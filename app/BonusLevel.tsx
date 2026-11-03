"use client";

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { createPortal } from "react-dom";
import regionsMap from "./brasil-cinco-regioes.json";
import { bonusRegionIds, type BonusRegionId } from "./progressPersistence";

const regions = [
  { id: "norte", name: "Norte", x: 223, y: 116, size: 116, image: "/bonus-paisagem-norte-v1.jpg", hint: "Procure a grande região verde na parte de cima do mapa." },
  { id: "nordeste", name: "Nordeste", x: 448, y: 187, size: 103, image: "/bonus-paisagem-nordeste-v1.jpg", hint: "Procure a região laranja à direita do mapa." },
  { id: "centro-oeste", name: "Centro-Oeste", x: 284, y: 277, size: 100, image: "/bonus-paisagem-centro-oeste-v1.jpg", hint: "Procure a região amarela no centro do Brasil." },
  { id: "sudeste", name: "Sudeste", x: 388, y: 348, size: 87, image: "/bonus-paisagem-sudeste-v1.jpg", hint: "Procure a região roxa, acima da Região Sul." },
  { id: "sul", name: "Sul", x: 305, y: 452, size: 78, image: "/bonus-paisagem-sul-v1.jpg", hint: "Procure a região azul na parte de baixo do mapa." },
] as const;

export const bonusInstructions = "Vamos completar o mapa com seus emblemas! Arraste cada emblema até a sua região. Você também pode tocar no emblema e depois na silhueta. São cinco regiões para completar a nossa viagem pelo Brasil!";
const landscapeBounds: Record<BonusRegionId, [number, number, number, number]> = { norte: [0, 0, 410, 300], nordeste: [365, 95, 245, 250], "centro-oeste": [170, 230, 230, 190], sudeste: [320, 310, 200, 150], sul: [235, 400, 150, 135] };
const regionBorderColors: Record<BonusRegionId, string> = {
  norte: "#2f7a32",
  nordeste: "#f27a1a",
  "centro-oeste": "#6f7f36",
  sudeste: "#1974bd",
  sul: "#7446a8",
};
const initialMessage = "Vamos completar o mapa com seus emblemas!";

type Props = {
  initialPlaced: readonly BonusRegionId[];
  sound: boolean;
  onBack: () => void;
  onToggleSound: () => void;
  onListen: (text: string) => void;
  onPlace: (regions: BonusRegionId[]) => void;
  onCorrect: () => void;
};

