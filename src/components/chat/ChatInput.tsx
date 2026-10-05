'use client';

import React, { useState } from 'react';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, disabled = false }) => {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() && !disabled) {
      onSend(text);
      setText('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full flex items-center mt-2">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type a message or command for JARVIS..."
        disabled={disabled}
        className="w-full h-11 pl-4 pr-12 rounded-xl bg-[#060b18]/90 border border-cyan-500/30 text-xs font-sans text-cyan-100 placeholder-cyan-500/40 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 shadow-inner backdrop-blur-md transition-all"
      />

      <button
        type="submit"
        disabled={!text.trim() || disabled}
        className="absolute right-1.5 w-8 h-8 flex items-center justify-center rounded-lg bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 hover:bg-cyan-400 hover:text-black disabled:opacity-40 disabled:hover:bg-cyan-500/20 disabled:hover:text-cyan-300 transition-all duration-200"
      >
        <Send className="w-4 h-4" />
      </button>
    </form>
  );
};
