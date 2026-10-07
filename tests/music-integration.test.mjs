import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const pageSource = fs.readFileSync("app/page.tsx", "utf8");
const musicFiles = [
  "musica-menu.mp3",
  "musica-regiao-norte.mp3",
  "musica-regiao-nordeste.mp3",
  "musica-regiao-centro-oeste.mp3",
  "musica-regiao-sudeste.mp3",
];

test("desktop and mobile share music state and the menu volume modal", () => {
  assert.match(pageSource, /screen !== "menu" && screen !== "journey"/);
  assert.match(pageSource, /MobileMenu[\s\S]*onSound=\{\(\) => setModal\("sound"\)\}/);
  assert.match(pageSource, /value=\{volume\}[\s\S]*setVolume\(Number\(e\.target\.value\)\)/);
  assert.match(pageSource, /\[menuMusicRef, northMusicRef, northeastMusicRef, centerWestMusicRef, southeastMusicRef\]/);
});

test("Southeast starts after the three-second intro on every loop", () => {
  assert.match(pageSource, /audio\.currentTime < 3/);
  assert.match(pageSource, /audio\.currentTime = 3/);
  assert.match(pageSource, /audio\.addEventListener\("ended", restartAfterIntro\)/);
});

test("all background music files contain MPEG audio", () => {
  for (const name of musicFiles) {
    const bytes = fs.readFileSync(`public/${name}`);
    const hasId3 = bytes.subarray(0, 3).toString("ascii") === "ID3";
    const hasMpegFrame = bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0;
    assert.ok(bytes.length > 1_000_000, `${name} está vazio ou incompleto`);
    assert.ok(hasId3 || hasMpegFrame, `${name} não parece ser MP3`);
  }
});