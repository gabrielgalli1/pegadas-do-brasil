"use client";

import regionsMap from "./brasil-cinco-regioes.json";

export function BonusMapThumbnail() {
  return <svg viewBox={regionsMap.viewBox} aria-hidden="true" focusable="false">
    {regionsMap.regions.map((region) => <g key={region.id} fill={region.color} stroke="#fff" strokeWidth="2">
      {region.paths.map((path) => <path key={path.id} d={path.d} />)}
    </g>)}
  </svg>;
}

export default function BonusJourneyCard({ unlocked, completed, onOpen }: {
  unlocked: boolean;
  completed: boolean;
  onOpen: () => void;
}) {
  return <button className={`bonus-journey-card ${unlocked ? "is-unlocked" : "is-locked"}${completed ? " is-completed" : ""}`}
    disabled={!unlocked} onClick={onOpen}
    aria-label={`Fase bônus: complete o mapa com seus emblemas. ${completed ? "Concluída. Jogar novamente" : unlocked ? "Desbloqueada. Jogar bônus" : "Bloqueada. Complete todas as seis fases para liberar"}`}>
    <span className="bonus-card-map"><BonusMapThumbnail /></span>
    <span className="bonus-card-copy">
      <small>{completed ? "★ CONCLUÍDA" : unlocked ? "★ DESBLOQUEADA!" : "🔒 COMPLETE AS 6 FASES"}</small>
      <strong>FASE BÔNUS</strong>
      <span>{unlocked ? "Complete o mapa com seus emblemas!" : "Uma surpresa espera por você!"}</span>
    </span>
    <span className="bonus-card-action" aria-hidden="true">{unlocked ? <>{completed ? "JOGAR DE NOVO" : "JOGAR BÔNUS"}<b>▶</b></> : <span>🔒</span>}</span>
  </button>;
}
