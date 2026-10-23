"use client";

import { useEffect, useRef, useState } from "react";
import regionsMap from "./brasil-cinco-regioes.json";
import ScoreBadge from "./ScoreBadge";
import { PhaseEmblemReward } from "./phaseEmblems";

type Feedback = "idle" | "correct" | "wrong" | "finished";
type Props = { challenge: number; score: number; mistakes: number; feedback: Feedback; sound: boolean; newEmblem: boolean; onAnswer: (correct: boolean) => void; onNext: () => void; onRetry: () => void; onBack: () => void; onToggleSound: () => void; onListen: (text: string) => void };
const regionNames: Record<string, string> = { norte: "Norte", nordeste: "Nordeste", "centro-oeste": "Centro-Oeste", sudeste: "Sudeste", sul: "Sul" };
const labels: Record<string, [number, number]> = { norte: [216, 170], nordeste: [458, 232], "centro-oeste": [286, 312], sudeste: [397, 374], sul: [314, 452] };
const titles = ["", "ONDE FICA O SUL?", "CENÁRIO EM PEDAÇOS", "TRILHA DAS ARAUCÁRIAS", "SEGREDOS DO SUL", "COLHEITA NO PARRERAL", "MISSÃO: CLIMA DO SUL"];
const subtitles = ["", "Encontre a Região Sul no mapa.", "Monte as Cataratas do Iguaçu.", "Recolha os pinhões e encontre o mirante.", "Raspe e descubra a cultura da Região Sul.", "Encontre os cachos maduros.", "Observe a previsão e prepare a Pipa."];
const mascotIntro = "Olá, explorador! Eu sou a Pipa, a quero-quero da Região Sul!";
const speeches = ["", "Procure a menor região do Brasil, bem ao sul do mapa.", "Escolha uma peça das Cataratas e depois toque no lugar correto para encaixá-la.", "Ajude a Pipa a explorar a trilha. Recolha quatro pinhões das araucárias e chegue ao mirante.", "Escolha um postal e raspe para descobrir um segredo do Sul!", "Observe as folhas e colha somente as uvas maduras!", "A previsão está mudando nos três estados! Observe cada paisagem e escolha como preparar a Pipa para o clima do Sul."];
const southContours = new Map(regionsMap.regions.find(region=>region.id==="sul")?.paths.map(path=>[path.id,path.d])??[]);
const climateStatePaths = {pr:southContours.get("path5284")??"",sc:southContours.get("path5294")??"",rs:southContours.get("path5334")??""};
const climatePins = {pr:[312,395],sc:[316,432],rs:[281,471]} as const;

function shuffle<T>(items: readonly T[]) { const copy = [...items]; for (let i = copy.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; } return copy; }

// Evita que a fala de erro reinicie a cada toque ou tecla repetida.
function useThrottledListen(onListen: (text: string) => void, gap = 4500) {
  const last = useRef(0);
  return (text: string) => {
    const now = Date.now();
    if (now - last.current < gap) return;
    last.current = now;
    onListen(text);
  };
}

function SouthPuzzle({ canPlay, onComplete, onListen }: { canPlay: boolean; onComplete: () => void; onListen: (text: string) => void }) {
  const listenWrong = useThrottledListen(onListen);
  const [tiles] = useState(() => shuffle([0, 1, 2, 3, 4, 5]));
  const [placed, setPlaced] = useState<number[]>([]);
  const [selected, setSelected] = useState(false);
  const [wrongSlot, setWrongSlot] = useState<number | null>(null);
  const [justPlaced, setJustPlaced] = useState<number | null>(null);
  const currentTile = tiles.find(tile => !placed.includes(tile));
  const pieceStyle = (tile: number, guide = false) => ({
    backgroundImage: `${guide ? "linear-gradient(#fff9e6b8,#fff9e6b8)," : ""}url('/sul-cataratas-quebra-cabeca-v1.webp')`,
    backgroundPosition: `${(tile % 3) * 50}% ${Math.floor(tile / 3) * 100}%`,
  });
  function choosePiece() {
    if (!canPlay || currentTile === undefined) return;
    setSelected(true);
  }
  function chooseSlot(slot: number, fromDrag = false) {
    if (!canPlay || placed.includes(slot)) return;
    if ((!selected && !fromDrag) || currentTile === undefined) return;
    if (currentTile !== slot) {
      setWrongSlot(slot);
      window.setTimeout(()=>setWrongSlot(null),450);
      listenWrong("Essa peça não encaixa aqui. Observe a paisagem e tente outro lugar.");
      return;
    }
    const next = [...placed, slot];
    setPlaced(next);
    setSelected(false);
    setJustPlaced(slot);
    window.setTimeout(()=>setJustPlaced(null),500);
    if (next.length === 6) window.setTimeout(onComplete, 1400);
  }
  function dropOnSlot(event: React.DragEvent<HTMLButtonElement>, slot: number) {
    event.preventDefault();
    if (currentTile === undefined) return;
    setSelected(true);
    chooseSlot(slot,true);
  }
  return <div className="south-puzzle" role="group" aria-label={`Quebra-cabeça das Cataratas do Iguaçu, ${placed.length} de 6 peças encaixadas`}>
    <div className={`south-puzzle-grid ${placed.length===6?"complete":""}`} aria-label="Tabuleiro do quebra-cabeça">{[0,1,2,3,4,5].map(slot=><button key={slot} className={`south-puzzle-slot ${placed.includes(slot)?"placed":""} ${wrongSlot===slot?"wrong":""} ${justPlaced===slot?"just-placed":""} ${selected&&!placed.includes(slot)?"ready":""}`} onClick={()=>chooseSlot(slot)} onDragOver={event=>event.preventDefault()} onDrop={event=>dropOnSlot(event,slot)} aria-label={placed.includes(slot)?`Peça ${slot+1} encaixada`:`Espaço ${slot+1}`} style={pieceStyle(slot,!placed.includes(slot))}>{!placed.includes(slot)&&<span>?</span>}</button>)}</div>
    <aside className="south-puzzle-piece-stage" aria-label="Peça da vez">
      <strong>PEÇA DA VEZ</strong>
      <div className="south-puzzle-progress-compact" aria-label={`${placed.length} de 6 peças encaixadas`}><span>PROGRESSO</span><b>{placed.length}/6</b><div><i style={{width:`${placed.length/6*100}%`}}/></div></div>
      {currentTile!==undefined?<button draggable className={`south-puzzle-piece ${selected?"selected":""}`} onDragStart={()=>setSelected(true)} onClick={choosePiece} aria-label="Selecionar a peça da vez" style={pieceStyle(currentTile)} />:<div className="south-puzzle-complete-mark">✨<b>PAISAGEM<br/>COMPLETA!</b>✨</div>}
      <p>{currentTile===undefined?"Muito bem!":selected?"Agora toque no lugar!":"Toque ou arraste a peça"}</p>
    </aside>
  </div>;
}

