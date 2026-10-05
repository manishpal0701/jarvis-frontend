'use client';

import React from 'react';
import { Bot, User } from 'lucide-react';
import { ChatMessage as ChatMessageType } from '@/types/chat';

interface ChatMessageProps {
  message: ChatMessageType;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isJarvis = message.sender === 'jarvis';

  return (
    <div
      className={`flex items-start space-x-3 my-3 ${
        isJarvis ? 'justify-start' : 'justify-end flex-row-reverse space-x-reverse'
      }`}
    >
      {/* Sender Avatar */}
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 shadow-md ${
          isJarvis
            ? 'bg-cyan-950/80 border border-cyan-400/50 text-cyan-300 shadow-[0_0_8px_rgba(0,240,255,0.3)]'
            : 'bg-indigo-950/80 border border-indigo-400/50 text-indigo-300 shadow-[0_0_8px_rgba(99,102,241,0.3)]'
        }`}
      >
        {isJarvis ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
      </div>

      {/* Message Bubble Content */}
      <div className={`max-w-[82%] flex flex-col ${isJarvis ? 'items-start' : 'items-end'}`}>
        <div
          className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed font-sans backdrop-blur-md border shadow-lg ${
            isJarvis
              ? 'bg-[#0a1226]/80 text-cyan-100 border-cyan-500/25 rounded-tl-none shadow-[0_0_15px_rgba(0,240,255,0.08)]'
              : 'bg-cyan-950/70 text-cyan-50 border-cyan-400/40 rounded-tr-none shadow-[0_0_15px_rgba(0,240,255,0.15)]'
          }`}
        >
          {message.content}
        </div>

        {/* Timestamp */}
        <span className="mt-1 px-1 font-mono text-[10px] text-cyan-400/50">
          {message.timestamp}
        </span>
      </div>
    </div>
  );
};
