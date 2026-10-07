import assert from "node:assert/strict";
import test from "node:test";

import { tidyNickname, validateNickname } from "../app/nicknameValidation.ts";

const PROHIBITED_MESSAGE = "Esse apelido não pode ser usado. Escolha um apelido divertido e respeitoso.";

test("blocks prohibited nicknames and common disguises", () => {
  const prohibitedNicknames = [
    "Onça Pintuda",
    "oncapintuda",
    "Capivarudo",
    "C4p1v4rudo",
    "P1r0c4",
    "p i r o c a",
    "Super Buceta",
    "Puta",
  ];

  for (const nickname of prohibitedNicknames) {
    assert.equal(validateNickname(nickname), PROHIBITED_MESSAGE, nickname);
  }
});

test("allows safe avatar-related nicknames and ordinary words", () => {
  const allowedNicknames = [
    "Onça Veloz",
    "Capivara Legal",
    "Capi Curioso",
    "Lua Azul",
    "Pintada",
    "Computador",
  ];

  for (const nickname of allowedNicknames) {
    assert.equal(validateNickname(nickname), null, nickname);
  }
});

test("keeps existing real-name protection", () => {
  assert.match(validateNickname("Gabriel") ?? "", /nome de verdade/);
  assert.match(validateNickname("Maria Silva") ?? "", /nome de verdade/);
});

test("normalizes whitespace before saving", () => {
  assert.equal(tidyNickname("  Onça   Veloz  "), "Onça Veloz");
});