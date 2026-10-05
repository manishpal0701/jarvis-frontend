'use client';

import React, { useMemo } from 'react';
import { JarvisState } from '@/types/jarvis';

interface JarvisStatusProps {
  state: JarvisState;
}

export const JarvisStatus: React.FC<JarvisStatusProps> = ({
  state = 'listening',
}) => {
  // State dot & text config (Minimal floating indicator)
  const stateDot = useMemo(() => {
    switch (state) {
      case 'listening':
        return {
          label: '● LISTENING',
          textColor: 'text-cyan-300/90',
          dotColor: 'bg-cyan-400 shadow-[0_0_10px_#00f0ff]',
        };
      case 'wake_detected':
        return {
          label: '● WAKE DETECTED',
          textColor: 'text-yellow-300/90',
          dotColor: 'bg-yellow-400 shadow-[0_0_10px_#facc15]',
        };
      case 'thinking':
      case 'processing':
        return {
          label: '● THINKING',
          textColor: 'text-purple-300/90',
          dotColor: 'bg-purple-400 shadow-[0_0_10px_#c084fc]',
        };
      case 'speaking':
        return {
          label: '● SPEAKING',
          textColor: 'text-emerald-300/90',
          dotColor: 'bg-emerald-400 shadow-[0_0_10px_#10b981]',
        };
      case 'video_analyzing':
        return {
          label: '● ANALYZING VIDEO',
          textColor: 'text-indigo-300/90',
          dotColor: 'bg-indigo-400 shadow-[0_0_10px_#818cf8]',
        };
      case 'video_editing':
        return {
          label: '● EDITING PREMIERE',
          textColor: 'text-amber-300/90',
          dotColor: 'bg-amber-400 shadow-[0_0_10px_#fbbf24]',
        };
      case 'video_exporting':
        return {
          label: '● EXPORTING VIDEO',
          textColor: 'text-teal-300/90',
          dotColor: 'bg-teal-400 shadow-[0_0_10px_#2dd4bf]',
        };
      case 'completed':
        return {
          label: '● COMPLETED',
          textColor: 'text-emerald-300/90',
          dotColor: 'bg-emerald-400 shadow-[0_0_10px_#34d399]',
        };
      case 'error':
        return {
          label: '● ERROR',
          textColor: 'text-rose-400/90',
          dotColor: 'bg-rose-400 shadow-[0_0_10px_#f43f5e]',
        };
      case 'offline':
        return {
          label: '● OFFLINE',
          textColor: 'text-rose-400/90',
          dotColor: 'bg-rose-400 shadow-[0_0_10px_#f43f5e]',
        };
      case 'idle':
      default:
        return {
          label: '● IDLE',
          textColor: 'text-cyan-400/80',
          dotColor: 'bg-cyan-400 shadow-[0_0_8px_#00f0ff]',
        };
    }
  }, [state]);

  return (
    <div className="flex items-center justify-center space-x-2 text-xs font-mono tracking-widest uppercase py-1 z-20 select-none pointer-events-none">
      <span className={`w-2 h-2 rounded-full animate-pulse ${stateDot.dotColor}`} />
      <span className={stateDot.textColor}>
        {stateDot.label.replace('● ', '')}
      </span>
    </div>
  );
};
