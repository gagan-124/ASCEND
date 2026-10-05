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

  const stopTracks = useCallback(() => {
    const tracksToStop: MediaStreamTrack[] = [];

    if (streamRef.current) {
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
        prev.stream.getTracks().forEach((track) => {
          if (!tracksToStop.includes(track)) {
            try {
              track.onmute = null;
              track.onunmute = null;
              track.stop();
            } catch {}
          }
        });
      }
      return {
        ...prev,
        stream: null,
        cameraGranted: false,
        micGranted: false,
        isMicHardwareMuted: false,
      };
    });
  }, []);

  const enumerateDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    try {
      const deviceInfos = await navigator.mediaDevices.enumerateDevices();
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
      stopTracks();
      setState((prev) => ({ ...prev, isLoading: true, cameraError: null, micError: null }));

      if (!navigator.mediaDevices?.getUserMedia) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          cameraError: 'Media devices API is not supported in this browser.',
          micError: 'Media devices API is not supported in this browser.',
        }));
        return;
      }

      const videoConstraints: MediaTrackConstraints | boolean = cameraId
        ? { deviceId: { exact: cameraId } }
        : true;
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
        const stream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: audioConstraints,
        });

        streamRef.current = stream;

        const hasVideo = stream.getVideoTracks().length > 0;
        const hasAudio = stream.getAudioTracks().length > 0;

        const videoTrack = stream.getVideoTracks()[0];
        const audioTrack = stream.getAudioTracks()[0];

        if (audioTrack) {
          audioTrack.onmute = () => {
            console.log('[MEDIA] Audio track onmute event fired (hardware/system muted)');
            setState((prev) => ({ ...prev, isMicHardwareMuted: true }));
          };
          audioTrack.onunmute = () => {
            console.log('[MEDIA] Audio track onunmute event fired (hardware unmuted)');
            setState((prev) => ({ ...prev, isMicHardwareMuted: false }));
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
      } catch (err: any) {
        console.error('[MEDIA] getUserMedia failed. Error name:', err.name, 'message:', err.message);
        stopTracks();
        const errName = err.name || '';

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
    return () => {
      stopTracks();
    };
  }, [stopTracks]);

  return {
    ...state,
    requestMedia,
    stopTracks,
  };
}
