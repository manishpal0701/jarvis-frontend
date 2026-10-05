import { useState, useCallback } from 'react';
import { useJarvis } from './useJarvis';

export function useJarvisChat() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const {
    connectionState,
    jarvisState,
    messages,
    activeStreamingText,
    sendCommand,
    cancelCommand,
    metrics,
    lastSpeechEvent,
  } = useJarvis();

  const toggleChat = useCallback(() => {
    setIsChatOpen((prev) => !prev);
  }, []);

  const closeChat = useCallback(() => {
    setIsChatOpen(false);
  }, []);

  const openChat = useCallback(() => {
    setIsChatOpen(true);
  }, []);

  return {
    isChatOpen,
    toggleChat,
    closeChat,
    openChat,
    messages,
    sendMessage: sendCommand,
    cancelCommand,
    jarvisState,
    connectionState,
    activeStreamingText,
    metrics,
    lastSpeechEvent,
  };
}
