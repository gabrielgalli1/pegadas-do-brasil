import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import { recordedNarrations } from "../app/narrationCatalog.ts";

const pageSource = fs.readFileSync("app/page.tsx", "utf8");
const sources = Object.values(recordedNarrations).flatMap((source) => typeof source === "string" ? [source] : [...source]);

test("all delivered menu, initial and North recordings are mapped", () => {
  assert.equal(Object.keys(recordedNarrations).length, 37);
  assert.equal(new Set(sources).size, 38);
  for (const text of Object.keys(recordedNarrations)) {
    assert.ok(pageSource.includes(JSON.stringify(text)), `fala sem chamada correspondente: ${text}`);
  }
});

test("all narration files exist and contain MPEG audio", () => {
  for (const source of new Set(sources)) {
    const file = path.join("public", source.replace(/^\//, ""));
    const bytes = fs.readFileSync(file);
    const hasId3 = bytes.subarray(0, 3).toString("ascii") === "ID3";
    const hasMpegFrame = bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0;
    assert.ok(bytes.length > 1_000, `${file} está vazio ou incompleto`);
    assert.ok(hasId3 || hasMpegFrame, `${file} não parece ser MP3`);
  }
});