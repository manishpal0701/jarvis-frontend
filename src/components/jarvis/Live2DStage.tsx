'use client';

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { JarvisState } from '@/types/jarvis';
import { Live2DAvatarController } from '@/types/live2d';

// Dynamically import client-only WebGL Live2D renderer with SSR disabled
const Live2DRenderer = dynamic(
  () => import('./live2d/Live2DRenderer').then((mod) => mod.Live2DRenderer),
  { ssr: false }
);

interface Live2DStageProps {
  state?: JarvisState;
  onControllerReady?: (controller: Live2DAvatarController) => void;
}

export const Live2DStage: React.FC<Live2DStageProps> = ({
  state = 'listening',
  onControllerReady,
}) => {
  const isListening = state === 'listening';
  const isSpeaking = state === 'speaking';
  const isThinking = state === 'thinking' || state === 'processing';

  // Compute state-based cinematic camera transform config
  const cameraTransform = useMemo(() => {
    switch (state) {
      case 'thinking':
      case 'processing':
        return { scale: 1.03, y: -6 };
      case 'speaking':
        return { scale: 1.05, y: -10 };
      case 'listening':
      case 'idle':
      case 'offline':
      default:
        return { scale: 1.0, y: 0 };
    }
  }, [state]);

  // Compute state-based aura lighting glow
  const haloColor = useMemo(() => {
    if (isSpeaking) return 'bg-emerald-500 scale-110 opacity-35';
    if (isThinking) return 'bg-purple-500 scale-105 opacity-30';
    if (isListening) return 'bg-cyan-500 scale-105 opacity-30';
    return 'bg-cyan-600 scale-100 opacity-20';
  }, [isSpeaking, isThinking, isListening]);

  return (
    <div
      id="live2d-canvas-container"
      className="relative w-full h-full flex-1 flex items-center justify-center select-none overflow-hidden"
    >
      {/* State-Reactive Atmospheric Backlight Halo behind Hibiki */}
      <div
        className={`absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] sm:w-[650px] h-[500px] sm:h-[650px] rounded-full transition-all duration-700 pointer-events-none blur-3xl ${haloColor}`}
      />

      {/* Subtle Holographic Pedestal Ring (Upper-Torso / Chest Alignment) */}
      <motion.div
        animate={{
          rotate: [0, 360],
        }}
        transition={{
          duration: 50,
          repeat: Infinity,
          ease: 'linear',
        }}
        className="absolute bottom-28 sm:bottom-36 w-80 sm:w-[420px] h-24 sm:h-32 rounded-[100%] border border-cyan-400/15 bg-gradient-to-t from-cyan-500/5 to-transparent pointer-events-none shadow-[0_0_25px_rgba(0,240,255,0.08)] opacity-60"
      />

      {/* Secondary Faint Ring */}
      <motion.div
        animate={{
          rotate: [360, 0],
        }}
        transition={{
          duration: 35,
          repeat: Infinity,
          ease: 'linear',
        }}
        className="absolute bottom-32 sm:bottom-40 w-60 sm:w-80 h-16 sm:h-24 rounded-[100%] border border-dashed border-cyan-400/20 pointer-events-none opacity-40"
      />

      {/* Cinematic Camera & Ambient Floating Motion Wrapper */}
      <motion.div
        animate={{
          scale: cameraTransform.scale,
          y: cameraTransform.y,
        }}
        transition={{
          duration: 0.5,
          ease: [0.25, 0.1, 0.25, 1], // Smooth cinematic curve
        }}
        className="relative z-10 w-full h-full flex items-center justify-center overflow-hidden"
      >
        {/* Organic Ambient Breathing Motion Container (Slow 6s cycle) */}
        <motion.div
          animate={{
            y: [0, -6, 0],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="w-full h-full flex items-center justify-center"
        >
          <Live2DRenderer onControllerReady={onControllerReady} />
        </motion.div>
      </motion.div>

      {/* Atmospheric Bottom Gradient Mask to cleanly crop out lower body */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#02040a] via-[#02040a]/80 to-transparent pointer-events-none z-20" />
    </div>
  );
};
