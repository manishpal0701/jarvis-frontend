'use client';

import React, { useEffect } from 'react';
import { useJarvisChat } from '@/hooks/useJarvisChat';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { FuturisticBackground } from './effects/FuturisticBackground';
import { HudOverlay } from './effects/HudOverlay';
import { JarvisStatus } from './ui/JarvisStatus';
import { VoiceControl } from './ui/VoiceControl';
import { ChatToggle } from './ui/ChatToggle';
import { ChatPanel } from './chat/ChatPanel';
import { Live2DStage } from './live2d/Live2DStage';
import { Live2DProvider, useLive2D } from './live2d/Live2DProvider';
import { Live2DAvatarController } from './live2d/Live2DTypes';

const InnerJarvisApp: React.FC = () => {
  const {
    isChatOpen,
    toggleChat,
    closeChat,
    messages,
    sendMessage,
    jarvisState,
    lastSpeechEvent,
  } = useJarvisChat();

  const { setAvatarState, startSpeaking, stopSpeaking, registerController } = useLive2D();

  // Register J and ESC keyboard shortcuts
  useKeyboardShortcuts({
    onToggleChat: toggleChat,
    onCloseChat: closeChat,
  });

  // 1. Sync real-time WebSocket speech events (speech_id & audio_url) to Live2D Real Audio Lip-Sync Engine
  useEffect(() => {
    if (!lastSpeechEvent) return;

    if (lastSpeechEvent.type === 'start') {
      startSpeaking(
        lastSpeechEvent.speechId,
        lastSpeechEvent.text,
        lastSpeechEvent.audioUrl
      );
    } else if (lastSpeechEvent.type === 'end') {
      stopSpeaking(lastSpeechEvent.speechId);
    }
  }, [lastSpeechEvent, startSpeaking, stopSpeaking]);

  // 2. Sync JARVIS state machine to Live2D Avatar State Mutex
  useEffect(() => {
    if (jarvisState === 'processing' || jarvisState === 'thinking') {
      setAvatarState('thinking');
    } else if (jarvisState === 'listening') {
      setAvatarState('listening');
    } else if (jarvisState === 'idle') {
      setAvatarState('idle');
    }
  }, [jarvisState, setAvatarState]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#000000] text-cyan-400 font-sans select-none flex flex-col justify-between">
      {/* Background Cyber Ambient Graphics */}
      <FuturisticBackground />

      {/* Cyber HUD Framing Overlay */}
      <HudOverlay />

      {/* Top Header Status Bar */}
      <JarvisStatus status={jarvisState} />

      {/* Main Central Stage: Live2D Character Avatar */}
      <main className="relative flex-1 w-full h-full flex items-center justify-center">
        <Live2DStage onModelLoaded={(controller: Live2DAvatarController) => registerController(controller)} />
      </main>

      {/* Bottom Voice / Mic Control Bar */}
      <VoiceControl status={jarvisState} />

      {/* Floating Chat Toggle Button */}
      <ChatToggle isOpen={isChatOpen} onToggle={toggleChat} />

      {/* Floating HUD Glassmorphism Chat Panel */}
      <ChatPanel
        isOpen={isChatOpen}
        onClose={closeChat}
        messages={messages}
        onSendMessage={sendMessage}
        status={jarvisState}
      />
    </div>
  );
};

export const JarvisApp: React.FC = () => {
  return (
    <Live2DProvider>
      <InnerJarvisApp />
    </Live2DProvider>
  );
};
