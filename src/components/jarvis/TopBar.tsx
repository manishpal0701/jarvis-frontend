'use client';

import React from 'react';
import { Settings, Cpu, ShieldCheck, Activity } from 'lucide-react';
import { WindowControls } from '../ui/WindowControls';

import { WebSocketConnectionState } from '@/lib/jarvis/types';

interface TopBarProps {
  onOpenSettings?: () => void;
  isSettingsOpen?: boolean;
  connectionState?: WebSocketConnectionState;
}

export const TopBar: React.FC<TopBarProps> = ({
  onOpenSettings,
  isSettingsOpen = false,
  connectionState = 'CONNECTED',
}) => {
  const getStatusPill = () => {
    switch (connectionState) {
      case 'CONNECTED':
        return {
          label: 'ONLINE',
          bg: 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400',
          dot: 'bg-emerald-400 shadow-[0_0_8px_#10b981]',
        };
      case 'CONNECTING':
      case 'RECONNECTING':
        return {
          label: connectionState,
          bg: 'bg-amber-950/40 border-amber-500/30 text-amber-400',
          dot: 'bg-amber-400 shadow-[0_0_8px_#f59e0b]',
        };
      case 'DISCONNECTED':
      case 'ERROR':
      default:
        return {
          label: 'OFFLINE',
          bg: 'bg-rose-950/40 border-rose-500/30 text-rose-400',
          dot: 'bg-rose-400 shadow-[0_0_8px_#f43f5e]',
        };
    }
  };

  const statusStyle = getStatusPill();

  return (
    <header className="w-full h-14 px-6 flex items-center justify-between z-30 select-none backdrop-blur-xl bg-[#030712]/60 border-b border-cyan-500/10 shadow-[0_4px_20px_rgba(0,0,0,0.4)] draggable">
      {/* Left: JARVIS Branding & Futuristic Indicator */}
      <div className="flex items-center space-x-3.5 non-draggable">
        <div className="relative flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_#00f0ff] animate-pulse" />
          <div className="absolute w-4 h-4 rounded-full border border-cyan-400/40 animate-ping" />
        </div>

        <div className="flex items-baseline space-x-2">
          <h1 className="font-mono text-base font-bold tracking-widest text-cyan-300 uppercase glow-cyan-sm">
            JARVIS
          </h1>
          <span className="text-[10px] font-mono tracking-wider px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/20 text-cyan-400/70">
            AI DESKTOP
          </span>
        </div>
      </div>

      {/* Middle: Subtle Technical System Telemetry (Desktop Vibe) */}
      <div className="hidden lg:flex items-center space-x-6 text-[11px] font-mono text-cyan-400/60 non-draggable">
        <div className="flex items-center space-x-1.5">
          <Cpu className="w-3.5 h-3.5 text-cyan-400/80" />
          <span>CORE: OPTIMAL</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <Activity className="w-3.5 h-3.5 text-cyan-400/80" />
          <span>FPS: 60</span>
        </div>
        <div className="flex items-center space-x-1.5 text-emerald-400/80">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>SYSTEM SECURE</span>
        </div>
      </div>

      {/* Right: Online Status & Settings Button & Window Controls */}
      <div className="flex items-center space-x-4 non-draggable">
        {/* ● ONLINE status pill */}
        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border text-xs font-mono tracking-wider transition-colors duration-300 ${statusStyle.bg}`}>
          <span className={`w-2 h-2 rounded-full animate-pulse ${statusStyle.dot}`} />
          <span>{statusStyle.label}</span>
        </div>

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          aria-label="Settings"
          title="Open Settings"
          className={`p-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-cyan-400 ${
            isSettingsOpen
              ? 'bg-cyan-900/40 border border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.3)]'
              : 'bg-cyan-950/30 border border-cyan-500/20 text-cyan-400/80 hover:text-cyan-200 hover:border-cyan-500/50 hover:bg-cyan-900/20'
          }`}
        >
          <Settings className={`w-4 h-4 transition-transform duration-500 ${isSettingsOpen ? 'rotate-90 text-cyan-300' : ''}`} />
        </button>

        {/* Window controls for Electron desktop environment */}
        <div className="pl-2 border-l border-cyan-500/15">
          <WindowControls />
        </div>
      </div>
    </header>
  );
};
