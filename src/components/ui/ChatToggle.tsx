'use client';

import React from 'react';
import { MessageSquare, X } from 'lucide-react';

interface ChatToggleProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const ChatToggle: React.FC<ChatToggleProps> = ({ isOpen, onToggle }) => {
  return (
    <div className="fixed bottom-6 right-6 z-40 select-none">
      <button
        onClick={onToggle}
        className="group relative flex items-center space-x-2 px-4 py-2.5 rounded-full bg-[#070d1e]/80 border border-cyan-500/30 hover:border-cyan-400 text-cyan-300 backdrop-blur-md shadow-[0_0_20px_rgba(0,240,255,0.15)] hover:shadow-[0_0_25px_rgba(0,240,255,0.35)] transition-all duration-300"
      >
        {isOpen ? (
          <X className="w-4 h-4 text-cyan-300 transition-transform group-hover:scale-110" />
        ) : (
          <MessageSquare className="w-4 h-4 text-cyan-300 transition-transform group-hover:scale-110" />
        )}

        <span className="text-xs font-mono tracking-wider">
          {isOpen ? 'CLOSE CHAT' : 'JARVIS CHAT'}
        </span>

        {/* Hotkey hint badge */}
        <kbd className="ml-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 shadow-inner">
          J
        </kbd>
      </button>
    </div>
  );
};