export default function BonusLevel({ initialPlaced, sound, onBack, onToggleSound, onListen, onPlace, onCorrect }: Props) {
  const [placed, setPlaced] = useState<BonusRegionId[]>(() => [...initialPlaced]);
  const [selected, setSelected] = useState<BonusRegionId | null>(null);
  const [message, setMessage] = useState(initialMessage);
  const [wrongRegion, setWrongRegion] = useState<BonusRegionId | null>(null);
  const [drag, setDrag] = useState<{ id: BonusRegionId; x: number; y: number } | null>(null);
  const [celebrating, setCelebrating] = useState(false);
  const pointerStart = useRef<{ id: BonusRegionId; pointerId: number; x: number; y: number; moved: boolean } | null>(null);
  const didDrag = useRef(false);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const finishRef = useRef<HTMLButtonElement>(null);
  const wrongTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    titleRef.current?.focus();
    return () => { if (wrongTimer.current) clearTimeout(wrongTimer.current); };
  }, []);
  useEffect(() => {
    if (!celebrating) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => finishRef.current?.focus(), reduceMotion ? 0 : 2250);
    return () => window.clearTimeout(timer);
  }, [celebrating]);

  function choose(id: BonusRegionId) {
    if (placed.includes(id) || celebrating) return;
    setSelected(id);
    const name = regions.find((region) => region.id === id)!.name;
    const line = `Emblema da Região ${name} selecionado. Toque na sua região no mapa.`;
    setMessage(line);
    if (sound) onListen(line);
  }

  function fit(target: BonusRegionId, piece = selected) {
    if (placed.includes(target) || celebrating) return;
    if (!piece) {
      setMessage("Primeiro, escolha um emblema ao lado do mapa.");
      return;
    }
    if (piece !== target) {
      const region = regions.find((item) => item.id === piece)!;
      const line = `Vamos tentar outro lugar! ${region.hint}`;
      setMessage(line);
      setWrongRegion(target);
      if (wrongTimer.current) clearTimeout(wrongTimer.current);
      wrongTimer.current = setTimeout(() => setWrongRegion(null), 650);
      if (sound) onListen(line);
      return;
    }
    const next = [...placed, target];
    setPlaced(next);
    setSelected(null);
    setWrongRegion(null);
    onPlace(next);
    onCorrect();
    const name = regions.find((region) => region.id === target)!.name;
    const line = next.length === 5
      ? "Você deixou suas pegadas por todo o Brasil! Parabéns, explorador!"
      : `Muito bem! Emblema da Região ${name} encaixado!`;
    setMessage(line);
    if (sound) onListen(line);
    if (next.length === 5) setCelebrating(true);
  }

  function pointerDown(event: PointerEvent<HTMLButtonElement>, id: BonusRegionId) {
    if (event.button !== 0 || !event.isPrimary || pointerStart.current) return;
    didDrag.current = false;
    pointerStart.current = { id, pointerId: event.pointerId, x: event.clientX, y: event.clientY, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function pointerMove(event: PointerEvent<HTMLButtonElement>) {
    const start = pointerStart.current;
    if (!start || start.pointerId !== event.pointerId) return;
    if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > 8) start.moved = true;
    if (start.moved) {
      setSelected(start.id);
      setDrag({ id: start.id, x: event.clientX, y: event.clientY });
    }
  }
  function pointerUp(event: PointerEvent<HTMLButtonElement>) {
    const start = pointerStart.current;
    if (!start || start.pointerId !== event.pointerId) return;
    pointerStart.current = null;
    setDrag(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (!start?.moved) return;
    didDrag.current = true;
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>("[data-bonus-region]");
    const regionId = target?.dataset.bonusRegion;
    if (bonusRegionIds.includes(regionId as BonusRegionId)) fit(regionId as BonusRegionId, start.id);
    else setMessage("Toque na silhueta da região para encaixar o emblema selecionado.");
  }

  return <section className="screen bonus-screen" aria-label="Fase bônus: complete sua viagem pelo Brasil" onKeyDown={(event) => {
    if (event.key === "Escape" && !celebrating) { pointerStart.current = null; setDrag(null); setSelected(null); setMessage(initialMessage); }
  }}>
    <header className="bonus-header" inert={celebrating}>
      <button className="bonus-round-control" onClick={onBack} aria-label="Voltar à jornada"><img src="/fases-voltar-v1.webp" alt="" /></button>
      <div className="bonus-title"><h1 ref={titleRef} tabIndex={-1}>FASE BÔNUS</h1><p>COMPLETE SUA VIAGEM PELO BRASIL</p></div>
      <button className={`bonus-round-control${sound ? "" : " is-muted"}`} onClick={onToggleSound} aria-label={sound ? "Desligar narração" : "Ligar narração"} aria-pressed={sound}><img src="/fases-som-v1.webp" alt="" /></button>
    </header>
    <div className="bonus-play-area" inert={celebrating}>
      <aside className="bonus-guide"><p>{message}</p><img src="/arara-mascote-v1.webp" alt="Arara Ari acompanhando sua viagem" /></aside>
      <div className="bonus-map-panel" role="group" aria-label="Mapa das cinco regiões do Brasil">
        <div className="bonus-map-stage">
          <svg className="bonus-map" viewBox={regionsMap.viewBox} aria-hidden="true" focusable="false">
            <defs>{regions.map((region) => <pattern id={`bonus-landscape-${region.id}`} key={region.id} patternUnits="userSpaceOnUse" width="613.11" height="533.07" viewBox="0 0 613.11 533.07">
              <image href={region.image} x={landscapeBounds[region.id][0] - 40} y={landscapeBounds[region.id][1] - 40} width={landscapeBounds[region.id][2] + 80} height={landscapeBounds[region.id][3] + 80} preserveAspectRatio="xMidYMid slice" />
            </pattern>)}</defs>
            {regionsMap.regions.map((region) => <g key={region.id} className={`bonus-map-region bonus-map-region-${region.id}`}>
              <g fill={region.color} stroke={regionBorderColors[region.id as BonusRegionId]} strokeWidth="5" strokeLinejoin="round">{region.paths.map((path) => <path key={path.id} d={path.d} />)}</g>
              <g fill={`url(#bonus-landscape-${region.id})`} stroke="#fffdf0" strokeWidth="1.15" strokeLinejoin="round" opacity=".9" pointerEvents="none">{region.paths.map((path) => <path key={path.id} d={path.d} />)}</g>
            </g>)}
          </svg>
          {regions.map((region) => {
            const filled = placed.includes(region.id);
            return <button key={region.id} data-bonus-region={region.id} onClick={() => fit(region.id)}
              className={`bonus-target bonus-target-${region.id}${filled ? " is-filled" : ""}${wrongRegion === region.id ? " is-wrong" : ""}`}
              style={{ left: `${region.x / 613.11 * 100}%`, top: `${region.y / 533.07 * 100}%`, width: `${region.size / 613.11 * 100}%`, "--emblem-mask": `url('/emblema-${region.id}-v2.webp')` } as CSSProperties}
              aria-label={filled ? `Região ${region.name}, emblema encaixado` : `Encaixar emblema na Região ${region.name}`} aria-disabled={filled}>
              {filled ? <img src={`/emblema-${region.id}-v2.webp`} alt="" draggable={false} /> : <span className="bonus-silhouette" aria-hidden="true" />}
              {filled && <span className="bonus-region-label">{region.name.toUpperCase()}<b aria-hidden="true"> ✓</b></span>}
            </button>;
          })}
        </div>
      </div>
      <aside className="bonus-emblem-tray" aria-label="Emblemas para encaixar">
        <h2>SEUS EMBLEMAS</h2>
        <div className="bonus-emblem-grid">{regions.map((region) => {
          const filled = placed.includes(region.id);
          return <button key={region.id} className={`bonus-piece${selected === region.id ? " is-selected" : ""}${filled ? " is-placed" : ""}`}
            disabled={filled} aria-pressed={selected === region.id} aria-label={`Emblema da Região ${region.name}${filled ? ", encaixado" : ", selecionar"}`}
            onPointerDown={(event) => pointerDown(event, region.id)} onPointerMove={pointerMove} onPointerUp={pointerUp}
            onPointerCancel={() => { pointerStart.current = null; setDrag(null); }}
            onClick={() => { if (didDrag.current) { didDrag.current = false; return; } choose(region.id); }}>
            <img src={`/emblema-${region.id}-v2.webp`} alt="" draggable={false} />
            <span>{filled ? "✓ ENCAIXADO" : region.name.toUpperCase()}</span>
          </button>;
        })}</div>
      </aside>
    </div>
    <footer className="bonus-footer" inert={celebrating}>
      <div className="bonus-help-bar"><div className="bonus-instruction"><svg className="bonus-touch-icon" viewBox="0 0 64 52" fill="none" aria-hidden="true"><path d="M17 22V12a4 4 0 0 1 8 0v17l3-5a4 4 0 0 1 6 0l2 3a4 4 0 0 1 6 2l2 4c2 5-2 14-5 17H23L11 36c-4-5 1-9 5-5l5 5" fill="currentColor"/><path d="M11 17a10 10 0 1 1 19-2M7 21a15 15 0 1 1 28-4M39 19c9-12 20-6 20 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="3 4"/><path d="m54 23 5 5 4-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg><p>Arraste o emblema ou toque nele e depois na região.</p></div>
      <div className="bonus-progress" role="status" aria-live="polite" aria-label={`${placed.length} de 5 emblemas encaixados`}><strong>{placed.length} DE 5 ENCAIXADOS</strong><div aria-hidden="true">{regions.map((region, index) => <span key={region.id} className={index < placed.length ? "is-earned" : ""}>★</span>)}</div></div></div>
      <button className="bonus-blue-button bonus-listen" onClick={() => onListen(bonusInstructions)}>🔊 OUVIR INSTRUÇÕES</button>
    </footer>
    <p className="bonus-live-message" aria-live="polite">{message}</p>
    {drag && createPortal(<img className="bonus-drag-ghost" src={`/emblema-${drag.id}-v2.webp`} alt="" style={{ left: drag.x, top: drag.y }} draggable={false} />, document.body)}
    {celebrating && <div className="bonus-celebration" role="dialog" aria-modal="true" aria-labelledby="bonus-finished-title" onKeyDown={(event) => {
      if (event.key === "Escape") onBack();
      if (event.key === "Tab") {
        const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>("button");
        if (event.shiftKey && document.activeElement === buttons[0]) { event.preventDefault(); buttons[buttons.length - 1]?.focus(); }
        else if (!event.shiftKey && document.activeElement === buttons[buttons.length - 1]) { event.preventDefault(); buttons[0]?.focus(); }
      }
    }}><div className="bonus-completion-card">
      <div className="bonus-completion-sparkles" aria-hidden="true">{Array.from({ length: 14 }, (_, index) => <span key={index}>★</span>)}</div>
      <span className="bonus-completion-ribbon">VIAGEM COMPLETA!</span>
      <div className="bonus-completion-emblems" aria-label="Cinco emblemas regionais reunidos">{regions.map((region) => <img key={region.id} src={`/emblema-${region.id}-v2.webp`} alt={`Região ${region.name}`} />)}</div>
      <h2 id="bonus-finished-title">Você deixou suas pegadas<br />por todo o Brasil!</h2>
      <p>Cada região tem suas histórias, paisagens e descobertas.<br />Juntas, elas formam o nosso Brasil!</p>
      <div className="bonus-completion-actions"><button ref={finishRef} className="bonus-blue-button" onClick={onBack}>VOLTAR À JORNADA</button><button className="bonus-replay" onClick={() => { setCelebrating(false); setPlaced([]); setSelected(null); setMessage(initialMessage); titleRef.current?.focus(); }}>JOGAR NOVAMENTE</button></div>
    </div></div>}
  </section>;
}