const openCells = new Set(["0-0","1-0","2-0","4-0","5-0","6-0","7-0","8-0","0-1","2-1","3-1","4-1","6-1","8-1","0-2","1-2","2-2","4-2","5-2","6-2","7-2","8-2","2-3","3-3","4-3","6-3","7-3","8-3","0-4","1-4","2-4","4-4","5-4","6-4","7-4","8-4","0-5","2-5","3-5","4-5","8-5"]);
const nuts = new Set(["0-2", "2-3", "0-5", "7-0"]);
function SouthMaze({ canPlay, onComplete, onListen }: { canPlay: boolean; onComplete: () => void; onListen: (text: string) => void }) {
  const listenBlocked = useThrottledListen(onListen);
  const [position, setPosition] = useState<[number, number]>([0, 0]);
  const [facing, setFacing] = useState<1 | -1>(1);
  const [collected, setCollected] = useState<string[]>([]);
  const [visited, setVisited] = useState<string[]>(["0-0"]);
  const [blocked, setBlocked] = useState(false);
  const [message, setMessage] = useState("Explore os caminhos e encontre os quatro pinhões.");
  function move(dx: number, dy: number) {
    if (!canPlay) return;
    const next: [number, number] = [position[0] + dx, position[1] + dy];
    const key = `${next[0]}-${next[1]}`;
    if (!openCells.has(key)) { setBlocked(true);setMessage("Há mata fechada por aqui. Tente outro caminho!");listenBlocked("Há mata fechada por aqui. Tente outro caminho!");window.setTimeout(()=>setBlocked(false),280);return; }
    if (dx !== 0) setFacing(dx > 0 ? 1 : -1);
    setPosition(next);
    setVisited(old=>old.includes(key)?old:[...old,key]);
    const found = nuts.has(key) && !collected.includes(key) ? [...collected, key] : collected;
    setCollected(found);
    if (nuts.has(key) && !collected.includes(key)) setMessage(found.length===4?"Todos os pinhões encontrados! Siga até o mirante.":`Pinhão encontrado! Falta${found.length===3?"":"m"} ${4-found.length}.`);
    else setMessage(found.length<4?"Explore os caminhos e encontre os quatro pinhões.":"Você encontrou todos! Agora siga até o mirante.");
    if (key === "8-5") {
      if (found.length === 4) window.setTimeout(onComplete, 350);
      else setMessage("O mirante está aqui, mas ainda faltam pinhões!");
    }
  }
  useEffect(() => { const key = (event: KeyboardEvent) => { const directions: Record<string,[number,number]> = { ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1] }; if (directions[event.key]) { event.preventDefault(); move(...directions[event.key]); } }; window.addEventListener("keydown", key); return () => window.removeEventListener("keydown", key); });
  const point = (key:string) => { const [x,y]=key.split("-").map(Number);return {x:55+x*124,y:35+y*86}; };
  const connections = Array.from(openCells).flatMap(key => { const [x,y]=key.split("-").map(Number);return [[x+1,y],[x,y+1]].filter(([nx,ny])=>openCells.has(`${nx}-${ny}`)).map(([nx,ny])=>({from:point(key),to:point(`${nx}-${ny}`),key:`${key}-${nx}-${ny}`})); });
  const forest = Array.from({length:54},(_,i)=>({x:i%9,y:Math.floor(i/9),i})).filter(cell=>!openCells.has(`${cell.x}-${cell.y}`));
  const goal = point("8-5");
  const player = point(`${position[0]}-${position[1]}`);
  return <div className={`south-maze-wrap ${blocked?"blocked":""}`}>
    <div className="south-maze" aria-label={`Labirinto, ${collected.length} de 4 pinhões coletados`}>
      <svg viewBox="0 0 1100 500" role="img" aria-label="Mapa da trilha entre araucárias">
        <defs>
          <linearGradient id="south-grass" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#a9dc72"/><stop offset="1" stopColor="#3e8549"/></linearGradient>
          <linearGradient id="south-trail" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#ffe8ae"/><stop offset="1" stopColor="#d8aa5e"/></linearGradient>
          <linearGradient id="south-finish" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#ffd638"/><stop offset="1" stopColor="#f29b19"/></linearGradient>
          <filter id="south-shadow"><feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="#173b4f" floodOpacity=".35"/></filter>
        </defs>
        <rect width="1100" height="500" rx="22" fill="url(#south-grass)"/>
        <path d="M0 95 Q210 28 420 92 T840 82 T1100 55 V0 H0Z" fill="#c7eb91" opacity=".72"/>
        <path d="M0 430 Q205 385 425 447 T870 420 T1100 432 V500 H0Z" fill="#2d7443" opacity=".5"/>
        <g className="south-maze-edge-plants" fill="#e7f6a8" opacity=".72">
          <path d="M18 145q18-32 25 0q10-30 23 2q-28 11-48-2M1025 22q18 34 25 1q13 29 27-5q-29-9-52 4M18 430q18-30 25 1q12-27 26 2q-29 9-51-3M1014 474q20-34 28-1q12-30 28 2q-31 10-56-1"/>
        </g>
        {forest.map(({x,y,i})=>{const p=point(`${x}-${y}`);const variant=i%4;return <g key={`forest-${i}`} transform={`translate(${p.x} ${p.y})`} opacity=".98">
          {variant===0&&<><path d="M-34 23 L-23 -11 L1 -34 L32 -13 L39 18 L20 34 L-14 34Z" fill="#81745e" stroke="#574c3c" strokeWidth="5"/><path d="M-19 3 L3 -20 L25 -6" fill="none" stroke="#c5b593" strokeWidth="6" strokeLinecap="round"/></>}
          {variant===1&&<><rect x="-6" y="3" width="12" height="37" rx="5" fill="#75451f"/><path d="M0 -42 C-10 -25 -38 -27 -43 -8 C-28 -4 -23 8 -36 20 C-18 23 -8 16 0 4 C8 16 19 23 37 20 C23 8 28 -4 44 -8 C37 -27 10 -25 0 -42Z" fill="#2e873e" stroke="#175b31" strokeWidth="5"/></>}
          {variant===2&&<><ellipse cy="13" rx="39" ry="25" fill="#246b39" stroke="#174b2e" strokeWidth="5"/><circle cx="-20" cy="-2" r="21" fill="#4b9c48"/><circle cx="4" cy="-10" r="27" fill="#57a94d"/><circle cx="25" cy="2" r="20" fill="#3c8d43"/><circle cx="-8" cy="8" r="4" fill="#f1d747"/><circle cx="17" cy="-3" r="4" fill="#f1d747"/></>}
          {variant===3&&<><g transform="rotate(-16)"><rect x="-38" y="-13" width="76" height="27" rx="13" fill="#85502b" stroke="#5a351e" strokeWidth="5"/><circle cx="-36" cy="0" r="12" fill="#ba7b3f" stroke="#5a351e" strokeWidth="4"/><path d="M-16 -10v20M5-10v20M25-9v18" stroke="#b9783d" strokeWidth="4"/></g><path d="M-30 26q13-23 21 0M20 27q12-23 21 0" fill="none" stroke="#286e37" strokeWidth="6" strokeLinecap="round"/></>}
        </g>})}
        {connections.map(line=><g key={line.key}><line x1={line.from.x} y1={line.from.y} x2={line.to.x} y2={line.to.y} stroke="#80542c" strokeWidth="47" strokeLinecap="round"/><line x1={line.from.x} y1={line.from.y} x2={line.to.x} y2={line.to.y} stroke="url(#south-trail)" strokeWidth="33" strokeLinecap="round" strokeDasharray="3 5"/></g>)}
        {Array.from(openCells).map(key=>{const p=point(key);return <circle key={`node-${key}`} cx={p.x} cy={p.y} r="22" fill="#f9da94" stroke="#986d35" strokeWidth="5"/>})}
        {visited.map((key,index)=>{const p=point(key);return <g key={`visited-${key}`} transform={`translate(${p.x} ${p.y}) rotate(${index%2?18:-18})`} opacity=".42"><ellipse cx="-5" cy="0" rx="5" ry="9" fill="#765029"/><ellipse cx="6" cy="-5" rx="4" ry="7" fill="#765029"/></g>})}
        {Array.from(nuts).filter(key=>!collected.includes(key)).map(key=>{const p=point(key);return <g key={`nut-${key}`} transform={`translate(${p.x} ${p.y})`} filter="url(#south-shadow)"><path d="M0 -28 C23 -11 27 18 0 31 C-27 18 -23 -11 0 -28Z" fill="#e97825" stroke="#71330e" strokeWidth="6"/><path d="M-7 -19 C-2 -10 2 5 -5 17" fill="none" stroke="#ffc56c" strokeWidth="6" strokeLinecap="round"/></g>})}
        <g transform={`translate(${goal.x} ${goal.y})`} filter="url(#south-shadow)">
          <ellipse cx="-13" cy="25" rx="39" ry="9" fill="#315f35" opacity=".38"/>
          <rect x="8" y="-35" width="8" height="64" rx="4" fill="#75451f" stroke="#fff1bb" strokeWidth="2"/>
          <circle cx="12" cy="-38" r="6" fill="#ffd438" stroke="#75451f" strokeWidth="3"/>
          <path d="M9 -31 C-8 -37 -31 -24 -52 -31 L-49 -2 C-30 5 -9 -7 9 0Z" fill="#fffdf1" stroke="#fff" strokeWidth="4"/>
          <path d="M7 -29 L-10 -31 L-10 -17 L8 -15ZM-29 -28 L-50 -29 L-49 -15 L-29 -13ZM-10 -17 L-29 -18 L-29 -4 L-10 -5Z" fill="#1598d0"/>
          <path d="M-10 -31 L-29 -28 L-29 -18 L-10 -17ZM-50 -15 L-29 -13 L-29 -4 L-49 -4Z" fill="#ffd33d"/>
          <rect x="-54" y="5" width="70" height="23" rx="11" fill="url(#south-finish)" stroke="#fff" strokeWidth="3"/>
          <text x="-19" y="21" textAnchor="middle" fill="#174b72" fontSize="11" fontWeight="1000">CHEGADA</text>
        </g>
        <g transform={`translate(${player.x} ${player.y})`} filter="url(#south-shadow)"><g transform={`scale(${facing} 1)`}><image href="/sul-mascote-quero-quero-sprite-v1.webp" x="-39" y="-50" width="102" height="102" preserveAspectRatio="xMidYMid meet"/></g></g>
      </svg>
    </div>
    <aside className="south-maze-controls">
      <div className="south-maze-progress-group"><div className="south-maze-counter"><span className="south-maze-counter-nut"><i/></span><div><small>PINHÕES ENCONTRADOS</small><strong>{collected.length}<em>/4</em></strong></div></div><div className="south-maze-nut-progress" aria-hidden="true">{Array.from({length:4},(_,index)=><span key={index} className={index<collected.length?"found":""}><i/></span>)}</div></div>
      <div className="south-maze-controls-block"><b>COMO JOGAR</b><div className="south-maze-dpad"><button onClick={() => move(0,-1)} aria-label="Mover para cima">↑</button><span><button onClick={() => move(-1,0)} aria-label="Mover para a esquerda">←</button><button onClick={() => move(0,1)} aria-label="Mover para baixo">↓</button><button onClick={() => move(1,0)} aria-label="Mover para a direita">→</button></span></div><small>Use as setas do teclado<br/>ou toque nos botões</small></div>
      <div className="south-maze-guidance"><p aria-live="polite">{message}</p></div>
    </aside>
  </div>;
}

