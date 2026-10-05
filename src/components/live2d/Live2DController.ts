import { AvatarState, Live2DAvatarController } from './Live2DTypes';

const STATE_PRIORITY_MAP: Record<AvatarState, number> = {
  idle: 1,
  thinking: 2,
  listening: 3,
  speaking: 4,
  happy: 4,
  confused: 4,
  error: 5,
};

export class Live2DModelController implements Live2DAvatarController {
  private model: any;
  private currentState: AvatarState = 'idle';
  private mouthParamId: string | null = null;
  private activeSpeechId: string | null = null;
  private isSpeaking = false;

  // Web Audio Realtime Analyser Lip-Sync state
  private audioContext: AudioContext | null = null;
  private activeSourceNode: AudioBufferSourceNode | null = null;
  private activeAnalyserNode: AnalyserNode | null = null;
  private animationFrameId: number | null = null;
  private currentMouthOpen = 0;

  constructor(model: any) {
    this.model = model;
    this.detectMouthParameter();
    this.setupModelMouthHook();
  }

  private setupModelMouthHook(): void {
    if (!this.model) return;

    const enforceMouthState = () => {
      const targetVal = this.isSpeaking ? this.currentMouthOpen : 0;
      try {
        const coreModel = this.model.internalModel?.coreModel;
        if (coreModel && typeof coreModel.setParameterValueById === 'function') {
          coreModel.setParameterValueById('ParamMouthOpenY', targetVal);
          coreModel.setParameterValueById('PARAM_MOUTH_OPEN_Y', targetVal);
        }
      } catch (e) {}
    };

    try {
      if (this.model.internalModel && typeof this.model.internalModel.on === 'function') {
        this.model.internalModel.on('beforeModelUpdate', enforceMouthState);
      } else if (typeof this.model.on === 'function') {
        this.model.on('update', enforceMouthState);
      }
    } catch (err) {
      console.warn('[Live2DModelController] Hook setup warning:', err);
    }
  }

  /**
   * Detect model mouth parameter ID on Cubism model
   */
  public detectMouthParameter(): void {
    if (!this.model) return;

    try {
      const coreModel = this.model.internalModel?.coreModel;
      const possibleIds = [
        'ParamMouthOpenY',
        'PARAM_MOUTH_OPEN_Y',
        'ParamMouthOpen',
        'PARAM_MOUTH_OPEN',
      ];

      if (coreModel) {
        for (const pid of possibleIds) {
          try {
            if (typeof coreModel.getParameterValueById === 'function') {
              const val = coreModel.getParameterValueById(pid);
              if (val !== undefined && val !== null) {
                this.mouthParamId = pid;
                console.log(`[LIVE2D_MOUTH_PARAMETER] id=${pid} found=true`);
                return;
              }
            }
          } catch (e) {}
        }
      }
    } catch (err) {
      console.warn('[Live2DController] Parameter detection warning:', err);
    }

    this.mouthParamId = 'ParamMouthOpenY';
    console.log(`[LIVE2D_MOUTH_PARAMETER] id=ParamMouthOpenY found=true`);
  }

  /**
   * Single Authority State Mutex & Priority Manager
   */
  public setAvatarState(state: AvatarState): void {
    if (!this.model) return;

    const requestedPriority = STATE_PRIORITY_MAP[state] || 1;
    const currentPriority = STATE_PRIORITY_MAP[this.currentState] || 1;

    // Do not allow lower priority state updates to override active speaking or error states
    if (this.isSpeaking && requestedPriority < STATE_PRIORITY_MAP.speaking) {
      return;
    }

    if (this.currentState === state) return;

    this.currentState = state;
    console.log(`[LIVE2D_STATE] state=${state.toUpperCase()} speech_id=${this.activeSpeechId || 'none'}`);

    switch (state) {
      case 'idle':
        this.expression('F01');
        this.motion('Idle', 0);
        this.setMouthOpen(0);
        break;

      case 'listening':
        this.expression('F02');
        this.setMouthOpen(0);
        break;

      case 'thinking':
        this.expression('F03');
        this.motion('TapBody', 0);
        this.setMouthOpen(0);
        break;

      case 'speaking':
        this.expression('F01');
        this.motion('Idle', 0);
        break;

      case 'happy':
        this.expression('F04');
        break;

      case 'confused':
        this.expression('F05');
        break;

      case 'error':
        this.expression('F07');
        this.setMouthOpen(0);
        break;

      default:
        break;
    }
  }

  /**
   * Stop active audio analysis loop
   */
  private stopAudioAnalysis(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.activeSourceNode) {
      try {
        this.activeSourceNode.stop();
        this.activeSourceNode.disconnect();
      } catch (e) {}
      this.activeSourceNode = null;
    }

