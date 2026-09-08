"use client";

import regionsMap from "./brasil-cinco-regioes.json";

type Feedback = "idle" | "correct" | "wrong" | "finished";
type Challenge = {
  title: string;
  question: string;
  tip: string;
  correct: string;
  options?: readonly (string | number)[];
  answer?: string | number;
};

type Props = {
  challenge: number;
  feedback: Feedback;
  sound: boolean;
  onAnswer: (correct: boolean) => void;
  onNext: () => void;
  onRetry: () => void;
  onBack: () => void;
  onToggleSound: () => void;
  onListen: (text: string) => void;
};

const regionNames: Record<string, string> = { norte: "Norte", nordeste: "Nordeste", "centro-oeste": "Centro-Oeste", sudeste: "Sudeste", sul: "Sul" };
const regionLabels: Record<string, [number, number]> = { norte: [215, 145], nordeste: [445, 225], "centro-oeste": [265, 305], sudeste: [395, 365], sul: [290, 440] };

const challenges: readonly Challenge[] = [
  { title: "ONDE FICA O NORDESTE?", question: "Toque na Região Nordeste no mapa do Brasil.", tip: "Observe o lado direito\ndo mapa do Brasil!", correct: "Você encontrou a Região Nordeste!" },
  { title: "QUANTOS ESTADOS?", question: "Quantos estados fazem parte da Região Nordeste?", tip: "Conte cada estado\ncom atenção!", options: [9, 7, 10, 8], answer: 9, correct: "A Região Nordeste possui 9 estados!" },
  { title: "MAIOR ESTADO DO NORDESTE", question: "Qual é o maior estado nordestino em extensão territorial?", tip: "Compare os nomes\ndos estados!", options: ["Ceará", "Maranhão", "Pernambuco", "Bahia"], answer: "Bahia", correct: "A Bahia é o maior estado da Região Nordeste!" },
  { title: "CAPITAL DA BAHIA", question: "Qual é a capital da Bahia?", tip: "Pense nas cidades\nque você conhece!", options: ["Fortaleza", "Natal", "Salvador", "Recife"], answer: "Salvador", correct: "Salvador é a capital da Bahia!" },
  { title: "BIOMA DO SERTÃO", question: "Qual bioma é típico das áreas mais secas do Nordeste?", tip: "É um bioma com plantas\nadaptadas à pouca chuva!", options: ["Amazônia", "Caatinga", "Pampa", "Pantanal"], answer: "Caatinga", correct: "A Caatinga é um bioma brasileiro muito presente no Nordeste!" },
  { title: "FESTA JUNINA", question: "Qual festa tradicional é muito celebrada no Nordeste no mês de junho?", tip: "Tem música, danças\ne bandeirinhas coloridas!", options: ["Festa Junina", "Carnaval de Veneza", "Oktoberfest", "Ano-Novo Chinês"], answer: "Festa Junina", correct: "As festas juninas são uma tradição muito querida no Nordeste!" },
] as const;

export default function NortheastLevel({ challenge, feedback, sound, onAnswer, onNext, onRetry, onBack, onToggleSound, onListen }: Props) {
  const current = challenges[challenge - 1];
  const isMap = challenge === 1;
  const canAnswer = feedback === "idle";

  return <section className={`screen north-challenge-screen northeast-challenge-screen ${isMap ? "" : "north-count-screen"}`} aria-label={`Desafio ${challenge} da Região Nordeste`}>
    <header className="north-challenge-header">
      <button className="north-round-control" onClick={onBack} aria-label="Voltar à jornada"><img src="/fases-voltar-v1.png" alt="" /></button>
      <div className="north-heading"><h1>{current.title}</h1><p>{current.question}</p></div>
      <div className="north-status"><b>DESAFIO {challenge} DE 6</b><div aria-label={`Desafio ${challenge} de 6`}>{Array.from({ length: 6 }, (_, index) => <span key={index} className={index < challenge ? "active" : ""}>★</span>)}</div></div>
      <button className={`north-round-control north-sound ${!sound ? "muted" : ""}`} onClick={onToggleSound} aria-label={sound ? "Desligar som" : "Ligar som"}><img src="/fases-som-v1.png" alt="" /></button>
    </header>
    <div className="north-guide"><div className="north-tip">{current.tip.split("\n").map((line, index) => <span key={line}>{line}{index === 0 && <br />}</span>)}</div></div>
    {isMap ? <><div className="north-map-card" role="group" aria-label="Mapa das regiões brasileiras">
      <svg className="north-map" viewBox={regionsMap.viewBox} preserveAspectRatio="xMidYMid meet" aria-label="Mapa do Brasil dividido em cinco regiões">
        {regionsMap.regions.map((region) => <g key={region.id} className="north-region" role="button" tabIndex={0} aria-label={`Região ${regionNames[region.id]}`} fill={region.color} onClick={() => onAnswer(region.id === "nordeste")} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onAnswer(region.id === "nordeste"); } }}>
          <title>{`Região ${regionNames[region.id]}`}</title>{region.paths.map((part) => <path key={part.id} d={part.d} />)}<text x={regionLabels[region.id][0]} y={regionLabels[region.id][1]}>{regionNames[region.id].toUpperCase()}</text>
        </g>)}
      </svg>
    </div><p className="north-map-instruction">Clique ou toque na Região Nordeste no mapa!</p></> : <div className="northeast-options" role="group" aria-label={current.question}>{current.options?.map((option) => <button key={String(option)} disabled={!canAnswer} onClick={() => onAnswer(option === current.answer)}>{option}</button>)}</div>}
    <button className="north-listen" onClick={() => onListen(current.question)}>🔊 OUVIR PERGUNTA</button>
    {feedback !== "idle" && <div className={`feedback ${feedback}`} role="dialog" aria-live="assertive">
      {feedback === "wrong" ? <><span>🧭</span><h2>Quase lá!</h2><p>Leia a pergunta novamente e observe a dica. Você consegue!</p><button onClick={onRetry}>TENTAR NOVAMENTE</button></> : <><span>{feedback === "finished" ? "🏆" : "⭐"}</span><h2>{feedback === "finished" ? "Região Nordeste concluída!" : "Muito bem!"}</h2><p>{current.correct}</p><button onClick={onNext}>{challenge < 6 ? "PRÓXIMO DESAFIO" : "VOLTAR À JORNADA"}</button></>}
    </div>}
  </section>;
}
