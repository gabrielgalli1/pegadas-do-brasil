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

const avatars = [
  { id: "sol", image: "/avatar-sol-v1.png", name: "Sol", description: "Menino explorador" },
  { id: "lua", image: "/avatar-lua-v1.png", name: "Lua", description: "Menina exploradora" },
  { id: "arara", image: "/avatar-arara-v1.png", name: "Ari", description: "Arara aventureira" },
  { id: "onca", image: "/avatar-onca-v1.png", name: "Pintada", description: "Onça-pintada" },
  { id: "capivara", image: "/avatar-capivara-v1.png", name: "Capi", description: "Capivara curiosa" },
  { id: "mico", image: "/avatar-mico-v1.png", name: "Dourado", description: "Mico-leão-dourado" },
] as const;

function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "pt-BR";
  utterance.rate = 0.9;
  utterance.volume = Math.max(0, Math.min(1, Number(window.localStorage.getItem("pegadas-volume") ?? 75) / 100));
  window.speechSynthesis.speak(utterance);
}

function Logo({ compact = false }: { compact?: boolean }) {
  return <img className={`logo ${compact ? "logo-compact" : ""}`} src="/pegadas-logo-v1.png" alt="Pegadas do Brasil — jogo de Geografia" />;
}

function Macaw({ message }: { message: React.ReactNode }) {
  return <div className="guide"><div className="speech">{message}</div><img className="macaw" src="/arara-mascote-v1.png" alt="Arara mascote do jogo" /></div>;
}

