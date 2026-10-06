"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";

type Props = { canPlay: boolean; onComplete: () => void };
type GamePhase = "ready" | "playing" | "failed" | "complete";
type TrashItem = { id: string; icon: string; label: string; x: number; y: number; speed: number; tilt: number; caught: boolean };

const TRASH = [
  ["bottle", "🧴", "garrafa plástica"], ["can", "🥫", "lata"],
  ["bag", "🛍️", "sacola plástica"], ["cup", "🥤", "copo descartável"],
  ["paper", "📰", "papel"], ["carton", "🧃", "embalagem"],
  ["box", "📦", "caixa de papelão"], ["shoe", "👟", "calçado"],
  ["pot", "🪣", "recipiente"], ["wrapper", "🍬", "embalagem pequena"],
  ["bottle-two", "🧴", "frasco plástico"], ["can-two", "🥫", "outra lata"],
] as const;
const TRASH_TOTAL = TRASH.length;
const MAX_MISSES = 12;
const START_X = [16, 34, 58, 79, 24, 69, 43, 86, 12, 53, 75, 29];

function makeInitialItems(): TrashItem[] {
  return TRASH.map(([id, icon, label], index) => ({
    id, icon, label, x: START_X[index], y: -12 - index * 15,
    speed: .56 + (index % 4) * .045,
    tilt: (index % 2 ? 1 : -1) * (5 + (index % 3) * 4),
    caught: false,
  }));
}

const clamp = (value: number, minimum: number, maximum: number) => Math.max(minimum, Math.min(maximum, value));
const nextLane = (item: TrashItem, misses: number) => 10 + ((item.x * 1.71 + misses * 13 + item.id.length * 7) % 80);


