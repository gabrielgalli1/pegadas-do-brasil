"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";

type StateId = "mg" | "es" | "rj" | "sp";
type Props = { canPlay: boolean; onWrong: (hint: string) => void; onComplete: () => void; onListen: (text: string) => void };
type DragPreview = { state: StateId; label: string; image: string; x: number; y: number; offsetX: number; offsetY: number; width: number };
type DragStart = { state: StateId; label: string; image: string; pointerId: number; x: number; y: number; offsetX: number; offsetY: number; width: number; moved: boolean };

const attractions: { state: StateId; label: string; image: string }[] = [
  { state: "mg", label: "Ouro Preto", image: "/sudeste-turismo-ouro-preto-v2.webp" },
  { state: "es", label: "Convento da Penha", image: "/sudeste-turismo-penha-v2.webp" },
  { state: "rj", label: "Cristo Redentor", image: "/sudeste-turismo-cristo-v2.webp" },
  { state: "sp", label: "MASP", image: "/sudeste-turismo-masp-v2.webp" },
];

function shuffledAttractions(previousOrder = "") {
  const albumOrder = "mg-es-rj-sp";
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const shuffled = [...attractions];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const random = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[random]] = [shuffled[random], shuffled[index]];
    }
    const order = shuffled.map((item) => item.state).join("-");
    if (order !== albumOrder && order !== previousOrder) return shuffled;
  }
  return [attractions[2], attractions[0], attractions[3], attractions[1]];
}
const states: { id: StateId; name: string; color: string }[] = [
  { id: "mg", name: "Minas Gerais", color: "#c77645" },
  { id: "es", name: "Espírito Santo", color: "#38a0ad" },
  { id: "rj", name: "Rio de Janeiro", color: "#4c9c68" },
  { id: "sp", name: "São Paulo", color: "#8d63ae" },
];

