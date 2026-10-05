'use client';

import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Terminal, Square } from 'lucide-react';
import { ChatMessage as ChatMessageType, JarvisState } from '@/types/chat';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessageType[];
  onSendMessage: (text: string) => void;
  status: JarvisState;
  onCancel?: () => void;
}

const QUICK_PROMPTS = [
  'Run system diagnostics',
  'Check system performance',
  'What can you do?',
];

export const ChatPanel: React.FC<ChatPanelProps> = ({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  status,
  onCancel,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const isBusy = status === 'processing' || status === 'thinking' || status === 'speaking';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          initial={{ x: 420, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 420, opacity: 0 }}
          transition={{ type: 'spring', damping: 26, stiffness: 220 }}
          className="fixed top-20 right-6 bottom-20 w-96 max-w-[calc(100vw-3rem)] z-40 flex flex-col rounded-2xl bg-[#060b19]/85 border border-cyan-500/30 backdrop-blur-xl shadow-[0_0_40px_rgba(0,240,255,0.2)] overflow-hidden"
        >
          {/* Header */}
          <div className="h-14 px-5 flex items-center justify-between border-b border-cyan-500/20 bg-cyan-950/30">
            <div className="flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <h2 className="font-mono text-xs font-bold tracking-widest text-cyan-200 uppercase">
                JARVIS CONSOLE
              </h2>
            </div>

            <div className="flex items-center space-x-2">
              {isBusy && onCancel && (
                <button
                  onClick={onCancel}
                  className="px-2 py-0.5 rounded text-[10px] font-mono flex items-center space-x-1 bg-rose-950/80 border border-rose-500/40 text-rose-300 hover:bg-rose-900/80 transition-colors"
                  title="Cancel active response"
                >
                  <Square className="w-2.5 h-2.5 fill-rose-300" />
                  <span>STOP</span>
                </button>
              )}

              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30 text-cyan-300">
                [J] TOGGLE
              </span>

              <button
                onClick={onClose}
                className="p-1 rounded-md hover:bg-cyan-500/20 text-cyan-400 hover:text-cyan-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto custom-scrollbar space-y-1">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}

            {isBusy && (
              <div className="flex items-center justify-between my-3 text-cyan-400/70 font-mono text-xs animate-pulse">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>JARVIS is {status}...</span>
                </div>
                {onCancel && (
                  <button
                    onClick={onCancel}
                    className="text-[10px] underline text-rose-400 hover:text-rose-300"
                  >
                    Cancel
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Quick Prompts & Input Section */}
          <div className="p-4 border-t border-cyan-500/20 bg-cyan-950/20 flex flex-col space-y-2">
            {/* Quick Prompt Chips */}
            <div className="flex items-center space-x-1.5 overflow-x-auto custom-scrollbar pb-1">
              {QUICK_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => onSendMessage(prompt)}
                  className="whitespace-nowrap px-2.5 py-1 rounded-full text-[10px] font-mono bg-cyan-950/60 border border-cyan-500/20 text-cyan-300/80 hover:border-cyan-400 hover:text-cyan-200 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Chat Input */}
            <ChatInput onSend={onSendMessage} disabled={status === 'processing'} />
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};
