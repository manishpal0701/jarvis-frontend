'use client';

import React from 'react';

export const HudOverlay: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-10 select-none p-6 flex flex-col justify-between">
      {/* Top Left Corner Bracket */}
      <div className="absolute top-6 left-6 w-12 h-12 border-t-2 border-l-2 border-cyan-500/50 rounded-tl-lg shadow-[0_0_10px_rgba(0,240,255,0.3)]" />
      
      {/* Top Right Corner Bracket */}
      <div className="absolute top-6 right-6 w-12 h-12 border-t-2 border-r-2 border-cyan-500/50 rounded-tr-lg shadow-[0_0_10px_rgba(0,240,255,0.3)]" />

      {/* Bottom Left Corner Bracket */}
      <div className="absolute bottom-6 left-6 w-12 h-12 border-b-2 border-l-2 border-cyan-500/50 rounded-bl-lg shadow-[0_0_10px_rgba(0,240,255,0.3)]" />

      {/* Bottom Right Corner Bracket */}
      <div className="absolute bottom-6 right-6 w-12 h-12 border-b-2 border-r-2 border-cyan-500/50 rounded-br-lg shadow-[0_0_10px_rgba(0,240,255,0.3)]" />

      {/* Subtle Central Target Rings around live2d area */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full border border-cyan-500/10 border-dashed pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[680px] h-[680px] rounded-full border border-cyan-500/5 pointer-events-none" />

      {/* Horizontal Scanline Accent */}
      <div 
        className="absolute inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent pointer-events-none top-1/3 animate-pulse"
      />
    </div>
  );
};