    if (this.activeAnalyserNode) {
      try {
        this.activeAnalyserNode.disconnect();
      } catch (e) {}
      this.activeAnalyserNode = null;
    }
  }

  /**
   * Start speech audio waveform lip-sync correlated with speech_id
   */
  public startSpeaking(speechId: string, text?: string, audioUrl?: string): void {
    if (!speechId) return;

    this.activeSpeechId = speechId;
    this.isSpeaking = true;
    this.setAvatarState('speaking');

    console.log(`[LIVE2D_STATE] state=SPEAKING speech_id=${speechId}`);
    console.log(`[LIVE2D_EXPRESSION] expression=F01 reason=speaking_start`);

    // Clean up any existing audio analysis loop
    this.stopAudioAnalysis();

    if (audioUrl) {
      this.analyzeAudioUrl(audioUrl, speechId);
    }
  }

  /**
   * Stop speech lip-sync when speech_id finishes
   */
  public stopSpeaking(speechId?: string): void {
    if (speechId && this.activeSpeechId && speechId !== this.activeSpeechId) {
      console.log(`[LIVE2D_LIPSYNC] Ignore stale speaking_end event speech_id=${speechId} active=${this.activeSpeechId}`);
      return;
    }

    console.log(`[LIVE2D_LIPSYNC] active=false speech_id=${this.activeSpeechId || ''}`);

    this.stopAudioAnalysis();
    this.isSpeaking = false;
    this.activeSpeechId = null;

    // Decay mouth to closed (0) smoothly
    let decayFrame = 0;
    const decayMouth = () => {
      if (decayFrame < 6 && !this.isSpeaking) {
        this.currentMouthOpen *= 0.5;
        this.setMouthOpen(this.currentMouthOpen);
        decayFrame++;
        requestAnimationFrame(decayMouth);
      } else if (!this.isSpeaking) {
        this.currentMouthOpen = 0;
        this.setMouthOpen(0);
      }
    };
    decayMouth();

    this.currentState = 'idle';
    this.setAvatarState('listening');
  }

  /**
   * Real Audio Analyser via Web Audio API (No duplicate audible playback)
   */
  private async analyzeAudioUrl(audioUrl: string, speechId: string): Promise<void> {
    try {
      if (!this.audioContext) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        this.audioContext = new AudioCtx();
      }

      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      const response = await fetch(audioUrl);
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

      if (this.activeSpeechId !== speechId) return;

      const sourceNode = this.audioContext.createBufferSource();
      sourceNode.buffer = audioBuffer;

      const analyser = this.audioContext.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.3;

      // Connect source to analyser WITHOUT connecting to destination (0% duplicate audio)
      sourceNode.connect(analyser);

      this.activeSourceNode = sourceNode;
      this.activeAnalyserNode = analyser;

      console.log(`[LIVE2D_LIPSYNC] active=true audio_url=${audioUrl}`);

      const dataArray = new Uint8Array(analyser.fftSize);

      const updateWaveform = () => {
        if (!this.isSpeaking || this.activeSpeechId !== speechId || !this.activeAnalyserNode) {
          return;
        }

        this.activeAnalyserNode.getByteTimeDomainData(dataArray);

        // Compute RMS time-domain PCM amplitude
        let sumSquares = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const norm = (dataArray[i] - 128) / 128;
          sumSquares += norm * norm;
        }
        const rms = Math.sqrt(sumSquares / dataArray.length);

        // Noise gate & normalization
        const NOISE_GATE = 0.03;
        let targetOpenness = 0;

        if (rms > NOISE_GATE) {
          targetOpenness = Math.min(1.0, (rms - NOISE_GATE) * 3.8);
        }

        // Attack & Release Envelope Smoothing
        const ATTACK = 0.45;
        const RELEASE = 0.18;

        if (targetOpenness > this.currentMouthOpen) {
          this.currentMouthOpen += (targetOpenness - this.currentMouthOpen) * ATTACK;
        } else {
          this.currentMouthOpen += (targetOpenness - this.currentMouthOpen) * RELEASE;
        }

        this.setMouthOpen(this.currentMouthOpen);
        this.animationFrameId = requestAnimationFrame(updateWaveform);
      };

      sourceNode.onended = () => {
        if (this.activeSpeechId === speechId) {
          this.stopSpeaking(speechId);
        }
      };

      sourceNode.start(0);
      updateWaveform();
    } catch (err) {
      console.warn(`[LIVE2D_LIPSYNC] Audio analysis error for ${audioUrl}:`, err);
    }
  }
  public setLipSyncMouth(value: number): void {
    const normalized = Math.max(0, Math.min(1, value));
    this.currentMouthOpen = normalized;
    try {
      const coreModel = this.model?.internalModel?.coreModel;
      if (coreModel && typeof coreModel.setParameterValueById === 'function') {
        coreModel.setParameterValueById('PARAM_MOUTH_OPEN_Y', normalized);
        coreModel.setParameterValueById('ParamMouthOpenY', normalized);
      }
    } catch (err) {}
  }

  public setMouthOpen(value: number): void {
    this.setLipSyncMouth(value);
  }

  public expression(nameOrIndex: string | number): void {
    if (!this.model || typeof this.model.expression !== 'function') return;
    try {
      console.log(`[LIVE2D_EXPRESSION] expression=${nameOrIndex}`);
      this.model.expression(nameOrIndex);
    } catch (err) {
      console.warn(`[Live2DController] Expression trigger warning: ${nameOrIndex}`);
    }
  }

  public motion(group: string, index = 0): void {
    if (!this.model || typeof this.model.motion !== 'function') return;
    try {
      this.model.motion(group, index);
    } catch (err) {
      console.warn(`[Live2DController] Motion trigger warning: ${group}:${index}`);
    }
  }

  public getCurrentState(): AvatarState {
    return this.currentState;
  }
}
