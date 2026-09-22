"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

type PieceId = "base" | "torres" | "concha" | "cupula" | "espelho";
type Props = { canAnswer: boolean; onComplete: () => void; onListen: (text: string) => void };
type Piece = { id: PieceId; name: string; color: string; path: string; transform: string; viewBox: string; imagePosition: string };

const pieces: Piece[] = [
  { id: "base", name: "PLATAFORMA", color: "#e8e1cf", path: "M72 199 H578 V219 H366 L347 239 H303 L284 219 H72 Z", transform: "", viewBox: "62 189 526 60", imagePosition: "50% 0%" },
  { id: "torres", name: "TORRES", color: "#d8d3c7", path: "M255 69 H288 V199 H255 Z M312 69 H345 V199 H312 Z", transform: "", viewBox: "245 59 110 150", imagePosition: "100% 0%" },
  { id: "concha", name: "CONCHA", color: "#eee7d9", path: "M389 163 H551 Q470 234 389 163 Z", transform: "", viewBox: "379 153 182 91", imagePosition: "0% 100%" },
  { id: "cupula", name: "CÚPULA", color: "#f7f4e9", path: "M79 199 Q160 129 241 199 Z", transform: "", viewBox: "69 119 182 90", imagePosition: "50% 100%" },
  { id: "espelho", name: "ESPELHO-D’ÁGUA", color: "#56bdea", path: "M76 220 H524 L566 246 H34 Z", transform: "", viewBox: "24 210 552 46", imagePosition: "100% 100%" },
];
const order: PieceId[] = ["concha", "base", "espelho", "torres", "cupula"];

export default function CenterWestBrasilia({ canAnswer, onComplete, onListen }: Props) {
  const [placed, setPlaced] = useState<PieceId[]>([]);
  const [selected, setSelected] = useState<PieceId | null>(null);
  const [ghost, setGhost] = useState<{ id: PieceId; x: number; y: number } | null>(null);
  const drag = useRef<{ id: PieceId; pointerId: number; moved: boolean } | null>(null);

  function place(slot: PieceId, piece: PieceId) {
    if (!canAnswer || placed.includes(piece)) return;
    setSelected(null);
    if (slot !== piece) { onListen("Essa peça não encaixa aí. Observe a referência e tente outro espaço."); return; }
    const next = [...placed, piece];
    setPlaced(next);
    onListen(pieces.find((item) => item.id === piece)!.name + ". Peça encaixada!");
    if (next.length === pieces.length) window.setTimeout(onComplete, 500);
  }
  function start(piece: PieceId, event: ReactPointerEvent<HTMLButtonElement>) {
    if (!canAnswer || placed.includes(piece)) return;
    drag.current = { id: piece, pointerId: event.pointerId, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
    setSelected(piece); setGhost({ id: piece, x: event.clientX, y: event.clientY });
  }
  function move(event: ReactPointerEvent<HTMLButtonElement>) {
    if (!drag.current || drag.current.pointerId !== event.pointerId) return;
    drag.current.moved = true; setGhost({ id: drag.current.id, x: event.clientX, y: event.clientY });
  }
  function end(event: ReactPointerEvent<HTMLButtonElement>) {
    const active = drag.current; drag.current = null; setGhost(null);
    if (!active) return;
    if (!active.moved) { setSelected(active.id); return; }
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<SVGGElement>("[data-brasilia-slot]");
    const slot = target?.dataset.brasiliaSlot as PieceId | undefined;
    if (slot) place(slot, active.id);
  }

  return <div className="centerwest-brasilia-board">
    <div className="brasilia-reference"><strong>REFERÊNCIA</strong><span className="brasilia-reference-image" role="img" aria-label="Congresso Nacional completo" /></div>
    <div className="brasilia-assembly" role="group" aria-label="Área de montagem do Congresso Nacional">
      <svg viewBox="0 0 600 300" className="brasilia-build-svg" aria-label="Silhuetas das cinco partes do Congresso Nacional">
        <defs><clipPath id="brasilia-placed-mask">{pieces.filter((piece) => placed.includes(piece.id)).map((piece) => <path key={piece.id} d={piece.path} transform={piece.transform} />)}</clipPath></defs>
        {placed.length > 0 && <foreignObject x="0" y="0" width="600" height="300" clipPath="url(#brasilia-placed-mask)" className="brasilia-complete-art" aria-hidden="true"><div className="brasilia-complete-image" /></foreignObject>}
        {pieces.map((piece) => { const complete = placed.includes(piece.id); return <g key={piece.id} transform={piece.transform} data-brasilia-slot={piece.id} role="button" tabIndex={0} aria-label={"Espaço de " + piece.name + (complete ? ", preenchido" : "")} className={"brasilia-shape " + (complete ? "complete" : "") + (selected ? " ready" : "")} onClick={() => selected && place(piece.id, selected)} onKeyDown={(event) => { if (selected && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); place(piece.id, selected); } }}><path d={piece.path} fill={complete ? "transparent" : "#fffaf0"} /></g>; })}
      </svg>
    </div>
    <div className="brasilia-tray" aria-label="Peças embaralhadas do monumento">{order.map((id) => { const piece = pieces.find((item) => item.id === id)!; const complete = placed.includes(id); return <button key={id} className={"brasilia-piece " + (selected === id ? "selected" : "")} disabled={!canAnswer || complete} onPointerDown={(event) => start(id, event)} onPointerMove={move} onPointerUp={end} onPointerCancel={() => { drag.current = null; setGhost(null); }} aria-label={"Peça " + piece.name}><span className="brasilia-piece-image" style={{ backgroundPosition: piece.imagePosition }} aria-hidden="true" /><strong>{piece.name}</strong></button>; })}</div>
    <div className="brasilia-progress"><strong>{placed.length} DE 5 PEÇAS ENCAIXADAS</strong><span>{pieces.map((piece) => <i key={piece.id} className={placed.includes(piece.id) ? "found" : ""}>★</i>)}</span></div>
    {ghost && (() => { const piece = pieces.find((item) => item.id === ghost.id)!; return <div className="brasilia-ghost" style={{ left: ghost.x, top: ghost.y }} aria-hidden="true"><span className="brasilia-piece-image" style={{ backgroundPosition: piece.imagePosition }} /></div>; })()}
  </div>;
}
