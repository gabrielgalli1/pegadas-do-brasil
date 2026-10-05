"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";

type Props = { canPlay: boolean; onComplete: () => void };
type RiverItem = { id: string; kind: "trash" | "animal"; icon: string; label: string; x: number; y: number; speed: number; collected?: boolean };

const TRASH_TOTAL = 8;
const INITIAL_ITEMS: RiverItem[] = [
  { id: "bottle", kind: "trash", icon: "🧴", label: "garrafa plástica", x: 17, y: 27, speed: .34 },
  { id: "can", kind: "trash", icon: "🥫", label: "lata", x: 38, y: 18, speed: .29 },
  { id: "tire", kind: "trash", icon: "◉", label: "pneu", x: 67, y: 32, speed: .25 },
  { id: "box", kind: "trash", icon: "📦", label: "caixa de papelão", x: 82, y: 21, speed: .31 },
  { id: "bag", kind: "trash", icon: "🛍️", label: "sacola plástica", x: 54, y: 42, speed: .27 },
  { id: "cup", kind: "trash", icon: "🥤", label: "copo descartável", x: 27, y: 47, speed: .3 },
  { id: "paper", kind: "trash", icon: "📰", label: "papel", x: 74, y: 52, speed: .28 },
  { id: "carton", kind: "trash", icon: "🧃", label: "embalagem", x: 44, y: 57, speed: .26 },
  { id: "fish", kind: "animal", icon: "🐟", label: "peixe", x: 61, y: 25, speed: .2 },
  { id: "duck", kind: "animal", icon: "🦆", label: "pato", x: 24, y: 37, speed: .18 },
  { id: "heron", kind: "animal", icon: "🦢", label: "ave do rio", x: 86, y: 44, speed: .17 },
];

const clamp = (value: number, minimum: number, maximum: number) => Math.max(minimum, Math.min(maximum, value));

