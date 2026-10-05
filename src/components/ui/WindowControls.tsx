'use client';

import React from 'react';
import { Minus, Square, X } from 'lucide-react';

export const WindowControls: React.FC = () => {
  const handleMinimize = () => {
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      (window as any).electronAPI.minimize();
    }
  };

  const handleMaximize = () => {
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      (window as any).electronAPI.maximize();
    }
  };

  const handleClose = () => {
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      (window as any).electronAPI.close();
    }
  };

  return (
    <div className="flex items-center space-x-1 z-50 non-draggable select-none">
      <button
        onClick={handleMinimize}
        title="Minimize"
        className="w-7 h-7 flex items-center justify-center rounded hover:bg-cyan-950/60 text-cyan-400/70 hover:text-cyan-300 transition-colors"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={handleMaximize}
        title="Maximize"
        className="w-7 h-7 flex items-center justify-center rounded hover:bg-cyan-950/60 text-cyan-400/70 hover:text-cyan-300 transition-colors"
      >
        <Square className="w-3 h-3" />
      </button>
      <button
        onClick={handleClose}
        title="Close"
        className="w-7 h-7 flex items-center justify-center rounded hover:bg-rose-950/80 text-cyan-400/70 hover:text-rose-400 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
