import React from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MessageSquare,
  PhoneOff,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { VoicePoweredOrb } from './VoicePoweredOrb';
import type { InterviewState } from '@/config/interviewConfig';

export interface InterviewBottomControlsProps {
  isMicMuted: boolean;
  isCameraOff: boolean;
  isChatOpen: boolean;
  roomState: InterviewState;
  audioLevel?: number;
  isSpeaking?: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onToggleChat: () => void;
  onEndSession: () => void;
  className?: string;
}

export const InterviewBottomControls: React.FC<InterviewBottomControlsProps> = ({
  isMicMuted,
  isCameraOff,
  isChatOpen,
  roomState,
  audioLevel = 0,
  isSpeaking = false,
  onToggleMic,
  onToggleCamera,
  onToggleChat,
  onEndSession,
  className,
}) => {
  return (
    <div
      className={cn(
        'relative w-full px-4 py-2 flex items-center justify-between font-sans select-none z-50 pointer-events-auto shrink-0',
        className
      )}
    >
      {/* Left Control Group: Mic | Camera */}
      <div className="flex items-center gap-2">
        {/* Mic Button */}
        <button
          type="button"
          onClick={onToggleMic}
          className={cn(
            'h-10 px-3.5 rounded-xl border flex items-center gap-2 text-xs font-medium transition-all cursor-pointer shadow-sm',
            isMicMuted
              ? 'bg-rose-500/15 border-rose-500/30 text-rose-300 hover:bg-rose-500/25'
              : 'bg-[#121824] border-white/10 text-white/90 hover:bg-[#182030] hover:text-white'
          )}
          title={isMicMuted ? 'Unmute microphone' : 'Mute microphone'}
        >
          {isMicMuted ? <MicOff className="w-4 h-4 text-rose-400" /> : <Mic className="w-4 h-4 text-cyan-400" />}
          <span>Mic</span>
          <ChevronUp className="w-3 h-3 opacity-50" />
        </button>

        {/* Camera Button */}
        <button
          type="button"
          onClick={onToggleCamera}
          className={cn(
            'h-10 px-3.5 rounded-xl border flex items-center gap-2 text-xs font-medium transition-all cursor-pointer shadow-sm',
            isCameraOff
              ? 'bg-rose-500/15 border-rose-500/30 text-rose-300 hover:bg-rose-500/25'
              : 'bg-[#121824] border-white/10 text-white/90 hover:bg-[#182030] hover:text-white'
          )}
          title={isCameraOff ? 'Turn camera on' : 'Turn camera off'}
        >
          {isCameraOff ? <VideoOff className="w-4 h-4 text-rose-400" /> : <Video className="w-4 h-4 text-cyan-400" />}
          <span>Camera</span>
          <ChevronUp className="w-3 h-3 opacity-50" />
        </button>
      </div>

      {/* Center: VoicePoweredOrb */}
      <div className="absolute left-1/2 -translate-x-1/2 -top-12 sm:-top-14 pointer-events-auto">
        <VoicePoweredOrb
          voiceLevel={audioLevel}
          isSpeaking={isSpeaking}
          state={roomState}
          size={72}
        />
      </div>

      {/* Right Control Group: Chat | End Session */}
      <div className="flex items-center gap-2">
        {/* Chat Toggle Button */}
        <button
          type="button"
          onClick={onToggleChat}
          className={cn(
            'h-10 px-3.5 rounded-xl border flex items-center gap-2 text-xs font-medium transition-all cursor-pointer shadow-sm',
            isChatOpen
              ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
              : 'bg-[#121824] border-white/10 text-white/80 hover:text-white hover:bg-[#182030]'
          )}
          title="Toggle Chat"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Chat</span>
        </button>

        {/* End Session Button (Distinct Red) */}
        <button
          type="button"
          onClick={onEndSession}
          className="h-10 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 border border-rose-400/30 text-white font-medium text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(225,29,72,0.35)] active:scale-[0.98] transition-all cursor-pointer"
        >
          <PhoneOff className="w-4 h-4" />
          <span>End Session</span>
        </button>
      </div>
    </div>
  );
};
