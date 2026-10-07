import { useState, useEffect, useRef } from 'react';
import type { FaceDetector } from '@mediapipe/tasks-vision';

export type FaceValidationState =
  | 'INITIALIZING'
  | 'CAMERA_UNAVAILABLE'
  | 'NO_FACE'
  | 'MULTIPLE_FACES'
  | 'FACE_TOO_SMALL'
  | 'FACE_OUT_OF_BOUNDS'
  | 'VALIDATING'
  | 'READY'
  | 'ERROR';

export interface UseFaceDetectionOptions {
  stream: MediaStream | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  enabled?: boolean;
  requiredConsecutiveFrames?: number;
  detectionIntervalMs?: number;
}

export interface FaceDetectionResult {
  faceState: FaceValidationState;
  guidanceMessage: string;
  isReady: boolean;
  faceCount: number;
  error: string | null;
}

export const FACE_GUIDANCE_MESSAGES: Record<FaceValidationState, string> = {
  INITIALIZING: 'Initializing face detection model...',
  CAMERA_UNAVAILABLE: 'Camera access is required to start the interview.',
  NO_FACE: 'Make sure your face is visible in the camera.',
  MULTIPLE_FACES: 'Only one person should be visible during the interview.',
  FACE_TOO_SMALL: 'Move closer so your face is clearly visible.',
  FACE_OUT_OF_BOUNDS: 'Center your face in the camera.',
  VALIDATING: 'Hold position — verifying face presence...',
  READY: "Face detected — you're ready.",
  ERROR: 'Face validation could not be initialized.',
};

// Singleton promise for dynamic detector loading
let detectorInstancePromise: Promise<FaceDetector> | null = null;

async function loadDetectorWithFallback(): Promise<FaceDetector> {
  if (detectorInstancePromise) {
    return detectorInstancePromise;
  }

  detectorInstancePromise = (async () => {
    const { FaceDetector, FilesetResolver } = await import('@mediapipe/tasks-vision');

    const baseUrl = import.meta.env.BASE_URL || '/';
    const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;

    const localWasm = `${cleanBase}wasm`;
    const cdnWasm = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.17/wasm';

    const localModel = `${cleanBase}models/blaze_face_short_range.tflite`;
    const cdnModel =
      'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite';

    // 1. Try Local Assets + GPU
    try {
      console.log('[FaceDetection] Attempting initialization with local assets (GPU)...');
      const vision = await FilesetResolver.forVisionTasks(localWasm);
      return await FaceDetector.createFromOptions(vision, {
        baseOptions: { modelAssetPath: localModel, delegate: 'GPU' },
        runningMode: 'VIDEO',
        minDetectionConfidence: 0.5,
      });
    } catch (errLocalGpu) {
      console.warn('[FaceDetection] Local GPU init failed, trying local CPU fallback:', errLocalGpu);
    }

    // 2. Try Local Assets + CPU
    try {
      console.log('[FaceDetection] Attempting initialization with local assets (CPU)...');
      const vision = await FilesetResolver.forVisionTasks(localWasm);
      return await FaceDetector.createFromOptions(vision, {
        baseOptions: { modelAssetPath: localModel, delegate: 'CPU' },
        runningMode: 'VIDEO',
        minDetectionConfidence: 0.5,
      });
    } catch (errLocalCpu) {
      console.warn('[FaceDetection] Local CPU init failed, trying CDN GPU fallback:', errLocalCpu);
    }

    // 3. Try CDN Assets + GPU
    try {
      console.log('[FaceDetection] Attempting initialization with CDN assets (GPU)...');
      const vision = await FilesetResolver.forVisionTasks(cdnWasm);
      return await FaceDetector.createFromOptions(vision, {
        baseOptions: { modelAssetPath: cdnModel, delegate: 'GPU' },
        runningMode: 'VIDEO',
        minDetectionConfidence: 0.5,
      });
    } catch (errCdnGpu) {
      console.warn('[FaceDetection] CDN GPU init failed, trying CDN CPU fallback:', errCdnGpu);
    }

    // 4. Try CDN Assets + CPU
    console.log('[FaceDetection] Attempting initialization with CDN assets (CPU)...');
    const vision = await FilesetResolver.forVisionTasks(cdnWasm);
    return await FaceDetector.createFromOptions(vision, {
      baseOptions: { modelAssetPath: cdnModel, delegate: 'CPU' },
      runningMode: 'VIDEO',
      minDetectionConfidence: 0.5,
    });
  })().catch((finalErr) => {
    detectorInstancePromise = null; // Reset singleton on failure to allow retry
    throw finalErr;
  });

  return detectorInstancePromise;
}

