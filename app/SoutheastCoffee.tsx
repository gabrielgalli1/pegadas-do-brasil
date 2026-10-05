"use client";

import { useEffect, useRef, useState } from "react";

type Props = { canPlay: boolean; onComplete: () => void };
const steps = ["PLANTAR", "CUIDAR", "COLHER", "PREPARAR"];
const icons = ["🌱", "💧", "🔴", "☕"];

export default function SoutheastCoffee({ canPlay, onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [seedling, setSeedling] = useState(false);
  const [water, setWater] = useState(0);
  const [picked, setPicked] = useState<number[]>([]);
  const [brew, setBrew] = useState(0);
  const [moving, setMoving] = useState(false);
  const [message, setMessage] = useState("Escolha a muda e depois toque na terra para plantar.");
  const timers = useRef<number[]>([]);
  useEffect(() => () => { timers.current.forEach(window.clearTimeout); }, []);
  function advance(next: number) {
    setMoving(true);
    timers.current.push(window.setTimeout(() => { setStep(next); setMoving(false); }, 520));
  }
  function plant() {
    if (!canPlay || moving) return;
    if (!seedling) { setMessage("Primeiro escolha a muda no botão abaixo."); return; }
    setMessage("Muda plantada! Agora vamos cuidar dela.");
    advance(1);
  }
  function waterPlant() {
    if (!canPlay || moving) return;
    const next = water + 1; setWater(next);
    if (next === 3) { setMessage("O cafeeiro cresceu e seus frutos amadureceram!"); advance(2); }
    else setMessage(`Muito bem! Regue mais ${3 - next} ${3 - next === 1 ? "vez" : "vezes"}.`);
  }
  function pickFruit(index: number) {
    if (!canPlay || moving || picked.includes(index)) return;
    const next = [...picked, index]; setPicked(next);
    if (next.length === 3) { setMessage("Frutos colhidos! Vamos preparar o café."); advance(3); }
    else setMessage(`Você colheu ${next.length} de 3 frutos. Continue!`);
  }
  function brewCoffee() {
    if (!canPlay || moving) return;
    const next = brew + 1; setBrew(next);
    if (next === 3) {
      setMessage("Café pronto! Você completou a jornada do café.");
      setMoving(true);
      timers.current.push(window.setTimeout(onComplete, 750));
    } else setMessage(`A xícara está enchendo! Faltam ${3 - next} ${3 - next === 1 ? "toque" : "toques"}.`);
  }
  return <div className="southeast-coffee-game" aria-label="Jornada interativa do café">
    <div className="southeast-coffee-steps" aria-label={`Etapa ${step + 1} de 4: ${steps[step]}`}>{steps.map((label, index) => <div key={label} className={index < step ? "done" : index === step ? "current" : ""}><span aria-hidden="true">{index < step ? "✓" : icons[index]}</span><strong>{label}</strong></div>)}</div>
    <div className={`southeast-coffee-scene ${moving ? "moving" : ""}`}>
      {step < 3 ? <><svg className="southeast-coffee-plant" viewBox="0 0 500 260" aria-hidden="true"><ellipse cx="250" cy="226" rx="137" ry="24" fill="#744420"/><ellipse cx="250" cy="219" rx="126" ry="17" fill="#a96a32"/>{step > 0 && <g transform={`translate(250 220) scale(${step === 1 ? .55 + water * .14 : 1}) translate(-250 -220)`}><path d="M250 218C251 185 248 150 250 83" fill="none" stroke="#3c8036" strokeWidth="9" strokeLinecap="round"/><path d="M249 166C210 136 186 130 160 134M251 154C290 122 313 117 338 126M248 123C225 96 211 82 188 81M253 113C276 89 290 75 314 72" fill="none" stroke="#3c8036" strokeWidth="6" strokeLinecap="round"/><path d="M203 139C181 107 155 111 148 130C164 151 181 150 203 139ZM293 128C318 98 344 101 352 122C333 142 316 142 293 128ZM221 100C196 74 175 76 169 93C184 108 200 111 221 100ZM281 99C304 72 327 75 334 94C318 109 301 111 281 99Z" fill="#59aa51" stroke="#2d7934" strokeWidth="3"/><path d="M250 83C230 63 212 61 205 76C217 93 235 95 250 83ZM250 83C268 60 289 60 298 76C284 94 264 95 250 83Z" fill="#75c36b" stroke="#2d7934" strokeWidth="3"/></g>}</svg>
        {step === 0 && <button className="southeast-soil-target" onClick={plant} disabled={!canPlay || moving} aria-label="Plantar a muda na terra">⬇ PLANTAR AQUI</button>}
        {step === 2 && <div className="southeast-coffee-berries" role="group" aria-label="Colha os três frutos vermelhos">{[0,1,2].map(index => <button key={index} className={`berry berry-${index} ${picked.includes(index) ? "picked" : ""}`} onClick={() => pickFruit(index)} disabled={!canPlay || moving || picked.includes(index)} aria-label={`Colher fruto ${index + 1}`}>{picked.includes(index) ? "✓" : "●"}</button>)}</div>}
      </> : <svg className="southeast-coffee-cup" viewBox="0 0 500 260" aria-hidden="true"><path d="M177 76H338L325 208Q253 238 190 208Z" fill="#fffaf0" stroke="#4d8d90" strokeWidth="9"/><path d="M193 203H319L326 139H185Z" fill="#7b4523" opacity={brew / 3}/><path d="M339 99Q397 98 386 145Q376 178 330 169" fill="none" stroke="#4d8d90" strokeWidth="12"/><path d="M165 224H361" stroke="#a37243" strokeWidth="13" strokeLinecap="round"/>{brew > 0 && <path d="M223 52Q208 31 227 15M268 49Q251 28 270 12M310 49Q294 26 313 11" fill="none" stroke="#d8e8d4" strokeWidth="8" strokeLinecap="round"/>}<path d="M169 83H341" stroke="#4d8d90" strokeWidth="9" strokeLinecap="round"/></svg>}
    </div>
    <div className="southeast-coffee-actions"><p role="status">{message}</p>{step === 0 ? <button className={seedling ? "selected" : ""} onClick={() => { setSeedling(true); setMessage("Muda escolhida! Toque na terra para plantar."); }} disabled={!canPlay || moving} aria-pressed={seedling}>🌱 {seedling ? "MUDA ESCOLHIDA" : "ESCOLHER MUDA"}</button> : step === 1 ? <button onClick={waterPlant} disabled={!canPlay || moving}>💧 REGAR O CAFEEIRO · {water}/3</button> : step === 2 ? <strong className="southeast-coffee-action-hint">TOQUE NOS FRUTOS VERMELHOS · {picked.length}/3</strong> : <button onClick={brewCoffee} disabled={!canPlay || moving}>☕ PREPARAR CAFÉ · {brew}/3</button>}</div>
  </div>;
}
