'use client';

import React from 'react';

export const FuturisticBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden bg-[#000000] text-cyan-400 select-none z-0">
      {/* Radial Cyan Glow behind Live2D character */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(0, 240, 255, 0.35) 0%, rgba(0, 136, 255, 0.12) 50%, transparent 75%)',
        }}
      />

      {/* Cyber Grid Lines */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #00f0ff 1px, transparent 1px),
            linear-gradient(to bottom, #00f0ff 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Subtle Vignette Overlay */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0, 0, 0, 0.85) 90%, #000000 100%)',
        }}
      />

      {/* Ambient HUD Accent Dots */}
      <div className="absolute top-8 left-8 w-2 h-2 rounded-full bg-cyan-400/30 animate-ping" />
      <div className="absolute top-8 right-8 w-2 h-2 rounded-full bg-cyan-400/30 animate-ping" />
      <div className="absolute bottom-8 left-8 w-2 h-2 rounded-full bg-cyan-400/30 animate-ping" />
      <div className="absolute bottom-8 right-8 w-2 h-2 rounded-full bg-cyan-400/30 animate-ping" />
    </div>
  );
};
