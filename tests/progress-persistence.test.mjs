import assert from "node:assert/strict";
import test from "node:test";

import {
  isRemoteProgressNewer,
  normalizePlayerProgress,
  readCachedProgress,
  unlockedAchievementIds,
} from "../app/progressPersistence.ts";

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
    completedChallenges: 5,
    completedRegions: ["norte", "nordeste", "centro-oeste", "sudeste", "sul"],
    firstTryWins: 3,
    highestScore: 500,
    initialPhasePerfect: true,
  });
  assert.deepEqual(unlockedAchievementIds(progress), [
    "primeiros-passos",
    "explorador-do-norte",
    "mestre-das-regioes",
    "acertei-de-primeira",
    "colecionador-de-estrelas",
    "grande-explorador",
  ]);
});