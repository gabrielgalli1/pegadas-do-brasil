"use client";

import { useEffect, useRef, useState } from "react";
import type { PointerEvent } from "react";
import { acrePath, isOverPuzzleSlot, northPuzzlePieces, northPuzzleStates } from "./north-puzzle-data";
import type { NorthPuzzlePieceId } from "./north-puzzle-data";

type Props = { solved: boolean; onPlace: (id: NorthPuzzlePieceId) => void; onFinish: () => void };
type Drag = { id: NorthPuzzlePieceId; pointerId: number; startX: number; startY: number; moved: boolean };
type Ghost = { id: NorthPuzzlePieceId; x: number; y: number };

export default function NorthPuzzle({ solved, onPlace, onFinish }: Props) {
  const [selected, setSelected] = useState<NorthPuzzlePieceId | null>(null);
  const [ghost, setGhost] = useState<Ghost | null>(null);
  const [overSlot, setOverSlot] = useState(false);
  const [message, setMessage] = useState("Arraste uma peça ou toque nela e depois no espaço vazio.");
  const drag = useRef<Drag | null>(null);
  const slot = useRef<SVGPathElement | null>(null);
  const placed = useRef(false);
  const suppressClick = useRef(false);
  const finishButton = useRef<HTMLButtonElement | null>(null);
  useEffect(() => { if (solved) finishButton.current?.focus(); }, [solved]);

  function select(id: NorthPuzzlePieceId) {
    if (solved || placed.current) return;
    setSelected(id);
    setMessage(northPuzzlePieces.find((piece) => piece.id === id)!.name + " selecionado. Toque no espaço vazio para encaixar.");
  }
  function place(id: NorthPuzzlePieceId | null) {
    if (solved || placed.current) return;
    if (!id) { setMessage("Escolha uma peça primeiro. Depois, toque no espaço vazio."); return; }
    setSelected(null); setGhost(null); setOverSlot(false);
    if (id === "acre") {
      placed.current = true;
      setMessage("Muito bem! O Acre completou o mapa da Região Norte!");
    } else setMessage("Essa peça não encaixa. Compare os formatos e tente novamente!");
    onPlace(id);
  }
  function startDrag(event: PointerEvent<HTMLButtonElement>, id: NorthPuzzlePieceId) {
    if (solved || placed.current || drag.current || !event.isPrimary || event.button !== 0) return;
    suppressClick.current = false;
    drag.current = { id, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function moveDrag(event: PointerEvent<HTMLButtonElement>) {
    const active = drag.current;
    if (!active || active.pointerId !== event.pointerId) return;
    if (Math.hypot(event.clientX - active.startX, event.clientY - active.startY) >= 6) active.moved = true;
    if (!active.moved) return;
    event.preventDefault();
    setGhost({ id: active.id, x: event.clientX, y: event.clientY });
    setOverSlot(isOverPuzzleSlot(slot.current, event.clientX, event.clientY));
  }
  function clearDrag(event: PointerEvent<HTMLButtonElement>) {
    drag.current = null; setGhost(null); setOverSlot(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }
  function endDrag(event: PointerEvent<HTMLButtonElement>) {
    const active = drag.current;
    if (!active || active.pointerId !== event.pointerId) return;
    clearDrag(event);
    if (!active.moved) return; // The following native click handles taps.
    suppressClick.current = true;
    if (isOverPuzzleSlot(slot.current, event.clientX, event.clientY)) place(active.id);
    else {
      setSelected(null);
      setMessage("A peça voltou ao lugar. Solte-a no espaço pontilhado do mapa.");
    }
  }
  const ghostPiece = northPuzzlePieces.find((piece) => piece.id === ghost?.id);
  return <div className="north-puzzle" onKeyDown={(event) => {
    if (event.key === "Escape") {
      drag.current = null; setGhost(null); setOverSlot(false); setSelected(null);
      setMessage("Seleção cancelada. Escolha uma peça para continuar.");
    }
  }}>
    <div className="north-map-card north-puzzle-board">
      <svg className="north-puzzle-map" viewBox="-10 -6 406 280" preserveAspectRatio="xMidYMid meet" aria-label="Mapa da Região Norte com uma peça para encaixar">
        {northPuzzleStates.map((state) => <g key={state.id}>
          {state.paths.map((d, index) => <path key={index} d={d} fill={state.color} className="north-puzzle-state" />)}
          <text className="north-puzzle-label" x={state.x} y={state.y}>{state.name}</text>
        </g>)}
        <g className={"north-puzzle-slot " + (overSlot ? "drop-ready " : "") + (solved ? "is-solved" : "")} role="button" tabIndex={solved ? -1 : 0}
          aria-label={solved ? "Acre encaixado" : "Espaço vazio: encaixar a peça selecionada"} aria-disabled={solved} aria-describedby="north-puzzle-message"
          onClick={() => place(selected)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); place(selected); } }}>
          <rect x="-3" y="175" width="108" height="60" fill="transparent" />
          <path ref={slot} d={acrePath} className="north-puzzle-hole" />
          <text x="54" y="209" className="north-puzzle-slot-label">{solved ? "Acre" : "?"}</text>
        </g>
      </svg>
    </div>
    <p id="north-puzzle-message" className={"north-puzzle-message " + (solved ? "is-solved" : "")} role="status" aria-live="polite" aria-atomic="true">{message}</p>
    {solved ? <div className="north-puzzle-complete"><strong>⭐ Mapa completo!</strong><button ref={finishButton} onClick={onFinish}>CONCLUIR REGIÃO NORTE</button></div> :
      <div className="north-puzzle-pieces" role="group" aria-label="Peças do quebra-cabeça">
        {northPuzzlePieces.map((piece) => <button key={piece.id} type="button" className={"north-puzzle-piece " + (selected === piece.id ? "selected " : "") + (ghost?.id === piece.id ? "dragging" : "")}
          aria-label={"Selecionar peça: " + piece.name} aria-pressed={selected === piece.id} aria-describedby="north-puzzle-message"
          onClick={(event) => { if (suppressClick.current && event.detail !== 0) { suppressClick.current = false; return; } select(piece.id); }}
          onPointerDown={(event) => startDrag(event, piece.id)} onPointerMove={moveDrag} onPointerUp={endDrag}
          onPointerCancel={(event) => { if (drag.current?.pointerId === event.pointerId) { clearDrag(event); setSelected(null); setMessage("Arraste uma peça ou toque nela e depois no espaço vazio."); } }}
          onLostPointerCapture={(event) => { if (drag.current?.pointerId === event.pointerId) { drag.current = null; setGhost(null); setOverSlot(false); } }}>
          <span className="north-puzzle-grip" aria-hidden="true">⠿</span>
          <svg viewBox={piece.viewBox} preserveAspectRatio="xMidYMid meet" aria-hidden="true"><path d={piece.d} /></svg>
          <strong>{piece.name}</strong>
        </button>)}
      </div>}
    {ghost && ghostPiece && <div className="north-puzzle-ghost" style={{ left: ghost.x, top: ghost.y }} aria-hidden="true"><svg viewBox={ghostPiece.viewBox}><path d={ghostPiece.d} /></svg><strong>{ghostPiece.name}</strong></div>}
  </div>;
}
