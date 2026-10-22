import assert from "node:assert/strict";
import test from "node:test";

import { countsAsFirstTry, regionChallengePoints } from "../app/regionScoring.ts";

test("awards points during the first run of a region", () => {
  assert.equal(regionChallengePoints([], "sul", 0), 100);
  assert.equal(regionChallengePoints([], "sul", 1), 60);
  assert.equal(countsAsFirstTry([], "sul", 0), true);
});

test("does not award points or first-try wins when replaying a completed region", () => {
  assert.equal(regionChallengePoints(["sul"], "sul", 0), 0);
  assert.equal(regionChallengePoints(["norte", "sul"], "sul", 2), 0);
  assert.equal(countsAsFirstTry(["sul"], "sul", 0), false);
});
