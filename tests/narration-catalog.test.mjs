import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import { recordedNarrations } from "../app/narrationCatalog.ts";

const sources = Object.values(recordedNarrations).flatMap((source) => typeof source === "string" ? [source] : [...source]);
const uniqueSources = new Set(sources);

test("all delivered recordings are mapped for menu through Southeast", () => {
  assert.equal(Object.keys(recordedNarrations).length, 216);
  assert.equal(uniqueSources.size, 153);

  const expectedByPrefix = {
    "geral-": 4,
    "inicial-": 15,
    "norte-": 19,
    "nordeste-": 34,
    "centro-oeste-": 32,
    "sudeste-": 49,
  };
  for (const [prefix, expected] of Object.entries(expectedByPrefix)) {
    const actual = [...uniqueSources].filter((source) => path.basename(source).startsWith(prefix)).length;
    assert.equal(actual, expected, `${prefix} deveria ter ${expected} arquivos, mas tem ${actual}`);
  }
});

test("dynamic regional narration sequences resolve to recordings", () => {
  assert.deepEqual(recordedNarrations["Maranhão. 1 de 9 estados descobertos."], [
    "/narracoes/nordeste-estado-maranhao.mp3",
    "/narracoes/nordeste-contagem-01.mp3",
  ]);
  assert.equal(recordedNarrations["MATO GROSSO DO SUL. Peça encaixada!"], "/narracoes/centro-oeste-mapa-ms.mp3");
  assert.equal(recordedNarrations["Dica: procure a palavra café."], "/narracoes/sudeste-04-dica-cafe.mp3");
  assert.deepEqual(recordedNarrations["Mutirão concluído! Você ajudou a cuidar do Rio Tietê. A recuperação do rio também exige coleta e tratamento de esgoto. Parabéns, explorador! Você concluiu os seis desafios da Região Sudeste!"], [
    "/narracoes/sudeste-06-conclusao.mp3",
    "/narracoes/sudeste-conclusao-regiao.mp3",
  ]);
});

test("all narration files exist and contain MPEG audio", () => {
  for (const source of uniqueSources) {
    const file = path.join("public", source.replace(/^\//, ""));
    const bytes = fs.readFileSync(file);
    const hasId3 = bytes.subarray(0, 3).toString("ascii") === "ID3";
    const hasMpegFrame = bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0;
    assert.ok(bytes.length > 1_000, `${file} está vazio ou incompleto`);
    assert.ok(hasId3 || hasMpegFrame, `${file} não parece ser MP3`);
  }
});
