"use client";

import { useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";

type AnimalId = "tuiuiu" | "capivara" | "jacare";
type Props = { canAnswer: boolean; onMistake: () => void; onComplete: () => void; onListen: (text: string) => void };
type Mission = { id: AnimalId; name: string; x: number; y: number; crop: string; cropSize: string; fact: string };

const missions: Mission[] = [
  { id: "tuiuiu", name: "TUIUIÚ", x: 52, y: 47, crop: "50% 48%", cropSize: "160% auto", fact: "O tuiuiú é uma das aves mais conhecidas e um símbolo do Pantanal." },
  { id: "capivara", name: "CAPIVARA", x: 20, y: 62, crop: "0% 67%", cropSize: "190% auto", fact: "A capivara vive próxima aos rios e é uma excelente nadadora." },
  { id: "jacare", name: "JACARÉ", x: 82, y: 68, crop: "91% 70%", cropSize: "350% auto", fact: "O jacaré ajuda a manter o equilíbrio da vida no Pantanal." },
];

export default function CenterWestPhotographer({ canAnswer, onMistake, onComplete, onListen }: Props) {
  const [missionIndex, setMissionIndex] = useState(0);
  const [photos, setPhotos] = useState<AnimalId[]>([]);
  const [frame, setFrame] = useState({ x: 50, y: 50 });
  const [message, setMessage] = useState("Mova a câmera e enquadre o animal da missão.");
  const current = missions[missionIndex] ?? missions[missions.length - 1];

  function updateFrame(event: ReactPointerEvent<HTMLDivElement>) {
    if (!canAnswer) return;
    const box = event.currentTarget.getBoundingClientRect();
    const x = Math.max(10, Math.min(90, ((event.clientX - box.left) / box.width) * 100));
    const y = Math.max(14, Math.min(86, ((event.clientY - box.top) / box.height) * 100));
    setFrame({ x, y });
  }
  function handleKeys(event: KeyboardEvent<HTMLDivElement>) {
    const movement: Record<string, [number, number]> = { ArrowLeft: [-3, 0], ArrowRight: [3, 0], ArrowUp: [0, -3], ArrowDown: [0, 3] };
    const delta = movement[event.key];
    if (!delta) return;
    event.preventDefault();
    setFrame((value) => ({ x: Math.max(10, Math.min(90, value.x + delta[0])), y: Math.max(14, Math.min(86, value.y + delta[1])) }));
  }
  function photograph() {
    if (!canAnswer || photos.length === missions.length) return;
    const framed = Math.abs(frame.x - current.x) <= 13 && Math.abs(frame.y - current.y) <= 16;
    if (!framed) { const text = "O animal ainda não está bem enquadrado. Observe a paisagem e tente novamente."; setMessage(text); onMistake(); return; }
    const next = [...photos, current.id];
    setPhotos(next); setMessage(current.fact); onListen(current.fact);
    if (next.length === missions.length) { window.setTimeout(onComplete, 700); return; }
    window.setTimeout(() => { setMissionIndex((value) => value + 1); setFrame({ x: 50, y: 50 }); setMessage("Nova missão! Encontre o próximo animal."); }, 900);
  }

  return <div className="centerwest-photo-board">
    <div className="photo-mission"><strong>MISSÃO: ENCONTRE O {current.name}</strong><span>{missionIndex + 1} DE 3</span></div>
    <div className="photo-scene" role="button" tabIndex={0} aria-label={"Paisagem do Pantanal. Use o mouse, toque ou as setas para enquadrar " + current.name + "."} onPointerDown={(event) => { if (!canAnswer) return; event.currentTarget.setPointerCapture(event.pointerId); updateFrame(event); }} onPointerMove={(event) => { if (event.currentTarget.hasPointerCapture(event.pointerId)) updateFrame(event); }} onPointerUp={(event) => { if (!event.currentTarget.hasPointerCapture(event.pointerId)) return; updateFrame(event); event.currentTarget.releasePointerCapture(event.pointerId); }} onPointerCancel={(event) => { if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }} onKeyDown={handleKeys}>
      <span className={"photo-viewfinder " + current.id} style={{ left: frame.x + "%", top: frame.y + "%" }} aria-hidden="true"><i /><i /><i /><i /></span>
    </div>
    <div className="photo-feedback" aria-live="polite">{message}</div>
    <div className="photo-album" aria-label={photos.length + " de 3 fotografias registradas"}>
      {missions.map((animal) => { const captured = photos.includes(animal.id); return <div key={animal.id} className={captured ? "captured" : ""}>{captured ? <span style={{ backgroundPosition: animal.crop, backgroundSize: animal.cropSize }} role="img" aria-label={"Foto de " + animal.name} /> : <b aria-hidden="true">📷</b>}<strong>{captured ? animal.name : "FOTO " + (missions.indexOf(animal) + 1)}</strong></div>; })}
    </div>
    <button className="photo-capture" onClick={photograph} disabled={!canAnswer || photos.length === missions.length}>📷 FOTOGRAFAR</button>
  </div>;
}
