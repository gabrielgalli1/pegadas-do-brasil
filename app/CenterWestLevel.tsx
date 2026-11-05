"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import regionsMap from "./brasil-cinco-regioes.json";
import ScoreBadge from "./ScoreBadge";
import JourneyRegionsMap from "./JourneyRegionsMap";
import CenterWestConveyor from "./CenterWestConveyor";
import CenterWestBrasilia from "./CenterWestBrasilia";
import CenterWestPhotographer from "./CenterWestPhotographer";
import { PhaseEmblemReward } from "./phaseEmblems";

type Feedback = "idle" | "correct" | "wrong" | "finished";
type Props = { mistakes: number; challenge: number; score: number; feedback: Feedback; sound: boolean; newEmblem: boolean; onAnswer: (correct: boolean) => void; onNext: () => void; onRetry: () => void; onBack: () => void; onToggleSound: () => void; onListen: (text: string) => void };
type AnimalId = "onca" | "lobo" | "tuiuiu" | "capivara";
type StateId = "mt" | "go" | "ms" | "df";
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

export default function CenterWestLevel({ mistakes, challenge, score, feedback, sound, newEmblem, onAnswer, onNext, onRetry, onBack, onToggleSound, onListen }: Props) {
  const isMemory = challenge === 2;
  const isPuzzle = challenge === 3;
  const isConveyor = challenge === 4;
  const isBrasilia = challenge === 5;
  const isPhotographer = challenge === 6;
  const [openCards, setOpenCards] = useState<number[]>([]);
  const [matched, setMatched] = useState<AnimalId[]>([]);
  const [memoryBusy, setMemoryBusy] = useState(false);
  const [memoryDeck, setMemoryDeck] = useState<AnimalId[]>(baseMemoryDeck);
  const [placedStates, setPlacedStates] = useState<StateId[]>([]);
  const [selectedState, setSelectedState] = useState<StateId | null>(null);
  const [stateGhost, setStateGhost] = useState<{ id: StateId; x: number; y: number } | null>(null);
  const stateDrag = useRef<{ id: StateId; pointerId: number; moved: boolean } | null>(null);
  const canAnswer = feedback === "idle";

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

  function chooseSlot(regionId: string) { if (canAnswer) onAnswer(regionId === "centro-oeste"); }
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
      // Pares diferentes fazem parte da busca: as cartas fecham sem penalidade.
      setOpenCards([]);
      setMemoryBusy(false);
    }, 700);
  }
  function placeState(slot: StateId, piece: StateId) {
    if (!canAnswer || placedStates.includes(piece)) return;
    setSelectedState(null);
    if (slot !== piece) { onAnswer(false); return; }
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
      <button className="north-round-control" onClick={onBack} aria-label="Voltar à jornada"><img src="/fases-voltar-v1.webp" alt="" /></button>
      <div className="north-heading"><h1>{title}</h1><p>{question}</p></div>
      <div className="north-status"><b>DESAFIO {challenge} DE 6</b><div aria-label={`Desafio ${challenge} de 6`}>{Array.from({ length: 6 }, (_, index) => <span key={index} className={index < challenge ? "active" : ""}>★</span>)}</div><ScoreBadge score={score} compact /></div>
      <button className={`north-round-control north-sound ${!sound ? "muted" : ""}`} onClick={onToggleSound} aria-label={sound ? "Desligar narração" : "Ligar narração"}><img src="/fases-som-v1.webp" alt="" /></button>
    </header>
    <div className="centerwest-guide">{isPhotographer ? <>Nossa missão:<br />fotografar a fauna!<br />Procure e enquadre cada animal.</> : isBrasilia ? <>Observe a referência<br />e monte o monumento!</> : isConveyor ? <>Observe com atenção!<br />Escolha o que pertence<br />ao Centro-Oeste.</> : isPuzzle ? <>Observe as formas<br />e complete o mapa!</> : isMemory ? <>Vamos conhecer os animais!<br />Vire duas cartas por vez.<br />Onde está cada par?</> : <>Olá, explorador!<br />Eu sou o Téo.<br />Boas-vindas ao Centro-Oeste!<br />Toque na região central do mapa.</>}</div>

    {isPhotographer ? <CenterWestPhotographer canAnswer={canAnswer} onMistake={() => onAnswer(false)} onComplete={() => onAnswer(true)} onListen={onListen} /> : isBrasilia ? <CenterWestBrasilia canAnswer={canAnswer} onMistake={() => onAnswer(false)} onComplete={() => onAnswer(true)} onListen={onListen} /> : isConveyor ? <CenterWestConveyor canAnswer={canAnswer} onMistake={() => onAnswer(false)} onComplete={() => onAnswer(true)} onListen={onListen} /> : isMemory ? <div className="centerwest-memory-board">
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
        {centerWestStates.map((state) => { const placed = placedStates.includes(state.id); return <g key={state.id} data-state-slot={state.id} className={`centerwest-state-slot ${placed ? "placed" : ""} ${selectedState ? "ready" : ""}`} role="button" tabIndex={0} aria-label={`Espaço de ${state.name}${placed ? ", preenchido" : ""}`} onClick={() => selectedState && placeState(state.id, selectedState)} onKeyDown={(event) => { if (selectedState && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); placeState(state.id, selectedState); } }}><path d={state.path} fill={placed ? state.color : "#fffaf0"} />{state.id === "df" && selectedState === "df" && !placed && <circle cx={state.label[0]} cy={state.label[1]} r="27" fill="transparent" stroke="none" pointerEvents="all" aria-hidden="true" />}{placed && <text x={state.label[0]} y={state.label[1]}>{state.id === "df" ? "DF" : state.name === "MATO GROSSO DO SUL" ? <><tspan x={state.label[0]} dy="-7">MATO GROSSO</tspan><tspan x={state.label[0]} dy="15">DO SUL</tspan></> : state.name}</text>}</g>; })}
      </svg>
      <div className="centerwest-state-tray" aria-label="Peças embaralhadas do mapa">{puzzleOrder.map((id) => { const state = centerWestStates.find((item) => item.id === id)!; return <button key={id} className={`centerwest-state-piece piece-${id} ${selectedState === id ? "selected" : ""}`} disabled={!canAnswer || placedStates.includes(id)} onPointerDown={(event) => beginStateDrag(id, event)} onPointerMove={moveStateDrag} onPointerUp={endStateDrag} onPointerCancel={() => { stateDrag.current = null; setStateGhost(null); }} aria-label={`Peça ${state.name}`}><svg viewBox={state.pieceViewBox} preserveAspectRatio="xMidYMid meet" aria-hidden="true"><path d={state.path} fill={state.color} /></svg><span className="centerwest-piece-code">{state.id.toUpperCase()}</span><strong>{state.name}</strong></button>; })}</div>
      <div className="centerwest-puzzle-progress">{placedStates.length} DE 4 PEÇAS ENCAIXADAS</div>
    </div> : <><div className="centerwest-board centerwest-location-board"><JourneyRegionsMap className="centerwest-map" canPlay={canAnswer} describedBy="centerwest-map-instruction" onSelect={chooseSlot} /></div><p id="centerwest-map-instruction" className="centerwest-map-instruction">Clique ou toque na Região Centro-Oeste no mapa!</p></>}

    <button className="centerwest-listen" onClick={() => onListen(isPhotographer ? "Encontre o animal indicado na missão. Mova a moldura com o mouse, toque ou use as setas do teclado. Quando o animal estiver enquadrado, pressione Fotografar. Registre o tuiuiú, a capivara e o jacaré." : isBrasilia ? "Observe a referência do Congresso Nacional. Arraste a plataforma, as torres, a concha, a cúpula e o espelho de água até as silhuetas correspondentes. Você também pode tocar na peça e depois no espaço correto." : isConveyor ? "Observe os cartões na esteira. Toque em milho, gado, Pantanal, Cerrado, Brasília e pequi. Use o botão pausar quando precisar de mais tempo." : isPuzzle ? "Observe o formato das quatro peças. Arraste Mato Grosso, Goiás, Mato Grosso do Sul e Distrito Federal até os espaços corretos para completar o mapa do Centro-Oeste." : isMemory ? "Vire duas cartas por vez e encontre os quatro pares de animais do Centro-Oeste: onça-pintada, lobo-guará, tuiuiú e capivara." : "Olá, explorador! Eu sou o Téo. Boas-vindas ao Centro-Oeste! Observe o mapa do Brasil e toque na região que fica no centro do país.")}>🔊 OUVIR INSTRUÇÕES</button>
    {stateGhost && <div className={`centerwest-state-ghost ghost-${stateGhost.id}`} style={{ left: stateGhost.x, top: stateGhost.y }} aria-hidden="true">{(() => { const state = centerWestStates.find((item) => item.id === stateGhost.id)!; return <svg viewBox={state.pieceViewBox}><path d={state.path} fill={state.color} /></svg>; })()}</div>}
    {feedback !== "idle" && <div className={`feedback ${feedback}`} role="dialog" aria-live="assertive">{feedback === "wrong" ? <><span>🧭</span><h2>{mistakes >= 2 ? "Vamos recomeçar!" : "Quase lá!"}</h2><p>{mistakes >= 2 ? "Você voltará ao primeiro desafio do Centro-Oeste." : isMemory ? "Observe os animais nas cartas que você acabou de virar." : isPuzzle ? "Compare o formato da peça com o espaço vazio." : isConveyor ? "Pense se esse elemento é característico do Centro-Oeste." : isBrasilia ? "Compare a peça com a imagem de referência do Congresso." : isPhotographer ? "Mova a câmera até que o animal fique inteiro na moldura." : "Observe a posição central da região no mapa do Brasil."}</p><button onClick={onRetry}>{mistakes >= 2 ? "RECOMEÇAR REGIÃO" : "TENTAR NOVAMENTE"}</button></> : <>{feedback === "finished" ? <PhaseEmblemReward id="centro-oeste" isNew={newEmblem} /> : <span>⭐</span>}<h2>{feedback === "finished" ? "Região Centro-Oeste concluída!" : "Muito bem!"}</h2><p>{isPhotographer ? "Missão completa! Você registrou a fauna do Pantanal e finalizou a Região Centro-Oeste!" : isBrasilia ? "Você chegou a Brasília, a capital do Brasil!" : isConveyor ? "Você reconheceu os elementos que pertencem ao Centro-Oeste!" : isPuzzle ? "Você montou o mapa com os quatro componentes do Centro-Oeste!" : isMemory ? "Você encontrou os quatro pares de animais do Centro-Oeste!" : "Você encontrou a Região Centro-Oeste, o coração do Brasil!"}</p><button onClick={challenge < 6 ? onNext : onBack}>{challenge < 6 ? "PRÓXIMO DESAFIO" : "VOLTAR À JORNADA"}</button></>}</div>}
  </section>;
}
