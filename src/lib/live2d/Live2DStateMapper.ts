import { JarvisState } from '@/types/jarvis';
import { Live2DAvatarController } from '@/types/live2d';
import { Live2DGestureManager } from './Live2DGestureManager';
import { Live2DExpressionMapper } from './Live2DExpressionMapper';
import { JarvisEmotion } from '@/types/jarvisEvents';

export class Live2DStateMapper {
  private static speakingTimer: ReturnType<typeof setInterval> | null = null;
  private static idleVariationTimer: ReturnType<typeof setTimeout> | null = null;
  private static currentState: JarvisState | null = null;

  /**
   * Apply Jarvis UI state to the Live2D controller
   */
  public static applyState(
    state: JarvisState,
    controller: Live2DAvatarController | null,
    emotion: JarvisEmotion = 'normal',
    responseText?: string
  ): void {
    if (!controller) return;

    this.currentState = state;

    // Clean up speaking mouth loop and gesture timers when changing states
    this.clearTimers(controller);

    // Apply emotion expression mapping
    Live2DExpressionMapper.setJarvisExpression(emotion, controller);

    switch (state) {
      case 'idle':
        controller.playMotion('Idle', 0, 1);
        controller.setMouthOpen(0);
        this.startRandomIdleLoop(controller);
        break;

      case 'listening':
        controller.playMotion('Idle', 0, 1);
        controller.setMouthOpen(0);
        this.startRandomIdleLoop(controller);
        break;

      case 'wake_detected':
        controller.setExpression('Surprised');
        controller.playMotion('Tap', 0, 2);
        controller.setMouthOpen(0);
        break;

      case 'thinking':
      case 'processing':
        controller.setExpression('f01');
        controller.playMotion('Idle', 1, 1);
        controller.setMouthOpen(0);
        break;

      case 'speaking':
        controller.playMotion('Idle', 0, 1);
        this.startSpeakingAnimation(controller);

        // Schedule conversational gestures if response text is provided
        if (responseText) {
          Live2DGestureManager.scheduleSpeakingGestures(responseText, controller);
        }
        break;

      case 'video_analyzing':
        controller.setExpression('f01');
        controller.playMotion('Idle', 1, 1);
        controller.setMouthOpen(0);
        break;

      case 'video_editing':
        controller.setExpression('Normal');
        controller.playMotion('Idle', 0, 1);
        controller.setMouthOpen(0);
        break;

      case 'video_exporting':
        controller.setExpression('Surprised');
        controller.playMotion('Idle', 1, 1);
        controller.setMouthOpen(0);
        break;

      case 'completed':
        controller.setExpression('Blushing');
        controller.playMotion('Tap', 0, 2);
        controller.setMouthOpen(0);
        break;

      case 'error':
        controller.setExpression('Sad');
        controller.playMotion('Idle', 0, 1);
        controller.setMouthOpen(0);
        break;

      case 'offline':
        controller.playMotion('Idle', 0, 1);
        controller.setMouthOpen(0);
        break;

      default:
        controller.playMotion('Idle', 0, 1);
        controller.setMouthOpen(0);
        break;
    }
  }

  /**
   * Real Audio Analyser Lip-Sync is handled by Live2DModelController
   */
  private static startSpeakingAnimation(controller: Live2DAvatarController): void {
    if (this.speakingTimer) {
      clearInterval(this.speakingTimer);
      this.speakingTimer = null;
    }
  }

  /**
   * Start randomized idle motion variation loop (every 8-15s) with motion playing safeguard
   */
  private static startRandomIdleLoop(controller: Live2DAvatarController): void {
    if (this.idleVariationTimer) {
      clearTimeout(this.idleVariationTimer);
      this.idleVariationTimer = null;
    }

    // Schedule next subtle idle variation between 8000ms and 15000ms
    const randomDelay = Math.floor(Math.random() * 7000) + 8000;
    this.idleVariationTimer = setTimeout(() => {
      if (!controller || (this.currentState !== 'idle' && this.currentState !== 'listening')) {
        return;
      }

      // Safeguard: Do not interrupt if a gesture motion is currently playing
      if (controller.isMotionPlaying && controller.isMotionPlaying()) {
        this.startRandomIdleLoop(controller);
        return;
      }

      // Pick random idle motion variation (index 0, 1, or 2)
      const randomIndex = Math.floor(Math.random() * 3);
      try {
        controller.playMotion('Idle', randomIndex, 1);
      } catch (e) {
        controller.playMotion('Idle', 0, 1);
      }

      // Recursively schedule next random idle variation
      this.startRandomIdleLoop(controller);
    }, randomDelay);
  }

  /**
   * Stop mouth animation loop and reset mouth to fully closed (0)
   */
  public static stopSpeakingAnimation(controller?: Live2DAvatarController | null): void {
    if (this.speakingTimer) {
      clearInterval(this.speakingTimer);
      this.speakingTimer = null;
    }
    if (controller) {
      controller.setMouthOpen(0);
    }
  }

  /**
   * Clear all active state timers and gesture schedules
   */
  public static clearTimers(controller?: Live2DAvatarController | null): void {
    this.stopSpeakingAnimation(controller);
    Live2DGestureManager.cancelScheduledGestures();

    if (this.idleVariationTimer) {
      clearTimeout(this.idleVariationTimer);
      this.idleVariationTimer = null;
    }
  }
}
