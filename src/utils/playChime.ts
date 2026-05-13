import { NativeModules, Vibration } from 'react-native';

const { StudyFlowSound } = NativeModules;

export function playChime(): void {
  Vibration.vibrate(400);
  try {
    StudyFlowSound?.playChime();
  } catch {
    // silently ignore if module unavailable in dev
  }
}
