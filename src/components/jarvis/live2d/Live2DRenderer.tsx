'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Live2DController } from '@/lib/live2d/Live2DController';
import { Live2DAvatarController } from '@/types/live2d';

interface Live2DRendererProps {
  onControllerReady?: (controller: Live2DAvatarController) => void;
  onModelLoaded?: () => void;
}

// Dynamically inject live2dcubismcore.min.js script if not present on window
const ensureCubismCore = async (): Promise<void> => {
  if (typeof window === 'undefined') return;
  if ((window as any).Live2DCubismCore) return;

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = '/live2d/live2dcubismcore.min.js';
    script.onload = () => resolve();
    script.onerror = (err) => reject(new Error('Failed to load live2dcubismcore.min.js'));
    document.head.appendChild(script);
  });
};

export const Live2DRenderer: React.FC<Live2DRendererProps> = ({
  onControllerReady,
  onModelLoaded,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<any>(null);
  const modelRef = useRef<any>(null);
  const controllerRef = useRef<Live2DController | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return;

    let isMounted = true;
    let resizeObserver: ResizeObserver | null = null;
    let cleanupPointer: (() => void) | null = null;

    const initLive2D = async () => {
      try {
        setLoading(true);
        setError(null);

        // Ensure Cubism 4 core SDK script is loaded in window
        await ensureCubismCore();

        // Dynamically import client-only WebGL & Cubism 4 dependencies
        const PIXI = await import('pixi.js');
        (window as any).PIXI = PIXI;
        const { Live2DModel, SoundManager } = await import('pixi-live2d-display/cubism4');
        Live2DModel.registerTicker(PIXI.Ticker);

        if (SoundManager) {
          try {
            SoundManager.volume = 1;
          } catch (e) {
            // Ignore if SoundManager not initialized
          }
        }

        const container = containerRef.current;
        if (!container || !isMounted) return;

        const width = container.clientWidth || window.innerWidth || 1200;
        const height = container.clientHeight || window.innerHeight || 800;

        // Initialize transparent PixiJS Application
        const app = new PIXI.Application({
          width,
          height,
          backgroundAlpha: 0,
          antialias: true,
          resolution: window.devicePixelRatio || 1,
          autoDensity: true,
        });

        if (!isMounted) {
          app.destroy(true, { children: true });
          return;
        }

        appRef.current = app;

        // Ensure canvas element fits container bounds perfectly
        const canvas = app.view as HTMLCanvasElement;
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.display = 'block';

        container.innerHTML = '';
        container.appendChild(canvas);

        // Load Hibiki model from public static directory (sound: true enables model.speak voice output; autoSound: false prevents motion auto-play on idle)
        const modelUrl = '/live2d/hibiki/hibiki.model3.json';
        const model = await Live2DModel.from(modelUrl, {
          autoInteract: false,
          sound: true,
        } as any);

        (model as any).sound = true;

        if (model?.internalModel?.motionManager) {
          (model.internalModel.motionManager as any).autoSound = false;
          if ((model.internalModel.motionManager as any).settings) {
            (model.internalModel.motionManager.settings as any).sound = false;
          }
        }
        if ((model as any)?.soundManager) {
          try {
            (model as any).soundManager.volume = 1;
          } catch (e) {}
        }

        if (!isMounted) {
          model.destroy();
          app.destroy(true, { children: true });
          return;
        }

        modelRef.current = model;

        // Anchor near top of head area so top head/hair position is guaranteed
        model.anchor.set(0.5, 0.08);

        // Framing & Scale: Top head has 14% breathing room; lower body extends past bottom stage edge
        const updateModelTransform = (w: number, h: number) => {
          if (!model || !app.renderer) return;

          model.x = w / 2;
          // Position top of head 14% from top edge for zero head crop
          model.y = h * 0.14;

          // Natural companion scale (head, shoulders, chest, upper torso visible)
          const baseScale = Math.min(w / 650, h / 650);
          const finalScale = Math.max(0.42, Math.min(0.58, baseScale * 0.52));

          model.scale.set(finalScale);
        };

        updateModelTransform(width, height);
        app.stage.addChild(model);

        // Instantiate controller
        const controller = new Live2DController(model);
        controllerRef.current = controller;

        if (onControllerReady) {
          onControllerReady(controller);
        }

        if (onModelLoaded) {
          onModelLoaded();
        }

        setLoading(false);

        // Responsive ResizeObserver
        resizeObserver = new ResizeObserver((entries) => {
          for (const entry of entries) {
            const { width: newW, height: newH } = entry.contentRect;
            if (appRef.current && appRef.current.renderer && modelRef.current) {
              appRef.current.renderer.resize(newW, newH);
              updateModelTransform(newW, newH);
            }
          }
        });

        resizeObserver.observe(container);

        // Pointer tracking
        const handlePointerMove = (e: PointerEvent) => {
          if (!container || !controllerRef.current) return;
          const rect = container.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          controllerRef.current.focus(x, y);
        };

        container.addEventListener('pointermove', handlePointerMove);
        cleanupPointer = () => container.removeEventListener('pointermove', handlePointerMove);

      } catch (err: any) {
        console.error('[Live2DRenderer] Failed to load Hibiki Live2D model:', err);
        if (isMounted) {
          setError(err?.message || 'Failed to initialize Live2D WebGL context');
          setLoading(false);
        }
      }
    };

    initLive2D();

    return () => {
      isMounted = false;
      if (cleanupPointer) cleanupPointer();
      if (resizeObserver) resizeObserver.disconnect();
      if (appRef.current) {
        appRef.current.destroy(true, { children: true, texture: true, baseTexture: true });
        appRef.current = null;
      }
      modelRef.current = null;
      controllerRef.current = null;
    };
  }, [onControllerReady, onModelLoaded]);

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Loading Overlay */}
      {loading && (
        <div className="absolute z-20 flex flex-col items-center justify-center space-y-2 pointer-events-none select-none">
          <div className="w-10 h-10 rounded-full border-2 border-cyan-400/30 border-t-cyan-400 animate-spin" />
          <span className="font-mono text-xs text-cyan-300 tracking-widest uppercase animate-pulse">
            INITIALIZING HIBIKI...
          </span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="absolute z-20 flex flex-col items-center justify-center p-4 rounded-xl jarvis-glass border border-rose-500/30 text-rose-300 font-mono text-xs select-none">
          <span className="font-bold text-rose-400 uppercase tracking-wider mb-1">
            LIVE2D MODEL FAILED TO LOAD
          </span>
          <span className="text-[11px] text-rose-300/80">{error}</span>
        </div>
      )}

      {/* WebGL Canvas Mount Container */}
      <div
        ref={containerRef}
        className="w-full h-full flex items-center justify-center relative z-10"
      />
    </div>
  );
};
