import { JarvisSemanticGesture } from '@/types/jarvisEvents';
import { Live2DAvatarController, HibikiMotionGroup } from '@/types/live2d';

export interface GestureDebugInfo {
  gesture: string;
  motion: string;
  paramArmR: number | null;
}

export class Live2DGestureManager {
  private static lastGestureTime = 0;
  private static COOLDOWN_MS = 3500; // 3.5s cooldown between gestures
  private static scheduledTimers: ReturnType<typeof setTimeout>[] = [];

  private static currentGestureName = 'NONE';
  private static currentMotionName = 'NONE';

  /**
   * Play a semantic context-aware gesture on the Live2D character with Priority 3 (FORCE)
   */
  public static playGesture(
    gesture: JarvisSemanticGesture,
    controller: Live2DAvatarController | null,
    bypassCooldown = false
  ): boolean {
    if (!controller) return false;

    const now = Date.now();
    if (!bypassCooldown && now - this.lastGestureTime < this.COOLDOWN_MS) {
      // Cooldown active, skip gesture gracefully
      return false;
    }

    const { group, index } = this.mapGestureToMotion(gesture);
    try {
      // Pass Priority 3 (FORCE) to override background idle loops
      controller.playMotion(group, index, 3);
      this.lastGestureTime = now;
      this.currentGestureName = gesture.toUpperCase();
      this.currentMotionName = `${group}[${index}]`;
      return true;
    } catch (err) {
      console.warn(`[Live2DGestureManager] Failed to play motion (${group}, ${index}):`, err);
      // Safe fallback to default Idle motion
      controller.playMotion('Idle', 0, 3);
      return false;
    }
  }

  /**
   * Schedule intelligent context-aware gestures based on response text length during SPEAKING state
   */
  public static scheduleSpeakingGestures(
    text: string,
    controller: Live2DAvatarController | null
  ): void {
    this.cancelScheduledGestures();
    if (!controller || !text.trim()) return;

    const words = text.trim().split(/\s+/).length;

    // Short response (< 4 words): 0 gestures
    if (words < 4) return;

    // Medium response (4-15 words): 1 gesture at ~1.2s
    if (words <= 15) {
      const timer1 = setTimeout(() => {
        this.playGesture('explain', controller);
      }, 1200);
      this.scheduledTimers.push(timer1);
      return;
    }

    // Long response (> 15 words): 1st gesture at ~1.2s, 2nd gesture at ~4.5s
    const timer1 = setTimeout(() => {
      this.playGesture('explain', controller);
    }, 1200);

    const timer2 = setTimeout(() => {
      this.playGesture('confirm', controller);
    }, 4500);

    this.scheduledTimers.push(timer1, timer2);
  }

  /**
   * Get dev debug status including active gesture, motion group/index, and current PARAM_ARM_R value
   */
  public static getGestureDebugInfo(controller: Live2DAvatarController | null): GestureDebugInfo {
    const armR = controller?.getParamArmR ? controller.getParamArmR() : null;
    return {
      gesture: this.currentGestureName,
      motion: this.currentMotionName,
      paramArmR: armR !== null ? Math.round(armR * 100) / 100 : null,
    };
  }

  /**
   * Cancel all pending scheduled gesture timers
   */
  public static cancelScheduledGestures(): void {
    this.scheduledTimers.forEach((t) => clearTimeout(t));
    this.scheduledTimers = [];
  }

  /**
   * Map semantic gesture to Hibiki motion group and index
   */
  private static mapGestureToMotion(gesture: JarvisSemanticGesture): {
    group: HibikiMotionGroup;
    index: number;
  } {
    switch (gesture) {
      case 'greeting':
        return { group: 'Tap', index: 0 };
      case 'explain':
        return { group: 'Flick', index: 0 };
      case 'confirm':
      case 'success':
        return { group: 'Tap', index: 0 };
      case 'warning':
        return { group: 'Flick', index: 0 };
      case 'thinking':
        return { group: 'Idle', index: 1 };
      default:
        return { group: 'Idle', index: 0 };
    }
  }
}
