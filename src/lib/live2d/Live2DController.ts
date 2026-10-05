import { Live2DAvatarController, HibikiExpression, HibikiMotionGroup } from '@/types/live2d';

export class Live2DController implements Live2DAvatarController {
  private model: any;

  private activeAudio: HTMLAudioElement | null = null;
  private audioContext: AudioContext | null = null;
  private activeSourceNode: MediaElementAudioSourceNode | null = null;
  private activeAnalyserNode: AnalyserNode | null = null;
  private animationFrameId: number | null = null;
  private currentMouthOpen = 0;
  private isSpeaking = false;
  private onSpeechEndCallback: (() => void) | null = null;

  // Throttling counter for lip sync debug logging
  private lipSyncLogCounter = 0;

  constructor(model: any) {
    this.model = model;
    this.setupModelMouthHook();
  }

  /**
   * Register frame update hook to strictly override mouth parameters post-motion manager evaluation.
   * Keeps idle motions (head, eyes, body, breathing) alive while separating mouth parameter ownership.
   */
  private setupModelMouthHook(): void {
    if (!this.model) return;

    const enforceMouthState = () => {
      const targetVal = this.isSpeaking ? this.currentMouthOpen : 0;
      try {
        const coreModel = this.model.internalModel?.coreModel;
        if (coreModel && typeof coreModel.setParameterValueById === 'function') {
          coreModel.setParameterValueById('PARAM_MOUTH_OPEN_Y', targetVal);
          coreModel.setParameterValueById('ParamMouthOpenY', targetVal);
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
      console.warn('[Live2DController] Hook setup warning:', err);
    }
  }

  /**
   * Authoritative Lip-Sync Mouth Control Function.
   * All speech mouth parameter updates flow through this single path.
   */
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

  /**
   * Set mouth opening parameter directly (compatibility wrapper)
   */
  public setMouthOpen(value: number): void {
    this.setLipSyncMouth(value);
  }

  /**
   * Play a registered motion group (e.g., 'Idle', 'Tap', 'Flick') with given priority level.
   * Priority levels: 1 = IDLE, 2 = NORMAL, 3 = FORCE
   */
  public playMotion(group: HibikiMotionGroup | string, index = 0, priority = 3): void {
    if (!this.model) return;
    try {
      if (typeof this.model.motion === 'function') {
        this.model.motion(group, index, priority);
      }
    } catch (err) {
      console.warn(`[Live2DController] Failed to play motion ${group}:${index} at priority ${priority}`, err);
    }
  }

  /**
   * Set facial expression (e.g., 'Normal', 'Angry', 'Sad', 'Surprised', 'Blushing', 'f01')
   */
  public setExpression(name: HibikiExpression | string): void {
    if (!this.model) return;
    try {
      if (typeof this.model.expression === 'function') {
        this.model.expression(name);
      }
    } catch (err) {
      console.warn(`[Live2DController] Failed to set expression ${name}`, err);
    }
  }

  /**
   * Reset expression to default Normal
   */
  public resetExpression(): void {
    this.setExpression('Normal');
  }

  /**
   * Focus eye/head tracking towards stage coordinates
   */
  public focus(x: number, y: number): void {
    if (!this.model) return;
    try {
      if (typeof this.model.focus === 'function') {
        this.model.focus(x, y);
      }
    } catch (err) {
      // Focus safety catch
    }
  }

  /**
   * Query the current right arm motion parameter (PARAM_ARM_R) value
   */
  public getParamArmR(): number | null {
    if (!this.model) return null;
    try {
      const coreModel = this.model.internalModel?.coreModel;
      if (coreModel && typeof coreModel.getParameterValueById === 'function') {
        return coreModel.getParameterValueById('PARAM_ARM_R');
      }
    } catch (err) {
      // Ignore
    }
    return null;
  }

  /**
   * Stop current active voice playback and audio analyser loop
   */
  public stopSpeech(): void {
    this.stopAudioAnalysis();
    if (this.activeAudio) {
      try {
        this.activeAudio.pause();
        this.activeAudio.currentTime = 0;
      } catch (e) {}
      this.activeAudio = null;
    }
    this.isSpeaking = false;
    this.smoothDecayMouth();
    console.log('[TTS_AUDIO] playback_ended=true');
    console.log('[LIP_SYNC] audio_ended=true');
  }

  /**
   * Smooth decay mouth opening to zero when speech ends
   */
  private smoothDecayMouth(): void {
    let frameCount = 0;
    const decayStep = () => {
      if (frameCount < 8 && !this.isSpeaking) {
        this.currentMouthOpen *= 0.5;
        this.setLipSyncMouth(this.currentMouthOpen);
        frameCount++;
        requestAnimationFrame(decayStep);
      } else if (!this.isSpeaking) {
        this.currentMouthOpen = 0;
        this.setLipSyncMouth(0);
      }
    };
    decayStep();
  }

  private activeSpeechId: string | null = null;

  /**
   * Speak using backend-generated TTS audio or native model audio URL.
   * Single playback authority owner: FRONTEND.
   */
  public speak(soundUrl?: string, text?: string, onEnded?: () => void, speechId?: string): void {
    const rxTime = performance.now();
    const effSpeechId = speechId || (soundUrl ? soundUrl.split('/').pop() : `speech_${Date.now()}`);

    console.log(`[VOICE_PLAY_REQUEST] speech_id=${effSpeechId}`);

    // Speech ID Deduplication Guard: Ignore duplicate trigger for active speech
    if (effSpeechId && this.activeSpeechId === effSpeechId && this.activeAudio && !this.activeAudio.ended && !this.activeAudio.paused) {
      console.log(`[VOICE_PLAY_DUPLICATE_IGNORED] speech_id=${effSpeechId}`);
      return;
    }

    console.log(`[VOICE_PLAY_ACCEPTED] speech_id=${effSpeechId}`);
    console.log(`[VOICE_PLAYBACK_OWNER] owner=FRONTEND`);
    console.log(`[CHARACTER_AUDIO_START] text="${text || ''}"`);

    try {
      const targetUrl = soundUrl || '/live2d/hibiki/sounds/hibiki_01.wav';

      // Prevent interrupting if exact same audio URL is already playing
      if (this.activeAudio && !this.activeAudio.ended && !this.activeAudio.paused) {
        if (this.activeAudio.src.endsWith(targetUrl)) {
          console.log(`[VOICE_PLAY_DUPLICATE_IGNORED] speech_id=${effSpeechId} src=${targetUrl}`);
          return;
        }
        console.log(`[HIBIKI_AUDIO] Switching voice session for new speech_id=${effSpeechId}`);
        this.stopSpeech();
      }

      this.activeSpeechId = effSpeechId || null;
      this.onSpeechEndCallback = onEnded || null;

      console.log(`[TTS_AUDIO] source=${targetUrl}`);
      console.log(`[CHARACTER_AUDIO_PLAYING] source="${targetUrl}"`);

      const audio = new Audio(targetUrl);
      this.activeAudio = audio;
      audio.volume = 1.0;
      audio.muted = false;
      audio.crossOrigin = 'anonymous';

      // Attach Web Audio Analyser & Speaker Destination Node
      this.setupWebAudioAnalyser(audio);

      const handleSpeechEnd = () => {
        const endTime = performance.now();
        console.log(`[VOICE_PLAY_ENDED] speech_id=${effSpeechId} timestamp=${endTime.toFixed(2)}`);
        console.log('[CHARACTER_AUDIO_END]');
        if (this.activeAudio === audio) {
          this.stopSpeech();
          if (this.onSpeechEndCallback) {
            const cb = this.onSpeechEndCallback;
            this.onSpeechEndCallback = null;
            cb();
          }
        }
      };

      audio.onended = handleSpeechEnd;
      audio.onerror = (e) => {
        console.error(`[VOICE_PLAY_ERROR] speech_id=${effSpeechId} source="${targetUrl}" error=`, e);
        if (this.activeAudio === audio) {
          handleSpeechEnd();
        }
      };

      console.log(`[VOICE_PLAY_STARTED] speech_id=${effSpeechId}`);

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log(`[TTS_AUDIO] playback_started=true speech_id=${effSpeechId}`);
          })
          .catch((error) => {
            if (error && (error.name === 'AbortError' || (typeof error.message === 'string' && error.message.includes('interrupted')))) {
              console.log(`[VOICE_PLAY_CANCELLED] speech_id=${effSpeechId} src=${targetUrl}`);
              return;
            }
            console.error(`[VOICE_PLAY_ERROR] speech_id=${effSpeechId} play_promise_rejected src=${targetUrl}`, error);
            if (this.activeAudio === audio) {
              handleSpeechEnd();
            }
          });
      }
    } catch (err) {
      console.error(`[VOICE_PLAY_ERROR] speech_id=${effSpeechId} speak_failed error=`, err);
    }
  }

  /**
   * Attach Web Audio API AnalyserNode to HTMLAudioElement for real-time RMS mouth lip-sync.
   * Connects source to AnalyserNode AND AudioContext.destination for audible speaker output.
   */
  private setupWebAudioAnalyser(audio: HTMLAudioElement): void {
    try {
      this.stopAudioAnalysis();

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!this.audioContext && AudioContextClass) {
        this.audioContext = new AudioContextClass();
      }

      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      if (this.audioContext) {
        const sourceNode = this.audioContext.createMediaElementSource(audio);
        const analyser = this.audioContext.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.25;

        // Connect audio source to AnalyserNode AND AudioContext destination (speakers)
        sourceNode.connect(analyser);
        analyser.connect(this.audioContext.destination);

        this.activeSourceNode = sourceNode;
        this.activeAnalyserNode = analyser;
        this.isSpeaking = true;

        console.log('[LIP_SYNC] audio_started=true');
        console.log('[LIP_SYNC] analyser_initialized=true');
        console.log('[LIP_SYNC] parameter=PARAM_MOUTH_OPEN_Y');

        const dataArray = new Uint8Array(analyser.fftSize);
        let firstFrameRecorded = false;

        const updateAnalyser = () => {
          if (!this.isSpeaking || !this.activeAnalyserNode || this.activeAudio !== audio) {
            return;
          }

          this.activeAnalyserNode.getByteTimeDomainData(dataArray);

          // Calculate RMS amplitude
          let sumSquares = 0;
          for (let i = 0; i < dataArray.length; i++) {
            const norm = (dataArray[i] - 128) / 128;
            sumSquares += norm * norm;
          }
          const rms = Math.sqrt(sumSquares / dataArray.length);

          if (!firstFrameRecorded && rms > 0.01) {
            firstFrameRecorded = true;
            console.log(`[TTS_FRONTEND] first_audio_frame=${performance.now().toFixed(2)}`);
          }

          // Noise gate & scale
          const NOISE_GATE = 0.02;
          let targetOpenness = 0;
          if (rms > NOISE_GATE) {
            targetOpenness = Math.min(1.0, (rms - NOISE_GATE) * 4.2);
          }

          // Attack & Release interpolation
          const ATTACK = 0.5;
          const RELEASE = 0.22;
          if (targetOpenness > this.currentMouthOpen) {
            this.currentMouthOpen += (targetOpenness - this.currentMouthOpen) * ATTACK;
          } else {
            this.currentMouthOpen += (targetOpenness - this.currentMouthOpen) * RELEASE;
          }

          this.setLipSyncMouth(this.currentMouthOpen);

          // Throttled debug log (every 30 frames ~ 500ms)
          this.lipSyncLogCounter++;
          if (this.lipSyncLogCounter % 30 === 0) {
            console.log(`[LIP_SYNC] rms=${rms.toFixed(3)} mouth=${this.currentMouthOpen.toFixed(2)}`);
          }

          this.animationFrameId = requestAnimationFrame(updateAnalyser);
        };

        this.animationFrameId = requestAnimationFrame(updateAnalyser);
      }
    } catch (err) {
      console.warn('[Live2DController] Web Audio API setup warning:', err);
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
   * Check if a motion is currently playing on the model
   */
  public isMotionPlaying(): boolean {
    if (!this.model) return false;
    try {
      const motionManager = this.model.internalModel?.motionManager;
      if (motionManager && typeof motionManager.state?.isPlaying === 'function') {
        return motionManager.state.isPlaying();
      }
    } catch (err) {
      // Ignore
    }
    return false;
  }
}


