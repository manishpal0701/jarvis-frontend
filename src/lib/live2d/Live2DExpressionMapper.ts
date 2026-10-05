import { JarvisEmotion } from '@/types/jarvisEvents';
import { Live2DAvatarController, HibikiExpression } from '@/types/live2d';

export class Live2DExpressionMapper {
  /**
   * Map conceptual Jarvis emotion to registered Hibiki Live2D expression
   */
  public static setJarvisExpression(
    emotion: JarvisEmotion,
    controller: Live2DAvatarController | null
  ): void {
    if (!controller) return;

    const targetExpression = this.mapEmotionToExpression(emotion);
    try {
      controller.setExpression(targetExpression);
    } catch (err) {
      console.warn(`[Live2DExpressionMapper] Expression "${targetExpression}" failed, falling back to Normal:`, err);
      controller.setExpression('Normal');
    }
  }

  /**
   * Conceptual emotion to model expression mapping table
   */

  private static mapEmotionToExpression(emotion: JarvisEmotion): HibikiExpression {
    switch (emotion) {
      case 'happy':
        return 'Blushing';
      case 'angry':
        return 'Angry';
      case 'sad':
      case 'concerned':
        return 'Sad';
      case 'surprised':
        return 'Surprised';
      case 'blushing':
        return 'Blushing';
      case 'normal':
      default:
        return 'Normal';
    }
  }
}