type SouthSecret = { id: string; title: string; state: string; fact: string; image: string; color: string };
const southSecrets: SouthSecret[] = [
  { id:"trem-parana", title:"Trem da Serra do Mar", state:"Paraná", fact:"O trem atravessa a Serra do Mar e revela montanhas, florestas e belas paisagens do Paraná.", image:"/sul-segredo-trem-parana-v1.webp", color:"#167fae" },
  { id:"acoriana", title:"Herança açoriana", state:"Santa Catarina", fact:"Casas coloridas, pesca e festas guardam a herança dos açorianos no litoral catarinense.", image:"/sul-segredo-acoriano-v1.webp", color:"#168fc4" },
  { id:"gaucha", title:"Cultura gaúcha", state:"Rio Grande do Sul", fact:"O campo, o cavalo e o lenço fazem parte de muitas tradições da cultura gaúcha.", image:"/sul-segredo-gaucho-v1.webp", color:"#d26932" },
];

function ScratchCard({ secret, revealed, onReveal }: { secret: SouthSecret; revealed: boolean; onReveal: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const lastPoint = useRef<{x:number;y:number}|null>(null);
  const checks = useRef(0);
  const [done,setDone]=useState(revealed);

  function finish() {
    if (done) return;
    const node=canvas.current;
    node?.getContext("2d")?.clearRect(0,0,node.width,node.height);
    setDone(true);
    onReveal();
  }
  useEffect(() => {
    const node=canvas.current;if(!node)return;
    const ctx=node.getContext("2d",{willReadFrequently:true});if(!ctx)return;
    setDone(revealed);checks.current=0;lastPoint.current=null;
    ctx.globalCompositeOperation="source-over";
    const silver=ctx.createLinearGradient(0,0,node.width,node.height);
    silver.addColorStop(0,"#78d7d0");silver.addColorStop(.42,"#188fa9");silver.addColorStop(.58,"#54c4c3");silver.addColorStop(1,"#0b7193");
    ctx.fillStyle=silver;ctx.fillRect(0,0,node.width,node.height);
    ctx.fillStyle="#ffffff24";
    for(let y=20;y<node.height;y+=42)for(let x=(y/42)%2?20:41;x<node.width;x+=48){ctx.beginPath();ctx.arc(x,y,4,0,Math.PI*2);ctx.fill();}
    ctx.strokeStyle="#d9ffffaa";ctx.lineWidth=4;ctx.setLineDash([10,12]);ctx.beginPath();ctx.moveTo(45,55);ctx.bezierCurveTo(170,10,250,100,365,48);ctx.bezierCurveTo(480,0,565,95,675,48);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle="#ffd13f";ctx.beginPath();ctx.arc(48,55,17,0,Math.PI*2);ctx.fill();ctx.fillStyle="#fff";ctx.font="900 20px sans-serif";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("★",48,56);
    ctx.save();ctx.shadowColor="#064f6f88";ctx.shadowBlur=15;ctx.shadowOffsetY=8;ctx.fillStyle="#fff8dc";ctx.beginPath();ctx.roundRect(146,82,428,242,28);ctx.fill();ctx.restore();
    ctx.strokeStyle="#ffd04a";ctx.lineWidth=7;ctx.beginPath();ctx.roundRect(156,92,408,222,22);ctx.stroke();
    ctx.fillStyle="#267c4a";ctx.beginPath();ctx.roundRect(245,111,230,42,21);ctx.fill();ctx.fillStyle="#fff";ctx.font="900 18px sans-serif";ctx.fillText("POSTAL SECRETO",360,132);
    ctx.fillStyle="#0b6387";ctx.font="1000 43px sans-serif";ctx.fillText("RASPE AQUI",360,211);
    ctx.fillStyle="#6e5529";ctx.font="900 17px sans-serif";ctx.fillText("E DESCUBRA UMA SURPRESA!",360,253);
    ctx.fillStyle="#efad24";ctx.beginPath();ctx.arc(360,287,12,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#efad24";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(313,287);ctx.lineTo(342,287);ctx.moveTo(378,287);ctx.lineTo(407,287);ctx.stroke();
    if(revealed)ctx.clearRect(0,0,node.width,node.height);
  },[secret.id,revealed]);

  function point(event: React.PointerEvent<HTMLCanvasElement>) { const node=event.currentTarget;const rect=node.getBoundingClientRect();return {x:(event.clientX-rect.left)*node.width/rect.width,y:(event.clientY-rect.top)*node.height/rect.height}; }
  function scratch(event: React.PointerEvent<HTMLCanvasElement>) {
    if(!drawing.current||done)return;
    const node=event.currentTarget;const ctx=node.getContext("2d",{willReadFrequently:true})!;const next=point(event);const last=lastPoint.current||next;
    ctx.globalCompositeOperation="destination-out";ctx.lineWidth=54;ctx.lineCap="round";ctx.lineJoin="round";ctx.beginPath();ctx.moveTo(last.x,last.y);ctx.lineTo(next.x,next.y);ctx.stroke();lastPoint.current=next;
    checks.current+=1;if(checks.current%7===0){const pixels=ctx.getImageData(0,0,node.width,node.height).data;let clear=0;for(let i=3;i<pixels.length;i+=32)if(pixels[i]<40)clear+=1;if(clear/(pixels.length/32)>.42)finish();}
  }
  return <article className={`south-active-postcard ${done?"revealed":""}`} style={{"--secret-color":secret.color} as React.CSSProperties}>
    <img src={secret.image} alt=""/>
    <div className="south-postcard-caption"><span>{done?secret.state:"POSTAL MISTERIOSO"}</span><strong>{done?secret.title:"O que será?"}</strong></div>
    <canvas ref={canvas} width={720} height={400} className={done?"revealed":""} onPointerDown={e=>{if(done)return;drawing.current=true;lastPoint.current=point(e);e.currentTarget.setPointerCapture(e.pointerId);scratch(e);}} onPointerMove={scratch} onPointerUp={e=>{drawing.current=false;lastPoint.current=null;if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);}} onPointerCancel={()=>{drawing.current=false;lastPoint.current=null;}} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();finish();}}} role="button" tabIndex={done?-1:0} aria-label={`Raspe para revelar o postal ${secret.title}`} />
    {done&&<div className="south-postcard-sparkles" aria-hidden="true">✦ <span>✦</span> ✦</div>}
  </article>;
}

