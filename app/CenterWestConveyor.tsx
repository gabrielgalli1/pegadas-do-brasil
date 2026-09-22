"use client";

import { useEffect, useRef, useState } from "react";

type Props = { canAnswer: boolean; onComplete: () => void; onListen: (text: string) => void };
type Item = { id: string; label: string; correct: boolean; position?: string; image?: string; explanation: string };

const items: Item[] = [
  { id: "milho", label: "MILHO", correct: true, position: "0% 0%", explanation: "O milho é uma cultura agrícola importante no Centro-Oeste." },
  { id: "gado", label: "GADO", correct: true, position: "25% 0%", explanation: "A pecuária tem forte presença na economia do Centro-Oeste." },
  { id: "pantanal", label: "PANTANAL", correct: true, position: "50% 0%", explanation: "O Pantanal ocupa áreas de Mato Grosso e Mato Grosso do Sul." },
  { id: "cerrado", label: "CERRADO", correct: true, position: "75% 0%", explanation: "O Cerrado é o bioma predominante em grande parte da região." },
  { id: "brasilia", label: "BRASÍLIA", correct: true, position: "100% 0%", explanation: "Brasília, a capital do Brasil, fica no Distrito Federal." },
  { id: "pequi", label: "PEQUI", correct: true, position: "0% 100%", explanation: "O pequi é um fruto muito presente na culinária do Cerrado." },
  { id: "praia", label: "PRAIA", correct: false, position: "25% 100%", explanation: "O Centro-Oeste não possui litoral. A praia pertence a outras regiões." },
  { id: "caatinga", label: "CAATINGA", correct: false, position: "50% 100%", explanation: "A Caatinga é característica principalmente da Região Nordeste." },
  { id: "araucaria", label: "ARAUCÁRIA", correct: false, position: "75% 100%", explanation: "A araucária é característica principalmente da Região Sul." },
  { id: "neve", label: "NEVE", correct: false, position: "100% 100%", explanation: "A neve não é uma característica do clima do Centro-Oeste." },
  { id: "amazonia", label: "FLORESTA AMAZÔNICA", correct: false, image: "/paisagem-amazonia-v1.png", explanation: "A Floresta Amazônica é característica principalmente da Região Norte." },
  { id: "pinguim", label: "PINGUIM", correct: false, image: "/animal-pinguim-norte-v1.png", explanation: "O pinguim vive em regiões frias e não é um animal típico do Centro-Oeste." },
];
const correctItems = items.filter((item) => item.correct);
function shuffle(source: Item[]) {
  const result = [...source];
  for (let index = result.length - 1; index > 0; index -= 1) { const target = Math.floor(Math.random() * (index + 1)); [result[index], result[target]] = [result[target], result[index]]; }
  return result;
}

export default function CenterWestConveyor({ canAnswer, onComplete, onListen }: Props) {
  const [found, setFound] = useState<string[]>([]);
  const [deck, setDeck] = useState<Item[]>(items);
  const [paused, setPaused] = useState(false);
  const [message, setMessage] = useState("Toque nos elementos que pertencem ao Centro-Oeste.");
  const resumeTimer = useRef<number | null>(null);
  useEffect(() => {
    const shuffleTimer = window.setTimeout(() => setDeck(shuffle(items)), 0);
    return () => {
      window.clearTimeout(shuffleTimer);
      if (resumeTimer.current) window.clearTimeout(resumeTimer.current);
    };
  }, []);

  function choose(item: Item) {
    if (!canAnswer || found.includes(item.id)) return;
    if (!item.correct) {
      setPaused(true); setMessage(item.explanation); onListen(item.explanation);
      if (resumeTimer.current) window.clearTimeout(resumeTimer.current);
      resumeTimer.current = window.setTimeout(() => { setPaused(false); setMessage("Continue observando a esteira."); }, 2400);
      return;
    }
    const next = [...found, item.id];
    setFound(next); setMessage(`${item.label}: elemento encontrado!`); onListen(item.explanation);
    if (next.length === correctItems.length) window.setTimeout(onComplete, 500);
  }

  return <div className="centerwest-conveyor-board">
    <div className="conveyor-progress">
      <strong>{found.length} DE {correctItems.length} ELEMENTOS ENCONTRADOS</strong>
      <div className="conveyor-collection" aria-label={`${found.length} de ${correctItems.length} elementos encontrados`}>
        {correctItems.map((item) => <span key={item.id} className={found.includes(item.id) ? "filled" : ""}>{found.includes(item.id) ? <i style={{ backgroundPosition: item.position }} aria-label={item.label} /> : <b aria-hidden="true">?</b>}</span>)}
      </div>
    </div>
    <div className="conveyor-message" aria-live="polite">{message}</div>
    <div className="conveyor-window">
      <div className={`conveyor-track ${paused ? "paused" : ""}`}>
        {[...deck, ...deck].map((item, index) => {
          const collected = found.includes(item.id);
          return <button key={`${item.id}-${index}`} className={`conveyor-card ${collected ? "collected" : ""}`} onClick={() => choose(item)} disabled={!canAnswer || collected} aria-label={`${item.label}${collected ? ", já encontrado" : ""}`}>
            <span className="conveyor-art" style={item.image ? { backgroundImage: `url(${item.image})`, backgroundPosition: "center", backgroundSize: "cover" } : { backgroundPosition: item.position }} /><strong>{item.label}</strong>{collected && <span className="conveyor-check" aria-hidden="true">✓</span>}
          </button>;
        })}
      </div>
    </div>
    <div className="conveyor-belt" aria-hidden="true"><span /><span /><span /><span /><span /><span /><span /></div>
    <button className="conveyor-pause" onClick={() => setPaused((value) => !value)} aria-pressed={paused}>{paused ? "▶ CONTINUAR" : "Ⅱ PAUSAR"}</button>
  </div>;
}
