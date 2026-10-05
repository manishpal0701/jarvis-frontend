'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useLive2D } from './Live2DProvider';
import { Live2DModelController } from './Live2DController';
import { Live2DStageProps } from './Live2DTypes';

export const Live2DStage: React.FC<Live2DStageProps> = ({
  modelUrl = '/live2d/model/Haru/Haru.model3.json',
  onModelLoaded,
  onError,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const { registerController } = useLive2D();

  const isInitializedRef = useRef(false);

  useEffect(() => {
    let isMounted = true;
    let pixiApp: any = null;
    let live2dModel: any = null;
    let resizeObserver: ResizeObserver | null = null;
    let pointerListener: ((e: MouseEvent) => void) | null = null;

    async function initStage() {
      if (!isMounted || isInitializedRef.current) return;
      if (!containerRef.current || !canvasRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const width = Math.floor(rect.width || containerRef.current.clientWidth || window.innerWidth);
      const height = Math.floor(rect.height || containerRef.current.clientHeight || window.innerHeight);

      // Guard against zero-size container initialization
      if (width <= 0 || height <= 0) {
        resizeObserver = new ResizeObserver((entries) => {
          for (const entry of entries) {
            if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
              resizeObserver?.disconnect();
              resizeObserver = null;
              if (isMounted && !isInitializedRef.current) {
                initStage();
              }
            }
          }
        });
        if (containerRef.current) {
          resizeObserver.observe(containerRef.current);
        }
        return;
      }

      isInitializedRef.current = true;

      try {
        console.log('[Live2DStage] Initializing WebGL PixiJS Stage...');

        // 1. Ensure Live2DCubismCore is present on window
        if (!(window as any).Live2DCubismCore) {
          console.log('[Live2DStage] Loading /live2d/live2dcubismcore.min.js...');
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = '/live2d/live2dcubismcore.min.js';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load /live2d/live2dcubismcore.min.js'));
            document.head.appendChild(script);
          });
        }

        if (!isMounted) return;

        // 2. Import PixiJS v6 and Cubism 4 specific Live2DModel loader
        const PIXI = await import('pixi.js');
        const { Live2DModel } = await import('pixi-live2d-display/cubism4');

        (window as any).PIXI = PIXI;
        Live2DModel.registerTicker(PIXI.Ticker as any);
        if (PIXI.Ticker && PIXI.Ticker.shared) {
          PIXI.Ticker.shared.start();
        }

        // 3. Create Pixi Application with transparent WebGL canvas
        pixiApp = new PIXI.Application({
          view: canvasRef.current!,
          width: width,
          height: height,
          backgroundAlpha: 0,
          autoDensity: true,
          resolution: window.devicePixelRatio || 1,
        });

        pixiApp.start();
        (window as any).pixiApp = pixiApp;

        console.log('[Live2DStage] Loading Cubism 4 model from:', modelUrl);

        // 4. Load Live2D model with autoInteract: false
        live2dModel = await (Live2DModel as any).from(modelUrl, {
          autoBlink: true,
          autoInteract: false,
        });

        if (!isMounted) {
          live2dModel?.destroy();
          pixiApp?.destroy(true);
          return;
        }

        (window as any).haruModel = live2dModel;

        // 5. Position & Scale in center using unscaled model dimensions
        live2dModel.anchor.set(0.5, 0.5);
        live2dModel.x = width / 2;
        live2dModel.y = height / 2 + 30;

        const baseWidth = live2dModel.internalModel?.originalWidth || live2dModel.internalModel?.width || live2dModel.width || 1000;
        const baseHeight = live2dModel.internalModel?.originalHeight || live2dModel.internalModel?.height || live2dModel.height || 1000;
        
        const scaleX = (width * 0.65) / baseWidth;
        const scaleY = (height * 0.70) / baseHeight;
        const fitScale = Math.min(scaleX, scaleY);

        live2dModel.scale.set(fitScale);
        pixiApp.stage.addChild(live2dModel);
        pixiApp.render();

        console.log('[Live2DStage] Haru Live2D Model rendered successfully:', {
          width,
          height,
          baseWidth,
          baseHeight,
          fitScale,
          x: live2dModel.x,
          y: live2dModel.y,
        });

        // 6. Smooth Mouse Pointer Tracking
        pointerListener = (e: MouseEvent) => {
          if (live2dModel && canvasRef.current) {
            const cRect = canvasRef.current.getBoundingClientRect();
            const mouseX = e.clientX - cRect.left;
            const mouseY = e.clientY - cRect.top;
            if (typeof live2dModel.focus === 'function') {
              live2dModel.focus(mouseX, mouseY);
            }
          }
        };
        window.addEventListener('mousemove', pointerListener);

        // 7. Register Controller
        const controller = new Live2DModelController(live2dModel);
        registerController(controller);
        if (onModelLoaded) onModelLoaded(controller);

        setIsLoaded(true);
        setHasError(false);

        // 8. Dynamic Container Resize Observer
        resizeObserver = new ResizeObserver((entries) => {
          for (const entry of entries) {
            const w = Math.floor(entry.contentRect.width);
            const h = Math.floor(entry.contentRect.height);
            if (w > 0 && h > 0 && pixiApp && pixiApp.renderer) {
              pixiApp.renderer.resize(w, h);
              if (live2dModel) {
                live2dModel.x = w / 2;
                live2dModel.y = h / 2 + 30;
                const sX = (w * 0.65) / baseWidth;
                const sY = (h * 0.70) / baseHeight;
                live2dModel.scale.set(Math.min(sX, sY));
                pixiApp.render();
              }
            }
          }
        });
        if (containerRef.current) {
          resizeObserver.observe(containerRef.current);
        }
      } catch (err: any) {
        console.error('[Live2DStage] Fatal error loading model:', err);
        if (isMounted) {
          setHasError(true);
          setIsLoaded(true);
          if (onError) onError(err);
        }
      }
    }

    initStage();

    return () => {
      isMounted = false;
      isInitializedRef.current = false;
      if (pointerListener) {
        window.removeEventListener('mousemove', pointerListener);
      }
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (live2dModel) {
        try {
          live2dModel.destroy();
        } catch (e) {}
      }
      if (pixiApp) {
        try {
          pixiApp.destroy(true, { children: true, texture: true, baseTexture: true });
        } catch (e) {}
      }
    };
  }, [modelUrl, registerController, onModelLoaded, onError]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[calc(100vh-7rem)] flex items-center justify-center overflow-hidden z-20 pointer-events-auto"
    >
      {/* WebGL Canvas Surface */}
      <canvas
        ref={canvasRef}
        className={`w-full h-full transition-opacity duration-700 ${
          isLoaded && !hasError ? 'opacity-100' : 'opacity-0 absolute'
        }`}
      />

      {/* Error Fallback (Only shown if model fails to load) */}
      {hasError && (
        <div className="relative flex flex-col items-center justify-center select-none pointer-events-none">
          <div className="relative w-[340px] h-[340px] flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-cyan-400/20 border-dashed animate-[spin_20s_linear_infinite]" />
            <div className="absolute inset-4 rounded-full border border-cyan-300/30 border-t-cyan-400 animate-[spin_10s_linear_infinite_reverse]" />
            <div className="absolute inset-10 rounded-full border border-cyan-500/10" />

            <div className="relative w-40 h-40 rounded-full bg-gradient-to-tr from-cyan-500/40 via-sky-400/20 to-blue-600/40 border border-cyan-300/50 shadow-[0_0_50px_rgba(0,240,255,0.4)] animate-pulse flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-cyan-400/30 blur-md animate-ping" />
              <div className="w-10 h-10 rounded-full bg-cyan-200 shadow-[0_0_20px_#00f0ff]" />
            </div>

            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_10px_#00f0ff]" />
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_10px_#00f0ff]" />
          </div>

          <div className="mt-8 w-[420px] h-[24px] rounded-[100%] bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent border-t border-cyan-400/50 shadow-[0_0_30px_rgba(0,240,255,0.3)]" />

          <p className="mt-4 font-mono text-xs tracking-widest text-cyan-400/80 uppercase">
            LIVE2D AVATAR UNAVAILABLE • VERIFY /live2d/model/Haru/Haru.model3.json
          </p>
        </div>
      )}
    </div>
  );
};
