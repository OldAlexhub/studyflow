export function formatTime(totalSeconds: number): string {
  const s = Math.max(0, Math.ceil(totalSeconds));
  const minutes = Math.floor(s / 60);
  const seconds = s % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