function HowToPlay() {
  const narration = "Primeiro, escolha seu avatar. Segundo, inicie a aventura e entre na jornada pelo Brasil. Terceiro, avance pelas fases. Complete uma fase de cada vez e aprenda sobre o Brasil.";
  return <><header className="help-heading"><img src="/icone-como-jogar-v1.png" alt="" /><h2 id="modal-title">COMO JOGAR</h2></header><div className="help-steps"><article className="help-step avatars-step"><span className="step-number">1</span><h3>ESCOLHA SEU AVATAR</h3><p>Escolha seu explorador para começar.</p><div className="help-avatars">{avatars.map((avatar) => <div key={avatar.id}><img src={avatar.image} alt={avatar.name} /><strong>{avatar.name}</strong></div>)}</div></article><article className="help-step adventure-step"><span className="step-number">2</span><h3>INICIE A AVENTURA</h3><p>Entre na jornada pelo Brasil.</p><div className="help-adventure-art" aria-hidden="true"><span>INICIAR<br />AVENTURA</span><i>➜</i></div></article><article className="help-step phases-step"><span className="step-number">3</span><h3>AVANCE PELAS FASES</h3><p>Complete uma fase de cada vez e aprenda sobre o Brasil.</p><div className="help-phase-art" aria-hidden="true"><span>⭐</span><i>•••</i><span>⭐</span><i>•••</i><span>⭐</span><b>🇧🇷</b></div></article></div><footer className="help-footer"><img src="/arara-mascote-v1.png" alt="Arara Ari" /><div><strong>Aprenda e explore o Brasil passo a passo!</strong><button className="help-listen" onClick={() => speak(narration)}>🔊 OUVIR INSTRUÇÕES</button></div><span className="help-footprints" aria-hidden="true">👣　👣</span></footer></>;
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>("menu");
  const [sound, setSound] = useState(true);
  const [music, setMusic] = useState(true);
  const [effects, setEffects] = useState(true);
  const [volume, setVolume] = useState(75);
  const [highContrast, setHighContrast] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [buttonHighlight, setButtonHighlight] = useState(false);
  const [avatarId, setAvatarId] = useState<string | null>(null);
  const [avatarReminder, setAvatarReminder] = useState(false);
  const [modal, setModal] = useState<"avatar" | "achievements" | "sound" | "accessibility" | "help" | null>(null);
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<"idle" | "correct" | "wrong" | "finished">("idle");
  const [attempts, setAttempts] = useState(0);
  const [completedChallenges, setCompletedChallenges] = useState(0);
  const [firstTryWins, setFirstTryWins] = useState(0);
  const [highestScore, setHighestScore] = useState(0);
  const [completedPhase, setCompletedPhase] = useState(false);
  const challenge = challenges[challengeIndex];
  const instruction = useMemo(() => `Encontre a Região ${challenge.target} no mapa. ${challenge.clue}`, [challenge]);

  useEffect(() => {
    const saved = window.localStorage.getItem("pegadas-progress");
    if (saved) try { const data = JSON.parse(saved); setScore(data.score || 0); setChallengeIndex(Math.min(data.challengeIndex || 0, 4)); setCompletedChallenges(data.completedChallenges || 0); setFirstTryWins(data.firstTryWins || 0); setHighestScore(data.highestScore || data.score || 0); setCompletedPhase(Boolean(data.completedPhase)); } catch { /* ignora progresso inválido */ }
    setAvatarId(window.localStorage.getItem("pegadas-avatar"));
    const savedAudio = window.localStorage.getItem("pegadas-audio");
    if (savedAudio) try { const audio = JSON.parse(savedAudio); setMusic(audio.music ?? true); setEffects(audio.effects ?? true); setSound(audio.narration ?? true); setVolume(audio.volume ?? 75); } catch { /* mantém as configurações padrão */ }
    const savedAccessibility = window.localStorage.getItem("pegadas-accessibility");
    if (savedAccessibility) try { const accessibility = JSON.parse(savedAccessibility); setHighContrast(accessibility.highContrast ?? false); setLargeText(accessibility.largeText ?? false); setButtonHighlight(accessibility.buttonHighlight ?? false); } catch { /* mantém as configurações padrão */ }
  }, []);
  useEffect(() => { window.localStorage.setItem("pegadas-progress", JSON.stringify({ score, challengeIndex, completedChallenges, firstTryWins, highestScore, completedPhase })); }, [score, challengeIndex, completedChallenges, firstTryWins, highestScore, completedPhase]);
  useEffect(() => { window.localStorage.setItem("pegadas-audio", JSON.stringify({ music, effects, narration: sound, volume })); window.localStorage.setItem("pegadas-volume", String(volume)); }, [music, effects, sound, volume]);
  useEffect(() => { window.localStorage.setItem("pegadas-accessibility", JSON.stringify({ highContrast, largeText, buttonHighlight })); }, [highContrast, largeText, buttonHighlight]);

  const selectedAvatar = avatars.find((avatar) => avatar.id === avatarId);
  const achievements = [
    { icon: "👣", title: "Primeiros Passos", description: "Complete seu primeiro desafio", unlocked: completedChallenges >= 1 },
    { icon: "🧭", title: "Explorador do Norte", description: "Encontre corretamente a Região Norte", unlocked: completedChallenges >= 1 },
    { icon: "🗺️", title: "Mestre das Regiões", description: "Complete os desafios das cinco regiões", unlocked: completedPhase },
    { icon: "🎯", title: "Acertei de Primeira", description: "Acerte 3 desafios sem errar", unlocked: firstTryWins >= 3 },
    { icon: "⭐", title: "Colecionador de Estrelas", description: "Conquiste pelo menos 400 pontos", unlocked: highestScore >= 400 },
    { icon: "🏆", title: "Grande Explorador", description: "Conclua a fase acertando tudo de primeira", unlocked: completedPhase && firstTryWins >= 5 },
  ];
  const unlockedAchievements = achievements.filter((achievement) => achievement.unlocked).length;

  function chooseAvatar(id: string) {
    setAvatarId(id);
    setAvatarReminder(false);
    window.localStorage.setItem("pegadas-avatar", id);
    setModal(null);
    if (sound) speak("Avatar escolhido! Agora você pode iniciar a aventura.");
  }

  function startAdventure() {
    if (!avatarId) {
      setAvatarReminder(true);
      setModal("avatar");
      if (sound) speak("Escolha seu avatar antes de iniciar a aventura.");
      return;
    }
    setScreen("journey");
  }

  function chooseRegion(region: Region) {
    if (feedback === "correct" || feedback === "finished") return;
    setAttempts((value) => value + 1);
    if (region === challenge.target) {
      const earnedPoints = attempts === 0 ? 100 : 60;
      setScore((value) => { const nextScore = value + earnedPoints; setHighestScore((best) => Math.max(best, nextScore)); return nextScore; });
      setCompletedChallenges((value) => Math.max(value, challengeIndex + 1));
      if (attempts === 0) setFirstTryWins((value) => value + 1);
      if (challengeIndex === challenges.length - 1) setCompletedPhase(true);
      setFeedback(challengeIndex === challenges.length - 1 ? "finished" : "correct");
      if (sound) speak("Muito bem! Você encontrou a região correta!");
    } else {
      setFeedback("wrong");
      if (sound) speak("Quase! Observe a dica e tente novamente.");
    }
  }
  function nextChallenge() { setChallengeIndex((value) => value + 1); setFeedback("idle"); setAttempts(0); }
  function restart() { setChallengeIndex(0); setScore(0); setFeedback("idle"); setAttempts(0); }

  return <main className={`${highContrast ? "high-contrast" : ""} ${largeText ? "large-text" : ""} ${buttonHighlight ? "button-highlight" : ""}`}><div className="game-shell">
    {screen === "menu" && <section className="screen menu-screen" aria-label="Menu principal">
      <nav className="menu-tools" aria-label="Opções do jogo">
        <button className={selectedAvatar ? "avatar-selected-tool" : ""} onClick={() => setModal("avatar")}><span className="menu-avatar" aria-hidden="true"><img src={selectedAvatar?.image ?? "/icone-avatar-v1.png"} alt="" /></span>{selectedAvatar ? selectedAvatar.name : "Avatar"}</button><button onClick={() => setModal("achievements")}><img src="/icone-conquistas-v1.png" alt="" />Conquistas</button><button className={!sound ? "sound-muted" : ""} onClick={() => setModal("sound")}><img src="/icone-som-v1.png" alt="" />Som</button><button onClick={() => setModal("accessibility")}><img src="/icone-acessibilidade-v1.png" alt="" />Acessibilidade</button><button onClick={() => setModal("help")}><img src="/icone-como-jogar-v1.png" alt="" />Como jogar</button>
      </nav><div className="menu-content"><Macaw message={<><strong>Olá, explorador!</strong><span>{selectedAvatar ? `${selectedAvatar.name}, pronto para conhecer o Brasil?` : "Escolha seu avatar para começar!"}</span></>} /><Logo /><div className="start-area"><button className={`start-button ${!selectedAvatar ? "start-locked" : ""}`} onClick={startAdventure} aria-disabled={!selectedAvatar}>INICIAR<br />AVENTURA <span aria-hidden="true"></span></button>{!selectedAvatar && <small className="avatar-required">🔒 Escolha um avatar primeiro</small>}</div></div><div className="footprints" aria-hidden="true"></div>
    </section>}

    {screen === "journey" && <section className="screen journey-screen"><header className="screen-header"><button className="round-control" onClick={() => setScreen("menu")} aria-label="Voltar ao menu">←<small>Voltar</small></button><div><h1>SUA JORNADA PELO BRASIL</h1><p>Aprenda, explore e avance por novas aventuras!</p></div><button className="round-control blue" onClick={() => setSound(!sound)} aria-pressed={sound}>{sound ? "🔊" : "🔇"}<small>Som</small></button></header><div className="journey-content"><Macaw message={<strong>Vamos começar?</strong>} /><div className="phase-track">{phases.map((phase, index) => <button key={phase.title} className={`phase-card ${phase.color} ${!phase.open ? "locked" : ""}`} disabled={!phase.open} onClick={() => setScreen("game")} aria-label={`${phase.number}, ${phase.title}${phase.open ? ", disponível" : ", bloqueada"}`}><span className="phase-icon">{phase.icon}</span><small>{phase.number}</small><strong>{phase.title}</strong><span className="phase-art">{index === 0 ? "🇧🇷" : phase.icon}</span><b>5 DESAFIOS</b><i>{phase.open ? "⭐" : "🔒"}</i></button>)}</div></div><p className="journey-tip">🌿 Complete cada fase para liberar a próxima! 🌿</p></section>}

    {screen === "game" && <section className="screen play-screen"><header className="play-header"><Logo compact /><h1>FASE 1 — ONDE ESTOU?</h1><div className="score">⭐ Pontos: {score}</div><button onClick={() => setScreen("journey")} aria-label="Voltar à jornada">←<small>Voltar</small></button><button onClick={() => setModal("help")} aria-label="Pausar jogo">Ⅱ<small>Pausar</small></button></header><div className="play-content"><Macaw message={<><strong>Olá, explorador!</strong><span>Encontre a Região {challenge.target} no mapa.</span></>} /><div className="map-area" aria-label="Mapa interativo das regiões do Brasil"><button className="region north" onClick={() => chooseRegion("Norte")}>NORTE</button><button className="region northeast" onClick={() => chooseRegion("Nordeste")}>NORDESTE</button><button className="region midwest" onClick={() => chooseRegion("Centro-Oeste")}>CENTRO-OESTE</button><button className="region southeast" onClick={() => chooseRegion("Sudeste")}>SUDESTE</button><button className="region south" onClick={() => chooseRegion("Sul")}>SUL</button></div><aside className="mission-card"><span className="counter">Desafio {challengeIndex + 1} de 5</span><div className="pin">📍</div><strong>Toque na região correta.</strong><p>{challenge.clue}</p><button className="listen" onClick={() => speak(instruction)}>🔊 OUVIR INSTRUÇÃO</button></aside></div><div className="progress" aria-label={`Progresso: desafio ${challengeIndex + 1} de 5`}>{challenges.map((_, index) => <span key={index} className={index <= challengeIndex ? "active" : ""}>{index + 1}</span>)}</div>
      {feedback !== "idle" && <div className={`feedback ${feedback}`} role="dialog" aria-live="assertive">{feedback === "wrong" && <><span>🧭</span><h2>Quase lá!</h2><p>Observe a dica e tente novamente. Errar também faz parte da aventura!</p><button onClick={() => setFeedback("idle")}>TENTAR NOVAMENTE</button></>}{feedback === "correct" && <><span>⭐</span><h2>Muito bem!</h2><p>Você encontrou a Região {challenge.target}!</p><button onClick={nextChallenge}>PRÓXIMO DESAFIO</button></>}{feedback === "finished" && <><span>🏆</span><h2>Fase concluída!</h2><p>Você explorou todas as regiões!</p><button onClick={() => setScreen("journey")}>VOLTAR À JORNADA</button><button className="secondary" onClick={restart}>JOGAR NOVAMENTE</button></>}</div>}
    </section>}

    {modal && <div className="modal-backdrop" role="presentation" onMouseDown={() => setModal(null)}><section className={`modal ${modal === "achievements" ? "achievements-modal" : modal === "sound" ? "sound-modal" : modal === "accessibility" ? "accessibility-modal" : modal === "help" ? "help-modal" : ""}`} role="dialog" aria-modal="true" aria-labelledby="modal-title" onMouseDown={(e) => e.stopPropagation()}><button className="modal-close" onClick={() => setModal(null)} aria-label="Fechar">×</button>{modal === "avatar" && <><h2 id="modal-title">Escolha seu avatar</h2>{avatarReminder && <p className="avatar-alert" role="alert">Escolha um personagem para liberar a aventura!</p>}<div className="avatar-grid">{avatars.map((avatar) => <button key={avatar.id} className={avatar.id === avatarId ? "selected" : ""} onClick={() => chooseAvatar(avatar.id)} aria-pressed={avatar.id === avatarId} aria-label={`Escolher ${avatar.description}`}><img src={avatar.image} alt="" /><strong>{avatar.name}</strong><small>{avatar.description}</small>{avatar.id === avatarId && <b>✓ Escolhido</b>}</button>)}</div><p className="avatar-safety">Você pode trocar de avatar quando quiser.</p></>}{modal === "achievements" && <><header className="achievements-heading"><img src="/icone-conquistas-v1.png" alt="" /><div><h2 id="modal-title">MINHAS CONQUISTAS</h2><p><strong>{unlockedAchievements} de 6</strong> conquistadas</p></div></header><div className="achievement-progress" aria-label={`${unlockedAchievements} de 6 conquistas desbloqueadas`}><span style={{ width: `${(unlockedAchievements / 6) * 100}%` }}></span>{achievements.map((_, index) => <i key={index} className={index < unlockedAchievements ? "earned" : ""}>★</i>)}</div><div className="achievement-grid">{achievements.map((achievement) => <article key={achievement.title} className={achievement.unlocked ? "unlocked" : "locked"}><div className="achievement-medal" aria-hidden="true">{achievement.icon}</div>{!achievement.unlocked && <span className="achievement-lock" aria-label="Conquista bloqueada">🔒</span>}<h3>{achievement.title}</h3><p>{achievement.description}</p><small>{achievement.unlocked ? "✓ CONQUISTADA" : "BLOQUEADA"}</small></article>)}</div><footer className="achievements-footer">Continue explorando para desbloquear novas medalhas!</footer></>}{modal === "sound" && <><header className="sound-heading"><img src="/icone-som-v1.png" alt="" /><h2 id="modal-title">SOM E NARRAÇÃO</h2></header><div className="volume-control"><strong>VOLUME GERAL</strong><div><span aria-hidden="true">🔈</span><input type="range" min="0" max="100" value={volume} onChange={(e) => setVolume(Number(e.target.value))} aria-label="Volume geral" style={{ background: `linear-gradient(90deg, #13aef0 0%, #13aef0 ${volume}%, #66bd38 ${volume}%, #66bd38 100%)` }} /><span aria-hidden="true">🔊</span></div></div><div className="sound-options"><article className="music-option"><img className="sound-option-icon" src="/som-musica-v1.png" alt="" /><div><h3>MÚSICA</h3><p>Música de fundo do jogo</p></div><button className={music ? "toggle on" : "toggle"} onClick={() => setMusic(!music)} role="switch" aria-checked={music} aria-label="Música">{music ? "LIGADO" : "DESLIGADO"}<i></i></button></article><article className="effects-option"><img className="sound-option-icon" src="/som-efeitos-v1.png" alt="" /><div><h3>EFEITOS SONOROS</h3><p>Botões, acertos e recompensas</p></div><button className={effects ? "toggle on" : "toggle"} onClick={() => setEffects(!effects)} role="switch" aria-checked={effects} aria-label="Efeitos sonoros">{effects ? "LIGADO" : "DESLIGADO"}<i></i></button></article><article className="narration-option"><img className="sound-option-icon" src="/som-narracao-v2.png" alt="" /><div><h3>NARRAÇÃO</h3><p>Instruções e perguntas faladas</p></div><button className={sound ? "toggle on" : "toggle"} onClick={() => setSound(!sound)} role="switch" aria-checked={sound} aria-label="Narração">{sound ? "LIGADO" : "DESLIGADO"}<i></i></button></article></div></>}{modal === "accessibility" && <><header className="accessibility-heading"><img src="/icone-acessibilidade-v1.png" alt="" /><h2 id="modal-title">ACESSIBILIDADE</h2></header><div className="accessibility-options"><article className="contrast-option"><span className="accessibility-icon contrast-icon" aria-hidden="true"></span><div><h3>ALTO CONTRASTE</h3><p>Aumenta a diferença entre as cores</p></div><button className={highContrast ? "toggle on" : "toggle"} onClick={() => setHighContrast(!highContrast)} role="switch" aria-checked={highContrast} aria-label="Alto contraste">{highContrast ? "LIGADO" : "DESLIGADO"}<i></i></button></article><article className="text-option"><span className="accessibility-icon text-icon" aria-hidden="true">AA</span><div><h3>TEXTO AMPLIADO</h3><p>Aumenta o tamanho das letras</p></div><div className="text-size-control" role="group" aria-label="Tamanho do texto"><button className={!largeText ? "selected" : ""} onClick={() => setLargeText(false)} aria-pressed={!largeText}>NORMAL</button><button className={largeText ? "selected" : ""} onClick={() => setLargeText(true)} aria-pressed={largeText}>GRANDE</button></div></article><article className="highlight-option"><span className="accessibility-icon highlight-icon" aria-hidden="true">☝</span><div><h3>DESTAQUE DOS BOTÕES</h3><p>Realça os botões interativos</p></div><button className={buttonHighlight ? "toggle on" : "toggle"} onClick={() => setButtonHighlight(!buttonHighlight)} role="switch" aria-checked={buttonHighlight} aria-label="Destaque visual dos botões">{buttonHighlight ? "LIGADO" : "DESLIGADO"}<i></i></button></article></div><div className="accessibility-footprints" aria-hidden="true">👣　👣</div></>}{modal === "help" && <HowToPlay />}</section></div>}
  </div></main>;
}
