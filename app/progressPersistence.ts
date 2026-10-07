export type PlayerProgress = {
  score: number;
  challengeIndex: number;
  completedChallenges: number;
  firstTryWins: number;
  highestScore: number;
  completedPhase: boolean;
  completedRegions: string[];
  initialPhasePerfect: boolean;
  initialPhaseHadMistake: boolean;
  unlockedLevel: number;
  northChallenge: number;
  northeastChallenge: number;
  centerWestChallenge: number;
  southeastChallenge: number;
};

export type CachedPlayerProgress = PlayerProgress & { updatedAt: string };

export const EMPTY_PROGRESS: PlayerProgress = {
  score: 0,
  challengeIndex: 0,
  completedChallenges: 0,
  firstTryWins: 0,
  highestScore: 0,
  completedPhase: false,
  completedRegions: [],
  initialPhasePerfect: false,
  initialPhaseHadMistake: false,
  unlockedLevel: 0,
  northChallenge: 1,
  northeastChallenge: 1,
  centerWestChallenge: 1,
  southeastChallenge: 1,
};

const REGION_IDS = new Set(["norte", "nordeste", "centro-oeste", "sudeste", "sul"]);

function boundedInteger(value: unknown, minimum: number, maximum: number, fallback: number): number {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(maximum, Math.max(minimum, Math.trunc(number))) : fallback;
}

export function normalizePlayerProgress(value: unknown): PlayerProgress {
  const data = value && typeof value === "object" ? value as Partial<PlayerProgress> : {};
  const score = boundedInteger(data.score, 0, Number.MAX_SAFE_INTEGER, 0);
  const completedPhase = Boolean(data.completedPhase);
  const completedRegions = Array.isArray(data.completedRegions)
    ? [...new Set(data.completedRegions.filter((region): region is string => typeof region === "string" && REGION_IDS.has(region)))]
    : [];

  return {
    score,
    challengeIndex: boundedInteger(data.challengeIndex, 0, 4, 0),
    completedChallenges: boundedInteger(data.completedChallenges, 0, 5, 0),
    firstTryWins: boundedInteger(data.firstTryWins, 0, Number.MAX_SAFE_INTEGER, 0),
    highestScore: Math.max(score, boundedInteger(data.highestScore, 0, Number.MAX_SAFE_INTEGER, score)),
    completedPhase,
    completedRegions,
    initialPhasePerfect: Boolean(data.initialPhasePerfect),
    initialPhaseHadMistake: Boolean(data.initialPhaseHadMistake),
    unlockedLevel: boundedInteger(data.unlockedLevel, completedPhase ? 1 : 0, 5, completedPhase ? 1 : 0),
    northChallenge: boundedInteger(data.northChallenge, 1, 6, 1),
    northeastChallenge: boundedInteger(data.northeastChallenge, 1, 6, 1),
    centerWestChallenge: boundedInteger(data.centerWestChallenge, 1, 6, 1),
    southeastChallenge: boundedInteger(data.southeastChallenge, 1, 6, 1),
  };
}

export function readCachedProgress(raw: string | null): CachedPlayerProgress | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      ...normalizePlayerProgress(parsed),
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : "",
    };
  } catch {
    return null;
  }
}

export function unlockedAchievementIds(progress: PlayerProgress): string[] {
  const achievements: string[] = [];
  if (progress.completedChallenges >= 1) achievements.push("primeiros-passos");
  if (progress.completedRegions.includes("norte")) achievements.push("explorador-do-norte");
  if (progress.completedRegions.length >= 5) achievements.push("mestre-das-regioes");
  if (progress.firstTryWins >= 3) achievements.push("acertei-de-primeira");
  if (progress.highestScore >= 400) achievements.push("colecionador-de-estrelas");
  if (progress.initialPhasePerfect) achievements.push("grande-explorador");
  return achievements;
}

export function isRemoteProgressNewer(localUpdatedAt: string, remoteUpdatedAt: string): boolean {
  if (!localUpdatedAt) return true;
  const localTime = Date.parse(localUpdatedAt);
  const remoteTime = Date.parse(remoteUpdatedAt);
  if (!Number.isFinite(localTime)) return true;
  if (!Number.isFinite(remoteTime)) return false;
  return remoteTime >= localTime;
}