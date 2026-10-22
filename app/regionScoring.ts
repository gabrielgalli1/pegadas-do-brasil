export function regionChallengePoints(completedRegions: readonly string[], regionId: string, attempts: number): number {
  if (completedRegions.includes(regionId)) return 0;
  return attempts === 0 ? 100 : 60;
}

export function countsAsFirstTry(completedRegions: readonly string[], regionId: string, attempts: number): boolean {
  return !completedRegions.includes(regionId) && attempts === 0;
}