function TrashSprite({ kind }: { kind: string }) {
  if (kind.startsWith("bottle")) return <svg className="southeast-trash-sprite" viewBox="0 0 64 64" aria-hidden="true"><path d="M25 7h14v8l5 7v31c0 4-3 7-7 7H27c-4 0-7-3-7-7V22l5-7Z" fill="#5dc9eb" stroke="#073c62" strokeWidth="4"/><path d="M25 9h14M22 31h20v15H22Z" fill="#fff4b8" stroke="#073c62" strokeWidth="3"/><path d="M27 36h10" stroke="#35a665" strokeWidth="4" strokeLinecap="round"/></svg>;
  if (kind.startsWith("can")) return <svg className="southeast-trash-sprite" viewBox="0 0 64 64" aria-hidden="true"><path d="M18 13c0-4 28-4 28 0v39c0 5-28 5-28 0Z" fill="#ef6b4b" stroke="#633727" strokeWidth="4"/><ellipse cx="32" cy="13" rx="14" ry="5" fill="#dce7e8" stroke="#633727" strokeWidth="3"/><path d="M21 28h22l-4 15H25Z" fill="#ffd35a"/><path d="m29 17 8-2" stroke="#633727" strokeWidth="3" strokeLinecap="round"/></svg>;
  if (kind === "bag") return <svg className="southeast-trash-sprite" viewBox="0 0 64 64" aria-hidden="true"><path d="M14 23h36l-4 34H18Z" fill="#b276d8" stroke="#472b67" strokeWidth="4"/><path d="M23 25c0-17 18-17 18 0" fill="none" stroke="#472b67" strokeWidth="4"/><path d="m24 38 7 7 11-14" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/></svg>;
  if (kind === "cup") return <svg className="southeast-trash-sprite" viewBox="0 0 64 64" aria-hidden="true"><path d="m42 5-8 18" stroke="#e05240" strokeWidth="5" strokeLinecap="round"/><path d="M15 20h34l-5 37H20Z" fill="#f5f1df" stroke="#275673" strokeWidth="4"/><path d="M19 31h27" stroke="#37a5c8" strokeWidth="8"/><path d="M14 20c0-5 36-5 36 0" fill="#fff" stroke="#275673" strokeWidth="4"/></svg>;
  if (kind === "paper") return <svg className="southeast-trash-sprite" viewBox="0 0 64 64" aria-hidden="true"><path d="m12 15 34-7 7 40-34 7Z" fill="#f7f2df" stroke="#35526a" strokeWidth="4"/><path d="m20 24 21-4M22 32l22-4M23 40l15-3" stroke="#4e91ba" strokeWidth="3" strokeLinecap="round"/><path d="m15 18 9 6-5 9Z" fill="#efb84a"/></svg>;
  if (kind === "carton") return <svg className="southeast-trash-sprite" viewBox="0 0 64 64" aria-hidden="true"><path d="m20 16 8-9h19l-3 9v41H17V22Z" fill="#f1d05d" stroke="#55452b" strokeWidth="4"/><path d="M20 16h24M28 8l7 8v41" fill="none" stroke="#55452b" strokeWidth="3"/><circle cx="27" cy="34" r="7" fill="#ed7056"/><path d="m27 26 3-6" stroke="#4f9b4c" strokeWidth="3"/></svg>;
  if (kind === "box") return <svg className="southeast-trash-sprite" viewBox="0 0 64 64" aria-hidden="true"><path d="M10 21 31 9l23 12-3 32-22 7-19-10Z" fill="#d69851" stroke="#5c3b23" strokeWidth="4"/><path d="m10 21 21 12 23-12M31 33l-2 27M21 15l22 12" fill="none" stroke="#5c3b23" strokeWidth="3"/><path d="m27 31 8-18" stroke="#f2d29b" strokeWidth="6"/></svg>;
  if (kind === "shoe") return <svg className="southeast-trash-sprite" viewBox="0 0 64 64" aria-hidden="true"><path d="M8 39c8 1 14-3 17-15l11 6c5 8 12 10 20 12v10H11c-5 0-7-10-3-13Z" fill="#65b66e" stroke="#244d38" strokeWidth="4"/><path d="M27 30h12M23 36h20" stroke="#fff" strokeWidth="3" strokeLinecap="round"/><path d="M10 48h45" stroke="#f4d561" strokeWidth="5"/></svg>;
  if (kind === "pot") return <svg className="southeast-trash-sprite" viewBox="0 0 64 64" aria-hidden="true"><path d="M15 22h34l-4 35H19Z" fill="#58b7c9" stroke="#174b5d" strokeWidth="4"/><path d="M12 20h40v8H12Z" fill="#e8f4ef" stroke="#174b5d" strokeWidth="4"/><path d="M23 20c0-18 18-18 18 0" fill="none" stroke="#174b5d" strokeWidth="4"/><path d="M25 36h14" stroke="#fff" strokeWidth="4" strokeLinecap="round"/></svg>;
  return <svg className="southeast-trash-sprite" viewBox="0 0 64 64" aria-hidden="true"><path d="m18 21-12 9 12 10 4 12h20l4-12 12-10-12-9-4-10H22Z" fill="#ef78a3" stroke="#71344e" strokeWidth="4"/><path d="m8 27 8 7-8 4M56 27l-8 7 8 4" fill="#ffd15a" stroke="#71344e" strokeWidth="3"/><path d="M24 31h16" stroke="#fff" strokeWidth="4" strokeLinecap="round"/></svg>;
}