export function useFaceDetection({
  stream,
  videoRef,
  enabled = true,
  requiredConsecutiveFrames = 5,
  detectionIntervalMs = 150,
}: UseFaceDetectionOptions): FaceDetectionResult {
  const [faceState, setFaceState] = useState<FaceValidationState>('INITIALIZING');
  const [faceCount, setFaceCount] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const detectorRef = useRef<FaceDetector | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const consecutiveValidRef = useRef<number>(0);
  const consecutiveInvalidRef = useRef<number>(0);
  const lastVideoTimeRef = useRef<number>(-1);

  // Initialize Detector Model dynamically
  useEffect(() => {
    isMountedRef.current = true;

    if (!enabled) {
      setFaceState('INITIALIZING');
      return;
    }

    let isCancelled = false;

    loadDetectorWithFallback()
      .then((detector) => {
        if (!isCancelled && isMountedRef.current) {
          detectorRef.current = detector;
          setError(null);
          console.log('[FaceDetection] FaceDetector model initialized successfully.');
        }
      })
      .catch((err: unknown) => {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error('[FaceDetection] Failed to initialize FaceDetector:', err);
        if (!isCancelled && isMountedRef.current) {
          setError(errMsg);
          setFaceState('ERROR');
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [enabled]);

  // Main Face Detection Loop
  useEffect(() => {
    if (!enabled) return;

    if (!stream || stream.getVideoTracks().length === 0 || stream.getVideoTracks()[0].readyState !== 'live') {
      setFaceState('CAMERA_UNAVAILABLE');
      setFaceCount(0);
      consecutiveValidRef.current = 0;
      consecutiveInvalidRef.current = 0;
      return;
    }

    let timerId: NodeJS.Timeout | null = null;

    const processFrame = () => {
      const video = videoRef.current;
      const detector = detectorRef.current;

      if (!video || !detector) {
        timerId = setTimeout(processFrame, detectionIntervalMs);
        return;
      }

      // Ensure video is actively playing and has valid non-zero dimensions before running detection
      if (video.paused || video.ended || video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
        if (video.paused && video.srcObject) {
          video.play().catch(() => {});
        }
        timerId = setTimeout(processFrame, detectionIntervalMs);
        return;
      }

      if (video.currentTime === lastVideoTimeRef.current) {
        timerId = setTimeout(processFrame, detectionIntervalMs);
        return;
      }
      lastVideoTimeRef.current = video.currentTime;

      try {
        const timestamp = performance.now();
        const results = detector.detectForVideo(video, timestamp);
        const detections = results.detections || [];
        const count = detections.length;

        if (isMountedRef.current) {
          setFaceCount(count);
        }

        let rawState: 'VALID' | 'NO_FACE' | 'MULTIPLE_FACES' | 'FACE_TOO_SMALL' | 'FACE_OUT_OF_BOUNDS' = 'VALID';

        if (count === 0) {
          rawState = 'NO_FACE';
        } else if (count > 1) {
          rawState = 'MULTIPLE_FACES';
        } else {
          const box = detections[0].boundingBox;
          if (!box) {
            rawState = 'NO_FACE';
          } else {
            const videoW = video.videoWidth || 640;
            const videoH = video.videoHeight || 480;
            const faceArea = box.width * box.height;
            const videoArea = videoW * videoH;
            const areaRatio = faceArea / videoArea;

            // Margin check
            const leftMargin = box.originX / videoW;
            const rightMargin = (videoW - (box.originX + box.width)) / videoW;
            const topMargin = box.originY / videoH;
            const bottomMargin = (videoH - (box.originY + box.height)) / videoH;

            if (areaRatio < 0.03) {
              rawState = 'FACE_TOO_SMALL';
            } else if (leftMargin < -0.05 || rightMargin < -0.05 || topMargin < -0.05 || bottomMargin < -0.05) {
              rawState = 'FACE_OUT_OF_BOUNDS';
            } else {
              rawState = 'VALID';
            }
          }
        }

        // Apply Stability Window
        setFaceState((prevState) => {
          if (rawState === 'VALID') {
            consecutiveValidRef.current += 1;
            consecutiveInvalidRef.current = 0;

            if (prevState === 'READY') {
              return 'READY';
            }
            if (consecutiveValidRef.current >= requiredConsecutiveFrames) {
              return 'READY';
            }
            return 'VALIDATING';
          } else {
            // Invalid frame detected
            if (prevState === 'READY') {
              consecutiveInvalidRef.current += 1;
              // Require 4 consecutive invalid frames before dropping READY to prevent flickering on blink/movement
              if (consecutiveInvalidRef.current >= 4) {
                consecutiveValidRef.current = 0;
                return rawState;
              }
              return 'READY';
            } else {
              consecutiveValidRef.current = 0;
              return rawState;
            }
          }
        });
      } catch (err) {
        console.error('[FaceDetection] Error processing video frame:', err);
      }

      timerId = setTimeout(processFrame, detectionIntervalMs);
    };

    timerId = setTimeout(processFrame, detectionIntervalMs);

    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [stream, videoRef, enabled, requiredConsecutiveFrames, detectionIntervalMs]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const guidanceMessage = error
    ? `Initialization Error: ${error}`
    : FACE_GUIDANCE_MESSAGES[faceState] || 'Verifying face presence...';
  const isReady = faceState === 'READY';

  return {
    faceState,
    guidanceMessage,
    isReady,
    faceCount,
    error,
  };
}
