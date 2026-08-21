"use client";

import { useEffect, useMemo, useState } from "react";

type Screen = "menu" | "journey" | "game";
type Region = "Norte" | "Nordeste" | "Centro-Oeste" | "Sudeste" | "Sul";

const challenges: { target: Region; clue: string }[] = [
  { target: "Norte", clue: "É a maior região do Brasil e abriga grande parte da Floresta Amazônica." },
  { target: "Nordeste", clue: "Tem um litoral muito extenso e nove estados." },
  { target: "Centro-Oeste", clue: "É onde fica Brasília, a capital do Brasil." },
  { target: "Sudeste", clue: "É a região mais populosa do país." },
  { target: "Sul", clue: "É a região que fica mais ao sul do nosso mapa." },
];

const phases = [
  { number: "FASE 1", title: "ONDE ESTOU?", icon: "📍", color: "green", open: true },
  { number: "FASE 2", title: "BÚSSOLA DO BRASIL", icon: "🧭", color: "blue", open: false },
  { number: "FASE 3", title: "CONHECENDO O BRASIL", icon: "🏞️", color: "forest", open: false },
  { number: "FASE 4", title: "DESAFIO DAS REGIÕES", icon: "🗺️", color: "purple", open: false },
  { number: "FASE BÔNUS", title: "GRANDE EXPEDIÇÃO", icon: "🏆", color: "gold", open: false },
];

function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "pt-BR";
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
}

function Logo({ compact = false }: { compact?: boolean }) {
  return <div className={`logo ${compact ? "logo-compact" : ""}`} aria-label="Pegadas do Brasil, jogo de Geografia"><div className="logo-map">🌳 〰️ 📍</div><strong>PEGADAS</strong><span>do <b>BRASIL</b> 👣</span><small>JOGO DE GEOGRAFIA</small></div>;
}

