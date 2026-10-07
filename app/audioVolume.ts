export function audioVolume(percent: number): number {
  const safePercent = Number.isFinite(percent) ? Math.min(100, Math.max(0, percent)) : 75;
  return safePercent / 100;
}

export function backgroundMusicVolume(percent: number, narrationActive: boolean): number {
  return audioVolume(percent) * (narrationActive ? 0.25 : 1);
}