'use client';

import React from 'react';
import { Mic, Square } from 'lucide-react';
import { motion } from 'framer-motion';
import { JarvisState } from '@/types/jarvis';

interface TalkButtonProps {
  state: JarvisState;
  onToggleState: () => void;
}

export const TalkButton: React.FC<TalkButtonProps> = ({
  state,
  onToggleState,
}) => {
  const isListening = state === 'listening';

  return (
    <div className="relative flex flex-col items-center justify-center z-30 my-3 select-none">
      {/* Outer Glowing Energy Pulse Ring */}
      <div
        className={`absolute inset-0 rounded-full blur-md transition-all duration-500 pointer-events-none ${
          isListening
            ? 'bg-amber-400/40 scale-125 opacity-100'
            : 'bg-cyan-400/20 scale-105 opacity-0 group-hover:opacity-100'
        }`}
      />

      {/* Primary Talk Button */}
      <motion.button
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        onClick={onToggleState}
        aria-label={isListening ? 'Stop listening to Jarvis' : 'Talk to Jarvis'}
        aria-pressed={isListening}
        className={`group relative flex items-center space-x-3 px-7 py-3.5 rounded-full font-mono text-sm font-semibold tracking-wider uppercase transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-black ${
          isListening
            ? 'bg-amber-950/80 border-2 border-amber-400 text-amber-300 shadow-[0_0_30px_rgba(251,191,36,0.5)]'
            : 'bg-[#061224]/80 border border-cyan-400/40 text-cyan-300 hover:border-cyan-300 hover:text-white shadow-[0_0_20px_rgba(0,240,255,0.25)] hover:shadow-[0_0_35px_rgba(0,240,255,0.45)] backdrop-blur-xl'
        }`}
      >
        {/* Mic / Stop Icon */}
        <div
          className={`p-2 rounded-full transition-colors duration-300 ${
            isListening ? 'bg-amber-500 text-black animate-pulse' : 'bg-cyan-500/20 text-cyan-300 group-hover:bg-cyan-400 group-hover:text-black'
          }`}
        >
          {isListening ? (
            <Square className="w-4 h-4 fill-current" />
          ) : (
            <Mic className="w-4 h-4" />
          )}
        </div>

        {/* Button Label */}
        <span>{isListening ? 'STOP LISTENING' : '🎙 TALK TO JARVIS'}</span>

        {/* Status Dot */}
        <span
          className={`w-2 h-2 rounded-full transition-colors duration-300 ${
            isListening ? 'bg-amber-400 shadow-[0_0_8px_#fbbf24] animate-ping' : 'bg-cyan-400/60 group-hover:bg-cyan-300'
          }`}
        />
      </motion.button>
    </div>
  );
};
