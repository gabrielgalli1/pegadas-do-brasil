"use client";

import { useEffect, useMemo, useState } from "react";

type Props = { canPlay: boolean; onComplete: () => void };
type Cell = { row: number; col: number };
type Placement = { word: string; cells: Cell[] };
type Puzzle = { grid: string[][]; placements: Placement[] };

const SIZE = 10;
const WORDS = ["MATA", "SERRA", "PRAIA", "MICO", "CAFE", "CIDADE", "CRISTO"];
const FILLER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const directions = [
  { dr: 0, dc: 1, kind: "horizontal" },
  { dr: 1, dc: 0, kind: "vertical" },
] as const;

function shuffle<T>(items: readonly T[]) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const random = Math.floor(Math.random() * (index + 1));
    [result[index], result[random]] = [result[random], result[index]];
  }
  return result;
}

function makePuzzle(): Puzzle {
  for (let boardAttempt = 0; boardAttempt < 80; boardAttempt += 1) {
    const grid = Array.from({ length: SIZE }, () => Array<string>(SIZE).fill(""));
    const placements: Placement[] = [];
    const orderedWords = [...WORDS].sort((a, b) => b.length - a.length);

    for (let wordIndex = 0; wordIndex < orderedWords.length; wordIndex += 1) {
      const word = orderedWords[wordIndex];
      const preferredKind = wordIndex % 2 === 0 ? "vertical" : "horizontal";
      const orderedDirections = shuffle(directions.filter((direction) => direction.kind === preferredKind));
      let placed = false;

      for (const direction of orderedDirections) {
        const candidates = shuffle(Array.from({ length: SIZE * SIZE }, (_, index) => ({ row: Math.floor(index / SIZE), col: index % SIZE })));
        for (const start of candidates) {
          const endRow = start.row + direction.dr * (word.length - 1);
          const endCol = start.col + direction.dc * (word.length - 1);
          if (endRow < 0 || endRow >= SIZE || endCol < 0 || endCol >= SIZE) continue;
          const cells = Array.from({ length: word.length }, (_, index) => ({ row: start.row + direction.dr * index, col: start.col + direction.dc * index }));
          if (!cells.every((cell) => !grid[cell.row][cell.col])) continue;
          cells.forEach((cell, index) => { grid[cell.row][cell.col] = word[index]; });
          placements.push({ word, cells });
          placed = true;
          break;
        }
        if (placed) break;
      }
      if (!placed) break;
    }

    if (placements.length === WORDS.length) {
      grid.forEach((row) => row.forEach((letter, col) => {
        if (!letter) row[col] = FILLER[Math.floor(Math.random() * FILLER.length)];
      }));
      return { grid, placements };
    }
  }
  throw new Error("Não foi possível montar o caça-palavras.");
}

function keyOf(cell: Cell) { return `${cell.row}-${cell.col}`; }
function sameCell(a: Cell, b: Cell) { return a.row === b.row && a.col === b.col; }

