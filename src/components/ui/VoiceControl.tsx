'use client';

import React, { useState } from 'react';
import { Mic, MicOff, Volume2, Radio } from 'lucide-react';
import { JarvisState } from '@/types/chat';

interface VoiceControlProps {
  status: JarvisState;
}

export const VoiceControl: React.FC<VoiceControlProps> = ({ status }) => {
  const [isMuted, setIsMuted] = useState(false);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 select-none">
      <div className="flex items-center space-x-4 px-5 py-2 rounded-full bg-[#050811]/70 border border-cyan-500/20 backdrop-blur-md shadow-[0_0_15px_rgba(0,240,255,0.1)]">
        {/* Mic toggle */}
        <button
          onClick={() => setIsMuted(!isMuted)}
          title={isMuted ? 'Unmute Voice' : 'Mute Voice'}
          className={`p-2 rounded-full transition-all duration-200 ${
            isMuted 
              ? 'bg-rose-950/60 text-rose-400 border border-rose-500/30' 
              : 'bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 hover:border-cyan-400 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
          }`}
        >
          {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        {/* Animated Audio Waveform Bars */}
        <div className="flex items-center space-x-1 h-5 px-2">
          {[0.6, 0.9, 0.4, 1.0, 0.7, 0.5, 0.8].map((scale, i) => (
            <span
              key={i}
              className={`w-0.5 rounded-full transition-all duration-300 ${
                isMuted
                  ? 'h-1 bg-cyan-900/40'
                  : status === 'speaking' || status === 'listening'
                  ? 'bg-cyan-400 animate-pulse shadow-[0_0_6px_#00f0ff]'
                  : 'bg-cyan-500/40'
              }`}
              style={{
                height: isMuted ? '4px' : `${Math.max(6, scale * (status === 'speaking' ? 20 : 12))}px`,
                animationDelay: `${i * 120}ms`,
              }}
            />
          ))}
        </div>

        {/* Voice status label */}
        <div className="flex items-center space-x-1.5 text-xs font-mono text-cyan-400/80">
          <Radio className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
          <span>{isMuted ? 'MIC MUTED' : 'VOICE ENGINE READY'}</span>
        </div>

        {/* Output audio indicator */}
        <div className="pl-2 border-l border-cyan-500/20 text-cyan-400/60 hover:text-cyan-300 cursor-pointer">
          <Volume2 className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};
