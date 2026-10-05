'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface ActiveConversation {
  speaker: 'user' | 'hibiki';
  text: string;
}

interface ConversationTextProps {
  activeMessage?: ActiveConversation | null;
}

export const ConversationText: React.FC<ConversationTextProps> = ({
  activeMessage,
}) => {
  if (!activeMessage || !activeMessage.text) return null;

  const isHibiki = activeMessage.speaker === 'hibiki';

  return (
    <div className="z-30 select-none max-w-xl mx-auto text-center px-6 my-2 pointer-events-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeMessage.text}
          initial={{ opacity: 0, y: 12, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.97 }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          className="flex flex-col items-center justify-center space-y-1"
        >
          {/* Speaker Label */}
          <span
            className={`font-mono text-[10px] uppercase tracking-widest font-semibold transition-colors duration-300 ${
              isHibiki
                ? 'text-cyan-400/80 drop-shadow-[0_0_10px_rgba(0,240,255,0.4)]'
                : 'text-purple-400/70'
            }`}
          >
            {isHibiki ? 'Hibiki' : 'User Command'}
          </span>

          {/* Minimal Floating Dialogue Text (No cards, boxes, or borders) */}
          <p
            className={`text-base sm:text-xl font-sans font-light tracking-wide leading-relaxed text-center transition-all duration-300 ${
              isHibiki
                ? 'text-sky-100 drop-shadow-[0_0_16px_rgba(0,240,255,0.3)] font-normal'
                : 'text-purple-200/80 drop-shadow-[0_0_10px_rgba(192,132,252,0.2)] font-light italic'
            }`}
          >
            &quot;{activeMessage.text}&quot;
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