export default function SoutheastRiverCleanup({ canPlay, onComplete }: Props) {
  const [boatX, setBoatX] = useState(50);
  const [items, setItems] = useState<RiverItem[]>(INITIAL_ITEMS);
  const [collected, setCollected] = useState<string[]>([]);
  const [message, setMessage] = useState("Mova o barco, aproxime-se do lixo e use a rede!");
  const [warningId, setWarningId] = useState<string | null>(null);
  const completeTimer = useRef<number | null>(null);
  const warningTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!canPlay || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      setItems((current) => current.map((item) => {
        if (item.collected) return item;
        if (item.y >= 76) return { ...item, y: 17, x: 12 + ((item.x * 1.63 + 19) % 76) };
        return { ...item, y: item.y + item.speed };
      }));
    }, 90);
    return () => window.clearInterval(timer);
  }, [canPlay]);

  useEffect(() => () => {
    if (completeTimer.current !== null) window.clearTimeout(completeTimer.current);
    if (warningTimer.current !== null) window.clearTimeout(warningTimer.current);
  }, []);

  const interactWith = useCallback((item: RiverItem) => {
    if (!canPlay || item.collected) return;
    if (item.kind === "animal") {
      setWarningId(item.id);
      setMessage(`Cuidado! ${item.label.charAt(0).toUpperCase() + item.label.slice(1)} é morador do rio.`);
      if (warningTimer.current !== null) window.clearTimeout(warningTimer.current);
      warningTimer.current = window.setTimeout(() => setWarningId(null), 650);
      return;
    }
    setItems((current) => current.map((candidate) => candidate.id === item.id ? { ...candidate, collected: true } : candidate));
    setCollected((current) => {
      if (current.includes(item.id)) return current;
      const next = [...current, item.id];
      setMessage(`${item.label.charAt(0).toUpperCase() + item.label.slice(1)} recolhida! O rio está mais limpo.`);
      if (next.length === TRASH_TOTAL) {
        setMessage("Missão cumprida! O Rio Tietê está recuperado!");
        completeTimer.current = window.setTimeout(onComplete, 850);
      }
      return next;
    });
  }, [canPlay, onComplete]);

  const collectNearby = useCallback(() => {
    if (!canPlay) return;
    const nearby = items
      .filter((item) => !item.collected && item.y >= 57 && item.y <= 79 && Math.abs(item.x - boatX) <= 15)
      .sort((first, second) => Math.hypot(first.x - boatX, first.y - 70) - Math.hypot(second.x - boatX, second.y - 70))[0];
    if (!nearby) {
      setMessage("Aproxime o barco de um objeto e tente a rede novamente.");
      return;
    }
    interactWith(nearby);
  }, [boatX, canPlay, interactWith, items]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (!canPlay) return;
      if (event.key === "ArrowLeft") { event.preventDefault(); setBoatX((value) => clamp(value - 6, 9, 91)); }
      if (event.key === "ArrowRight") { event.preventDefault(); setBoatX((value) => clamp(value + 6, 9, 91)); }
      if ((event.key === " " || event.key === "Enter") && !(event.target instanceof HTMLButtonElement)) { event.preventDefault(); collectNearby(); }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [canPlay, collectNearby]);

  function moveBoat(direction: -1 | 1) {
    if (canPlay) setBoatX((value) => clamp(value + direction * 9, 9, 91));
  }

  function moveBoatToPointer(event: ReactPointerEvent<HTMLDivElement>) {
    if (!canPlay || (event.target as HTMLElement).closest("button")) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    setBoatX(clamp(((event.clientX - bounds.left) / bounds.width) * 100, 9, 91));
  }

  const cleanPercent = Math.round((collected.length / TRASH_TOTAL) * 100);
  const sceneStyle = { "--river-dirt": String(.44 * (1 - collected.length / TRASH_TOTAL)) } as CSSProperties;

  return <div className="southeast-river-game">
    <div className="southeast-river-toolbar">
      <div><span aria-hidden="true">🌿</span><strong>RIO RECUPERADO</strong><small>{collected.length} DE {TRASH_TOTAL} RESÍDUOS</small></div>
      <div className="southeast-river-progress" role="progressbar" aria-label="Recuperação do Rio Tietê" aria-valuenow={cleanPercent} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${cleanPercent}%` }} /></div>
      <strong>{cleanPercent}%</strong>
    </div>
    <div className="southeast-river-scene" style={sceneStyle} onPointerDown={moveBoatToPointer} role="region" aria-label="Rio Tietê. Use as setas para mover o barco e espaço para lançar a rede.">
      <img className="southeast-river-background" src="/sudeste-rio-tiete-cenario-v1.webp" alt="Rio Tietê com vegetação, cidade e ponte ao fundo" draggable={false} />
      <div className="southeast-river-dirt" aria-hidden="true" />
      {items.map((item) => !item.collected && <button key={item.id} type="button" className={`southeast-river-item ${item.kind} ${warningId === item.id ? "warning" : ""}`} style={{ left: `${item.x}%`, top: `${item.y}%` }} onClick={() => interactWith(item)} disabled={!canPlay} aria-label={item.kind === "trash" ? `Recolher ${item.label}` : `Proteger ${item.label}`}><span aria-hidden="true">{item.icon}</span></button>)}
      <div className="southeast-cleanup-boat" style={{ left: `${boatX}%` }} aria-hidden="true"><span className="net">🕸️</span><span className="boat">🚤</span></div>
      <div className="southeast-river-controls" aria-label="Controles do barco">
        <button type="button" onClick={() => moveBoat(-1)} disabled={!canPlay} aria-label="Mover barco para a esquerda">←</button>
        <button type="button" className="collect" onClick={collectNearby} disabled={!canPlay} aria-label="Lançar rede"><span aria-hidden="true">🕸️</span><strong>REDE</strong></button>
        <button type="button" onClick={() => moveBoat(1)} disabled={!canPlay} aria-label="Mover barco para a direita">→</button>
      </div>
      <div className="southeast-river-inventory" aria-label={`${collected.length} resíduos recolhidos`}><strong>COLETADOS</strong><div>{Array.from({ length: TRASH_TOTAL }, (_, index) => <span key={index}>{index < collected.length ? "♻" : "·"}</span>)}</div></div>
    </div>
    <p className="southeast-river-message" role="status">{message}</p>
  </div>;
}
