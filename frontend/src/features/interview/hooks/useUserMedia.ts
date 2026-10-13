import { useState, useCallback, useRef, useEffect } from 'react';

export interface UserMediaState {
  stream: MediaStream | null;
  cameraGranted: boolean;
  micGranted: boolean;
  isMicHardwareMuted: boolean;
  cameraError: string | null;
  micError: string | null;
  isLoading: boolean;
  devices: MediaDeviceInfo[];
  selectedCameraId: string;
  selectedMicId: string;
}

/**
 * Global active interview media stream registry.
 * Guarantees that any stream acquired across hooks can be forcibly stopped
 * on terminal events (navigation back, cancel, unmount, or session termination).
 */
const activeInterviewStreams = new Set<MediaStream>();

export function stopAllInterviewMediaStreams(): void {
  activeInterviewStreams.forEach((mediaStream) => {
    try {
      mediaStream.getTracks().forEach((track) => {
        try {
          track.onmute = null;
          track.onunmute = null;
          track.stop();
        } catch (e) {
          console.error(`[MEDIA] Error stopping track ${track.id}:`, e);
        }
      });
    } catch {
      // Safe to ignore
    }
  });
  activeInterviewStreams.clear();
}

export function useUserMedia() {
  const [state, setState] = useState<UserMediaState>({
    stream: null,
    cameraGranted: false,
    micGranted: false,
    isMicHardwareMuted: false,
    cameraError: null,
    micError: null,
    isLoading: false,
    devices: [],
    selectedCameraId: '',
    selectedMicId: '',
  });

  const streamRef = useRef<MediaStream | null>(null);
  const requestIdRef = useRef<number>(0);
  const isMountedRef = useRef<boolean>(true);
  const isCancelledRef = useRef<boolean>(false);

  const stopTracks = useCallback(() => {
    isCancelledRef.current = true;
    requestIdRef.current += 1;

    const tracksToStop: MediaStreamTrack[] = [];

    if (streamRef.current) {
      activeInterviewStreams.delete(streamRef.current);
      streamRef.current.getTracks().forEach((track) => {
        tracksToStop.push(track);
      });
      streamRef.current = null;
    }

    tracksToStop.forEach((track) => {
      try {
        track.onmute = null;
        track.onunmute = null;
        track.stop();
      } catch (e) {
        console.error(`[MEDIA] Error stopping track ${track.id}:`, e);
      }
    });

    setState((prev) => {
      if (prev.stream) {
        activeInterviewStreams.delete(prev.stream);
        prev.stream.getTracks().forEach((track) => {
          if (!tracksToStop.includes(track)) {
            try {
              track.onmute = null;
              track.onunmute = null;
              track.stop();
            } catch {
              // Safe to ignore if track stop fails
            }
          }
        });
      }
      return {
        ...prev,
        stream: null,
        cameraGranted: false,
        micGranted: false,
        isMicHardwareMuted: false,
        isLoading: false,
      };
    });
  }, []);

  const enumerateDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    try {
      const deviceInfos = await navigator.mediaDevices.enumerateDevices();
      if (!isMountedRef.current) return;
      setState((prev) => ({
        ...prev,
        devices: deviceInfos,
      }));
    } catch {
      // Ignore enumeration failures
    }
  }, []);

  const requestMedia = useCallback(
    async (cameraId?: string, micId?: string) => {
      if (!isMountedRef.current) return;

      stopTracks();
      isCancelledRef.current = false;
      const currentRequestId = ++requestIdRef.current;

      setState((prev) => ({ ...prev, isLoading: true, cameraError: null, micError: null }));

      if (!navigator.mediaDevices?.getUserMedia) {
        if (!isMountedRef.current || currentRequestId !== requestIdRef.current) return;
        setState((prev) => ({
          ...prev,
          isLoading: false,
          cameraError: 'Media devices API is not supported in this browser.',
          micError: 'Media devices API is not supported in this browser.',
        }));
        return;
      }

      const videoConstraints: MediaTrackConstraints = {
        ...(cameraId ? { deviceId: { exact: cameraId } } : {}),
        width: { ideal: 1280 },
        height: { ideal: 720 },
        aspectRatio: { ideal: 16 / 9 },
        facingMode: 'user',
      };
      const audioConstraints: MediaTrackConstraints | boolean = micId
        ? {
            deviceId: { exact: micId },
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          }
        : {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          };

      try {
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: videoConstraints,
            audio: audioConstraints,
          });
        } catch (firstErr: unknown) {
          const firstMediaErr = firstErr as { name?: string };
          if (firstMediaErr?.name === 'OverconstrainedError') {
            console.warn('[MEDIA] OverconstrainedError on ideal constraints. Falling back to basic device constraints.');
            stream = await navigator.mediaDevices.getUserMedia({
              video: cameraId ? { deviceId: { exact: cameraId } } : true,
              audio: audioConstraints,
            });
          } else {
            throw firstErr;
          }
        }

        // CRITICAL GUARD: Stop tracks immediately if unmounted, cancelled, or superseded during await
        if (!isMountedRef.current || isCancelledRef.current || currentRequestId !== requestIdRef.current) {
          console.warn('[MEDIA] Late getUserMedia resolved after cancellation, unmount, or newer request. Stopping all tracks immediately.');
          stream.getTracks().forEach((track) => {
            try {
              track.onmute = null;
              track.onunmute = null;
              track.stop();
            } catch {
              // Safe ignore
            }
          });
          return;
        }

        activeInterviewStreams.add(stream);
        streamRef.current = stream;

        const hasVideo = stream.getVideoTracks().length > 0;
        const hasAudio = stream.getAudioTracks().length > 0;

        const videoTrack = stream.getVideoTracks()[0];
        const audioTrack = stream.getAudioTracks()[0];

        // Inspect track capabilities for hardware zoom and set to widest angle (minimum zoom) if supported
        if (videoTrack && typeof videoTrack.getCapabilities === 'function') {
          try {
            const capabilities = videoTrack.getCapabilities() as { zoom?: { min?: number } };
            if (capabilities && capabilities.zoom && typeof capabilities.zoom.min === 'number') {
              if (typeof videoTrack.applyConstraints === 'function') {
                await videoTrack.applyConstraints({
                  advanced: [{ zoom: capabilities.zoom.min } as MediaTrackConstraintSet],
                });
              }
            }
          } catch {
            // Hardware PTZ zoom constraint is best-effort; safe to continue
          }
        }

        // Secondary check after zoom constraint promise
        if (!isMountedRef.current || isCancelledRef.current || currentRequestId !== requestIdRef.current) {
          console.warn('[MEDIA] Stream invalidated during post-acquisition configuration. Stopping tracks.');
          activeInterviewStreams.delete(stream);
          stream.getTracks().forEach((track) => {
            try {
              track.onmute = null;
              track.onunmute = null;
              track.stop();
            } catch {
              // Safe ignore
            }
          });
          streamRef.current = null;
          return;
        }

        if (audioTrack) {
          audioTrack.onmute = () => {
            console.log('[MEDIA] Audio track onmute event fired (hardware/system muted)');
            if (isMountedRef.current) {
              setState((prev) => ({ ...prev, isMicHardwareMuted: true }));
            }
          };
          audioTrack.onunmute = () => {
            console.log('[MEDIA] Audio track onunmute event fired (hardware unmuted)');
            if (isMountedRef.current) {
              setState((prev) => ({ ...prev, isMicHardwareMuted: false }));
            }
          };
        }

        setState((prev) => ({
          ...prev,
          stream,
          cameraGranted: hasVideo,
          micGranted: hasAudio,
          isMicHardwareMuted: audioTrack ? audioTrack.muted : false,
          cameraError: hasVideo ? null : 'No camera video track detected.',
          micError: hasAudio ? null : 'No microphone audio track detected.',
          isLoading: false,
          selectedCameraId: videoTrack?.getSettings()?.deviceId || cameraId || '',
          selectedMicId: audioTrack?.getSettings()?.deviceId || micId || '',
        }));

        await enumerateDevices();
      } catch (err: unknown) {
        if (!isMountedRef.current || currentRequestId !== requestIdRef.current) return;

        const mediaErr = err as { name?: string; message?: string } | null;
        console.error('[MEDIA] getUserMedia failed. Error name:', mediaErr?.name, 'message:', mediaErr?.message);
        stopTracks();
        const errName = mediaErr?.name || '';

        let cameraErr = 'Could not access camera.';
        let micErr = 'Could not access microphone.';

        if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
          cameraErr = 'Camera permission denied. Please allow camera access in browser permissions.';
          micErr = 'Microphone permission denied. Please allow microphone access in browser permissions.';
        } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
          cameraErr = 'No camera device found on this system.';
          micErr = 'No microphone device found on this system.';
        } else if (errName === 'NotReadableError' || errName === 'TrackStartError') {
          cameraErr = 'Camera is currently in use by another application or locked by OS.';
          micErr = 'Microphone is currently in use by another application or locked by OS.';
        } else if (errName === 'OverconstrainedError') {
          cameraErr = 'Camera does not satisfy the requested constraints.';
          micErr = 'Microphone does not satisfy the requested constraints.';
        } else if (errName === 'SecurityError') {
          cameraErr = 'Camera access blocked by browser security policy or insecure context.';
          micErr = 'Microphone access blocked by browser security policy or insecure context.';
        } else if (errName === 'AbortError') {
          cameraErr = 'Camera hardware request was aborted.';
          micErr = 'Microphone hardware request was aborted.';
        }

        setState((prev) => ({
          ...prev,
          stream: null,
          cameraGranted: false,
          micGranted: false,
          cameraError: cameraErr,
          micError: micErr,
          isLoading: false,
        }));
      }
    },
    [enumerateDevices, stopTracks]
  );

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      isCancelledRef.current = true;
      requestIdRef.current += 1;
      stopTracks();
    };
  }, [stopTracks]);

  return {
    ...state,
    requestMedia,
    stopTracks,
  };
}
