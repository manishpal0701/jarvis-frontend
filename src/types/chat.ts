import { JarvisState } from './jarvis';

export type { JarvisState };

export type MessageSender = 'user' | 'jarvis' | 'system';

export interface ChatMessage {
  id: string;
  sender: MessageSender;
  content: string;
  timestamp: string;
  status?: 'sending' | 'sent' | 'delivered';
}

export interface SystemStatus {
  status: JarvisState;
  modelLoaded: boolean;
  modelName: string;
  cpuUsage: number;
  memoryUsage: number;
  fps: number;
}