function SouthScratch({ onComplete }: { onComplete: () => void }) {
  const [activeId,setActiveId]=useState(southSecrets[0].id);
  const [revealed,setRevealed]=useState<string[]>([]);
  const active=southSecrets.find(secret=>secret.id===activeId)!;
  function reveal(id:string){setRevealed(old=>{if(old.includes(id))return old;const next=[...old,id];if(next.length===southSecrets.length)window.setTimeout(onComplete,3200);else{const following=southSecrets.find(secret=>!next.includes(secret.id));if(following)window.setTimeout(()=>setActiveId(following.id),2800);}return next;});}
  return <div className="south-secrets-game" role="group" aria-label={`Mala de descobertas, ${revealed.length} de 3 postais revelados`}>
    <div className="south-suitcase-handle" aria-hidden="true"/>
    <section className="south-suitcase">
      <div className="south-secret-main">
        <div className="south-secret-route"><span>✈</span><b>POSTAL {southSecrets.findIndex(secret=>secret.id===active.id)+1} DE 3</b><i/></div>
        <ScratchCard key={active.id} secret={active} revealed={revealed.includes(active.id)} onReveal={()=>reveal(active.id)}/>
        <p aria-live="polite">{revealed.includes(active.id)?active.fact:"Passe o dedo ou o mouse para raspar o postal."}</p>
      </div>
      <aside className="south-secret-rack" aria-label="Postais da viagem">
        <h3><span>✦</span> POSTAIS DA VIAGEM</h3>
        <div>{southSecrets.map((secret,index)=>{const isRevealed=revealed.includes(secret.id);const isActive=active.id===secret.id;return <button key={secret.id} className={`${isActive?"active":""} ${isRevealed?"revealed":""}`} onClick={()=>setActiveId(secret.id)} aria-label={`${isRevealed?secret.title:`Postal misterioso ${index+1}`}${isActive?", selecionado":""}`}><span>{index+1}</span>{isRevealed?<img src={secret.image} alt=""/>:<b>?</b>}<i>{isRevealed?"DESCOBERTO":"RASPE"}</i></button>;})}</div>
        <small>Escolha um postal<br/>para explorar</small>
      </aside>
      <footer className="south-secret-album">
        <div className="south-secret-album-title"><span>✦</span><p><small>MEU ÁLBUM</small><strong>DE DESCOBERTAS</strong></p></div>
        <div className="south-secret-stamps">{southSecrets.map((secret,index)=><span key={secret.id} className={revealed.includes(secret.id)?"found":""} aria-label={`${secret.title}: ${revealed.includes(secret.id)?"descoberto":"a descobrir"}`}>{revealed.includes(secret.id)?"★":index+1}</span>)}</div>
        <b><span>{revealed.length}</span><em>/3</em><small>SEGREDOS</small></b>
      </footer>
    </section>
  </div>;
}

