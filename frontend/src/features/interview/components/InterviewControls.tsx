import React from 'react';
import { Mic, MicOff, Video as VideoIcon, VideoOff, Square, ArrowRight, MessageSquare, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { InterviewState } from '@/config/interviewConfig';

export interface InterviewControlsProps {
  isMicMuted: boolean;
  isCameraOff: boolean;
  isInterviewerMuted?: boolean;
  isChatOpen?: boolean;
  hasUnreadChat?: boolean;
  roomState: InterviewState;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onToggleInterviewerAudio?: () => void;
  onToggleChat?: () => void;
  onStartSpeaking: () => void;
  onSubmitAnswer: () => void;
  onEndInterview: () => void;
  onViewResults?: () => void;
  className?: string;
}

export const InterviewControls: React.FC<InterviewControlsProps> = ({
  isMicMuted,
  isCameraOff,
  isInterviewerMuted = false,
  isChatOpen = false,
  hasUnreadChat = false,
  roomState,
  onToggleMic,
  onToggleCamera,
  onToggleInterviewerAudio,
  onToggleChat,
  onStartSpeaking,
  onSubmitAnswer,
  onEndInterview,
  onViewResults,
  className,
}) => {
  return (
    <div
      className={cn(
        'w-full max-w-2xl mx-auto p-2.5 sm:p-3 rounded-2xl bg-surface/90 backdrop-blur-md border border-border/80 shadow-2xl flex items-center justify-between gap-3 font-mono text-xs select-none',
        className
      )}
    >
      {/* Left Action Buttons: Mic | Camera | Chat | Audio */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Candidate Mic Toggle */}
        <button
          type="button"
          onClick={onToggleMic}
          className={cn(
            'p-2.5 rounded-xl border transition-all cursor-pointer',
            isMicMuted
              ? 'bg-destructive/15 border-destructive/30 text-destructive'
              : 'bg-background/70 border-border/40 text-foreground hover:bg-background'
          )}
          title={isMicMuted ? 'Unmute Microphone' : 'Mute Microphone'}
        >
          {isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        {/* Candidate Camera Toggle */}
        <button
          type="button"
          onClick={onToggleCamera}
          className={cn(
            'p-2.5 rounded-xl border transition-all cursor-pointer',
            isCameraOff
              ? 'bg-destructive/15 border-destructive/30 text-destructive'
              : 'bg-background/70 border-border/40 text-foreground hover:bg-background'
          )}
          title={isCameraOff ? 'Turn Camera On' : 'Turn Camera Off'}
        >
          {isCameraOff ? <VideoOff className="w-4 h-4" /> : <VideoIcon className="w-4 h-4" />}
        </button>

        {/* Compact Chat Toggle Drawer */}
        {onToggleChat && (
          <button
            type="button"
            onClick={onToggleChat}
            className={cn(
              'p-2.5 rounded-xl border transition-all cursor-pointer relative',
              isChatOpen
                ? 'bg-accent/20 border-accent/40 text-accent'
                : 'bg-background/70 border-border/40 text-foreground/80 hover:bg-background'
            )}
            title="Toggle Interview Clarification Chat"
          >
            <MessageSquare className="w-4 h-4" />
            {hasUnreadChat && !isChatOpen && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
            )}
          </button>
        )}

        {/* Replay / Mute Interviewer Audio */}
        {onToggleInterviewerAudio && (
          <button
            type="button"
            onClick={onToggleInterviewerAudio}
            className={cn(
              'p-2.5 rounded-xl border transition-all cursor-pointer',
              isInterviewerMuted
                ? 'bg-amber-500/15 border-amber-500/30 text-amber-500'
                : 'bg-background/70 border-border/40 text-foreground/80 hover:bg-background'
            )}
            title={isInterviewerMuted ? 'Unmute AI Voice' : 'Mute/Replay AI Voice'}
          >
            {isInterviewerMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Center Dynamic Stage Action */}
      <div>
        {roomState === 'QUESTION' && (
          <button
            type="button"
            onClick={onStartSpeaking}
            className="px-4 sm:px-6 py-2.5 rounded-xl bg-foreground text-background font-bold uppercase tracking-wider hover:opacity-95 transition-all flex items-center gap-2 cursor-pointer shadow-md text-[11px] sm:text-xs"
          >
            <span>SPEAK ANSWER</span>
            <Mic className="w-4 h-4" />
          </button>
        )}

        {roomState === 'LISTENING' && (
          <button
            type="button"
            onClick={onSubmitAnswer}
            className="px-4 sm:px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-bold uppercase tracking-wider hover:bg-emerald-500 transition-all flex items-center gap-2 cursor-pointer shadow-md text-[11px] sm:text-xs"
          >
            <span>SUBMIT RESPONSE</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}

        {(roomState === 'EVALUATING' || roomState === 'FOLLOW_UP') && (
          <div className="px-4 py-2 rounded-xl bg-foreground/10 text-foreground/70 font-semibold flex items-center gap-2 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            <span>PROCESSING...</span>
          </div>
        )}

        {roomState === 'COMPLETE' && (
          <button
            type="button"
            onClick={onViewResults || onEndInterview}
            className="px-5 py-2.5 rounded-xl bg-foreground text-background font-bold uppercase tracking-wider hover:opacity-95 transition-all flex items-center gap-2 cursor-pointer shadow-md text-[11px] sm:text-xs"
          >
            <span>VIEW RESULTS</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Right End Session Button */}
      <button
        type="button"
        onClick={onEndInterview}
        className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-destructive hover:bg-destructive/10 px-3 py-2 rounded-xl border border-destructive/40 transition-colors cursor-pointer"
        title="End Interview Session"
      >
        <Square className="w-3.5 h-3.5 fill-current" />
        <span className="hidden sm:inline">END SESSION</span>
      </button>
    </div>
  );
};
