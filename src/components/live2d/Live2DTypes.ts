export type AvatarState =
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'happy'
  | 'confused'
  | 'error';

export interface Live2DAvatarController {
  setAvatarState: (state: AvatarState) => void;
  setMouthOpen: (value: number) => void;
  expression: (name: string | number) => void;
  motion: (group: string, index?: number) => void;
  detectMouthParameter: () => void;
  startSpeaking: (speechId: string, text?: string, audioUrl?: string) => void;
  stopSpeaking: (speechId?: string) => void;
}

export interface Live2DStageProps {
  modelUrl?: string;
  onModelLoaded?: (controller: Live2DAvatarController) => void;
  onError?: (error: Error) => void;
}