type HarvestGrape = { id:string; x:number; y:number; ripe:boolean; scale:number };
const harvestGrapes: HarvestGrape[] = [
  {id:"r1",x:19,y:25,ripe:true,scale:1.02},{id:"g1",x:47,y:25,ripe:false,scale:.92},{id:"r2",x:76,y:25,ripe:true,scale:1},
  {id:"g2",x:27,y:55,ripe:false,scale:.9},{id:"r3",x:55,y:53,ripe:true,scale:1.08},{id:"g3",x:82,y:57,ripe:false,scale:.86},
  {id:"r4",x:18,y:81,ripe:true,scale:.96},{id:"g4",x:46,y:82,ripe:false,scale:.88},{id:"r5",x:75,y:80,ripe:true,scale:1.04},
];
const basketSlots=[{x:25,y:66,rotate:-8},{x:50,y:69,rotate:2},{x:75,y:66,rotate:9},{x:38,y:34,rotate:-5},{x:62,y:34,rotate:6}];

function GrapeCluster({ ripe, mini=false }: { ripe:boolean;mini?:boolean }) {
  const berries=[[45,31],[33,39],[48,43],[61,40],[27,52],[41,54],[56,54],[68,52],[34,67],[49,67],[62,66],[40,80],[54,80],[47,93]];
  return <svg className={`south-grape-art ${ripe?"ripe":"green"} ${mini?"mini":""}`} viewBox="0 0 92 108" aria-hidden="true"><path className="stem" d="M47 32C48 18 40 12 34 6M45 23c12-9 24-9 32-3"/><path className="leaf" d="M43 24C24 26 13 17 10 6c13-2 26 1 35 13C52 7 67 3 79 8c-4 12-14 20-31 18Z"/>{berries.map(([cx,cy],index)=><g key={index}><circle className="berry" cx={cx} cy={cy} r="12"/><circle className="shine" cx={cx-4} cy={cy-4} r="3.3"/></g>)}</svg>;
}

