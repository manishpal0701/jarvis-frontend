import {
  WebSocketConnectionState,
  WebSocketClientMessage,
  WebSocketServerEvent,
} from './types';

const WS_BASE_URL =
  process.env.NEXT_PUBLIC_JARVIS_WS_URL || 'ws://localhost:8000/ws/jarvis';

type StateChangeCallback = (state: WebSocketConnectionState) => void;
type EventCallback = (event: WebSocketServerEvent) => void;

class JarvisWebSocketManager {
  private static instance: JarvisWebSocketManager | null = null;

  private ws: WebSocket | null = null;
  private url: string;
  private state: WebSocketConnectionState = 'DISCONNECTED';

  private stateCallbacks: Set<StateChangeCallback> = new Set();
  private eventCallbacks: Set<EventCallback> = new Set();

  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isIntentionallyClosed = false;

  private constructor(url: string = WS_BASE_URL) {
    this.url = url;
  }

  public static getInstance(url: string = WS_BASE_URL): JarvisWebSocketManager {
    if (!JarvisWebSocketManager.instance) {
      JarvisWebSocketManager.instance = new JarvisWebSocketManager(url);
    }
    return JarvisWebSocketManager.instance;
  }

  public getState(): WebSocketConnectionState {
    return this.state;
  }

  public subscribeState(callback: StateChangeCallback): () => void {
    this.stateCallbacks.add(callback);
    callback(this.state);
    return () => {
      this.stateCallbacks.delete(callback);
    };
  }

  public subscribeEvents(callback: EventCallback): () => void {
    this.eventCallbacks.add(callback);
    return () => {
      this.eventCallbacks.delete(callback);
    };
  }

  private setState(newState: WebSocketConnectionState) {
    if (this.state !== newState) {
      this.state = newState;
      console.log(`[JarvisWebSocket] Connection state: ${newState}`);
      this.stateCallbacks.forEach((cb) => cb(newState));
    }
  }

  private notifyEvent(event: WebSocketServerEvent) {
    this.eventCallbacks.forEach((cb) => cb(event));
  }

  public connect(): void {
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN ||
        this.ws.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    this.isIntentionallyClosed = false;
    const initialConnectingState =
      this.reconnectAttempts > 0 ? 'RECONNECTING' : 'CONNECTING';
    this.setState(initialConnectingState);

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('[JarvisWebSocket] WebSocket OPEN');
        this.reconnectAttempts = 0;
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
        this.setState('CONNECTED');
      };

      this.ws.onmessage = (event: MessageEvent) => {
        try {
          const parsed: WebSocketServerEvent = JSON.parse(event.data);
          // Ignore heartbeat ping messages
          if ((parsed as any).type === 'ping') return;
          this.notifyEvent(parsed);
        } catch (e) {
          console.error('[JarvisWebSocket] Failed to parse message:', event.data, e);
        }
      };

      this.ws.onerror = (err) => {
        console.warn('[JarvisWebSocket] WebSocket ERROR:', err);
      };

      this.ws.onclose = (evt) => {
        console.log(`[JarvisWebSocket] WebSocket CLOSE (code: ${evt.code})`);
        this.ws = null;
        if (!this.isIntentionallyClosed) {
          this.setState('DISCONNECTED');
          this.scheduleReconnect();
        } else {
          this.setState('DISCONNECTED');
        }
      };
    } catch (err) {
      console.error('[JarvisWebSocket] Connection creation failed:', err);
      this.setState('ERROR');
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 10000);
      console.log(
        `[JarvisWebSocket] Scheduling reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${Math.round(delay)}ms`
      );
      this.reconnectTimer = setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.error('[JarvisWebSocket] Max reconnect attempts reached.');
      this.setState('ERROR');
    }
  }

  public sendCommand(text: string, enableAudioTts: boolean = false, requestId?: string): boolean {
    const message: WebSocketClientMessage = {
      type: 'command',
      text,
      enable_audio_tts: enableAudioTts,
      request_id: requestId,
    };
    return this.send(message);
  }

  public sendCancel(): boolean {
    const message: WebSocketClientMessage = {
      type: 'cancel',
    };
    return this.send(message);
  }

  public send(message: WebSocketClientMessage): boolean {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
      return true;
    }
    console.warn(
      '[JarvisWebSocket] Send failed: WebSocket not in OPEN state.',
      this.ws?.readyState
    );
    return false;
  }

  public disconnect(): void {
    this.isIntentionallyClosed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setState('DISCONNECTED');
  }
}

export const jarvisWsManager = JarvisWebSocketManager.getInstance();
