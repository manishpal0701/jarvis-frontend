'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { JarvisState } from '@/types/jarvis';

interface AudioVisualizerProps {
  state?: JarvisState;
  barCount?: number;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  state = 'listening',
  barCount = 15,
}) => {
  const isListening = state === 'listening';
  const isSpeaking = state === 'speaking';
  const isThinking = state === 'thinking' || state === 'processing';
  const isOffline = state === 'offline';

  // Symmetric visualizer bar multipliers
  const baseMultipliers = [0.3, 0.5, 0.8, 1.0, 0.7, 0.4, 0.6, 0.9, 0.6, 0.4, 0.7, 1.0, 0.8, 0.5, 0.3];

  return (
    <div className="flex items-center justify-center space-x-1.5 h-8 px-4 py-1 select-none z-20 pointer-events-none">
      {baseMultipliers.slice(0, barCount).map((multiplier, i) => {
        const minHeight = 3;
        const maxHeight = isListening ? 26 : isSpeaking ? 28 : isThinking ? 18 : isOffline ? 3 : 10;
        const duration = isListening ? 0.6 + (i % 4) * 0.08 : isSpeaking ? 0.3 + (i % 5) * 0.05 : isThinking ? 0.9 + (i % 3) * 0.12 : 1.6;

        return (
          <motion.span
            key={i}
            animate={{
              height: isListening
                ? [
                    `${Math.max(minHeight, multiplier * maxHeight * 0.35)}px`,
                    `${Math.max(minHeight, multiplier * maxHeight)}px`,
                    `${Math.max(minHeight, multiplier * maxHeight * 0.45)}px`,
                  ]
                : isSpeaking
                ? [
                    `${Math.max(minHeight, multiplier * maxHeight * 0.4)}px`,
                    `${Math.max(minHeight, multiplier * maxHeight * 0.9)}px`,
                    `${Math.max(minHeight, multiplier * maxHeight * 0.25)}px`,
                  ]
                : isThinking
                ? [
                    `${Math.max(minHeight, multiplier * maxHeight * 0.5)}px`,
                    `${Math.max(minHeight, multiplier * maxHeight * 0.85)}px`,
                    `${Math.max(minHeight, multiplier * maxHeight * 0.5)}px`,
                  ]
                : isOffline
                ? ['3px', '3px', '3px']
                : [
                    `${Math.max(minHeight, multiplier * maxHeight * 0.5)}px`,
                    `${Math.max(minHeight, multiplier * maxHeight * 0.8)}px`,
                    `${Math.max(minHeight, multiplier * maxHeight * 0.5)}px`,
                  ],
            }}
            transition={{
              duration,
              repeat: isOffline ? 0 : Infinity,
              repeatType: 'reverse',
              ease: 'easeInOut',
              delay: (i % 5) * 0.07,
            }}
            className={`w-1 rounded-full transition-colors duration-500 ${
              isListening
                ? 'bg-gradient-to-t from-cyan-500 to-cyan-300 shadow-[0_0_8px_#00f0ff]'
                : isSpeaking
                ? 'bg-gradient-to-t from-emerald-500 to-emerald-300 shadow-[0_0_8px_#10b981]'
                : isThinking
                ? 'bg-gradient-to-t from-purple-500 to-purple-300 shadow-[0_0_8px_#c084fc]'
                : isOffline
                ? 'bg-rose-900/40'
                : 'bg-gradient-to-t from-cyan-600/50 to-cyan-400/70 shadow-[0_0_5px_rgba(0,240,255,0.3)]'
            }`}
          />
        );
      })}
    </div>
  );
};
