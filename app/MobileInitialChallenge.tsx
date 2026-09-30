"use client";

import type { ReactNode } from "react";

type Country = { id: string; label: string; image: string };
type Ocean = { id: string; label: string; icon: string };
type Landscape = { id: string; label: string; image: string };

type Props = {
  index: number;
  score: number;
  sound: boolean;
  countries: readonly Country[];
  continents: readonly string[];
  oceans: readonly Ocean[];
  stateCounts: readonly number[];
  landscapes: readonly Landscape[];
  stateMap: ReactNode;
  onBack: () => void;
  onToggleSound: () => void;
  onCountry: (id: string) => void;
  onContinent: (continent: string) => void;
  onOcean: (id: string) => void;
  onStateCount: (count: number) => void;
  onLandscape: (id: string) => void;
  onListen: (text: string) => void;
};

const prompts = [
  { title: "RECONHEÇA O BRASIL", question: "Qual dessas silhuetas representa o Brasil?", tip: "Observe bem o formato de cada país!", spoken: "Qual dessas silhuetas representa o Brasil?" },
  { title: "ONDE FICA O BRASIL?", question: "Em qual continente o Brasil está localizado?", tip: "Observe as cores no mapa-múndi!", spoken: "Em qual continente o Brasil está localizado?" },
  { title: "QUAL OCEANO?", question: "Qual oceano banha o litoral do Brasil?", tip: "Observe o litoral do Brasil!", spoken: "Qual oceano banha o litoral do Brasil?" },
  { title: "QUANTOS ESTADOS?", question: "Quantas unidades federativas o Brasil possui?", tip: "Conte os estados e o Distrito Federal!", spoken: "Observe o mapa. Quantas unidades federativas o Brasil possui? Conte os 26 estados e o Distrito Federal." },
  { title: "PAISAGEM DO BRASIL", question: "Qual destas paisagens está presente no Brasil?", tip: "Observe a vegetação e o clima!", spoken: "Qual destas paisagens está presente no Brasil?" },
] as const;

export default function MobileInitialChallenge({
  index, score, sound, countries, continents, oceans, stateCounts, landscapes, stateMap,
  onBack, onToggleSound, onCountry, onContinent, onOcean, onStateCount, onLandscape, onListen,
}: Props) {
  const prompt = prompts[index] ?? prompts[0];
  return <div className={`mobile-initial-challenge mobile-initial-step-${index + 1}`} aria-label={`Desafio ${index + 1} da fase inicial`}>
    <header className="mobile-initial-header">
      <button className="mobile-initial-control" onClick={onBack} aria-label="Voltar à jornada"><img src="/fases-voltar-v1.png" alt="" /></button>
      <h1 className="mobile-initial-header-title">{prompt.title}</h1>
      <div className="mobile-initial-status"><b>DESAFIO {index + 1} DE 5</b><div aria-label={`${index + 1} de 5 desafios`}>{Array.from({ length: 5 }, (_, star) => <span key={star} className={star <= index ? "active" : ""}>★</span>)}</div><small>⭐ {score} PONTOS</small></div>
      <button className="mobile-initial-control" onClick={onToggleSound} aria-label={sound ? "Desligar som" : "Ligar som"} aria-pressed={sound}><img src="/fases-som-v1.png" alt="" /></button>
    </header>
    <div className="mobile-initial-body">
      <aside className="mobile-initial-intro">
        <h1>{prompt.title}</h1>
        <p className="mobile-initial-question">{prompt.question}</p>
        <div className="mobile-initial-guide"><img src="/arara-mascote-v1.png" alt="Arara Ari" /><p>{prompt.tip}</p></div>
        <button className="mobile-initial-listen" onClick={() => onListen(prompt.spoken)}>🔊 OUVIR PERGUNTA</button>
      </aside>
      <div className="mobile-initial-work">
        {index === 0 && <div className="mobile-initial-choices mobile-initial-silhouettes" role="group" aria-label="Escolha a silhueta do Brasil">
          {countries.map((country) => <button key={country.id} className="mobile-initial-silhouette" onClick={() => onCountry(country.id)} aria-label={`Opção ${country.label}`}><span>{country.label}</span><img src={country.image} alt="" /></button>)}
        </div>}
        {index === 1 && <div className="mobile-initial-map-layout">
          <div className="mobile-initial-map"><img src="/mapa-mundi-continentes-v3.png" alt="Mapa-múndi com os continentes em cores diferentes" /></div>
          <div className="mobile-initial-answers" role="group" aria-label="Escolha o continente do Brasil">{continents.map((continent, option) => <button key={continent} className={`mobile-initial-answer answer-${option + 1}`} onClick={() => onContinent(continent)}>{continent}</button>)}</div>
        </div>}
        {index === 2 && <div className="mobile-initial-map-layout">
          <div className="mobile-initial-map"><img src="/mapa-brasil-oceano-atlantico-v1.png" alt="Mapa do Brasil ao lado do Oceano Atlântico" /></div>
          <div className="mobile-initial-answers" role="group" aria-label="Escolha o oceano que banha o Brasil">{oceans.map((ocean, option) => <button key={ocean.id} className={`mobile-initial-answer answer-${option + 1}`} onClick={() => onOcean(ocean.id)}><img src={ocean.icon} alt="" /><span>{ocean.label}</span></button>)}</div>
        </div>}
        {index === 3 && <div className="mobile-initial-map-layout">
          <div className="mobile-initial-map mobile-initial-state-map">{stateMap}</div>
          <div className="mobile-initial-answers" role="group" aria-label="Escolha o número de unidades federativas">{stateCounts.map((count, option) => <button key={count} className={`mobile-initial-answer mobile-initial-number answer-${option + 1}`} onClick={() => onStateCount(count)}>{count}</button>)}</div>
        </div>}
        {index === 4 && <div className="mobile-initial-choices mobile-initial-landscapes" role="group" aria-label="Escolha a paisagem presente no Brasil">{landscapes.map((landscape) => <button key={landscape.id} className="mobile-initial-landscape" onClick={() => onLandscape(landscape.id)}><img src={landscape.image} alt="" /><strong>{landscape.label}</strong></button>)}</div>}
      </div>
    </div>
  </div>;
}