export default function SoutheastRiverCleanup({ canPlay, onComplete }: Props) {
  const [phase, setPhase] = useState<GamePhase>("ready");
  const [boatX, setBoatX] = useState(50);
  const [items, setItems] = useState<TrashItem[]>(makeInitialItems);
  const [collected, setCollected] = useState(0);
  const [missed, setMissed] = useState(0);
  const [riverHealth, setRiverHealth] = useState(72);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [netActive, setNetActive] = useState(false);
  const [netCooling, setNetCooling] = useState(false);
  const [message, setMessage] = useState("Prepare o barco para o mutirão de limpeza!");
  const [reducedMotion, setReducedMotion] = useState(false);
  const itemsRef = useRef(items);
  const boatXRef = useRef(boatX);
  const phaseRef = useRef<GamePhase>(phase);
  const missedRef = useRef(missed);
  const draggingRef = useRef(false);
  const timerRefs = useRef<number[]>([]);

  const rememberTimer = useCallback((timer: number) => {
    timerRefs.current.push(timer);
    return timer;
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(media.matches);
    updatePreference();
    media.addEventListener?.("change", updatePreference);
    return () => media.removeEventListener?.("change", updatePreference);
  }, []);

  useEffect(() => () => timerRefs.current.forEach(window.clearTimeout), []);
  useEffect(() => { itemsRef.current = items; }, [items]);
  useEffect(() => { boatXRef.current = boatX; }, [boatX]);
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { missedRef.current = missed; }, [missed]);

  const startGame = useCallback(() => {
    if (!canPlay || phaseRef.current !== "ready") return;
    phaseRef.current = "playing";
    setPhase("playing");
    setMessage("A corrente começou! Mova o barco e lance a rede no momento certo.");
  }, [canPlay]);

  const restartGame = useCallback(() => {
    timerRefs.current.forEach(window.clearTimeout);
    timerRefs.current = [];
    const freshItems = makeInitialItems();
    itemsRef.current = freshItems;
    missedRef.current = 0;
    boatXRef.current = 50;
    phaseRef.current = "playing";
    setItems(freshItems);
    setBoatX(50);
    setCollected(0);
    setMissed(0);
    setRiverHealth(72);
    setCombo(0);
    setBestCombo(0);
    setNetActive(false);
    setNetCooling(false);
    setPhase("playing");
    setMessage("Novo mutirão iniciado! Observe a corrente e não deixe os resíduos escaparem.");
  }, []);

  const catchTrash = useCallback((target: TrashItem) => {
    const nextItems = itemsRef.current.map((item) => item.id === target.id ? { ...item, caught: true } : item);
    itemsRef.current = nextItems;
    setItems(nextItems);
    setRiverHealth((value) => Math.min(100, value + 3));
    setCombo((value) => {
      const next = value + 1;
      setBestCombo((best) => Math.max(best, next));
      return next;
    });
    setCollected((value) => {
      const next = value + 1;
      if (next === TRASH_TOTAL) {
        phaseRef.current = "complete";
        setPhase("complete");
        setRiverHealth(100);
        setMessage("Mutirão concluído! Cuidar do rio é um trabalho contínuo de toda a cidade.");
        rememberTimer(window.setTimeout(onComplete, reducedMotion ? 450 : 1100));
      } else {
        setMessage(`${target.label.charAt(0).toUpperCase() + target.label.slice(1)} recolhida! Continue acompanhando a corrente.`);
      }
      return next;
    });
  }, [onComplete, reducedMotion, rememberTimer]);

  const launchNet = useCallback(() => {
    if (!canPlay || phaseRef.current !== "playing" || netCooling) return;
    setNetActive(true);
    setNetCooling(true);
    const nearby = itemsRef.current
      .filter((item) => !item.caught && item.y >= 55 && item.y <= 88 && Math.abs(item.x - boatXRef.current) <= 14)
      .sort((first, second) => Math.hypot(first.x - boatXRef.current, first.y - 72) - Math.hypot(second.x - boatXRef.current, second.y - 72))[0];
    if (nearby) catchTrash(nearby);
    else setMessage("A rede passou longe. Acompanhe o resíduo e tente quando ele chegar perto do barco.");
    rememberTimer(window.setTimeout(() => setNetActive(false), reducedMotion ? 120 : 360));
    rememberTimer(window.setTimeout(() => setNetCooling(false), reducedMotion ? 220 : 620));
  }, [canPlay, catchTrash, netCooling, reducedMotion, rememberTimer]);

  useEffect(() => {
    if (!canPlay || phase !== "playing") return;
    const timer = window.setInterval(() => {
      const currentWave = Math.min(3, Math.floor(collected / 4) + 1);
      let escaped = 0;
      const nextItems = itemsRef.current.map((item) => {
        if (item.caught) return item;
        const nextY = item.y + item.speed * (1 + (currentWave - 1) * .18) * (reducedMotion ? .58 : 1);
        if (nextY <= 94) return { ...item, y: nextY };
        escaped += 1;
        return { ...item, y: -14 - escaped * 8, x: nextLane(item, missed + escaped), tilt: -item.tilt };
      });
      itemsRef.current = nextItems;
      setItems(nextItems);
      if (escaped > 0) {
        const nextMissed = Math.min(MAX_MISSES, missedRef.current + escaped);
        missedRef.current = nextMissed;
        setMissed(nextMissed);
        setCombo(0);
        setRiverHealth((value) => Math.max(18, value - escaped * 8));
        if (nextMissed >= MAX_MISSES) {
          phaseRef.current = "failed";
          setPhase("failed");
          setMessage("Doze resíduos escaparam. O mutirão será reiniciado para tentar novamente.");
        } else {
          setMessage(escaped > 1 ? "Alguns resíduos passaram. Reposicione o barco e observe as faixas da corrente." : "Um resíduo passou pelo barco, mas ele voltará. Tente novamente!");
        }
      }
    }, 60);
    return () => window.clearInterval(timer);
  }, [canPlay, collected, missed, phase, reducedMotion]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (!canPlay) return;
      const targetIsButton = event.target instanceof HTMLButtonElement;
      if (phaseRef.current === "ready" && !targetIsButton && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        startGame();
        return;
      }
      if (phaseRef.current !== "playing") return;
      if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
        event.preventDefault();
        setBoatX((value) => clamp(value - 6, 8, 92));
      }
      if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
        event.preventDefault();
        setBoatX((value) => clamp(value + 6, 8, 92));
      }
      if (!targetIsButton && (event.key === " " || event.key === "Enter")) {
        event.preventDefault();
        launchNet();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [canPlay, launchNet, startGame]);

  function moveBoat(direction: -1 | 1) {
    if (canPlay && phaseRef.current === "playing") setBoatX((value) => clamp(value + direction * 9, 8, 92));
  }

  function moveBoatToPointer(event: ReactPointerEvent<HTMLDivElement>) {
    if (!canPlay || phaseRef.current !== "playing" || (event.target as HTMLElement).closest("button")) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    setBoatX(clamp(((event.clientX - bounds.left) / bounds.width) * 100, 8, 92));
  }

  function beginDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest("button")) return;
    draggingRef.current = true;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    moveBoatToPointer(event);
  }

  const wave = Math.min(3, Math.floor(collected / 4) + 1);
  const cleanPercent = Math.round((collected / TRASH_TOTAL) * 100);
  const sceneStyle = { "--river-health": String(riverHealth / 100), "--boat-x": `${boatX}%` } as CSSProperties;

  return <div className={`southeast-river-game phase-${phase}`}>
    <div className="southeast-river-toolbar">
      <div className="southeast-cleanup-score"><span aria-hidden="true">♻</span><strong>MUTIRÃO DO TIETÊ</strong><small>{collected} DE {TRASH_TOTAL} RESÍDUOS</small></div>
      <div className="southeast-river-progress" role="progressbar" aria-label="Progresso do mutirão de limpeza" aria-valuenow={cleanPercent} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${cleanPercent}%` }} /></div>
      <div className="southeast-wave"><small>ONDA</small><strong>{wave}/3</strong></div>
    </div>
    <div
      className="southeast-river-scene"
      style={sceneStyle}
      onPointerDown={beginDrag}
      onPointerMove={(event) => { if (draggingRef.current) moveBoatToPointer(event); }}
      onPointerUp={() => { draggingRef.current = false; }}
      onPointerCancel={() => { draggingRef.current = false; }}
      role="application"
      aria-label="Minijogo de limpeza do Rio Tietê. Mova o barco com as setas ou arrastando. Use espaço, Enter ou o botão Rede para recolher os resíduos."
    >
      <img className="southeast-river-background" src="/sudeste-rio-tiete-cenario-v2.webp" alt="Trecho urbano ilustrado do Rio Tietê, com água turva, margens e cidade ao fundo" draggable={false} />
      <div className="southeast-river-water-tone" aria-hidden="true" />
      <div className="southeast-current-lines" aria-hidden="true"><i /><i /><i /><i /><i /></div>
      <div className="southeast-river-vignette" aria-hidden="true" />

      {items.map((item) => <div key={item.id} className={`southeast-river-item ${item.caught ? "caught" : ""}`} style={{ left: `${item.x}%`, top: `${item.y}%`, "--item-tilt": `${item.tilt}deg` } as CSSProperties} aria-hidden="true"><TrashSprite kind={item.id} /><i /></div>)}

      <div className={`southeast-cleanup-boat ${netActive ? "casting" : ""}`} style={{ left: `${boatX}%` }} role="img" aria-label="Barco do mutirão com rede de coleta">
        <span className="southeast-net" aria-hidden="true" />
        <span className="southeast-boat-flag" aria-hidden="true" />
        <span className="southeast-boat-cabin" aria-hidden="true" />
        <span className="southeast-boat-hull" aria-hidden="true">♻</span>
      </div>

      {combo >= 2 && <div className="southeast-combo" aria-live="polite">COMBO ×{combo}</div>}
      <div className="southeast-river-health" aria-label={`Indicador do rio em ${riverHealth}%`}><span>💧</span><div><small>CUIDADO COM O RIO</small><b>{riverHealth}%</b></div></div>
      <div className="southeast-river-misses" aria-label={`${missed} de ${MAX_MISSES} resíduos escaparam`}>ESCAPARAM <strong>{missed}/{MAX_MISSES}</strong></div>


      {phase === "ready" && <div className="southeast-river-start">
        <span aria-hidden="true">🚤</span>
        <strong>PRONTO PARA O MUTIRÃO?</strong>
        <p>O lixo vem com a corrente. Mova o barco e lance a rede quando ele estiver próximo.</p>
        <div className="southeast-river-howto" aria-label="Como controlar o barco">
          <div className="southeast-river-howto-card computer">
            <b>NO COMPUTADOR</b>
            <div><span className="southeast-key-pair"><kbd>←</kbd><kbd>→</kbd></span><span>Mover o barco</span></div>
            <div><kbd className="space-key">ESPAÇO</kbd><span>Lançar a rede</span></div>
          </div>
          <div className="southeast-river-howto-card mobile">
            <b>NO CELULAR</b>
            <div><span className="southeast-phone-control" aria-hidden="true"><i />↔</span><span>Arraste o barco</span></div>
            <div><span className="southeast-net-control" aria-hidden="true"><i />REDE</span><span>Toque na rede</span></div>
          </div>
        </div>
        <button type="button" onClick={startGame} disabled={!canPlay}>COMEÇAR</button>
      </div>}
      {phase === "failed" && <div className="southeast-river-start southeast-river-failed" role="dialog" aria-modal="true" aria-live="assertive">
        <span aria-hidden="true">♻</span>
        <strong>VAMOS TENTAR DE NOVO?</strong>
        <p>Doze resíduos escaparam pela corrente. Recomece o mutirão e tente recolher todos antes que passem pelo barco.</p>
        <div className="southeast-river-failed-count"><b>12</b><span>limite de resíduos escapados</span></div>
        <button type="button" onClick={restartGame} disabled={!canPlay}>REINICIAR MUTIRÃO</button>
      </div>}
    </div>
    <div className="southeast-river-footer">
      <div className="southeast-river-message" role="status"><span>{message}</span><small>O lixo é parte do problema. Recuperar o Tietê também exige coleta e tratamento de esgoto.</small></div>
        <div className="southeast-river-controls" aria-label="Controles do barco">
          <button type="button" onClick={() => moveBoat(-1)} disabled={!canPlay || phase !== "playing"} aria-label="Mover barco para a esquerda">←</button>
          <button type="button" className="collect" onClick={launchNet} disabled={!canPlay || phase !== "playing" || netCooling} aria-label="Lançar rede"><span aria-hidden="true" /><strong>REDE</strong></button>
          <button type="button" onClick={() => moveBoat(1)} disabled={!canPlay || phase !== "playing"} aria-label="Mover barco para a direita">→</button>
        </div>
    </div>
    <span className="southeast-sr-only" aria-live="polite">{phase === "playing" ? `${collected} de ${TRASH_TOTAL} resíduos coletados. Melhor sequência: ${bestCombo}.` : ""}</span>
  </div>;
}