function SouthHarvest({ canPlay, onComplete, onListen }: { canPlay:boolean;onComplete:()=>void;onListen:(text:string)=>void }) {
  const listenWrong=useThrottledListen(onListen);
  const basketRef=useRef<HTMLDivElement>(null);
  const [harvested,setHarvested]=useState<string[]>([]);
  const [wrong,setWrong]=useState<string|null>(null);
  const [flying,setFlying]=useState<{id:string;dx:number;dy:number}|null>(null);
  const [message,setMessage]=useState("Toque nas uvas roxas e leve para a cesta.");
  function pick(grape:HarvestGrape,event:React.MouseEvent<HTMLButtonElement>){
    if(!canPlay||flying||harvested.includes(grape.id))return;
    if(!grape.ripe){setWrong(grape.id);setMessage("Observe melhor a cor das uvas. Escolha somente os cachos maduros.");listenWrong("Observe melhor a cor das uvas. Escolha somente os cachos maduros.");window.setTimeout(()=>{setWrong(null);setMessage("Procure um cacho roxo e maduro.");},900);return;}
    const source=event.currentTarget.getBoundingClientRect();const target=basketRef.current?.getBoundingClientRect();const slot=basketSlots[harvested.length];
    setFlying({id:grape.id,dx:target?target.left+target.width*slot.x/100-source.left-source.width/2:250,dy:target?target.top+target.height*slot.y/100-source.top-source.height/2:80});
    setMessage("Boa escolha! O cacho está indo para a cesta.");
    // No quinto cacho a conclusão do desafio assume a narração.
    if(harvested.length<4)onListen("Boa escolha! O cacho está indo para a cesta.");
    window.setTimeout(()=>{setHarvested(old=>{const next=[...old,grape.id];if(next.length===5){setMessage("Colheita completa! A cesta está cheia.");window.setTimeout(onComplete,1300);}else setMessage(`Muito bem! Faltam ${5-next.length} ${5-next.length===1?"cacho":"cachos"}.`);return next;});setFlying(null);},720);
  }
  return <div className="south-harvest" role="group" aria-label={`Colheita no parreiral, ${harvested.length} de 5 cachos maduros`}>
    <section className="south-vineyard" aria-label="Parreiral com cachos maduros e verdes">
      <div className="south-vineyard-badge"><span>✦</span><b>PROCURE AS UVAS ROXAS</b></div>
      {harvestGrapes.map(grape=>!harvested.includes(grape.id)&&<button key={grape.id} className={`south-grape ${grape.ripe?"ripe":"green"} ${wrong===grape.id?"wrong":""} ${flying?.id===grape.id?"harvesting":""}`} style={{left:`${grape.x}%`,top:`${grape.y}%`,"--grape-scale":grape.scale,"--fly-x":`${flying?.id===grape.id?flying.dx:0}px`,"--fly-y":`${flying?.id===grape.id?flying.dy:0}px`} as React.CSSProperties} onClick={event=>pick(grape,event)} aria-label={grape.ripe?"Cacho de uvas roxas maduras":"Cacho de uvas verdes ainda não maduras"}><GrapeCluster ripe={grape.ripe}/>{grape.ripe&&<i>✦</i>}</button>)}
    </section>
    <aside className="south-harvest-panel">
      <header><small>COLHEITA</small><strong><span>{harvested.length}</span>/5</strong><b>CACHOS</b></header>
      <div className="south-harvest-cue"><span>↓</span><b>UVAS NA CESTA</b></div>
      <div className="south-basket-stage">
        <div className="south-basket-grapes" ref={basketRef} aria-hidden="true">{harvested.map((id,index)=>{const slot=basketSlots[index];return <span key={id} style={{left:`${slot.x}%`,top:`${slot.y}%`,transform:`translate(-50%,-50%) rotate(${slot.rotate}deg)`}}><GrapeCluster ripe mini/></span>;})}</div>
        <img src="/sul-cesta-colheita-v1.webp" alt="Cesta da colheita"/>
        {harvested.length===5&&<span className="south-basket-complete">★ CESTA CHEIA!</span>}
      </div>
      <div className="south-harvest-progress" aria-label={`${harvested.length} de 5 cachos colhidos`}>{Array.from({length:5},(_,index)=><span key={index} className={index<harvested.length?"filled":""}>{index<harvested.length?<GrapeCluster ripe mini/>:index+1}</span>)}</div>
      <p aria-live="polite">{message}</p>
    </aside>
  </div>;
}

type ClimateId="frost"|"cold"|"wind"|"sun";
type ClimateChoice="watering"|"scarf"|"ball"|"hat"|"rake"|"cover"|"coat";
type ClimateRound={id:ClimateId;state:"pr"|"sc"|"rs";place:string;weather:string;image:string;prompt:string;answer:ClimateChoice;choices:{id:ClimateChoice;label:string}[];success:string};

const climateRounds:ClimateRound[]=[
  {id:"frost",state:"pr",place:"PLANALTO DO PARANÁ",weather:"MANHÃ COM GEADA",image:"/sul-clima-planalto-parana-scene-v2.webp",prompt:"Como proteger esta pequena muda?",answer:"cover",choices:[{id:"cover",label:"Cobertura"},{id:"ball",label:"Bola de praia"},{id:"rake",label:"Ancinho"}],success:"Muito bem! A cobertura ajuda a proteger a muda da geada."},
  {id:"cold",state:"sc",place:"SERRA CATARINENSE",weather:"FRIO NA SERRA",image:"/sul-clima-serra-catarinense-scene-v2.webp",prompt:"O que aquece a Pipa?",answer:"scarf",choices:[{id:"watering",label:"Regador"},{id:"scarf",label:"Cachecol"},{id:"ball",label:"Bola de praia"}],success:"Acertou! O cachecol deixa a Pipa bem quentinha."},
  {id:"wind",state:"rs",place:"CAMPOS GAÚCHOS",weather:"VENTO FRIO",image:"/sul-clima-campos-gauchos-scene-v2.webp",prompt:"O que protege o corpo do vento?",answer:"coat",choices:[{id:"hat",label:"Chapéu de sol"},{id:"rake",label:"Ancinho"},{id:"coat",label:"Corta-vento"}],success:"Boa escolha! O corta-vento protege nos campos abertos."},
  {id:"sun",state:"sc",place:"LITORAL CATARINENSE",weather:"SOL DE VERÃO",image:"/sul-clima-litoral-catarinense-scene-v2.webp",prompt:"O que protege do sol forte?",answer:"hat",choices:[{id:"scarf",label:"Cachecol"},{id:"hat",label:"Chapéu"},{id:"watering",label:"Regador"}],success:"Isso! O chapéu ajuda a proteger durante o verão no litoral."},
];

