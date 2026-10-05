'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ActivePanel } from '@/types/jarvis';
import { Live2DAvatarController } from '@/types/live2d';
import { JarvisEmotion, JarvisSemanticGesture } from '@/types/jarvisEvents';
import { Live2DStateMapper } from '@/lib/live2d/Live2DStateMapper';
import { Live2DGestureManager } from '@/lib/live2d/Live2DGestureManager';
import { FuturisticBackground } from '../effects/FuturisticBackground';
import { TopBar } from './TopBar';
import { BottomControls } from './BottomControls';
import { Live2DStage } from './Live2DStage';
import { JarvisStatus } from './JarvisStatus';
import { ConversationText, ActiveConversation } from './ConversationText';
import { ChatPanel } from '../chat/ChatPanel';
import { DevLive2DControls } from './live2d/DevLive2DControls';
import { useJarvisChat } from '@/hooks/useJarvisChat';

export const JarvisShell: React.FC = () => {
  const [currentEmotion, setCurrentEmotion] = useState<JarvisEmotion>('normal');
  const [activePanel, setActivePanel] = useState<ActivePanel>('none');
  const [controller, setController] = useState<Live2DAvatarController | null>(null);

  const [activeDialogue, setActiveDialogue] = useState<ActiveConversation | null>(null);

  const hasSpokenStartupRef = useRef(false);

  const {
    messages,
    sendMessage,
    cancelCommand,
    jarvisState,
    connectionState,
    activeStreamingText,
    lastSpeechEvent,
  } = useJarvisChat();

  // Handle Live2D controller registration
  const handleControllerReady = useCallback((ctrl: Live2DAvatarController) => {
    setController(ctrl);
  }, []);

  // Startup Greeting Logger when WebSocket connects and controller is ready
  useEffect(() => {
    if (connectionState === 'CONNECTED' && controller && !hasSpokenStartupRef.current) {
      hasSpokenStartupRef.current = true;
      console.log('[JARVIS_STARTUP_GREETING] WebSocket connected and controller ready for speech events');
    }
  }, [connectionState, controller]);

  // Synchronize WebSocket speech events (speaking_start & speaking_end) to Live2D Character Voice Engine
  useEffect(() => {
    if (!lastSpeechEvent || !controller) return;

    if (lastSpeechEvent.type === 'start') {
      console.log(`[JARVIS_SPEECH_SYNC] type=start speechId=${lastSpeechEvent.speechId} text=${lastSpeechEvent.text || ''}`);
      if (lastSpeechEvent.text) {
        setActiveDialogue({ speaker: 'hibiki', text: lastSpeechEvent.text });
      }
      controller.speak?.(lastSpeechEvent.audioUrl || undefined, lastSpeechEvent.text || undefined, () => {
        setActiveDialogue(null);
      });
    } else if (lastSpeechEvent.type === 'end') {
      console.log(`[JARVIS_SPEECH_SYNC] type=end speechId=${lastSpeechEvent.speechId} status=COMPLETED_NATURALLY`);
      // Do NOT call stopSpeech() on backend speaking_end; browser audio finishes naturally via audio.onended
    }
  }, [lastSpeechEvent, controller]);

  // Update floating dialogue & Live2D emotion state when real-time backend state changes
  useEffect(() => {
    if (jarvisState === 'speaking' && activeStreamingText) {
      setActiveDialogue({ speaker: 'hibiki', text: activeStreamingText });
      setCurrentEmotion('happy');
    } else if (jarvisState === 'wake_detected') {
      setCurrentEmotion('surprised');
    } else if (jarvisState === 'video_analyzing' || jarvisState === 'video_editing' || jarvisState === 'video_exporting') {
      setCurrentEmotion('surprised');
    } else if (jarvisState === 'completed') {
      setCurrentEmotion('happy');
    } else if (jarvisState === 'error') {
      setCurrentEmotion('concerned');
    } else if (jarvisState === 'listening' || jarvisState === 'idle') {
      setCurrentEmotion('normal');
    }
  }, [jarvisState, activeStreamingText]);

  // Synchronize Live2D character behavior whenever jarvisState, currentEmotion, or controller updates
  useEffect(() => {
    if (controller) {
      Live2DStateMapper.applyState(
        jarvisState,
        controller,
        currentEmotion,
        activeDialogue?.speaker === 'hibiki' ? activeDialogue.text : undefined
      );
    }
    return () => {
      Live2DStateMapper.clearTimers(controller);
    };
  }, [jarvisState, currentEmotion, controller, activeDialogue]);

  // Handle User Message submit
  const handleUserSendMessage = useCallback(
    (text: string) => {
      if (!text.trim()) return;
      setActiveDialogue({ speaker: 'user', text: text.trim() });
      sendMessage(text);
    },
    [sendMessage]
  );

  // Combo Test Handler for Dev Panel
  const handleTestSpeakingCombo = useCallback(
    (text: string, emotion: JarvisEmotion, gesture: JarvisSemanticGesture) => {
      setActiveDialogue({ speaker: 'hibiki', text });
      setCurrentEmotion(emotion);
      if (controller) {
        Live2DGestureManager.playGesture(gesture, controller, true);
      }
    },
    [controller]
  );

  // Global Keyboard Shortcuts (C for Chat toggle, Esc to close drawers, Ctrl+C to cancel)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === 'Escape') {
        setActivePanel('none');
      } else if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        setActivePanel((prev) => (prev === 'chat' ? 'none' : 'chat'));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#02040a] text-cyan-400 font-sans select-none flex flex-col justify-between">
      {/* Ambient Background Lighting */}
      <FuturisticBackground />

      {/* Top Header Bar with Dynamic Backend Connection Pill */}
      <TopBar connectionState={connectionState} />

      {/* Main Immersive Assistant Screen Composition */}
      <main className="relative flex-1 w-full h-full flex flex-col items-center justify-between z-10 pt-2 pb-4 px-4 overflow-hidden">
        {/* Central Large Live2D Stage */}
        <div className="relative flex-1 w-full h-full flex items-center justify-center">
          <Live2DStage state={jarvisState} onControllerReady={handleControllerReady} />
        </div>

        {/* Minimal Floating Conversation Overlay & Status Area */}
        <div className="flex flex-col items-center justify-center pb-2 space-y-1 z-20">
          {/* Cinematic Dialogue Text (Renders user prompt & real streaming response) */}
          <ConversationText activeMessage={activeDialogue} />

          {/* Minimal Floating State Indicator (● LISTENING / ● SPEAKING / ● THINKING) */}
          <JarvisStatus state={jarvisState} />
        </div>
      </main>

      {/* Bottom Navigation & Controls */}
      <BottomControls
        activePanel={activePanel}
        onTogglePanel={(panel) => setActivePanel((prev) => (prev === panel ? 'none' : panel))}
      />

      {/* Development-Only Live2D & State Control Panel */}
      {process.env.NODE_ENV === 'development' && (
        <DevLive2DControls
          controller={controller}
          currentState={jarvisState}
          onSetState={() => {}}
          onTestSpeakingCombo={handleTestSpeakingCombo}
        />
      )}

      {/* Reusable Glassmorphism Chat Drawer Overlay */}
      <ChatPanel
        isOpen={activePanel === 'chat'}
        onClose={() => setActivePanel('none')}
        messages={messages}
        onSendMessage={handleUserSendMessage}
        status={jarvisState}
        onCancel={cancelCommand}
      />
    </div>
  );
};
