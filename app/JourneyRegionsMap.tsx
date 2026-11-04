"use client";

import regionsMap from "./brasil-cinco-regioes.json";

type Props = {
  canPlay: boolean;
  className?: string;
  describedBy?: string;
  onSelect: (regionId: string) => void;
};

const regionNames: Record<string, string> = {
  norte: "NORTE",
  nordeste: "NORDESTE",
  "centro-oeste": "CENTRO-OESTE",
  sudeste: "SUDESTE",
  sul: "SUL",
};

const regionLabels: Record<string, [number, number]> = {
  norte: [215, 127],
  nordeste: [445, 207],
  "centro-oeste": [281, 291],
  sudeste: [385, 351],
  sul: [303, 440],
};

const regionLabelWidths: Record<string, number> = {
  norte: 72,
  nordeste: 94,
  "centro-oeste": 126,
  sudeste: 86,
  sul: 52,
};

const journeyRegionColors: Record<string, [string, string]> = {
  norte: ["#4caf45", "#217b32"],
  nordeste: ["#ff9b35", "#e86213"],
  "centro-oeste": ["#a2b83c", "#667f17"],
  sudeste: ["#42b7ea", "#147bc5"],
  sul: ["#b06ade", "#7836ad"],
};

export default function JourneyRegionsMap({ canPlay, className = "", describedBy, onSelect }: Props) {
  return <svg className={`journey-regions-map ${className}`.trim()} viewBox="0 10 560 510" preserveAspectRatio="xMidYMid meet" role="group" aria-label="Mapa interativo das cinco regiões do Brasil" aria-describedby={describedBy}>
    <defs>{regionsMap.regions.map((region) => <linearGradient key={region.id} id={`journey-region-fill-${region.id}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={journeyRegionColors[region.id][0]} /><stop offset="1" stopColor={journeyRegionColors[region.id][1]} /></linearGradient>)}</defs>
    {regionsMap.regions.map((region) => {
      const [x, y] = regionLabels[region.id];
      const labelWidth = regionLabelWidths[region.id];
      return <g key={region.id} className={`journey-map-region journey-map-region-${region.id}`} role="button" tabIndex={canPlay ? 0 : -1} aria-label={`Região ${regionNames[region.id]}`} aria-disabled={!canPlay} onClick={() => canPlay && onSelect(region.id)} onKeyDown={(event) => { if (canPlay && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); onSelect(region.id); } }}>
        <title>{`Região ${regionNames[region.id]}`}</title>
        {region.paths.map((path) => <path key={path.id} d={path.d} fill={`url(#journey-region-fill-${region.id})`} />)}
        <g className="journey-map-label" aria-hidden="true"><rect x={x - labelWidth / 2} y={y - 17} width={labelWidth} height="25" rx="12.5" /><text x={x} y={y}>{regionNames[region.id]}</text></g>
      </g>;
    })}
  </svg>;
}