function ClimateSymbol({climate}:{climate:ClimateId}){
  if(climate==="sun")return <svg viewBox="0 0 64 64" aria-hidden="true"><g stroke="#fff0a5" strokeWidth="6" strokeLinecap="round"><path d="M32 4v10M32 50v10M4 32h10M50 32h10M12 12l8 8M44 44l8 8M52 12l-8 8M20 44l-8 8"/></g><circle cx="32" cy="32" r="15" fill="#ffc928" stroke="#f08a20" strokeWidth="4"/></svg>;
  if(climate==="wind")return <svg viewBox="0 0 64 64" aria-hidden="true"><g fill="none" stroke="#eefcff" strokeWidth="6" strokeLinecap="round"><path d="M7 20h34c13 0 13-16 2-16-7 0-9 5-9 8M7 34h45c11 0 10 16 0 16-6 0-8-4-8-8M7 48h24"/></g></svg>;
  if(climate==="frost")return <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M12 49h40M17 42h30" stroke="#d8fbff" strokeWidth="5" strokeLinecap="round"/><path d="M22 39V12M42 39V7M14 21l8 7 8-7M34 17l8 7 8-7" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/></svg>;
  return <svg viewBox="0 0 64 64" aria-hidden="true"><g fill="none" stroke="#e9fbff" strokeWidth="5" strokeLinecap="round"><path d="M32 5v54M8 18l48 28M56 18 8 46M24 11l8 8 8-8M24 53l8-8 8 8M10 28l11 3-3 11M54 28l-11 3 3 11"/></g></svg>;
}

const climateChoiceImages:Record<ClimateChoice,string>={watering:"/sul-clima-opcao-watering-v2.webp",scarf:"/sul-clima-opcao-scarf-v2.webp",ball:"/sul-clima-opcao-ball-v2.png",hat:"/sul-clima-opcao-hat-v2.webp",rake:"/sul-clima-opcao-rake-v2.png",cover:"/sul-clima-opcao-cover-v2.webp",coat:"/sul-clima-opcao-coat-v2.webp"};
function SeasonChoiceArt({kind}:{kind:ClimateChoice}){return <img src={climateChoiceImages[kind]} alt=""/>;}

function SouthClimate({canPlay,onComplete,onListen}:{canPlay:boolean;onComplete:()=>void;onListen:(text:string)=>void}){
  const [round,setRound]=useState(0);const [completed,setCompleted]=useState<ClimateId[]>([]);const [wrong,setWrong]=useState<ClimateChoice|null>(null);const [locked,setLocked]=useState(false);const [message,setMessage]=useState("Observe a previsão e escolha uma opção.");const current=climateRounds[round];
  const pin=climatePins[current.state];
  function choose(choice:ClimateChoice){if(!canPlay||locked)return;if(choice!==current.answer){setWrong(choice);setMessage("Observe o clima mais uma vez e tente outra opção.");window.setTimeout(()=>{setWrong(null);setMessage("Qual objeto ajuda nesta previsão?");},850);return;}setLocked(true);const next=[...completed,current.id];setCompleted(next);setMessage(current.success);onListen(next.length===climateRounds.length?`${current.success} Parabéns, explorador! Você concluiu os seis desafios da Região Sul!`:current.success);window.setTimeout(()=>{if(next.length===climateRounds.length){setMessage("Boletim completo! Você venceu o clima do Sul.");window.setTimeout(onComplete,700);}else{setRound(round+1);setLocked(false);setMessage("A previsão mudou! Observe a nova paisagem.");}},950);}
  return <div className={`south-seasons south-climate weather-${current.id} state-${current.state} ${locked?"answered":""}`} role="group" aria-label={`Missão Clima do Sul, ${completed.length} de 4 previsões concluídas`}>
    <div className="south-seasons-main">
      <section className="south-season-wheel-panel south-climate-map-panel" aria-label={`Mapa climático. Previsão atual: ${current.place}`}>
        <header className="south-climate-map-title"><span><ClimateSymbol climate={current.id}/></span><div><small>MAPA DO CLIMA</small><strong>REGIÃO SUL</strong></div></header>
        <div className="south-climate-map">
          <svg viewBox="235 378 120 158" role="img" aria-label="Mapa em formato geográfico real dos estados da Região Sul"><defs><filter id="climate-map-shadow"><feDropShadow dx="0" dy="3" stdDeviation="2.5" floodColor="#174d3a" floodOpacity=".34"/></filter><linearGradient id="climate-pr" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#89c765"/><stop offset="1" stopColor="#55a765"/></linearGradient><linearGradient id="climate-sc" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#62c2aa"/><stop offset="1" stopColor="#318c83"/></linearGradient><linearGradient id="climate-rs" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#62a6ce"/><stop offset="1" stopColor="#3f729e"/></linearGradient></defs><path className={`climate-state pr ${current.state==="pr"?"active":""}`} d={climateStatePaths.pr}/><path className={`climate-state sc ${current.state==="sc"?"active":""}`} d={climateStatePaths.sc}/><path className={`climate-state rs ${current.state==="rs"?"active":""}`} d={climateStatePaths.rs}/><text className="state-label pr-label" x="306" y="410">PARANÁ</text><text className="state-label sc-label" x="310" y="443">SANTA CATARINA</text><text className="state-label rs-label" x="278" y="483">RIO GRANDE</text><text className="state-label rs-label" x="278" y="491">DO SUL</text><g className="climate-map-pin" transform={`translate(${pin[0]} ${pin[1]})`}><circle r="8.5"/><path d="M0 14 5 5H-5Z"/><circle r="3"/></g></svg>
        </div>
        <div className="south-season-current"><small>PREVISÃO EM</small><strong>{current.place}</strong></div>
      </section>
      <section className="south-season-play">
        <h2 className="south-climate-question">{current.prompt}</h2>
        <div className="south-season-scene" aria-label={`Paisagem de ${current.place.toLowerCase()}`}>
          <img className="south-climate-bg" src={current.image} alt={`Pipa, a quero-quero, em ${current.place.toLowerCase()} durante ${current.weather.toLowerCase()}`}/>
          <span className="south-season-particles">{Array.from({length:9},(_,index)=><i key={index}/>)}</span>
          <b className="south-season-name"><ClimateSymbol climate={current.id}/>{current.weather}</b>
        </div>
        <div className="south-season-choices">{current.choices.map(choice=><button key={choice.id} className={`${wrong===choice.id?"wrong":""} ${locked&&choice.id===current.answer?"correct":""}`} disabled={!canPlay||locked} onClick={()=>choose(choice.id)}><span className="south-climate-choice-art"><SeasonChoiceArt kind={choice.id}/></span><span className="south-climate-choice-copy"><small>ESCOLHER</small><strong>{choice.label}</strong></span>{locked&&choice.id===current.answer&&<i aria-hidden="true">✓</i>}</button>)}</div>
      </section>
    </div>
    <footer className="south-seasons-footer"><div className="south-season-progress"><span>BOLETIM DO SUL</span>{climateRounds.map(item=><i key={item.id} className={`${completed.includes(item.id)?"done":""} ${item.id===current.id?"current":""}`}><ClimateSymbol climate={item.id}/></i>)}<strong>{completed.length}/4</strong></div><p aria-live="polite">{message}</p></footer>
  </div>;
}

