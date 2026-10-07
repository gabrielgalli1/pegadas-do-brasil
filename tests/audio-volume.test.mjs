import assert from "node:assert/strict";
import test from "node:test";

import { audioVolume, backgroundMusicVolume } from "../app/audioVolume.ts";

test("menu volume slider maps percentages to every media element", () => {
  assert.equal(audioVolume(0), 0);
  assert.equal(audioVolume(50), 0.5);
  assert.equal(audioVolume(100), 1);
  assert.equal(audioVolume(-20), 0);
  assert.equal(audioVolume(140), 1);
});

test("background music drops to 25 percent while narration is active", () => {
  assert.equal(backgroundMusicVolume(100, true), 0.25);
  assert.equal(backgroundMusicVolume(80, true), 0.2);
  assert.equal(backgroundMusicVolume(80, false), 0.8);
  assert.equal(backgroundMusicVolume(0, true), 0);
});