'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Play, Activity, Smile, Hand, Cpu } from 'lucide-react';
import { Live2DAvatarController } from '@/types/live2d';
import { JarvisState } from '@/types/jarvis';
import { JarvisEmotion, JarvisSemanticGesture } from '@/types/jarvisEvents';
import { Live2DExpressionMapper } from '@/lib/live2d/Live2DExpressionMapper';
import { Live2DGestureManager, GestureDebugInfo } from '@/lib/live2d/Live2DGestureManager';

interface DevLive2DControlsProps {
  controller: Live2DAvatarController | null;
  currentState?: JarvisState;
  onSetState?: (state: JarvisState) => void;
  onTestSpeakingCombo?: (text: string, emotion: JarvisEmotion, gesture: JarvisSemanticGesture) => void;
}

const STATES: { label: string; value: JarvisState }[] = [
  { label: 'IDLE', value: 'idle' },
  { label: 'LISTENING', value: 'listening' },
  { label: 'THINKING', value: 'thinking' },
  { label: 'SPEAKING', value: 'speaking' },
];

const EMOTIONS: { label: string; value: JarvisEmotion }[] = [
  { label: 'NORMAL', value: 'normal' },
  { label: 'HAPPY', value: 'happy' },
  { label: 'ANGRY', value: 'angry' },
  { label: 'SAD', value: 'sad' },
  { label: 'SURPRISED', value: 'surprised' },
  { label: 'BLUSHING', value: 'blushing' },
];

const GESTURES: { label: string; value: JarvisSemanticGesture }[] = [
  { label: 'GREETING', value: 'greeting' },
  { label: 'EXPLAIN', value: 'explain' },
  { label: 'CONFIRM', value: 'confirm' },
  { label: 'WARNING', value: 'warning' },
  { label: 'SUCCESS', value: 'success' },
  { label: 'THINKING', value: 'thinking' },
];