export default function SoutheastWordSearch({ canPlay, onComplete }: Props) {
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  useEffect(() => {
    const timer = window.setTimeout(() => setPuzzle(makePuzzle()), 0);
    return () => window.clearTimeout(timer);
  }, []);
  const [start, setStart] = useState<Cell | null>(null);
  const [found, setFound] = useState<string[]>([]);
  const [message, setMessage] = useState("Escolha a primeira e a última letra de uma palavra.");
  const [hintedWord, setHintedWord] = useState<string | null>(null);
  const foundCellWords = useMemo(() => new Map((puzzle?.placements ?? []).filter((placement) => found.includes(placement.word)).flatMap((placement) => placement.cells.map((cell) => [keyOf(cell), placement.word] as const))), [found, puzzle]);

  function giveHint() {
    if (!puzzle || !canPlay) return;
    const remaining = puzzle.placements.filter((placement) => !found.includes(placement.word));
    if (!remaining.length) return;
    const placement = remaining[Math.floor(Math.random() * remaining.length)];
    const first = placement.cells[0];
    const last = placement.cells[placement.cells.length - 1];
    const vertical = first.col === last.col;
    const middleRow = (first.row + last.row) / 2;
    const middleCol = (first.col + last.col) / 2;
    const area = vertical
      ? middleRow < SIZE / 2 ? "na metade de cima" : "na metade de baixo"
      : middleCol < SIZE / 2 ? "na metade esquerda" : "na metade direita";
    setHintedWord(placement.word);
    setMessage(`Dica: procure ${placement.word === "CAFE" ? "CAFÉ" : placement.word} ${area}; ela segue na ${vertical ? "vertical" : "horizontal"}.`);
  }
  function choose(cell: Cell) {
    if (!canPlay) return;
    if (!start) {
      setStart(cell);
      setMessage("Agora escolha a última letra, na horizontal ou na vertical.");
      return;
    }
    if (sameCell(start, cell)) {
      setStart(null);
      setMessage("Seleção cancelada. Escolha outra letra inicial.");
      return;
    }
    if (!puzzle) return;
    const placement = puzzle.placements.find((item) => {
      const first = item.cells[0];
      const last = item.cells[item.cells.length - 1];
      return (sameCell(first, start) && sameCell(last, cell)) || (sameCell(last, start) && sameCell(first, cell));
    });
    setStart(null);
    if (!placement || found.includes(placement.word)) {
      setMessage("Essa sequência não forma uma palavra da lista. Tente novamente!");
      return;
    }
    const next = [...found, placement.word];
    setFound(next);
    setHintedWord(null);
    setMessage(`${placement.word === "CAFE" ? "CAFÉ" : placement.word} encontrada!`);
    if (next.length === WORDS.length) window.setTimeout(onComplete, 500);
  }

  if (!puzzle) return <div className="southeast-word-loading" role="status">Montando um novo caça-palavras…</div>;

  return <div className="southeast-word-game">
    <div className="southeast-word-toolbar">
      <div><span aria-hidden="true">🔎</span><strong>{found.length} DE {WORDS.length}</strong><small>PALAVRAS ENCONTRADAS</small></div>
      <p role="status">{message}</p>
      <button type="button" className="southeast-word-hint" onClick={giveHint} disabled={!canPlay || found.length === WORDS.length} aria-label="Receber uma dica sobre uma palavra ainda não encontrada"><span aria-hidden="true">💡</span> PRECISO DE UMA DICA</button>
    </div>
    <div className="southeast-word-layout">
      <div className="southeast-word-grid" role="grid" aria-label="Caça-palavras com dez linhas e dez colunas">
        {puzzle.grid.flatMap((row, rowIndex) => row.map((letter, colIndex) => {
          const cell = { row: rowIndex, col: colIndex };
          const cellKey = keyOf(cell);
          const foundWord = foundCellWords.get(cellKey);
          const colorClass = foundWord ? `word-${WORDS.indexOf(foundWord)}` : "";
          return <button key={cellKey} role="gridcell" className={`${start && sameCell(start, cell) ? "selected" : ""} ${foundWord ? "found" : ""} ${colorClass}`} onClick={() => choose(cell)} disabled={!canPlay} aria-label={`Linha ${rowIndex + 1}, coluna ${colIndex + 1}: letra ${letter}`}>{letter}</button>;
        }))}
      </div>
      <aside className="southeast-word-list" aria-label="Palavras para encontrar">
        <h2>ENCONTRE</h2>
        {WORDS.map((word, index) => <span key={word} className={`${found.includes(word) ? `found word-${index}` : ""} ${hintedWord === word ? "hinted" : ""}`}>{found.includes(word) && <b aria-hidden="true">✓</b>}{word === "CAFE" ? "CAFÉ" : word}</span>)}
        <small>↔ horizontal<br />↕ vertical</small>
      </aside>
    </div>
  </div>;
}
