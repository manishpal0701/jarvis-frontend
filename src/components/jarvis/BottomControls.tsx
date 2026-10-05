'use client';

import React from 'react';
import { Cpu, MessageSquare, Wrench, Settings } from 'lucide-react';
import { ActivePanel } from '@/types/jarvis';

interface BottomControlsProps {
  activePanel: ActivePanel;
  onTogglePanel: (panel: ActivePanel) => void;
}

export const BottomControls: React.FC<BottomControlsProps> = ({
  activePanel,
  onTogglePanel,
}) => {
  const navItems: { id: ActivePanel; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'system', label: 'SYSTEM', icon: Cpu },
    { id: 'chat', label: 'CHAT', icon: MessageSquare },
    { id: 'tools', label: 'TOOLS', icon: Wrench },
    { id: 'settings', label: 'SETTINGS', icon: Settings },
  ];

  return (
    <footer className="w-full h-16 px-6 flex items-center justify-center z-30 select-none border-t border-cyan-500/10 backdrop-blur-xl bg-[#030712]/60">
      <nav aria-label="Jarvis Navigation" className="flex items-center space-x-2 sm:space-x-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePanel === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTogglePanel(item.id)}
              aria-label={`Toggle ${item.label} Panel`}
              aria-pressed={isActive}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-mono text-xs tracking-wider transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-cyan-400 ${
                isActive
                  ? 'bg-cyan-900/40 border border-cyan-400 text-cyan-200 shadow-[0_0_16px_rgba(0,240,255,0.25)]'
                  : 'bg-cyan-950/20 border border-cyan-500/15 text-cyan-400/70 hover:text-cyan-200 hover:border-cyan-500/40 hover:bg-cyan-900/20'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-300' : 'text-cyan-400/70'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </footer>
  );
};
