'use client';

import React from 'react';
import { ShieldCheck, Activity, Cpu } from 'lucide-react';
import { JarvisState } from '@/types/chat';
import { WindowControls } from './WindowControls';

interface JarvisStatusProps {
  status: JarvisState;
}

export const JarvisStatus: React.FC<JarvisStatusProps> = ({ status }) => {
  const getStatusBadge = () => {
    switch (status) {
      case 'speaking':
        return { text: 'JARVIS • SPEAKING', color: 'bg-emerald-500', glow: 'shadow-[0_0_12px_#10b981]' };
      case 'listening':
        return { text: 'JARVIS • LISTENING', color: 'bg-amber-400', glow: 'shadow-[0_0_12px_#fbbf24]' };
      case 'processing':
        return { text: 'JARVIS • COMPUTING', color: 'bg-cyan-400', glow: 'shadow-[0_0_12px_#00f0ff]' };
      case 'offline':
        return { text: 'JARVIS • OFFLINE', color: 'bg-rose-500', glow: 'shadow-[0_0_12px_#f43f5e]' };
      default:
        return { text: 'JARVIS • ONLINE', color: 'bg-cyan-500', glow: 'shadow-[0_0_10px_#00f0ff]' };
    }
  };

  const badge = getStatusBadge();

  return (
    <header className="w-full h-14 px-6 flex items-center justify-between z-30 select-none backdrop-blur-md bg-[#050811]/40 border-b border-cyan-500/10">
      {/* System Identity & Status LED */}
      <div className="flex items-center space-x-3">
        <div className="relative flex items-center justify-center">
          <div className={`w-2.5 h-2.5 rounded-full ${badge.color} ${badge.glow} animate-pulse`} />
        </div>

        <span className="font-mono text-sm font-semibold tracking-wider text-cyan-300 uppercase drop-shadow-[0_0_8px_rgba(0,240,255,0.4)]">
          {badge.text}
        </span>

        <span className="hidden sm:inline-block text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/20 text-cyan-400/80">
          v1.0.4-DESKTOP
        </span>
      </div>

      {/* System Health Specs */}
      <div className="hidden md:flex items-center space-x-6 text-xs font-mono text-cyan-400/70">
        <div className="flex items-center space-x-1.5">
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          <span>CPU: 3.2%</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span>FPS: 60</span>
        </div>
        <div className="flex items-center space-x-1.5 text-emerald-400">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>SECURE</span>
        </div>
      </div>

      {/* Electron Desktop Window Controls */}
      <WindowControls />
    </header>
  );
};
