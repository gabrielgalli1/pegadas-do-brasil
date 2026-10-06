"use client";

import { useEffect, useRef, useState } from "react";
import regionsMap from "./brasil-cinco-regioes.json";
import ScoreBadge from "./ScoreBadge";
import SoutheastCoffee from "./SoutheastCoffee";
import SoutheastWordSearch from "./SoutheastWordSearch";
import SoutheastPassport from "./SoutheastPassport";
import SoutheastRiverCleanup from "./SoutheastRiverCleanup";

type Feedback = "idle" | "correct" | "wrong" | "finished";
type Props = { challenge: number; score: number; mistakes: number; feedback: Feedback; sound: boolean; onAnswer: (correct: boolean) => void; onNext: () => void; onRetry: () => void; onBack: () => void; onToggleSound: () => void; onListen: (text: string) => void };
type State = "mg" | "es" | "rj" | "sp";
const states: { id: State; name: string; capital: string; path: string; color: string }[] = [
  { id: "mg", name: "Minas Gerais", capital: "Belo Horizonte", path: "path5192", color: "#e9ae41" },
  { id: "es", name: "Espírito Santo", capital: "Vitória", path: "path5172", color: "#9a78c9" },
  { id: "rj", name: "Rio de Janeiro", capital: "Rio de Janeiro", path: "path5200", color: "#35a5d8" },
  { id: "sp", name: "São Paulo", capital: "São Paulo", path: "path5270", color: "#63b969" },
];
const shuffleStates = () => {
  const choices = [...states];
  for (let index = choices.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [choices[index], choices[swapIndex]] = [choices[swapIndex], choices[index]];
  }
  return choices;
};
const regionNames: Record<string, string> = { norte: "Norte", nordeste: "Nordeste", "centro-oeste": "Centro-Oeste", sudeste: "Sudeste", sul: "Sul" };
const regionLabels: Record<string, [number, number]> = { norte: [216, 170], nordeste: [458, 232], "centro-oeste": [286, 312], sudeste: [397, 374], sul: [314, 452] };
const titles = ["", "ONDE FICA O SUDESTE?", "DETETIVE DOS ESTADOS", "DO PÉ AO CAFÉ", "PALAVRAS DA VIAGEM", "PASSAPORTE DO SUDESTE", "GUARDIÕES DO RIO TIETÊ"];
const speeches = ["", "Bem-vindo, explorador! Encontre a Região Sudeste no mapa.", "Descubra cada estado pela capital indicada.", "Vamos cultivar café! Escolha a muda, plante, regue, colha os frutos e prepare uma xícara.", "Encontre as sete palavras escondidas na grade.", "Leve cada cartão turístico ao seu estado.", "Nossa missão: recolher os resíduos antes que a corrente os leve!"];
export default function SoutheastLevel({ challenge, score, mistakes, feedback, sound, onAnswer, onNext, onRetry, onBack, onToggleSound, onListen }: Props) {
  const [clue, setClue] = useState(0);
  const [solvedState, setSolvedState] = useState<State | null>(null);
  const [stateChoices, setStateChoices] = useState(states);
  const previousChallenge = useRef<number | null>(null);
  const [changingClue, setChangingClue] = useState(false);
  const clueTimers = useRef<number[]>([]);
  useEffect(() => () => { clueTimers.current.forEach(window.clearTimeout); }, []);
  useEffect(() => {
    if (challenge === 2 && previousChallenge.current !== 2) setStateChoices(shuffleStates());
    previousChallenge.current = challenge;
  }, [challenge]);
  const canPlay = feedback === "idle" && (challenge !== 2 || solvedState === null);
  const currentState = states[clue];
  const chooseRegion = (id: string) => { if (canPlay) onAnswer(id === "sudeste"); };
  const chooseState = (id: State) => {
    if (!canPlay) return;
    if (id !== currentState.id) { onAnswer(false); return; }
    setSolvedState(id);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const checkDelay = reducedMotion ? 250 : 650;
    const nextDelay = reducedMotion ? 500 : 1050;
    clueTimers.current.push(window.setTimeout(() => setChangingClue(true), checkDelay));
    clueTimers.current.push(window.setTimeout(() => {
      if (clue === states.length - 1) onAnswer(true);
      else { setClue(clue + 1); setSolvedState(null); setChangingClue(false); }
    }, nextDelay));
  };
  return <section className={`screen southeast-screen ${challenge <= 6 ? "southeast-location-screen" : ""} ${challenge === 2 ? "southeast-detective-screen" : ""} ${challenge === 3 ? "southeast-coffee-screen" : ""} ${challenge === 4 ? "southeast-word-screen" : ""} ${challenge === 5 ? "southeast-passport-screen" : ""} ${challenge === 6 ? "southeast-river-screen" : ""}`} aria-label={`Desafio ${challenge} da Região Sudeste`}>
    <header className="southeast-header">
      <button className="southeast-round" onClick={onBack} aria-label="Voltar à jornada"><img src="/fases-voltar-v1.png" alt="" /></button>
      <div className="southeast-title"><h1>{titles[challenge]}</h1><p>{challenge === 1 ? "Toque na Região Sudeste no mapa do Brasil." : challenge === 2 ? "Descubra o estado pela pista da capital." : challenge === 3 ? "Cultive, colha e prepare o café." : challenge === 4 ? "Encontre palavras na horizontal e na vertical." : challenge === 5 ? "Colecione os carimbos dos pontos turísticos." : "Recolha os resíduos antes que a corrente os leve."}</p></div>
      <div className="southeast-status"><b>DESAFIO {challenge} DE 6</b><div aria-hidden="true">{Array.from({ length: 6 }, (_, i) => <span key={i} className={i < challenge ? "active" : ""}>★</span>)}</div><ScoreBadge score={score} compact /></div>
      <button className={`southeast-round southeast-sound ${!sound ? "muted" : ""}`} onClick={onToggleSound} aria-label={sound ? "Desligar narração" : "Ligar narração"}><img src="/fases-som-v1.png" alt="" /></button>
    </header>
    <div className="southeast-speech">{speeches[challenge]}</div>
    <button className="southeast-listen" onClick={() => onListen(speeches[challenge])}>{challenge <= 2 ? "🔊 OUVIR PERGUNTA" : "🔊 OUVIR INSTRUÇÕES"}</button>
    <div className={`southeast-board southeast-board-${challenge}`}>
      {challenge === 1 && <svg className="southeast-brazil-map" viewBox="0 10 560 510" role="group" aria-label="Mapa interativo das cinco regiões do Brasil">{regionsMap.regions.map(region => <g key={region.id} role="button" tabIndex={canPlay ? 0 : -1} aria-label={`Região ${regionNames[region.id]}`} aria-disabled={!canPlay} onClick={() => chooseRegion(region.id)} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); chooseRegion(region.id); } }}>{region.paths.map(path => <path key={path.id} d={path.d} fill={region.color} />)}<text x={regionLabels[region.id][0]} y={regionLabels[region.id][1]}>{regionNames[region.id].toUpperCase()}</text></g>)}</svg>}
      {challenge === 2 && <><div key={clue} className={`southeast-detective-clue ${changingClue ? "leaving" : ""}`} aria-live="polite"><span aria-hidden="true">🔎</span><div><small>PISTA {clue + 1} DE 4</small><strong>Minha capital é {currentState.capital}. Qual é o estado?</strong></div></div><div className="southeast-detective-map-frame"><img className="southeast-static-map" src="/sudeste-estados-ilustrado-v1.svg" alt="Mapa da Região Sudeste com Minas Gerais em amarelo, Espírito Santo em roxo, Rio de Janeiro em azul e São Paulo em verde." /><span>Escolha uma das quatro alternativas abaixo</span></div><div className="southeast-state-choices" role="group" aria-label="Escolha o estado da capital indicada">{stateChoices.map(state => <button key={state.id} className={`${solvedState === state.id ? "solved " : ""}state-${state.id}`} disabled={!canPlay} onClick={() => chooseState(state.id)} aria-label={solvedState === state.id ? `${state.name}, correto` : state.name}><span aria-hidden="true">{state.id.toUpperCase()}</span><strong>{state.name}</strong></button>)}</div><span className="southeast-sr-only" role="status">{solvedState ? `Correto! ${states[clue].name}.` : ""}</span></>}
      {challenge === 3 && <SoutheastCoffee canPlay={canPlay} onComplete={() => onAnswer(true)} />}
      {challenge === 4 && <SoutheastWordSearch canPlay={canPlay} onComplete={() => onAnswer(true)} />}
      {challenge === 5 && <SoutheastPassport canPlay={canPlay} onWrong={() => onAnswer(false)} onComplete={() => onAnswer(true)} />}
      {challenge === 6 && <SoutheastRiverCleanup canPlay={canPlay} onComplete={() => onAnswer(true)} />}
    </div>
    {challenge === 1 && <p className="southeast-location-instruction">Clique ou toque na Região Sudeste no mapa!</p>}
    {feedback !== "idle" && <div className={`feedback ${feedback} southeast-feedback`} role="dialog" aria-modal="true" aria-live="assertive"><span aria-hidden="true">{feedback === "wrong" ? "🧭" : feedback === "finished" ? "🏆" : "⭐"}</span><h2>{feedback === "wrong" ? mistakes >= 2 ? "Vamos recomeçar!" : "Quase lá!" : feedback === "finished" ? "Sudeste concluído!" : "Muito bem!"}</h2><p>{feedback === "wrong" ? mistakes >= 2 ? "Vamos tentar a região novamente." : "Observe a pista e tente outra vez." : challenge === 1 ? "Você encontrou o Sudeste!" : challenge === 2 ? "Você reconheceu os quatro estados da região!" : challenge === 3 ? "Você completou a jornada do café! O Sudeste é a principal região produtora de café do Brasil." : challenge === 4 ? "Todas as palavras foram encontradas!" : challenge === 5 ? "Seu passaporte recebeu os quatro carimbos!" : "Você concluiu o mutirão! A recuperação do Tietê depende de cuidado contínuo e tratamento de esgoto."}</p><button onClick={feedback === "wrong" ? onRetry : onNext}>{feedback === "wrong" ? mistakes >= 2 ? "RECOMEÇAR REGIÃO" : "TENTAR NOVAMENTE" : feedback === "finished" ? "VOLTAR À JORNADA" : "PRÓXIMO DESAFIO"}</button></div>}
  </section>;
}