export default function SoutheastPassport({ canPlay, onWrong, onComplete, onListen }: Props) {
  const [cards, setCards] = useState(() => [...attractions].reverse());
  const [selected, setSelected] = useState<StateId | null>(null);
  const [placed, setPlaced] = useState<StateId[]>([]);
  const [message, setMessage] = useState("Arraste um cartão até o estado ou toque para selecionar.");
  const [dragPreview, setDragPreview] = useState<DragPreview | null>(null);
  const dragStart = useRef<DragStart | null>(null);
  const suppressClick = useRef(false);
  const completeTimer = useRef<number | null>(null);
  useEffect(() => {
    const shuffleTimer = window.setTimeout(() => {
      let previousOrder = "";
      try { previousOrder = window.sessionStorage.getItem("southeast-passport-card-order") ?? ""; } catch { /* armazenamento pode estar indisponível */ }
      const shuffled = shuffledAttractions(previousOrder);
      const order = shuffled.map((item) => item.state).join("-");
      try { window.sessionStorage.setItem("southeast-passport-card-order", order); } catch { /* segue sem persistência */ }
      setCards(shuffled);
    }, 0);
    return () => {
      window.clearTimeout(shuffleTimer);
      if (completeTimer.current !== null) window.clearTimeout(completeTimer.current);
    };
  }, []);

  function selectAttraction(state: StateId, label: string) {
    if (!canPlay || placed.includes(state) || suppressClick.current) return;
    setSelected(state);
    setMessage(`${label} selecionado. Agora escolha o estado no passaporte.`);
  }

  function stamp(target: StateId, source: StateId | null = selected) {
    if (!canPlay) return;
    if (!source) {
      setMessage("Primeiro escolha um dos cartões turísticos.");
      return;
    }
    if (source !== target) {
      const attraction = attractions.find((item) => item.state === source);
      const correctState = states.find((state) => state.id === source);
      setMessage("Esse ponto turístico pertence a outro estado. Observe a imagem e tente novamente!");
      onWrong(`${attraction?.label ?? "Esse ponto turístico"} pertence a ${correctState?.name ?? "outro estado"}. Leve o cartão ao estado indicado no passaporte.`);
      return;
    }
    const attraction = attractions.find((item) => item.state === source);
    const next = placed.includes(target) ? placed : [...placed, target];
    setPlaced(next);
    setSelected(null);
    setMessage(`Carimbo conquistado: ${attraction?.label ?? "ponto turístico"}!`);
    const spokenLabel = attraction?.label === "MASP" ? "Masp" : attraction?.label ?? "Ponto turístico";
    const article = spokenLabel === "Ouro Preto" ? "" : "O ";
    onListen(`${article}${spokenLabel} pertence a ${states.find((item) => item.id === state)?.name}. Carimbo conquistado!`);
    if (next.length === attractions.length) completeTimer.current = window.setTimeout(onComplete, 650);
  }

  function beginDrag(event: ReactPointerEvent<HTMLButtonElement>, state: StateId, label: string, image: string) {
    if (!canPlay || placed.includes(state)) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    dragStart.current = { state, label, image, pointerId: event.pointerId, x: event.clientX, y: event.clientY, offsetX: event.clientX - bounds.left, offsetY: event.clientY - bounds.top, width: bounds.width, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    const start = dragStart.current;
    if (!start || start.pointerId !== event.pointerId) return;
    const moved = start.moved || Math.hypot(event.clientX - start.x, event.clientY - start.y) > 7;
    if (!moved) return;
    event.preventDefault();
    start.moved = true;
    setSelected(start.state);
    setDragPreview({ state: start.state, label: start.label, image: start.image, x: event.clientX, y: event.clientY, offsetX: start.offsetX, offsetY: start.offsetY, width: start.width });
    setMessage(`Leve ${start.label} até o estado correspondente.`);
  }

  function finishDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    const start = dragStart.current;
    if (!start || start.pointerId !== event.pointerId) return;
    dragStart.current = null;
    setDragPreview(null);
    if (!start.moved) return;
    suppressClick.current = true;
    window.setTimeout(() => { suppressClick.current = false; }, 0);
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>("[data-passport-target]");
    const targetState = target?.dataset.passportTarget as StateId | undefined;
    if (targetState) stamp(targetState, start.state);
    else setMessage("Quase! Solte o cartão dentro de um estado do passaporte.");
  }

  return <div className="southeast-passport-game">
    <div className="southeast-passport-toolbar">
      <div className="southeast-passport-count"><span aria-hidden="true">🛂</span><strong>{placed.length} DE {attractions.length}</strong><small>CARIMBOS CONQUISTADOS</small></div>
      <p role="status">{message}</p>
    </div>
    <div className="southeast-passport-layout">
      <section className="southeast-passport-book" aria-label="Passaporte com os quatro estados do Sudeste">
        <div className="southeast-passport-page">
          <header><span aria-hidden="true">✦</span><div><small>PASSAPORTE</small><strong>REGIÃO SUDESTE</strong></div><span aria-hidden="true">✦</span></header>
          <div className="southeast-passport-stamps">
            {states.map((state) => {
              const done = placed.includes(state.id);
              const attraction = attractions.find((item) => item.state === state.id);
              return <button key={state.id} type="button" data-passport-target={state.id} className={`southeast-passport-stamp state-${state.id} ${done ? "placed" : ""} ${selected ? "ready" : ""}`} style={{ "--stamp-color": state.color } as CSSProperties} disabled={!canPlay || done} onClick={() => stamp(state.id)} aria-label={done ? `${state.name}, carimbado com ${attraction?.label}` : `Carimbar ${state.name}`}>
                {done && attraction && <img className="southeast-passport-memory" src={attraction.image} alt="" />}
                <span className="southeast-passport-seal" aria-hidden="true">{done ? "✓" : state.id.toUpperCase()}</span>
                <strong>{state.name}</strong>
                <small>{done ? attraction?.label : selected ? "SOLTE OU TOQUE AQUI" : "AGUARDANDO"}</small>
              </button>;
            })}
          </div>
          <footer>CONHECENDO O BRASIL • UMA VIAGEM DE DESCOBERTAS</footer>
        </div>
      </section>
      <section className="southeast-tourist-gallery" aria-label="Cartões de pontos turísticos">
        <h2><span aria-hidden="true">🖐️</span> ARRASTE OU TOQUE EM UM CARTÃO</h2>
        <div>
          {cards.map((attraction) => {
            const done = placed.includes(attraction.state);
            const active = selected === attraction.state;
            return <button key={attraction.state} type="button" className={`${active ? "selected" : ""} ${done ? "placed" : ""}`} disabled={!canPlay || done} onClick={() => selectAttraction(attraction.state, attraction.label)} onPointerDown={(event) => beginDrag(event, attraction.state, attraction.label, attraction.image)} onPointerMove={moveDrag} onPointerUp={finishDrag} onPointerCancel={() => { dragStart.current = null; setDragPreview(null); }} aria-pressed={active} aria-label={`${attraction.label}${done ? ", já carimbado" : ". Arraste até o estado ou toque para selecionar"}`}>
              <img src={attraction.image} alt="" draggable={false} />
              <span><strong>{attraction.label}</strong><small>{done ? "✓ NO PASSAPORTE" : active ? "SELECIONADO" : "ARRASTE OU TOQUE"}</small></span>
            </button>;
          })}
        </div>
      </section>
    </div>
    {dragPreview && <div className="southeast-drag-preview" style={{ left: dragPreview.x - dragPreview.offsetX, top: dragPreview.y - dragPreview.offsetY, width: dragPreview.width }} aria-hidden="true"><img src={dragPreview.image} alt="" /><strong>{dragPreview.label}</strong></div>}
  </div>;
}