export const DevLive2DControls: React.FC<DevLive2DControlsProps> = ({
  controller,
  currentState = 'idle',
  onSetState,
  onTestSpeakingCombo,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeEmotion, setActiveEmotion] = useState<JarvisEmotion>('normal');
  const [debugInfo, setDebugInfo] = useState<GestureDebugInfo>({
    gesture: 'NONE',
    motion: 'NONE',
    paramArmR: null,
  });

  // Periodically query PARAM_ARM_R and motion state in dev mode
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      if (controller) {
        const info = Live2DGestureManager.getGestureDebugInfo(controller);
        setDebugInfo(info);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [isOpen, controller]);

  const handleStateClick = (st: JarvisState) => {
    if (onSetState) {
      onSetState(st);
    }
  };

  const handleEmotionClick = (emo: JarvisEmotion) => {
    setActiveEmotion(emo);
    if (controller) {
      Live2DExpressionMapper.setJarvisExpression(emo, controller);
    }
  };

  const handleGestureClick = (gest: JarvisSemanticGesture) => {
    if (controller) {
      Live2DGestureManager.playGesture(gest, controller, true);
    }
  };

  const handleDirectMotion = (group: 'Idle' | 'Tap' | 'Flick', index: number) => {
    if (controller) {
      controller.playMotion(group, index, 3);
    }
  };

  const handleSpeakingCombo = (gesture: JarvisSemanticGesture) => {
    if (onTestSpeakingCombo) {
      onTestSpeakingCombo(
        "Sure Boss, I'll check the system for you.",
        'happy',
        gesture
      );
    }
  };

  return (
    <div className="fixed bottom-20 left-6 z-50 select-none">
      {/* Dev Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-[11px] font-mono tracking-wider bg-purple-950/70 border border-purple-500/30 text-purple-300 hover:bg-purple-900/80 hover:border-purple-400 backdrop-blur-md shadow-[0_0_15px_rgba(168,85,247,0.2)] transition-all"
        >
          <Sparkles className="w-3 h-3 text-purple-400 animate-pulse" />
          <span>DEV MODEL & GESTURE TEST</span>
        </button>
      )}

      {/* Dev Controls & Debug Status Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="w-96 p-4 rounded-2xl jarvis-glass border border-purple-500/40 text-purple-200 shadow-[0_0_30px_rgba(168,85,247,0.25)] space-y-3 font-mono text-xs max-h-[85vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-purple-500/20 pb-2">
              <div className="flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <h3 className="text-xs font-bold tracking-widest text-purple-300 uppercase">
                  LIVE2D MOTION & GESTURE TEST
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded text-purple-400 hover:text-purple-200 hover:bg-purple-900/40"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Dev Mode Realtime Debug Status Overlay */}
            <div className="p-2 rounded bg-purple-950/50 border border-purple-500/20 space-y-1 font-mono text-[10px]">
              <div className="flex justify-between items-center text-cyan-300">
                <span>GESTURE:</span>
                <span className="font-bold text-cyan-400">{debugInfo.gesture}</span>
              </div>
              <div className="flex justify-between items-center text-purple-300">
                <span>MOTION:</span>
                <span className="font-bold text-purple-400">{debugInfo.motion}</span>
              </div>
              <div className="flex justify-between items-center text-emerald-300">
                <span>PARAM_ARM_R:</span>
                <span className="font-bold text-emerald-400">
                  {debugInfo.paramArmR !== null ? debugInfo.paramArmR : '0 (IDLE)'}
                </span>
              </div>
            </div>

            {/* Direct Motion Group Test Section */}
            <div>
              <div className="flex items-center space-x-1 mb-1">
                <Cpu className="w-3 h-3 text-cyan-400" />
                <span className="text-[10px] text-cyan-400/80 tracking-widest uppercase">
                  DIRECT MOTIONS (PRIORITY 3)
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1 text-[10px]">
                <button
                  onClick={() => handleDirectMotion('Idle', 0)}
                  className="px-2 py-1 rounded bg-cyan-950/40 border border-cyan-500/20 text-cyan-300 hover:border-cyan-400"
                >
                  IDLE 0
                </button>
                <button
                  onClick={() => handleDirectMotion('Idle', 1)}
                  className="px-2 py-1 rounded bg-cyan-950/40 border border-cyan-500/20 text-cyan-300 hover:border-cyan-400"
                >
                  IDLE 1
                </button>
                <button
                  onClick={() => handleDirectMotion('Idle', 2)}
                  className="px-2 py-1 rounded bg-cyan-950/40 border border-cyan-500/20 text-cyan-300 hover:border-cyan-400"
                >
                  IDLE 2
                </button>
                <button
                  onClick={() => handleDirectMotion('Flick', 0)}
                  className="px-2 py-1 rounded bg-amber-950/40 border border-amber-500/30 text-amber-300 font-bold hover:border-amber-400"
                >
                  FLICK (03)
                </button>
                <button
                  onClick={() => handleDirectMotion('Tap', 0)}
                  className="px-2 py-1 rounded bg-amber-950/40 border border-amber-500/30 text-amber-300 font-bold hover:border-amber-400"
                >
                  TAP (04)
                </button>
              </div>
            </div>

            {/* State Test Section */}
            <div>
              <div className="flex items-center space-x-1 mb-1">
                <Activity className="w-3 h-3 text-cyan-400" />
                <span className="text-[10px] text-cyan-400/80 tracking-widest uppercase">
                  JARVIS UI STATE
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1 text-[10px]">
                {STATES.map((st) => (
                  <button
                    key={st.value}
                    onClick={() => handleStateClick(st.value)}
                    className={`px-2 py-1 rounded transition-all font-bold ${
                      currentState === st.value
                        ? 'bg-cyan-500 text-black border border-cyan-300 shadow-[0_0_8px_#00f0ff]'
                        : 'bg-cyan-950/40 border border-cyan-500/20 text-cyan-300 hover:border-cyan-400'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Semantic Emotion Test Section */}
            <div>
              <div className="flex items-center space-x-1 mb-1">
                <Smile className="w-3 h-3 text-emerald-400" />
                <span className="text-[10px] text-emerald-400/80 tracking-widest uppercase">
                  EXPRESSIONS / EMOTIONS
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1 text-[10px]">
                {EMOTIONS.map((emo) => (
                  <button
                    key={emo.value}
                    onClick={() => handleEmotionClick(emo.value)}
                    className={`px-1.5 py-1 rounded transition-colors ${
                      activeEmotion === emo.value
                        ? 'bg-emerald-600 text-white font-bold border border-emerald-400'
                        : 'bg-purple-950/40 border border-purple-500/20 text-purple-300 hover:border-purple-400'
                    }`}
                  >
                    {emo.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Semantic Gesture Test Section */}
            <div>
              <div className="flex items-center space-x-1 mb-1">
                <Hand className="w-3 h-3 text-amber-400" />
                <span className="text-[10px] text-amber-400/80 tracking-widest uppercase">
                  SEMANTIC GESTURES
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1 text-[10px]">
                {GESTURES.map((gest) => (
                  <button
                    key={gest.value}
                    onClick={() => handleGestureClick(gest.value)}
                    className="flex items-center justify-between px-2 py-1 rounded bg-purple-950/40 border border-purple-500/20 text-purple-300 hover:border-purple-400 hover:bg-purple-900/30 transition-colors"
                  >
                    <span>{gest.label}</span>
                    <Play className="w-2 h-2 text-amber-400" />
                  </button>
                ))}
              </div>
            </div>

            {/* Combo Performance Test Buttons */}
            <div className="space-y-1 pt-1">
              <button
                onClick={() => handleSpeakingCombo('explain')}
                className="w-full py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-amber-600 hover:from-purple-500 hover:to-amber-500 text-white text-[11px] font-bold tracking-wider shadow-[0_0_12px_rgba(168,85,247,0.3)] transition-all flex items-center justify-center space-x-1.5"
              >
                <Sparkles className="w-3 h-3 text-amber-200" />
                <span>SPEAKING + FLICK COMBO</span>
              </button>
              <button
                onClick={() => handleSpeakingCombo('greeting')}
                className="w-full py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white text-[11px] font-bold tracking-wider shadow-[0_0_12px_rgba(0,240,255,0.3)] transition-all flex items-center justify-center space-x-1.5"
              >
                <Sparkles className="w-3 h-3 text-cyan-200" />
                <span>SPEAKING + TAP COMBO</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
};