function Macaw({ message }: { message: React.ReactNode }) {
  return <div className="guide"><div className="speech">{message}</div><div className="macaw" aria-hidden="true">🦜</div></div>;
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>("menu");
  const [sound, setSound] = useState(true);
  const [highContrast, setHighContrast] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [modal, setModal] = useState<"avatar" | "achievements" | "accessibility" | "help" | null>(null);
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<"idle" | "correct" | "wrong" | "finished">("idle");
  const [attempts, setAttempts] = useState(0);
  const challenge = challenges[challengeIndex];
  const instruction = useMemo(() => `Encontre a Região ${challenge.target} no mapa. ${challenge.clue}`, [challenge]);

  useEffect(() => {
    const saved = window.localStorage.getItem("pegadas-progress");
    if (saved) try { const data = JSON.parse(saved); setScore(data.score || 0); setChallengeIndex(Math.min(data.challengeIndex || 0, 4)); } catch { /* ignora progresso inválido */ }
  }, []);
  useEffect(() => { window.localStorage.setItem("pegadas-progress", JSON.stringify({ score, challengeIndex })); }, [score, challengeIndex]);

  function chooseRegion(region: Region) {
    if (feedback === "correct" || feedback === "finished") return;
    setAttempts((value) => value + 1);
    if (region === challenge.target) {
      setScore((value) => value + (attempts === 0 ? 100 : 60));
      setFeedback(challengeIndex === challenges.length - 1 ? "finished" : "correct");
      if (sound) speak("Muito bem! Você encontrou a região correta!");
    } else {
      setFeedback("wrong");
      if (sound) speak("Quase! Observe a dica e tente novamente.");
    }
  }
  function nextChallenge() { setChallengeIndex((value) => value + 1); setFeedback("idle"); setAttempts(0); }
  function restart() { setChallengeIndex(0); setScore(0); setFeedback("idle"); setAttempts(0); }

  return <main className={`${highContrast ? "high-contrast" : ""} ${largeText ? "large-text" : ""}`}><div className="game-shell">
    {screen === "menu" && <section className="screen menu-screen" aria-label="Menu principal">
      <nav className="menu-tools" aria-label="Opções do jogo">
        <button onClick={() => setModal("avatar")}><span>👦</span>Avatar</button><button onClick={() => setModal("achievements")}><span>🏆</span>Conquistas</button><button onClick={() => { setSound(!sound); if (!sound) speak("Som ativado"); }} aria-pressed={sound}><span>{sound ? "🔊" : "🔇"}</span>Som</button><button onClick={() => setModal("accessibility")}><span>♿</span>Acessibilidade</button><button onClick={() => setModal("help")}><span>📖</span>Como jogar</button>
      </nav><div className="menu-content"><Macaw message={<><strong>Olá, explorador!</strong><span>Pronto para conhecer o Brasil?</span></>} /><Logo /><button className="start-button" onClick={() => setScreen("journey")}>INICIAR<br />AVENTURA <span>⟶</span></button></div><div className="footprints" aria-hidden="true">👣 · 👣 · 👣 · 👣 · 👣 · 👣</div>
    </section>}

    {screen === "journey" && <section className="screen journey-screen"><header className="screen-header"><button className="round-control" onClick={() => setScreen("menu")} aria-label="Voltar ao menu">←<small>Voltar</small></button><div><h1>SUA JORNADA PELO BRASIL</h1><p>Aprenda, explore e avance por novas aventuras!</p></div><button className="round-control blue" onClick={() => setSound(!sound)} aria-pressed={sound}>{sound ? "🔊" : "🔇"}<small>Som</small></button></header><div className="journey-content"><Macaw message={<strong>Vamos começar?</strong>} /><div className="phase-track">{phases.map((phase, index) => <button key={phase.title} className={`phase-card ${phase.color} ${!phase.open ? "locked" : ""}`} disabled={!phase.open} onClick={() => setScreen("game")} aria-label={`${phase.number}, ${phase.title}${phase.open ? ", disponível" : ", bloqueada"}`}><span className="phase-icon">{phase.icon}</span><small>{phase.number}</small><strong>{phase.title}</strong><span className="phase-art">{index === 0 ? "🇧🇷" : phase.icon}</span><b>5 DESAFIOS</b><i>{phase.open ? "⭐" : "🔒"}</i></button>)}</div></div><p className="journey-tip">🌿 Complete cada fase para liberar a próxima! 🌿</p></section>}

    {screen === "game" && <section className="screen play-screen"><header className="play-header"><Logo compact /><h1>FASE 1 — ONDE ESTOU?</h1><div className="score">⭐ Pontos: {score}</div><button onClick={() => setScreen("journey")} aria-label="Voltar à jornada">←<small>Voltar</small></button><button onClick={() => setModal("help")} aria-label="Pausar jogo">Ⅱ<small>Pausar</small></button></header><div className="play-content"><Macaw message={<><strong>Olá, explorador!</strong><span>Encontre a Região {challenge.target} no mapa.</span></>} /><div className="map-area" aria-label="Mapa interativo das regiões do Brasil"><button className="region north" onClick={() => chooseRegion("Norte")}>NORTE</button><button className="region northeast" onClick={() => chooseRegion("Nordeste")}>NORDESTE</button><button className="region midwest" onClick={() => chooseRegion("Centro-Oeste")}>CENTRO-OESTE</button><button className="region southeast" onClick={() => chooseRegion("Sudeste")}>SUDESTE</button><button className="region south" onClick={() => chooseRegion("Sul")}>SUL</button></div><aside className="mission-card"><span className="counter">Desafio {challengeIndex + 1} de 5</span><div className="pin">📍</div><strong>Toque na região correta.</strong><p>{challenge.clue}</p><button className="listen" onClick={() => speak(instruction)}>🔊 OUVIR INSTRUÇÃO</button></aside></div><div className="progress" aria-label={`Progresso: desafio ${challengeIndex + 1} de 5`}>{challenges.map((_, index) => <span key={index} className={index <= challengeIndex ? "active" : ""}>{index + 1}</span>)}</div>
      {feedback !== "idle" && <div className={`feedback ${feedback}`} role="dialog" aria-live="assertive">{feedback === "wrong" && <><span>🧭</span><h2>Quase lá!</h2><p>Observe a dica e tente novamente. Errar também faz parte da aventura!</p><button onClick={() => setFeedback("idle")}>TENTAR NOVAMENTE</button></>}{feedback === "correct" && <><span>⭐</span><h2>Muito bem!</h2><p>Você encontrou a Região {challenge.target}!</p><button onClick={nextChallenge}>PRÓXIMO DESAFIO</button></>}{feedback === "finished" && <><span>🏆</span><h2>Fase concluída!</h2><p>Você explorou todas as regiões!</p><button onClick={() => setScreen("journey")}>VOLTAR À JORNADA</button><button className="secondary" onClick={restart}>JOGAR NOVAMENTE</button></>}</div>}
    </section>}

    {modal && <div className="modal-backdrop" role="presentation" onMouseDown={() => setModal(null)}><section className="modal" role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}><button className="modal-close" onClick={() => setModal(null)} aria-label="Fechar">×</button>{modal === "avatar" && <><h2>Escolha seu avatar</h2><div className="avatar-grid"><button>👦<small>Sol</small></button><button>👧<small>Lua</small></button><button>🧒<small>Rio</small></button></div><p>Use apenas um apelido divertido. Não informe seu nome verdadeiro.</p></>}{modal === "achievements" && <><h2>Suas conquistas</h2><div className="badges">⭐ Primeiros passos<br />🔒 Mestre do mapa<br />🔒 Grande explorador</div></>}{modal === "accessibility" && <><h2>Acessibilidade</h2><label><input type="checkbox" checked={largeText} onChange={(e) => setLargeText(e.target.checked)} /> Texto maior</label><label><input type="checkbox" checked={highContrast} onChange={(e) => setHighContrast(e.target.checked)} /> Alto contraste</label><label><input type="checkbox" checked={sound} onChange={(e) => setSound(e.target.checked)} /> Narração e sons</label></>}{modal === "help" && <><h2>Como jogar</h2><p>Ouça a pista e toque na região correta do mapa. Se errar, você poderá tentar novamente. Complete cinco desafios para concluir a fase!</p><button className="listen" onClick={() => speak("Ouça a pista e toque na região correta do mapa. Se errar, tente novamente.")}>🔊 OUVIR</button></>}</section></div>}
  </div></main>;
}
