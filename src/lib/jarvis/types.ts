/**
 * API and WebSocket Contract Types for Jarvis AI Assistant Backend Integration.
 */

export interface CommandRequest {
  text: string;
  enable_audio_tts?: boolean;
}

export interface CommandResponse {
  success: boolean;
  text: string;
  command: string;
}

export interface JarvisStateResponse {
  state: string;
  is_speaking: boolean;
  is_listening: boolean;
}

export interface CancelResponse {
  success: boolean;
  message: string;
  status: string;
}

export interface ErrorDetail {
  code: string;
  message: string;
}

export interface ErrorResponse {
  success: false;
  error: ErrorDetail;
}

export interface HealthResponse {
  status: string;
  service: string;
}

export type WebSocketConnectionState =
  | 'CONNECTED'
  | 'CONNECTING'
  | 'DISCONNECTED'
  | 'RECONNECTING'
  | 'ERROR';

export type WebSocketClientMessageType = 'command' | 'cancel';

export interface WebSocketClientMessage {
  type: WebSocketClientMessageType;
  text?: string;
  enable_audio_tts?: boolean;
  request_id?: string;
}

export type WebSocketServerEventType =
  | 'response_start'
  | 'response_chunk'
  | 'response_end'
  | 'response'
  | 'wake_detected'
  | 'speaking_start'
  | 'speaking_end'
  | 'state'
  | 'video_progress'
  | 'completed'
  | 'cancelled'
  | 'error';

export interface WebSocketServerEvent {
  type: WebSocketServerEventType;
  text?: string;
  timestamp?: string;
  request_id?: string;
  speech_id?: string;
  audio_url?: string;
  status?: string;
  state?: string;
  stage?: string;
  progress?: number;
  full_text?: string;
  output_file?: string;
  data?: any;
  error?: ErrorDetail;
}
