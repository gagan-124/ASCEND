import React, { useRef, useEffect } from 'react';
import { Video, VideoOff, Mic, MicOff, Signal } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CandidateCameraProps {
  stream: MediaStream | null;
  videoRef?: React.RefObject<HTMLVideoElement | null>;
  isCameraOff?: boolean;
  isMicMuted?: boolean;
  candidateName?: string;
  className?: string;
}

export const CandidateCamera: React.FC<CandidateCameraProps> = ({
  stream,
  videoRef: externalVideoRef,
  isCameraOff = false,
  isMicMuted = false,
  candidateName = 'You',
  className,
}) => {
  const internalVideoRef = useRef<HTMLVideoElement>(null);
  const activeVideoRef = externalVideoRef || internalVideoRef;

  useEffect(() => {
    const videoElement = activeVideoRef.current;
    if (videoElement) {
      if (stream && !isCameraOff) {
        videoElement.srcObject = stream;
        videoElement.play().catch(() => {});
      } else {
        videoElement.srcObject = null;
      }
    }
    return () => {
      if (videoElement) {
        videoElement.srcObject = null;
      }
    };
  }, [stream, isCameraOff, activeVideoRef]);

  return (
    <div
      className={cn(
        'relative w-full h-full rounded-2xl bg-[#0d1219] border border-white/10 overflow-hidden shadow-2xl flex items-center justify-center select-none',
        className
      )}
    >
      {!isCameraOff && stream ? (
        <video
          ref={activeVideoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover transform -scale-x-100"
        />
      ) : (
        <div className="flex flex-col items-center justify-center p-4 text-center text-xs text-white/50 space-y-2">
          <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
            <VideoOff className="w-5 h-5 text-white/40" />
          </div>
          <span className="font-mono text-[11px] uppercase tracking-wider">Camera Paused</span>
        </div>
      )}

      {/* Top Right: Status Overlay Indicators */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-white/80 text-xs">
        <span title={isCameraOff ? 'Camera Off' : 'Camera Active'}>
          {isCameraOff ? (
            <VideoOff className="w-3.5 h-3.5 text-rose-400" />
          ) : (
            <Video className="w-3.5 h-3.5 text-white/80" />
          )}
        </span>
        <span className="w-px h-3 bg-white/20" />
        <span title={isMicMuted ? 'Mic Muted' : 'Mic Active'}>
          {isMicMuted ? (
            <MicOff className="w-3.5 h-3.5 text-rose-400" />
          ) : (
            <Mic className="w-3.5 h-3.5 text-white/80" />
          )}
        </span>
        <span className="w-px h-3 bg-white/20" />
        <span title="Signal Quality: Excellent" className="text-emerald-400">
          <Signal className="w-3.5 h-3.5" />
        </span>
      </div>

      {/* Bottom Left: Candidate Label */}
      <div className="absolute bottom-3 left-3 z-20 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white text-xs font-sans font-medium">
        <span>{candidateName}</span>
      </div>
    </div>
  );
};
