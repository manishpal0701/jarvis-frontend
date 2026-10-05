import { JarvisState } from './jarvis';

export type JarvisEmotion =
  | 'normal'
  | 'happy'
  | 'angry'
  | 'sad'
  | 'surprised'
  | 'blushing'
  | 'concerned';

export type JarvisSemanticGesture =
  | 'greeting'
  | 'explain'
  | 'confirm'
  | 'warning'
  | 'success'
  | 'thinking';

export interface JarvisEvent {
  type: 'user_message' | 'state_change' | 'response' | 'emotion' | 'gesture';
  text?: string;
  state?: JarvisState;
  emotion?: JarvisEmotion;
  gesture?: JarvisSemanticGesture;
}

export interface JarvisResponsePayload {
  text: string;
  emotion?: JarvisEmotion;
  gesture?: JarvisSemanticGesture;
  state?: JarvisState;
}
