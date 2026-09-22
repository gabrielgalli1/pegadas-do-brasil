"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import regionsMap from "./brasil-cinco-regioes.json";
import ScoreBadge from "./ScoreBadge";
import CenterWestConveyor from "./CenterWestConveyor";
import CenterWestBrasilia from "./CenterWestBrasilia";
import CenterWestPhotographer from "./CenterWestPhotographer";

type Feedback = "idle" | "correct" | "wrong" | "finished";
type Props = { challenge: number; score: number; feedback: Feedback; sound: boolean; onAnswer: (correct: boolean) => void; onNext: () => void; onRetry: () => void; onBack: () => void; onToggleSound: () => void; onListen: (text: string) => void };
type AnimalId = "onca" | "lobo" | "tuiuiu" | "capivara";
type StateId = "mt" | "go" | "ms" | "df";
const names: Record<string, string> = { norte: "NORTE", nordeste: "NORDESTE", "centro-oeste": "CENTRO-OESTE", sudeste: "SUDESTE", sul: "SUL" };
const labels: Record<string, [number, number]> = { norte: [215, 145], nordeste: [445, 225], "centro-oeste": [265, 305], sudeste: [395, 365], sul: [290, 440] };
const possibleSlots = ["norte", "centro-oeste", "sul"] as const;
const slotLabels: Record<string, string> = { norte: "encaixe superior", "centro-oeste": "encaixe central", sul: "encaixe inferior" };
const animalNames: Record<AnimalId, string> = { onca: "Onça-pintada", lobo: "Lobo-guará", tuiuiu: "Tuiuiú", capivara: "Capivara" };
const baseMemoryDeck: AnimalId[] = ["onca", "capivara", "lobo", "tuiuiu", "capivara", "onca", "tuiuiu", "lobo"];
function shuffleMemoryDeck() {
  const deck = [...baseMemoryDeck];
  for (let index = deck.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [deck[index], deck[randomIndex]] = [deck[randomIndex], deck[index]];
  }
  if (deck.every((animal, index) => animal === baseMemoryDeck[index])) deck.push(deck.shift()!);
  return deck;
}
const statePaths = new Map(regionsMap.regions.flatMap((region) => region.paths).map((part) => [part.id, part.d]));
function stateContour(id: string) { const path = statePaths.get(id); if (!path) throw new Error(`Contorno não encontrado: ${id}`); return path; }
const centerWestStates: readonly { id: StateId; name: string; color: string; path: string; label: [number, number]; pieceViewBox: string }[] = [
  { id: "mt", name: "MATO GROSSO", color: "#56ad45", path: stateContour("path5126"), label: [236, 255], pieceViewBox: "155 188 178 132" },
  { id: "go", name: "GOIÁS", color: "#f3b92e", path: stateContour("path5168"), label: [329, 309], pieceViewBox: "278 242 108 98" },
  { id: "ms", name: "MATO GROSSO DO SUL", color: "#3399df", path: stateContour("path5246"), label: [266, 350], pieceViewBox: "214 304 108 101" },
  { id: "df", name: "DISTRITO FEDERAL", color: "#8d63bf", path: stateContour("path5098"), label: [353, 287], pieceViewBox: "344 279 19 17" },
] as const;
const puzzleOrder: StateId[] = ["ms", "go", "df", "mt"];

