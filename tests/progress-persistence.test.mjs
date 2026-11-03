import assert from "node:assert/strict";
import test from "node:test";

import {
  isRemoteProgressNewer,
  isBonusUnlocked,
  bonusRegionIds,
  normalizePlayerProgress,
  readCachedProgress,
  unlockedAchievementIds,
} from "../app/progressPersistence.ts";

test("bonus needs the initial phase and every different region, not just five entries", () => {
  assert.equal(isBonusUnlocked(true, bonusRegionIds), true);
  assert.equal(isBonusUnlocked(false, bonusRegionIds), false);
  assert.equal(isBonusUnlocked(true, ["norte", "nordeste", "centro-oeste", "sudeste", "sudeste"]), false);
  for (const missing of bonusRegionIds) {
    assert.equal(isBonusUnlocked(true, bonusRegionIds.filter((id) => id !== missing)), false);
  }
});

test("older saves unlock the bonus without losing main progress", () => {
  const cached = readCachedProgress(JSON.stringify({ completedPhase: true, completedRegions: bonusRegionIds, score: 3500 }));
  assert.equal(isBonusUnlocked(cached.completedPhase, cached.completedRegions), true);
  assert.equal(cached.score, 3500);
  assert.deepEqual(cached.bonusPlacedRegions, []);
  assert.equal(cached.bonusCompleted, false);
});

test("bonus save restores partial placements and completion from the same player snapshot", () => {
  const partial = normalizePlayerProgress({ completedPhase: true, completedRegions: bonusRegionIds, bonusPlacedRegions: ["norte", "norte", "sul", "invalid"], bonusCompleted: true });
  assert.deepEqual(partial.bonusPlacedRegions, ["norte", "sul"]);
  assert.equal(partial.bonusCompleted, false);
  const finished = readCachedProgress(JSON.stringify({ ...partial, bonusPlacedRegions: bonusRegionIds }));
  assert.equal(finished.bonusCompleted, true);
  assert.deepEqual(finished.bonusPlacedRegions, bonusRegionIds);
  const locked = normalizePlayerProgress({ bonusPlacedRegions: bonusRegionIds, bonusCompleted: true });
  assert.deepEqual(locked.bonusPlacedRegions, []);
  assert.equal(locked.bonusCompleted, false);
});

test("normalizes stored progress and rejects invalid values", () => {
  const progress = normalizePlayerProgress({
    score: 320,
    highestScore: 200,
    challengeIndex: 99,
    completedChallenges: -4,
    completedPhase: true,
    completedRegions: ["norte", "norte", "invalida"],
    unlockedLevel: 0,
    northChallenge: 7,
  });

  assert.equal(progress.score, 320);
  assert.equal(progress.highestScore, 320);
  assert.equal(progress.challengeIndex, 4);
  assert.equal(progress.completedChallenges, 0);
  assert.equal(progress.unlockedLevel, 1);
  assert.equal(progress.northChallenge, 6);
  assert.deepEqual(progress.completedRegions, ["norte"]);
});

test("reads legacy localStorage progress as a valid cache", () => {
  const cached = readCachedProgress(JSON.stringify({ score: 500, completedPhase: true }));
  assert.equal(cached?.score, 500);
  assert.equal(cached?.highestScore, 500);
  assert.equal(cached?.updatedAt, "");
});

test("selects remote progress only when it is at least as recent", () => {
  assert.equal(isRemoteProgressNewer("", "2026-10-07T12:00:00Z"), true);
  assert.equal(isRemoteProgressNewer("2026-10-07T13:00:00Z", "2026-10-07T12:00:00Z"), false);
  assert.equal(isRemoteProgressNewer("2026-10-07T12:00:00Z", "2026-10-07T13:00:00Z"), true);
});

test("derives the achievements saved in Supabase", () => {
  const progress = normalizePlayerProgress({
    completedPhase: true,
    completedChallenges: 5,
    completedRegions: ["norte", "nordeste", "centro-oeste", "sudeste", "sul"],
    firstTryWins: 3,
    highestScore: 500,
    initialPhasePerfect: true,
  });
  assert.deepEqual(unlockedAchievementIds(progress), [
    "emblema-brasil",
    "emblema-norte",
    "emblema-nordeste",
    "emblema-centro-oeste",
    "emblema-sudeste",
    "emblema-sul",
  ]);
});
