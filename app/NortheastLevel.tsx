"use client";

import { useRef, useState } from "react";
import regionsMap from "./brasil-cinco-regioes.json";

type Feedback = "idle" | "correct" | "wrong" | "finished";
type Challenge = { title: string; question: string; tip: string; correct: string; options?: readonly (string | number)[]; answer?: string | number };
type Props = { challenge: number; feedback: Feedback; sound: boolean; onAnswer: (correct: boolean) => void; onNext: () => void; onRetry: () => void; onBack: () => void; onToggleSound: () => void; onListen: (text: string) => void };
type NortheastState = { id: string; name: string; short: string; path: string; label: [number, number]; color: string };
type LandscapeId = "litoral" | "manguezal" | "serra" | "caatinga";
type ArraiaId = "bandeirinhas" | "sanfona" | "milho" | "frevo" | "chimarrao" | "neve";
type ArraiaDrag = { id: ArraiaId; pointerId: number; startX: number; startY: number; moved: boolean };

const regionNames: Record<string, string> = { norte: "Norte", nordeste: "Nordeste", "centro-oeste": "Centro-Oeste", sudeste: "Sudeste", sul: "Sul" };
const regionLabels: Record<string, [number, number]> = { norte: [215, 145], nordeste: [445, 225], "centro-oeste": [265, 305], sudeste: [395, 365], sul: [290, 440] };
const northeastStates: readonly NortheastState[] = [
  { id: "ma", name: "Maranhão", short: "MA", path: "M40 80 160 50 205 120 175 205 90 220 35 160Z", label: [112, 137], color: "#62b936" },
  { id: "pi", name: "Piauí", short: "PI", path: "M160 50 250 70 270 170 220 245 175 205 205 120Z", label: [220, 145], color: "#f6c93c" },
  { id: "ce", name: "Ceará", short: "CE", path: "M250 70 335 55 360 120 315 180 270 170Z", label: [307, 116], color: "#f29a3e" },
  { id: "rn", name: "Rio Grande do Norte", short: "RN", path: "M335 55 455 80 470 115 360 120Z", label: [403, 91], color: "#e76955" },
  { id: "pb", name: "Paraíba", short: "PB", path: "M315 180 360 120 470 115 475 150 345 170Z", label: [409, 142], color: "#58a8df" },
  { id: "pe", name: "Pernambuco", short: "PE", path: "M220 245 270 170 345 170 475 150 480 195 320 220 255 260Z", label: [367, 194], color: "#8d75c7" },
  { id: "al", name: "Alagoas", short: "AL", path: "M255 260 320 220 460 210 445 245 300 275Z", label: [378, 241], color: "#ef7f91" },
  { id: "se", name: "Sergipe", short: "SE", path: "M300 275 445 245 430 285 320 310Z", label: [378, 278], color: "#45b9a4" },
  { id: "ba", name: "Bahia", short: "BA", path: "M90 220 175 205 220 245 255 260 300 275 320 310 285 455 165 470 75 400 50 300Z", label: [185, 350], color: "#e7b94b" },
] as const;
const northeastStateChecks: Record<string, [number, number]> = {
  ma: [112, 162], pi: [220, 170], ce: [307, 141], rn: [420, 112],
  pb: [452, 141], pe: [454, 187], al: [426, 234], se: [430, 278], ba: [185, 375],
};const northeastLandscapes: readonly { id: LandscapeId; name: string; image: string }[] = [
  { id: "litoral", name: "LITORAL", image: "/paisagem-nordeste-litoral-v2.png" },
  { id: "manguezal", name: "MANGUEZAL", image: "/paisagem-nordeste-manguezal-v2.png" },
  { id: "serra", name: "SERRA", image: "/paisagem-nordeste-serra-v2.png" },
  { id: "caatinga", name: "CAATINGA", image: "/paisagem-nordeste-caatinga-v2.png" },
];
const arraiaItems: readonly { id: ArraiaId; name: string; image: string; optionImage?: string; correct: boolean }[] = [
  { id: "bandeirinhas", name: "BANDEIRINHAS", image: "/arraia-bandeirinhas-v3.png", optionImage: "/arraia-bandeirinhas-v2.png", correct: true },
  { id: "sanfona", name: "SANFONA", image: "/arraia-sanfona-v4.png", optionImage: "/arraia-sanfona-v2.png", correct: true },
  { id: "milho", name: "MILHO", image: "/arraia-milho-v4.png", optionImage: "/arraia-milho-v2.png", correct: true },
  { id: "frevo", name: "FREVO", image: "/arraia-frevo-v4.png", optionImage: "/arraia-frevo-v2.png", correct: true },
  { id: "chimarrao", name: "CHIMARRÃO", image: "/arraia-chimarrao-v2.png", correct: false },
  { id: "neve", name: "BONECO DE NEVE", image: "/arraia-boneco-neve-v2.png", correct: false },
];
const challenges: readonly Challenge[] = [
  { title: "ONDE FICA O NORDESTE?", question: "Clique na Região Nordeste no mapa do Brasil.", tip: "Bem-vindo, explorador!\nVamos conhecer a Região Nordeste!", correct: "Você encontrou a Região Nordeste!" },
  { title: "QUANTOS ESTADOS TEM O NORDESTE?", question: "Toque em cada estado para descobrir e contar.", tip: "Cada toque revela um estado.\nVamos contar juntos?", correct: "Muito bem! O Nordeste possui 9 estados!" },
  { title: "COMO É O CLIMA DO SERTÃO?", question: "Complete o painel com as características do clima.", tip: "Observe a paisagem!\nComo são o calor e as chuvas no Sertão?", correct: "Muito bem! No Sertão faz calor e chove pouco durante boa parte do ano!" },
  { title: "ENCONTRE O TATU-BOLA", question: "Observe a Caatinga e encontre o animal.", tip: "Tenho uma carapaça e posso me enrolar como uma bola.\nOnde estou?", correct: "Você encontrou o tatu-bola escondido na Caatinga!" },
  { title: "AS PAISAGENS DO NORDESTE", question: "Monte o álbum com os diferentes ambientes da região.", tip: "Escolha uma paisagem e depois toque no nome correto.\nVamos completar o álbum?", correct: "Muito bem! O Nordeste possui muitos ambientes e paisagens diferentes!" },
  { title: "COMPLETE A FESTA NORDESTINA", question: "Arraste as peças até as silhuetas da imagem.", tip: "Arraste cada figura até a sombra com o mesmo formato.\nVamos completar a festa!", correct: "Muito bem! A cultura nordestina tem festas, músicas, danças e sabores muito especiais!" },
] as const;

