export type HibikiExpression =
  | 'Normal'
  | 'Angry'
  | 'Sad'
  | 'Surprised'
  | 'Blushing'
  | 'f01';

export type HibikiMotionGroup = 'Idle' | 'Tap' | 'Flick';

export interface Live2DStageConfig {
  modelUrl: string;
  scale: number;
  offsetX: number;
  offsetY: number;
  anchorX: number;
  anchorY: number;
  autoBlink: boolean;
  enablePhysics: boolean;
}

export interface Live2DAvatarController {
  playMotion(group: HibikiMotionGroup | string, index?: number, priority?: number): void;
  setExpression(name: HibikiExpression | string): void;
  resetExpression(): void;
  setMouthOpen(value: number): void;
  focus(x: number, y: number): void;
  speak?(soundUrl?: string, text?: string, onEnded?: () => void): void;
  stopSpeech?(): void;
  getParamArmR?(): number | null;
  isMotionPlaying?(): boolean;
}

export const HIBIKI_DEFAULT_CONFIG: Live2DStageConfig = {
  modelUrl: '/live2d/hibiki/hibiki.model3.json',
  scale: 0.28,
  offsetX: 0,
  offsetY: 40,
  anchorX: 0.5,
  anchorY: 0.5,
  autoBlink: true,
  enablePhysics: true,
};