export default function SouthLevel({challenge,score,mistakes,feedback,sound,newEmblem,onAnswer,onNext,onRetry,onBack,onToggleSound,onListen}:Props){
  const [hint,setHint]=useState("");const canPlay=feedback==="idle";function chooseRegion(id:string){if(!canPlay)return;if(id!=="sul"){setHint("Procure a região mais ao sul do mapa e tente novamente.");if(mistakes<1)onListen("Quase! Procure a região mais ao sul do mapa e tente novamente.");}onAnswer(id==="sul");}
  const spokenInstruction=speeches[challenge];
  return <section className={`screen south-screen south-challenge-${challenge}`} aria-label={`Desafio ${challenge} da Região Sul`}><header className="south-header"><button className="south-round" onClick={onBack} aria-label="Voltar à jornada"><img src="/fases-voltar-v1.webp" alt=""/></button><div className="south-title"><h1>{titles[challenge]}</h1><p>{subtitles[challenge]}</p></div><div className="south-status"><b>DESAFIO {challenge} DE 6</b><div>{Array.from({length:6},(_,i)=><span key={i} className={i<challenge?"active":""}>★</span>)}</div><ScoreBadge score={score} compact/></div><button className={`south-round south-sound ${!sound?"muted":""}`} onClick={onToggleSound} aria-label={sound?"Desligar narração":"Ligar narração"}><img src="/fases-som-v1.webp" alt=""/></button></header><div className="south-speech">{challenge===1&&<strong>{mascotIntro}</strong>}<span>{speeches[challenge]}</span></div><button className="south-listen" onClick={()=>onListen(spokenInstruction)}>🔊 OUVIR INSTRUÇÕES</button><div className={`south-board board-${challenge}`}>
  {challenge===1&&<svg className="south-map" viewBox="0 10 560 510" role="group" aria-label="Mapa interativo das cinco regiões do Brasil">{regionsMap.regions.map(region=><g key={region.id} role="button" tabIndex={canPlay?0:-1} onClick={()=>chooseRegion(region.id)} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();chooseRegion(region.id);}}} aria-label={`Região ${regionNames[region.id]}`}>{region.paths.map(path=><path key={path.id} d={path.d} fill={region.color}/>)}<text x={labels[region.id][0]} y={labels[region.id][1]}>{regionNames[region.id].toUpperCase()}</text></g>)}</svg>}
  {challenge===2&&<SouthPuzzle canPlay={canPlay} onComplete={()=>onAnswer(true)} onListen={onListen}/>} {challenge===3&&<SouthMaze canPlay={canPlay} onComplete={()=>onAnswer(true)} onListen={onListen}/>} {challenge===4&&<SouthScratch onComplete={()=>onAnswer(true)}/>} {challenge===5&&<SouthHarvest canPlay={canPlay} onComplete={()=>onAnswer(true)} onListen={onListen}/>} {challenge===6&&<SouthClimate canPlay={canPlay} onComplete={()=>onAnswer(true)} onListen={onListen}/>}</div>
  {challenge===1&&<p className="south-map-instruction">Clique ou toque na Região Sul no mapa!</p>}
  {feedback!=="idle"&&<div className={`feedback ${feedback} south-feedback`} role="dialog" aria-modal="true" aria-live="assertive">{feedback==="finished"?<PhaseEmblemReward id="sul" isNew={newEmblem}/>:<span>{feedback==="wrong"?"🧭":"⭐"}</span>}<h2>{feedback==="wrong"?(mistakes>=2?"Vamos recomeçar!":"Quase lá!"):feedback==="finished"?"Região Sul concluída!":"Muito bem!"}</h2><p>{feedback==="wrong"?(mistakes>=2?"A Região Sul será reiniciada desde o primeiro desafio.":hint||"Observe a missão e tente novamente."):challenge===1?"Você encontrou a Região Sul!":challenge===2?"Você montou as Cataratas do Iguaçu!":challenge===3?"Você atravessou a serra e recolheu todos os pinhões!":challenge===4?"Você completou o álbum e descobriu três tradições da Região Sul!":challenge===5?"A colheita de uvas está completa!":"Você completou o boletim climático e concluiu a Região Sul!"}</p><button onClick={feedback==="wrong"?onRetry:onNext}>{feedback==="wrong"?(mistakes>=2?"RECOMEÇAR REGIÃO":"TENTAR NOVAMENTE"):feedback==="finished"?"VOLTAR À JORNADA":"PRÓXIMO DESAFIO"}</button></div>}</section>;
}
