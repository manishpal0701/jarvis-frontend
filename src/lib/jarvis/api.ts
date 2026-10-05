import {
  HealthResponse,
  JarvisStateResponse,
  CommandRequest,
  CommandResponse,
  CancelResponse,
  ErrorResponse,
} from './types';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_JARVIS_API_URL || 'http://localhost:8000';

class JarvisApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  /**
   * Health check endpoint GET /health
   */
  async checkHealth(): Promise<HealthResponse> {
    const res = await fetch(`${this.baseUrl}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      throw new Error(`Health check failed with status ${res.status}`);
    }
    return res.json();
  }

  /**
   * Get real-time StateMachine state GET /api/v1/jarvis/state
   */
  async getState(): Promise<JarvisStateResponse> {
    const res = await fetch(`${this.baseUrl}/api/v1/jarvis/state`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      const errBody: ErrorResponse = await res.json().catch(() => ({
        success: false as const,
        error: { code: 'HTTP_ERROR', message: `Server error ${res.status}` },
      }));
      throw new Error(errBody.error?.message || `Failed to fetch state (${res.status})`);
    }
    return res.json();
  }

  /**
   * Send REST command POST /api/v1/jarvis/command
   */
  async executeCommand(
    text: string,
    enable_audio_tts: boolean = true
  ): Promise<CommandResponse> {
    const payload: CommandRequest = { text, enable_audio_tts };
    const res = await fetch(`${this.baseUrl}/api/v1/jarvis/command`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errBody: ErrorResponse = await res.json().catch(() => ({
        success: false as const,
        error: { code: 'COMMAND_ERROR', message: `Server returned status ${res.status}` },
      }));
      throw new Error(errBody.error?.message || `Command failed (${res.status})`);
    }

    return res.json();
  }

  /**
   * Cancel active speech and session POST /api/v1/jarvis/cancel
   */
  async cancelSpeech(): Promise<CancelResponse> {
    const res = await fetch(`${this.baseUrl}/api/v1/jarvis/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      const errBody: ErrorResponse = await res.json().catch(() => ({
        success: false as const,
        error: { code: 'CANCEL_ERROR', message: `Cancel returned status ${res.status}` },
      }));
      throw new Error(errBody.error?.message || `Cancellation failed (${res.status})`);
    }

    return res.json();
  }
}

export const jarvisApi = new JarvisApiClient();
