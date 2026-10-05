export type JarvisState =
  | 'idle'
  | 'listening'
  | 'wake_detected'
  | 'thinking'
  | 'processing'
  | 'speaking'
  | 'video_analyzing'
  | 'video_editing'
  | 'video_exporting'
  | 'completed'
  | 'error'
  | 'offline';

export type ActivePanel = 'none' | 'system' | 'chat' | 'tools' | 'settings';

export interface JarvisStatusInfo {
  state: JarvisState;
  greeting: string;
  subtext?: string;
  online: boolean;
}