export default function CenterWestLevel({ challenge, score, feedback, sound, onAnswer, onNext, onRetry, onBack, onToggleSound, onListen }: Props) {
  const isMemory = challenge === 2;
  const isPuzzle = challenge === 3;
  const isConveyor = challenge === 4;
  const isBrasilia = challenge === 5;
  const isPhotographer = challenge === 6;
  const [selected, setSelected] = useState(false);
  const [ghost, setGhost] = useState<{ x: number; y: number } | null>(null);
  const drag = useRef<{ pointerId: number; moved: boolean } | null>(null);
  const dropRefs = useRef<Record<string, SVGGElement | null>>({});
  const [openCards, setOpenCards] = useState<number[]>([]);
  const [matched, setMatched] = useState<AnimalId[]>([]);
  const [memoryBusy, setMemoryBusy] = useState(false);
  const [memoryDeck, setMemoryDeck] = useState<AnimalId[]>(baseMemoryDeck);
  const [placedStates, setPlacedStates] = useState<StateId[]>([]);
  const [selectedState, setSelectedState] = useState<StateId | null>(null);
  const [stateGhost, setStateGhost] = useState<{ id: StateId; x: number; y: number } | null>(null);
  const stateDrag = useRef<{ id: StateId; pointerId: number; moved: boolean } | null>(null);
  const centerWest = regionsMap.regions.find((region) => region.id === "centro-oeste")!;
  const canAnswer = feedback === "idle";
  const solved = feedback === "correct" || feedback === "finished";

  useEffect(() => {
    if (!isMemory) return;
    const shuffleTimer = window.setTimeout(() => {
      setMemoryDeck(shuffleMemoryDeck());
      setOpenCards([]);
      setMatched([]);
      setMemoryBusy(false);
    }, 0);
    return () => window.clearTimeout(shuffleTimer);
  }, [isMemory]);

  function chooseSlot(regionId: string) { if (canAnswer) { setSelected(false); setGhost(null); onAnswer(regionId === "centro-oeste"); } }
  function startDrag(event: ReactPointerEvent<HTMLButtonElement>) { if (!canAnswer) return; drag.current = { pointerId: event.pointerId, moved: false }; event.currentTarget.setPointerCapture(event.pointerId); setSelected(true); setGhost({ x: event.clientX, y: event.clientY }); }
  function moveDrag(event: ReactPointerEvent<HTMLButtonElement>) { if (!drag.current || drag.current.pointerId !== event.pointerId) return; drag.current.moved = true; setGhost({ x: event.clientX, y: event.clientY }); }
  function endDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    const active = drag.current; drag.current = null; setGhost(null);
    if (!active?.moved) { setSelected(true); return; }
    const slot = possibleSlots.find((id) => { const box = dropRefs.current[id]?.getBoundingClientRect(); return box && event.clientX >= box.left && event.clientX <= box.right && event.clientY >= box.top && event.clientY <= box.bottom; });
    if (slot) chooseSlot(slot);
  }
  function flipCard(index: number) {
    if (!canAnswer || memoryBusy || openCards.includes(index) || matched.includes(memoryDeck[index])) return;
    const next = [...openCards, index];
    setOpenCards(next);
    if (next.length < 2) return;
    setMemoryBusy(true);
    window.setTimeout(() => {
      const [first, second] = next;
      if (memoryDeck[first] === memoryDeck[second]) {
        const animal = memoryDeck[first];
        const nextMatched = [...matched, animal];
        setMatched(nextMatched);
        if (nextMatched.length === 4) window.setTimeout(() => onAnswer(true), 350);
      }
      setOpenCards([]);
      setMemoryBusy(false);
    }, 700);
  }
  function placeState(slot: StateId, piece: StateId) {
    if (!canAnswer || placedStates.includes(piece)) return;
    setSelectedState(null);
    if (slot !== piece) { onListen("Essa peça não encaixa aí. Compare o formato e tente outro espaço."); return; }
    const next = [...placedStates, piece];
    setPlacedStates(next);
    onListen(`${centerWestStates.find((state) => state.id === piece)?.name}. Peça encaixada!`);
    if (next.length === centerWestStates.length) window.setTimeout(() => onAnswer(true), 350);
  }
  function beginStateDrag(piece: StateId, event: ReactPointerEvent<HTMLButtonElement>) {
    if (!canAnswer) return;
    stateDrag.current = { id: piece, pointerId: event.pointerId, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
    setSelectedState(piece);
    setStateGhost({ id: piece, x: event.clientX, y: event.clientY });
  }
  function moveStateDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    if (!stateDrag.current || stateDrag.current.pointerId !== event.pointerId) return;
    stateDrag.current.moved = true;
    setStateGhost({ id: stateDrag.current.id, x: event.clientX, y: event.clientY });
  }
  function endStateDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    const active = stateDrag.current;
    stateDrag.current = null;
    setStateGhost(null);
    if (!active) return;
    if (!active.moved) { setSelectedState(active.id); return; }
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<SVGGElement>("[data-state-slot]");
    const slot = target?.dataset.stateSlot as StateId | undefined;
    if (slot) placeState(slot, active.id);
  }

  const title = isPhotographer ? "FOTÓGRAFO DO PANTANAL" : isBrasilia ? "CONSTRUINDO BRASÍLIA" : isConveyor ? "O QUE PERTENCE AO CENTRO-OESTE?" : isPuzzle ? "MONTE O MAPA DO CENTRO-OESTE" : isMemory ? "MEMÓRIA DA NATUREZA" : "ONDE FICA O CENTRO-OESTE?";
  const question = isPhotographer ? "Encontre o animal e tire uma foto!" : isBrasilia ? "Monte o Congresso Nacional colocando as peças no lugar correto." : isConveyor ? "Escolha os elementos que fazem parte da região." : isPuzzle ? "Coloque as peças nos espaços corretos." : isMemory ? "Encontre os pares de animais." : "Encontre a região no mapa do Brasil.";
  return <section className={`screen centerwest-screen ${isPhotographer ? "centerwest-photo-screen" : isBrasilia ? "centerwest-brasilia-screen" : isConveyor ? "centerwest-conveyor-screen" : isPuzzle ? "centerwest-puzzle-screen" : isMemory ? "centerwest-memory-screen" : "centerwest-location-screen"}`} aria-label={`Desafio ${challenge} da Região Centro-Oeste`}>
    <header className="north-challenge-header centerwest-challenge-header">
      <button className="north-round-control" onClick={onBack} aria-label="Voltar à jornada"><img src="/fases-voltar-v1.png" alt="" /></button>
      <div className="north-heading"><h1>{title}</h1><p>{question}</p></div>
      <div className="north-status"><b>DESAFIO {challenge} DE 6</b><div aria-label={`Desafio ${challenge} de 6`}>{Array.from({ length: 6 }, (_, index) => <span key={index} className={index < challenge ? "active" : ""}>★</span>)}</div><ScoreBadge score={score} compact /></div>
      <button className={`north-round-control north-sound ${!sound ? "muted" : ""}`} onClick={onToggleSound} aria-label={sound ? "Desligar som" : "Ligar som"}><img src="/fases-som-v1.png" alt="" /></button>
    </header>
    <div className="centerwest-guide">{isPhotographer ? <>Nossa missão:<br />fotografar a fauna!<br />Procure e enquadre cada animal.</> : isBrasilia ? <>Observe a referência<br />e monte o monumento!</> : isConveyor ? <>Observe com atenção!<br />Escolha o que pertence<br />ao Centro-Oeste.</> : isPuzzle ? <>Observe as formas<br />e complete o mapa!</> : isMemory ? <>Vamos conhecer os animais!<br />Vire duas cartas por vez.<br />Onde está cada par?</> : <>Olá, explorador!<br />Eu sou o Téo.<br />Bem-vindo ao Centro-Oeste!<br />Encaixe a região no lugar certo.</>}</div>

    {isPhotographer ? <CenterWestPhotographer canAnswer={canAnswer} onComplete={() => onAnswer(true)} onListen={onListen} /> : isBrasilia ? <CenterWestBrasilia canAnswer={canAnswer} onComplete={() => onAnswer(true)} onListen={onListen} /> : isConveyor ? <CenterWestConveyor canAnswer={canAnswer} onComplete={() => onAnswer(true)} onListen={onListen} /> : isMemory ? <div className="centerwest-memory-board">
      <div className="memory-grid" role="grid" aria-label="Jogo da memória com oito cartas">
        {memoryDeck.map((animal, index) => {
          const revealed = openCards.includes(index) || matched.includes(animal);
          return <button key={index} className={`memory-card ${revealed ? "revealed" : ""} ${matched.includes(animal) ? "matched" : ""}`} onClick={() => flipCard(index)} disabled={!canAnswer || memoryBusy || matched.includes(animal)} role="gridcell" aria-label={revealed ? animalNames[animal] : `Carta fechada ${index + 1}`} aria-selected={revealed}>
            <span className="memory-card-inner"><span className="memory-card-back" aria-hidden="true"></span><span className={`memory-card-front animal-${animal}`}><b>{animalNames[animal]}</b></span></span>
          </button>;
        })}
      </div>
      <div className="memory-progress" aria-live="polite"><strong>{matched.length} DE 4 PARES ENCONTRADOS</strong><span>{Array.from({ length: 4 }, (_, index) => <i key={index} className={index < matched.length ? "found" : ""}>★</i>)}</span></div>
    </div> : isPuzzle ? <div className="centerwest-puzzle-board">
      <svg className="centerwest-states-map" viewBox="148 182 250 230" role="img" aria-label="Quebra-cabeça dos estados do Centro-Oeste">
        {centerWestStates.map((state) => { const placed = placedStates.includes(state.id); return <g key={state.id} data-state-slot={state.id} className={`centerwest-state-slot ${placed ? "placed" : ""} ${selectedState ? "ready" : ""}`} role="button" tabIndex={0} aria-label={`Espaço de ${state.name}${placed ? ", preenchido" : ""}`} onClick={() => selectedState && placeState(state.id, selectedState)} onKeyDown={(event) => { if (selectedState && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); placeState(state.id, selectedState); } }}><path d={state.path} fill={placed ? state.color : "#fffaf0"} />{placed && <text x={state.label[0]} y={state.label[1]}>{state.id === "df" ? "DF" : state.name === "MATO GROSSO DO SUL" ? <><tspan x={state.label[0]} dy="-7">MATO GROSSO</tspan><tspan x={state.label[0]} dy="15">DO SUL</tspan></> : state.name}</text>}</g>; })}
      </svg>
      <div className="centerwest-state-tray" aria-label="Peças embaralhadas do mapa">{puzzleOrder.map((id) => { const state = centerWestStates.find((item) => item.id === id)!; return <button key={id} className={`centerwest-state-piece piece-${id} ${selectedState === id ? "selected" : ""}`} disabled={!canAnswer || placedStates.includes(id)} onPointerDown={(event) => beginStateDrag(id, event)} onPointerMove={moveStateDrag} onPointerUp={endStateDrag} onPointerCancel={() => { stateDrag.current = null; setStateGhost(null); }} aria-label={`Peça ${state.name}`}><svg viewBox={state.pieceViewBox} preserveAspectRatio="xMidYMid meet" aria-hidden="true"><path d={state.path} fill={state.color} /></svg><span className="centerwest-piece-code">{state.id.toUpperCase()}</span><strong>{state.name}</strong></button>; })}</div>
      <div className="centerwest-puzzle-progress">{placedStates.length} DE 4 PEÇAS ENCAIXADAS</div>
    </div> : <div className="centerwest-board"><div className="centerwest-piece-area">{!solved && <button className={`centerwest-piece ${selected ? "selected" : ""}`} onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={() => { drag.current = null; setGhost(null); }} aria-pressed={selected} aria-label="Peça da Região Centro-Oeste. Arraste até um espaço no mapa ou pressione para selecionar."><svg viewBox="135 190 245 225" aria-hidden="true">{centerWest.paths.map((path) => <path key={path.id} d={path.d} />)}<text x="266" y="306">CENTRO-</text><text x="266" y="326">OESTE</text></svg></button>}{!solved && <span className="centerwest-drag-hint" aria-hidden="true">➜</span>}</div>
      <svg className="centerwest-map" viewBox={regionsMap.viewBox} role="img" aria-label="Mapa do Brasil com três possíveis espaços de encaixe">{regionsMap.regions.map((region) => { const isCandidate = possibleSlots.includes(region.id as typeof possibleSlots[number]); const isCorrect = region.id === "centro-oeste"; const filled = isCorrect && solved; const [x, y] = labels[region.id]; return <g key={region.id} ref={isCandidate ? (node) => { dropRefs.current[region.id] = node; } : undefined} className={`${isCandidate ? "centerwest-slot" : "centerwest-map-region"} ${filled ? "filled" : ""}`} role={isCandidate ? "button" : undefined} tabIndex={isCandidate ? 0 : undefined} aria-label={isCandidate ? slotLabels[region.id] : undefined} onClick={isCandidate && selected ? () => chooseSlot(region.id) : undefined} onKeyDown={isCandidate ? (event) => { if (selected && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); chooseSlot(region.id); } } : undefined}>{region.paths.map((path) => <path key={path.id} d={path.d} fill={isCandidate && !filled ? "#fffdf1" : region.color} />)}{(!isCandidate || filled) && <text x={x} y={y}>{names[region.id]}</text>}</g>; })}</svg>
    </div>}

    <button className="centerwest-listen" onClick={() => onListen(isPhotographer ? "Encontre o animal indicado na missão. Mova a moldura com o mouse, toque ou use as setas do teclado. Quando o animal estiver enquadrado, pressione Fotografar. Registre o tuiuiú, a capivara e o jacaré." : isBrasilia ? "Observe a referência do Congresso Nacional. Arraste a plataforma, as torres, a concha, a cúpula e o espelho de água até as silhuetas correspondentes. Você também pode tocar na peça e depois no espaço correto." : isConveyor ? "Observe os cartões na esteira. Toque em milho, gado, Pantanal, Cerrado, Brasília e pequi. Use o botão pausar quando precisar de mais tempo." : isPuzzle ? "Observe o formato das quatro peças. Arraste Mato Grosso, Goiás, Mato Grosso do Sul e Distrito Federal até os espaços corretos para completar o mapa do Centro-Oeste." : isMemory ? "Vire duas cartas por vez e encontre os quatro pares de animais do Centro-Oeste: onça-pintada, lobo-guará, tuiuiú e capivara." : "Olá, explorador! Eu sou o Téo. Bem-vindo ao Centro-Oeste! Arraste a peça da região até um dos três espaços vazios no mapa. Observe a posição das regiões para escolher o encaixe correto. Você também pode tocar na peça e depois no espaço.")}>🔊 OUVIR INSTRUÇÕES</button>
    {!isMemory && !isPuzzle && ghost && <div className="centerwest-ghost" style={{ left: ghost.x, top: ghost.y }} aria-hidden="true"><svg viewBox="135 190 245 225">{centerWest.paths.map((path) => <path key={path.id} d={path.d} />)}</svg></div>}
    {stateGhost && <div className={`centerwest-state-ghost ghost-${stateGhost.id}`} style={{ left: stateGhost.x, top: stateGhost.y }} aria-hidden="true">{(() => { const state = centerWestStates.find((item) => item.id === stateGhost.id)!; return <svg viewBox={state.pieceViewBox}><path d={state.path} fill={state.color} /></svg>; })()}</div>}
    {feedback !== "idle" && <div className={`feedback ${feedback}`} role="dialog" aria-live="assertive">{feedback === "wrong" ? <><span>🧭</span><h2>Quase lá!</h2><p>Observe a posição das regiões e tente outro encaixe.</p><button onClick={onRetry}>TENTAR NOVAMENTE</button></> : <><span>⭐</span><h2>Muito bem!</h2><p>{isPhotographer ? "Missão completa! Você registrou a fauna do Pantanal e finalizou a Região Centro-Oeste!" : isBrasilia ? "Você chegou a Brasília, a capital do Brasil!" : isConveyor ? "Você reconheceu os elementos que pertencem ao Centro-Oeste!" : isPuzzle ? "Você montou o mapa com os quatro componentes do Centro-Oeste!" : isMemory ? "Você encontrou os quatro pares de animais do Centro-Oeste!" : "Você encontrou a Região Centro-Oeste, o coração do Brasil!"}</p><button onClick={challenge < 6 ? onNext : onBack}>{challenge < 6 ? "PRÓXIMO DESAFIO" : "VOLTAR À JORNADA"}</button></>}</div>}
  </section>;
}