export default function NortheastLevel({ challenge, feedback, sound, onAnswer, onNext, onRetry, onBack, onToggleSound, onListen }: Props) {
  const current = challenges[challenge - 1];
  const isMap = challenge === 1;
  const isStateDiscovery = challenge === 2;
  const isClimate = challenge === 3;
  const isAnimalSearch = challenge === 4;
  const isLandscapeAlbum = challenge === 5;
  const isArraia = challenge === 6;
  const canAnswer = feedback === "idle";
  const [discovered, setDiscovered] = useState<string[]>([]);
  const discoveredRef = useRef<string[]>([]);
  const [climateTemperature, setClimateTemperature] = useState<"quente" | "frio" | null>(null);
  const [climateRain, setClimateRain] = useState<"pouca" | "muita" | null>(null);
  const [lensPosition, setLensPosition] = useState({ x: 51, y: 48 });
  const [animalHint, setAnimalHint] = useState(false);
  const [selectedLandscape, setSelectedLandscape] = useState<LandscapeId | null>(null);
  const [placedLandscapes, setPlacedLandscapes] = useState<LandscapeId[]>([]);
  const [arraiaChoices, setArraiaChoices] = useState<ArraiaId[]>([]);
  const [arraiaGhost, setArraiaGhost] = useState<{ id: ArraiaId; x: number; y: number } | null>(null);
  const [arraiaOverSlot, setArraiaOverSlot] = useState<ArraiaId | null>(null);
  const arraiaDrag = useRef<ArraiaDrag | null>(null);
  const arraiaSuppressClick = useRef(false);

  function chooseRegion(regionId: string) { if (canAnswer) onAnswer(regionId === "nordeste"); }
  function discoverState(state: NortheastState) {
    if (!canAnswer || discoveredRef.current.includes(state.id)) return;
    const next = [...discoveredRef.current, state.id];
    discoveredRef.current = next;
    setDiscovered(next);
    onListen(`${state.name}. ${next.length} de 9 estados descobertos.`);
    if (next.length === northeastStates.length) onAnswer(true);
  }

  function chooseClimate(kind: "temperature" | "rain", value: "quente" | "frio" | "pouca" | "muita") {
    if (!canAnswer) return;
    const nextTemperature = kind === "temperature" ? value as "quente" | "frio" : climateTemperature;
    const nextRain = kind === "rain" ? value as "pouca" | "muita" : climateRain;
    if (kind === "temperature") setClimateTemperature(nextTemperature);
    else setClimateRain(nextRain);
    if (nextTemperature && nextRain) onAnswer(nextTemperature === "quente" && nextRain === "pouca");
  }
  function moveLens(event: ReactPointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    setLensPosition({
      x: Math.max(8, Math.min(92, ((event.clientX - rect.left) / rect.width) * 100)),
      y: Math.max(14, Math.min(86, ((event.clientY - rect.top) / rect.height) * 100)),
    });
  }
  function showAnimalHint() {
    if (!canAnswer) return;
    setAnimalHint(true);
    setLensPosition({ x: 84, y: 71 });
    onListen("Dica: procure perto das pedras e das plantas no canto direito da paisagem.");
  }
  function placeLandscape(slot: LandscapeId) {
    if (!canAnswer || !selectedLandscape || placedLandscapes.includes(slot)) return;
    if (selectedLandscape !== slot) { onAnswer(false); return; }
    const next = [...placedLandscapes, slot];
    setPlacedLandscapes(next);
    setSelectedLandscape(null);
    const landscape = northeastLandscapes.find((item) => item.id === slot);
    onListen((landscape?.name || "") + ". Paisagem colocada corretamente.");
    if (next.length === northeastLandscapes.length) onAnswer(true);
  }

  function placeArraiaPiece(slot: ArraiaId, piece: ArraiaId | null) {
    if (!canAnswer || !piece || arraiaChoices.includes(slot)) return;
    const item = arraiaItems.find((candidate) => candidate.id === piece);
    if (!item?.correct || piece !== slot) { onAnswer(false); return; }
    const next = [...arraiaChoices, slot];
    setArraiaChoices(next);
    onListen(item.name + ". Peça encaixada corretamente!");
    if (next.length === 4) onAnswer(true);
  }
  function arraiaSlotAt(x: number, y: number) {
    const slots = Array.from(document.querySelectorAll<HTMLElement>("[data-arraia-slot]"));
    return slots.find((slot) => {
      const rect = slot.getBoundingClientRect();
      return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    })?.dataset.arraiaSlot as ArraiaId | undefined;
  }
  function beginArraiaDrag(item: (typeof arraiaItems)[number], event: ReactPointerEvent<HTMLButtonElement>) {
    if (!canAnswer || arraiaChoices.includes(item.id) || !event.isPrimary || event.button !== 0 || arraiaDrag.current) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    arraiaDrag.current = { id: item.id, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, moved: false };
  }
  function moveArraiaDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    const active = arraiaDrag.current;
    if (!active || active.pointerId !== event.pointerId) return;
    if (!active.moved && Math.hypot(event.clientX - active.startX, event.clientY - active.startY) < 6) return;
    active.moved = true;
    event.preventDefault();
    setArraiaGhost({ id: active.id, x: event.clientX, y: event.clientY });
    setArraiaOverSlot(arraiaSlotAt(event.clientX, event.clientY) ?? null);
  }
  function clearArraiaDrag(element?: HTMLButtonElement, pointerId?: number) {
    if (element && pointerId !== undefined && element.hasPointerCapture(pointerId)) element.releasePointerCapture(pointerId);
    arraiaDrag.current = null;
    setArraiaGhost(null);
    setArraiaOverSlot(null);
  }
  function endArraiaDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    const active = arraiaDrag.current;
    if (!active || active.pointerId !== event.pointerId) return;
    const slot = active.moved ? arraiaSlotAt(event.clientX, event.clientY) : undefined;
    const piece = active.id;
    const moved = active.moved;
    clearArraiaDrag(event.currentTarget, event.pointerId);
    if (moved) {
      arraiaSuppressClick.current = true;
      window.setTimeout(() => { arraiaSuppressClick.current = false; }, 0);
      if (slot) placeArraiaPiece(slot, piece);
    }
  }
  function cancelArraiaDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    if (arraiaDrag.current?.pointerId === event.pointerId) clearArraiaDrag(event.currentTarget, event.pointerId);
  }
  function retryChallenge() {
    if (isClimate) { setClimateTemperature(null); setClimateRain(null); }
    if (isAnimalSearch) { setAnimalHint(false); setLensPosition({ x: 51, y: 48 }); }
    if (isLandscapeAlbum) { setSelectedLandscape(null); setPlacedLandscapes([]); }
    onRetry();
  }
  return <section className={`screen north-challenge-screen northeast-challenge-screen ${isMap ? "" : "north-count-screen"} ${isStateDiscovery ? "northeast-state-screen" : ""} ${isClimate ? "northeast-climate-screen" : ""} ${isAnimalSearch ? "northeast-animal-screen" : ""} ${isLandscapeAlbum ? "northeast-landscape-screen" : ""} ${isArraia ? "northeast-arraia-screen" : ""}`} aria-label={`Desafio ${challenge} da Região Nordeste`}>
    <header className="north-challenge-header">
      <button className="north-round-control" onClick={onBack} aria-label="Voltar à jornada"><img src="/fases-voltar-v1.png" alt="" /></button>
      <div className="north-heading"><h1>{current.title}</h1><p>{current.question}</p></div>
      <div className="north-status"><b>DESAFIO {challenge} DE 6</b><div aria-label={`Desafio ${challenge} de 6`}>{Array.from({ length: 6 }, (_, index) => <span key={index} className={index < challenge ? "active" : ""}>★</span>)}</div></div>
      <button className={`north-round-control north-sound ${!sound ? "muted" : ""}`} onClick={onToggleSound} aria-label={sound ? "Desligar som" : "Ligar som"}><img src="/fases-som-v1.png" alt="" /></button>
    </header>
    <div className="north-guide"><div className="north-tip">{current.tip.split("\n").map((line, index) => <span key={line}>{line}{index === 0 && <br />}</span>)}</div></div>
    {isMap ? <><div className="north-map-card northeast-map-card" role="group" aria-label="Mapa do Brasil dividido em cinco regiões">
      <svg className="north-map northeast-map" viewBox={regionsMap.viewBox} preserveAspectRatio="xMidYMid meet" aria-label="Clique na Região Nordeste no mapa do Brasil">{regionsMap.regions.map((region) => <g key={region.id} className="north-region" role="button" tabIndex={canAnswer ? 0 : -1} aria-label={`Região ${regionNames[region.id]}`} aria-disabled={!canAnswer} fill={region.color} onClick={() => chooseRegion(region.id)} onKeyDown={(event) => { if (canAnswer && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); chooseRegion(region.id); } }}><title>{`Região ${regionNames[region.id]}`}</title>{region.paths.map((part) => <path key={part.id} d={part.d} />)}<text x={regionLabels[region.id][0]} y={regionLabels[region.id][1]}>{regionNames[region.id].toUpperCase()}</text></g>)}</svg>
    </div><p className="north-map-instruction">Clique ou toque na Região Nordeste no mapa!</p></> : isStateDiscovery ? <div className="northeast-discovery-card">
      <svg className="northeast-states-map" viewBox="0 0 520 500" role="group" aria-label="Mapa interativo dos nove estados da Região Nordeste">{northeastStates.map((state) => { const revealed = discovered.includes(state.id); return <g key={state.id} className={revealed ? "revealed" : ""} role="button" tabIndex={canAnswer && !revealed ? 0 : -1} aria-label={`${state.name}${revealed ? ", descoberto" : ", toque para descobrir"}`} onClick={() => discoverState(state)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); discoverState(state); } }}><path d={state.path} style={{ "--state-color": state.color } as React.CSSProperties} /><text x={state.label[0]} y={state.label[1]}>{revealed ? state.name : state.short}</text>{revealed && <text className="state-check" x={northeastStateChecks[state.id][0]} y={northeastStateChecks[state.id][1]}>✓</text>}</g>})}</svg>
      <div className="northeast-discovery-progress"><strong>{discovered.length} DE 9 ESTADOS DESCOBERTOS</strong><div>{northeastStates.map((state, index) => <span key={state.id} className={index < discovered.length ? "found" : ""} aria-hidden="true" />)}</div></div>
    </div> : isClimate ? <div className="northeast-climate-card">
      <div className="northeast-climate-landscape"><img src="/clima-sertao-paisagem-v1.png" alt="Paisagem ensolarada do Sertão com cactos e vegetação da Caatinga" /></div>
      <div className="climate-columns">
        <section aria-labelledby="temperature-title"><h2 id="temperature-title">TEMPERATURA</h2><div className="climate-answer-slot">{climateTemperature ? (climateTemperature === "quente" ? "QUENTE" : "FRIO") : "?"}</div><div className="climate-options"><button className={climateTemperature === "quente" ? "selected" : ""} disabled={!canAnswer} onClick={() => chooseClimate("temperature", "quente")}><img src="/clima-quente-v2.png" alt="" />QUENTE</button><button className={climateTemperature === "frio" ? "selected" : ""} disabled={!canAnswer} onClick={() => chooseClimate("temperature", "frio")}><img src="/clima-frio-v2.png" alt="" />FRIO</button></div></section>
        <section aria-labelledby="rain-title"><h2 id="rain-title">CHUVAS</h2><div className="climate-answer-slot">{climateRain ? (climateRain === "pouca" ? "POUCA CHUVA" : "MUITA CHUVA") : "?"}</div><div className="climate-options"><button className={climateRain === "pouca" ? "selected" : ""} disabled={!canAnswer} onClick={() => chooseClimate("rain", "pouca")}><img src="/clima-pouca-chuva-v2.png" alt="" />POUCA CHUVA</button><button className={climateRain === "muita" ? "selected" : ""} disabled={!canAnswer} onClick={() => chooseClimate("rain", "muita")}><img src="/clima-muita-chuva-v2.png" alt="" />MUITA CHUVA</button></div></section>
      </div>
    </div> : isAnimalSearch ? <><div className="northeast-animal-card">
      <div className={"animal-search-scene" + (animalHint ? " show-hint" : "")} style={{ "--lens-x": lensPosition.x + "%", "--lens-y": lensPosition.y + "%" } as CSSProperties} onPointerMove={moveLens}>
        <img className="animal-search-background" src="/busca-caatinga-cenario-v1.png" alt="Paisagem da Caatinga onde três animais estão escondidos" />
        <img className="hidden-animal animal-bird" src="/animal-asa-branca-busca-v1.png" alt="" />
        <img className="hidden-animal animal-iguana" src="/animal-iguana-busca-v1.png" alt="" />
        <img className="hidden-animal animal-armadillo" src="/animal-tatu-bola-busca-v2.png" alt="" />
        <img className="hidden-animal animal-prea" src="/animal-prea-busca-v1.png" alt="" />
        <img className="hidden-animal animal-carcara animal-carcara-far-left" src="/animal-carcara-voando-v2.png" alt="" />
        <img className="hidden-animal animal-carcara animal-carcara-left" src="/animal-carcara-voando-v2.png" alt="" />
        <img className="hidden-animal animal-carcara animal-carcara-right" src="/animal-carcara-voando-v2.png" alt="" />
        <button className="animal-hotspot hotspot-bird" disabled={!canAnswer} onClick={() => onAnswer(false)} aria-label="Verificar a asa-branca" />
        <button className="animal-hotspot hotspot-iguana" disabled={!canAnswer} onClick={() => onAnswer(false)} aria-label="Verificar a iguana" />
        <button className="animal-hotspot hotspot-armadillo" disabled={!canAnswer} onClick={() => onAnswer(true)} aria-label="Verificar o tatu-bola" />
        <button className="animal-hotspot hotspot-prea" disabled={!canAnswer} onClick={() => onAnswer(false)} aria-label="Verificar o preá" />
        <button className="animal-hotspot hotspot-carcara hotspot-carcara-far-left" disabled={!canAnswer} onClick={() => onAnswer(false)} aria-label="Verificar o carcará no canto esquerdo" />
        <button className="animal-hotspot hotspot-carcara hotspot-carcara-left" disabled={!canAnswer} onClick={() => onAnswer(false)} aria-label="Verificar o carcará à esquerda" />
        <button className="animal-hotspot hotspot-carcara hotspot-carcara-right" disabled={!canAnswer} onClick={() => onAnswer(false)} aria-label="Verificar o carcará à direita" />
        <div className="animal-dimmer" aria-hidden="true" />
        <div className="animal-lens" aria-hidden="true" />
      </div>
    </div>
      <div className="animal-controls">
        <button className="animal-hint" disabled={!canAnswer} onClick={showAnimalHint}>💡 PRECISO DE UMA DICA</button>
        <button className="north-listen animal-listen" onClick={() => onListen("Movimente a lupa pela paisagem e toque no tatu-bola quando encontrá-lo.")}>🔊 OUVIR INSTRUÇÕES</button>
      </div>
    </> : isLandscapeAlbum ? <div className="northeast-landscape-card">
      <div className="landscape-album" aria-label="Álbum de paisagens do Nordeste">{northeastLandscapes.map((landscape) => { const placed = placedLandscapes.includes(landscape.id); return <button key={landscape.id} className={placed ? "filled" : ""} disabled={!canAnswer || placed} onClick={() => placeLandscape(landscape.id)} aria-label={"Espaço " + landscape.name + (placed ? ", preenchido" : "")}>{placed ? <img src={landscape.image} alt={"Paisagem: " + landscape.name} /> : <span>?</span>}<strong>{landscape.name}</strong></button>; })}</div>
      <p className="landscape-album-instruction">{selectedLandscape ? "Agora toque no nome correto para colocar a paisagem." : "Primeiro escolha uma das paisagens abaixo."}</p>
      <div className="landscape-cards" aria-label="Paisagens embaralhadas para colocar no álbum">{[northeastLandscapes[2], northeastLandscapes[0], northeastLandscapes[3], northeastLandscapes[1]].map((landscape) => <button key={landscape.id} className={selectedLandscape === landscape.id ? "selected" : ""} disabled={!canAnswer || placedLandscapes.includes(landscape.id)} onClick={() => setSelectedLandscape(landscape.id)} aria-label={"Selecionar paisagem " + landscape.name}><img src={landscape.image} alt="" /><span>ESCOLHER</span></button>)}</div>
    </div> : isArraia ? <div className="northeast-arraia-card">
      <div className="arraia-scene"><img src="/arraia-quebra-cabeca-silhuetas-v3.png" alt="Festa nordestina com pessoas dançando na praça" />
        {arraiaItems.filter((item) => item.correct).map((item) => { const placed = arraiaChoices.includes(item.id); return <button key={item.id} className={"arraia-slot slot-" + item.id + (placed ? " placed" : "") + (arraiaOverSlot === item.id ? " drop-ready" : "")} data-arraia-slot={item.id} disabled={!canAnswer || placed} aria-label={(placed ? "Peça encaixada: " : "Silhueta para encaixar: ") + item.name}><img src={item.image} alt="" /></button>; })}
      </div>
      <div className="arraia-progress"><strong>{arraiaChoices.length} DE 4 ELEMENTOS ESCOLHIDOS</strong><div>{Array.from({ length: 4 }, (_, index) => <span key={index} className={index < arraiaChoices.length ? "ready" : ""}>★</span>)}</div></div>
      <div className="arraia-options" aria-label="Peças embaralhadas do quebra-cabeça">{[arraiaItems[4], arraiaItems[1], arraiaItems[5], arraiaItems[2], arraiaItems[3], arraiaItems[0]].map((item) => <button key={item.id} className={arraiaGhost?.id === item.id ? "dragging" : ""} disabled={!canAnswer || arraiaChoices.includes(item.id)} onClick={(event) => { if (arraiaSuppressClick.current && event.detail !== 0) arraiaSuppressClick.current = false; }} onPointerDown={(event) => beginArraiaDrag(item, event)} onPointerMove={moveArraiaDrag} onPointerUp={endArraiaDrag} onPointerCancel={cancelArraiaDrag} onLostPointerCapture={cancelArraiaDrag}><img src={item.optionImage ?? item.image} alt="" draggable={false} /><strong>{item.name}</strong></button>)}</div>
    </div> : <div className="northeast-options" role="group" aria-label={current.question}>{current.options?.map((option) => <button key={String(option)} disabled={!canAnswer} onClick={() => onAnswer(option === current.answer)}>{option}</button>)}</div>}
    {arraiaGhost && <div className="arraia-drag-ghost" style={{ left: arraiaGhost.x, top: arraiaGhost.y }} aria-hidden="true"><img src={arraiaItems.find((item) => item.id === arraiaGhost.id)?.optionImage ?? arraiaItems.find((item) => item.id === arraiaGhost.id)?.image} alt="" /></div>}
    {!isAnimalSearch && <button className="north-listen" onClick={() => onListen(isStateDiscovery ? "Toque em cada estado do mapa. Cada toque revela o nome de um estado. Vamos descobrir os nove estados do Nordeste!" : isClimate ? "Observe a paisagem do Sertão. Escolha uma opção de temperatura e uma opção de chuvas para completar o painel." : isAnimalSearch ? "Movimente a lupa pela paisagem e toque no tatu-bola quando encontrá-lo." : isLandscapeAlbum ? "Escolha uma paisagem e depois toque no espaço com o nome correspondente para completar o álbum." : isArraia ? "Arraste uma peça da parte de baixo até a silhueta escura com o mesmo formato. Complete as quatro partes da festa." : current.question)}>🔊 {isStateDiscovery || isClimate || isAnimalSearch || isLandscapeAlbum || isArraia ? "OUVIR INSTRUÇÕES" : "OUVIR PERGUNTA"}</button>}
    {feedback !== "idle" && <div className={`feedback ${feedback}`} role="dialog" aria-live="assertive">{feedback === "wrong" ? <><span>🧭</span><h2>Quase lá!</h2><p>Leia a pergunta novamente e observe a dica. Você consegue!</p><button onClick={retryChallenge}>TENTAR NOVAMENTE</button></> : <><span>{feedback === "finished" ? "🏆" : "⭐"}</span><h2>{feedback === "finished" ? "Região Nordeste concluída!" : "Muito bem!"}</h2><p>{current.correct}</p><button onClick={onNext}>{challenge < 6 ? "PRÓXIMO DESAFIO" : "VOLTAR À JORNADA"}</button></>}</div>}
  </section>;
}





















