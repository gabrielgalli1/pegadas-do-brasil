"use client";

import { useEffect, useRef, useState } from "react";

type Screen = "menu" | "journey" | "game";
const plannedChallengeCount = 5;

const journeyLevels = [
  { id: "brasil", title: "Conhecendo o Brasil", image: "/fase-inicial-v3.png", phases: 5 },
  { id: "norte", title: "Região Norte", image: "/fase-norte-v3.png", phases: 6 },
  { id: "nordeste", title: "Região Nordeste", image: "/fase-nordeste-v3.png", phases: 6 },
  { id: "centro-oeste", title: "Região Centro-Oeste", image: "/fase-centro-oeste-v3.png", phases: 6 },
  { id: "sudeste", title: "Região Sudeste", image: "/fase-sudeste-v3.png", phases: 6 },
  { id: "sul", title: "Região Sul", image: "/fase-sul-v3.png", phases: 6 },
] as const;

const countryOptions = [
  { id: "brasil", label: "A", image: "/silhueta-brasil-v1.png" },
  { id: "argentina", label: "B", image: "/silhueta-argentina-v1.png" },
  { id: "chile", label: "C", image: "/silhueta-chile-v1.png" },
  { id: "peru", label: "D", image: "/silhueta-peru-v1.png" },
] as const;

const continentOptions = ["América do Sul", "América do Norte", "Europa", "África"] as const;

const oceanOptions = [
  { id: "atlantico", label: "Oceano Atlântico", icon: "/icone-oceano-onda-v1.png" },
  { id: "pacifico", label: "Oceano Pacífico", icon: "/icone-oceano-onda-v1.png" },
  { id: "indico", label: "Oceano Índico", icon: "/icone-oceano-onda-v1.png" },
  { id: "artico", label: "Oceano Ártico", icon: "/icone-oceano-gelo-v1.png" },
] as const;

const stateCountOptions = [24, 26, 27, 28] as const;

const landscapeOptions = [
  { id: "amazonia", label: "Floresta Amazônica", image: "/paisagem-amazonia-v1.png" },
  { id: "deserto", label: "Paisagem desértica", image: "/paisagem-deserto-v1.png" },
  { id: "neve", label: "Paisagem de neve", image: "/paisagem-neve-v1.png" },
  { id: "savana", label: "Savana africana", image: "/paisagem-savana-v1.png" },
] as const;

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

function TransparentStateMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const image = new Image();
    image.src = "/mapa-brasil-estados-coloridos-v1.png";
    image.onload = () => {
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) return;
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      context.drawImage(image, 0, 0);
      const frame = context.getImageData(0, 0, canvas.width, canvas.height);
      const { data } = frame;
      const total = canvas.width * canvas.height;
      const visited = new Uint8Array(total);
      const queue = new Int32Array(total);
      let head = 0;
      let tail = 0;
      const isBackground = (pixel: number) => {
        const offset = pixel * 4;
        const red = data[offset];
        const green = data[offset + 1];
        const blue = data[offset + 2];
        return Math.max(red, green, blue) - Math.min(red, green, blue) < 20 && (red + green + blue) / 3 > 220;
      };
      const enqueue = (pixel: number) => {
        if (!visited[pixel] && isBackground(pixel)) {
          visited[pixel] = 1;
          queue[tail++] = pixel;
        }
      };
      for (let x = 0; x < canvas.width; x += 1) {
        enqueue(x);
        enqueue((canvas.height - 1) * canvas.width + x);
      }
      for (let y = 0; y < canvas.height; y += 1) {
        enqueue(y * canvas.width);
        enqueue(y * canvas.width + canvas.width - 1);
      }
      while (head < tail) {
        const pixel = queue[head++];
        data[pixel * 4 + 3] = 0;
        const x = pixel % canvas.width;
        const y = Math.floor(pixel / canvas.width);
        if (x > 0) enqueue(pixel - 1);
        if (x + 1 < canvas.width) enqueue(pixel + 1);
        if (y > 0) enqueue(pixel - canvas.width);
        if (y + 1 < canvas.height) enqueue(pixel + canvas.width);
      }
      context.putImageData(frame, 0, 0);
    };
  }, []);
  return <canvas ref={canvasRef} className="states-map" role="img" aria-label="Mapa do Brasil com 26 estados e o Distrito Federal destacados em cores diferentes" />;
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
  const [unlockedLevel, setUnlockedLevel] = useState(0);
  const [journeyNotice, setJourneyNotice] = useState<string | null>(null);
  useEffect(() => {
    const saved = window.localStorage.getItem("pegadas-progress");
    if (saved) try { const data = JSON.parse(saved); setScore(data.score || 0); setChallengeIndex(Math.min(data.challengeIndex || 0, 4)); setCompletedChallenges(Math.min(data.completedChallenges || 0, 5)); setFirstTryWins(data.firstTryWins || 0); setHighestScore(data.highestScore || data.score || 0); setCompletedPhase(Boolean(data.completedPhase)); setUnlockedLevel(Math.min(5, Math.max(data.unlockedLevel || 0, data.completedPhase ? 1 : 0))); } catch { /* ignora progresso inválido */ }
    setAvatarId(window.localStorage.getItem("pegadas-avatar"));
    const savedAudio = window.localStorage.getItem("pegadas-audio");
    if (savedAudio) try { const audio = JSON.parse(savedAudio); setMusic(audio.music ?? true); setEffects(audio.effects ?? true); setSound(audio.narration ?? true); setVolume(audio.volume ?? 75); } catch { /* mantém as configurações padrão */ }
    const savedAccessibility = window.localStorage.getItem("pegadas-accessibility");
    if (savedAccessibility) try { const accessibility = JSON.parse(savedAccessibility); setHighContrast(accessibility.highContrast ?? false); setLargeText(accessibility.largeText ?? false); setButtonHighlight(accessibility.buttonHighlight ?? false); } catch { /* mantém as configurações padrão */ }
  }, []);
  useEffect(() => { window.localStorage.setItem("pegadas-progress", JSON.stringify({ score, challengeIndex, completedChallenges, firstTryWins, highestScore, completedPhase, unlockedLevel })); }, [score, challengeIndex, completedChallenges, firstTryWins, highestScore, completedPhase, unlockedLevel]);
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

  function chooseCountry(country: string) {
    if (feedback === "correct" || feedback === "finished") return;
    setAttempts((value) => value + 1);
    if (country === "brasil") {
      const earnedPoints = attempts === 0 ? 100 : 60;
      setScore((value) => { const nextScore = value + earnedPoints; setHighestScore((best) => Math.max(best, nextScore)); return nextScore; });
      setCompletedChallenges((value) => Math.max(value, 1));
      if (attempts === 0) setFirstTryWins((value) => value + 1);
      setFeedback("correct");
      if (sound) speak("Muito bem! Essa é a silhueta do Brasil!");
    } else {
      setFeedback("wrong");
      if (sound) speak("Quase! Observe o formato de cada país e tente novamente.");
    }
  }
  function chooseContinent(continent: string) {
    if (feedback === "correct" || feedback === "finished") return;
    setAttempts((value) => value + 1);
    if (continent === "América do Sul") {
      const earnedPoints = attempts === 0 ? 100 : 60;
      setScore((value) => { const nextScore = value + earnedPoints; setHighestScore((best) => Math.max(best, nextScore)); return nextScore; });
      setCompletedChallenges((value) => Math.max(value, 2));
      if (attempts === 0) setFirstTryWins((value) => value + 1);
      setFeedback("correct");
      if (sound) speak("Muito bem! O Brasil está localizado na América do Sul!");
    } else {
      setFeedback("wrong");
      if (sound) speak("Quase! Observe o mapa e tente novamente.");
    }
  }
  function chooseOcean(ocean: string) {
    if (feedback === "correct" || feedback === "finished") return;
    setAttempts((value) => value + 1);
    if (ocean === "atlantico") {
      const earnedPoints = attempts === 0 ? 100 : 60;
      setScore((value) => { const nextScore = value + earnedPoints; setHighestScore((best) => Math.max(best, nextScore)); return nextScore; });
      setCompletedChallenges((value) => Math.max(value, 3));
      if (attempts === 0) setFirstTryWins((value) => value + 1);
      setFeedback("correct");
      if (sound) speak("Muito bem! O Oceano Atlântico banha o litoral do Brasil!");
    } else {
      setFeedback("wrong");
      if (sound) speak("Quase! Observe o litoral do Brasil e tente novamente.");
    }
  }
  function chooseStateCount(count: number) {
    if (feedback === "correct" || feedback === "finished") return;
    setAttempts((value) => value + 1);
    if (count === 27) {
      const earnedPoints = attempts === 0 ? 100 : 60;
      setScore((value) => { const nextScore = value + earnedPoints; setHighestScore((best) => Math.max(best, nextScore)); return nextScore; });
      setCompletedChallenges((value) => Math.max(value, 4));
      if (attempts === 0) setFirstTryWins((value) => value + 1);
      setFeedback("correct");
      if (sound) speak("Muito bem! O Brasil possui 26 estados e o Distrito Federal, formando 27 unidades federativas!");
    } else {
      setFeedback("wrong");
      if (sound) speak("Quase! Conte cada parte colorida do mapa, incluindo o Distrito Federal, e tente novamente.");
    }
  }
  function chooseLandscape(landscape: string) {
    if (feedback === "correct" || feedback === "finished") return;
    setAttempts((value) => value + 1);
    if (landscape === "amazonia") {
      const earnedPoints = attempts === 0 ? 100 : 60;
      setScore((value) => { const nextScore = value + earnedPoints; setHighestScore((best) => Math.max(best, nextScore)); return nextScore; });
      setCompletedChallenges(5);
      if (attempts === 0) setFirstTryWins((value) => value + 1);
      setCompletedPhase(true);
      setUnlockedLevel((value) => Math.max(value, 1));
      setFeedback("finished");
      if (sound) speak("Muito bem! A Floresta Amazônica está presente no Brasil e é uma das maiores florestas tropicais do mundo!");
    } else {
      setFeedback("wrong");
      if (sound) speak("Quase! Observe a vegetação e o clima de cada paisagem e tente novamente.");
    }
  }
  function nextChallenge() {
    setChallengeIndex((value) => value + 1); setFeedback("idle"); setAttempts(0);
  }
  function restart() { setChallengeIndex(0); setScore(0); setFeedback("idle"); setAttempts(0); }
  function openJourneyLevel(index: number) {
    setJourneyNotice(null);
    if (index === 0) { setScreen("game"); return; }
    setJourneyNotice(`${journeyLevels[index].title} desbloqueada! As aventuras desta região serão adicionadas na próxima etapa.`);
  }

  return <main className={`${highContrast ? "high-contrast" : ""} ${largeText ? "large-text" : ""} ${buttonHighlight ? "button-highlight" : ""}`}><div className="game-shell">
    {screen === "menu" && <section className="screen menu-screen" aria-label="Menu principal">
      <nav className="menu-tools" aria-label="Opções do jogo">
        <button className={selectedAvatar ? "avatar-selected-tool" : ""} onClick={() => setModal("avatar")}><span className="menu-avatar" aria-hidden="true"><img src={selectedAvatar?.image ?? "/icone-avatar-v1.png"} alt="" /></span>{selectedAvatar ? selectedAvatar.name : "Avatar"}</button><button onClick={() => setModal("achievements")}><img src="/icone-conquistas-v1.png" alt="" />Conquistas</button><button className={!sound ? "sound-muted" : ""} onClick={() => setModal("sound")}><img src="/icone-som-v1.png" alt="" />Som</button><button onClick={() => setModal("accessibility")}><img src="/icone-acessibilidade-v1.png" alt="" />Acessibilidade</button><button onClick={() => setModal("help")}><img src="/icone-como-jogar-v1.png" alt="" />Como jogar</button>
      </nav><div className="menu-content"><Macaw message={<><strong>Olá, explorador!</strong><span>{selectedAvatar ? `${selectedAvatar.name}, pronto para conhecer o Brasil?` : "Escolha seu avatar para começar!"}</span></>} /><Logo /><div className="start-area"><button className={`start-button ${!selectedAvatar ? "start-locked" : ""}`} onClick={startAdventure} aria-disabled={!selectedAvatar}>INICIAR<br />AVENTURA <span aria-hidden="true"></span></button>{!selectedAvatar && <small className="avatar-required">🔒 Escolha um avatar primeiro</small>}</div></div><div className="footprints" aria-hidden="true"></div>
    </section>}

    {screen === "journey" && <section className="screen journey-screen journey-map" aria-label="Escolha sua aventura">
      <button className="journey-art-button journey-back" onClick={() => setScreen("menu")} aria-label="Voltar ao menu"><img src="/fases-voltar-v1.png" alt="" /></button>
      <header className="journey-heading">
        <h1><span aria-hidden="true">◆</span> ESCOLHA SUA AVENTURA <span aria-hidden="true">◆</span></h1>
        <p>Aprenda, explore e descubra o Brasil passo a passo!</p>
      </header>
      <button className={`journey-art-button journey-sound ${!sound ? "muted" : ""}`} onClick={() => setSound(!sound)} aria-label={sound ? "Desligar som" : "Ligar som"} aria-pressed={sound}><img src="/fases-som-v1.png" alt="" /></button>
      <img className="journey-mascot-art" src="/fases-mascote-v2.png" alt="Arara Ari convidando você para explorar o Brasil" />
      <div className="journey-levels">
        {journeyLevels.map((level, index) => {
          const unlocked = index <= unlockedLevel;
          const completed = index < unlockedLevel || (index === 0 && completedPhase);
          return <button key={level.id} className={`journey-level ${unlocked ? "unlocked" : "locked"} ${completed ? "completed" : ""}`} disabled={!unlocked} onClick={() => openJourneyLevel(index)} aria-label={`${level.title}, ${level.phases} fases, ${completed ? "concluída" : unlocked ? "disponível" : "bloqueada"}`}>
            <img src={level.image} alt="" />
            <span className="journey-level-state" aria-hidden="true">{!unlocked ? "🔒" : completed ? "★" : "▶"}</span>
          </button>;
        })}
      </div>
      {journeyNotice && <div className="journey-notice" role="status">{journeyNotice}<button onClick={() => setJourneyNotice(null)} aria-label="Fechar aviso">×</button></div>}
      <p className="journey-footer"><span aria-hidden="true">●</span> Complete as fases na ordem para desbloquear novas regiões! <span aria-hidden="true">●</span></p>
    </section>}

    {screen === "game" && <section className="screen play-screen challenge-screen">
      <header className="challenge-header">
        <button className="challenge-control back" onClick={() => setScreen("journey")} aria-label="Voltar à jornada"><img src="/fases-voltar-v1.png" alt="" /></button>
        <div className="challenge-status"><b>DESAFIO {challengeIndex + 1} DE 5</b><div aria-label={`${challengeIndex + 1} de 5 desafios`}>{Array.from({ length: plannedChallengeCount }, (_, index) => <span key={index} className={index <= challengeIndex ? "active" : ""}>★</span>)}</div></div>
        <button className={`challenge-control sound ${!sound ? "muted" : ""}`} onClick={() => setSound(!sound)} aria-label={sound ? "Desligar som" : "Ligar som"}><img src="/fases-som-v1.png" alt="" /></button>
      </header>
      {challengeIndex === 0 ? <div className="silhouette-challenge">
        <div className="challenge-title"><h1>RECONHEÇA O BRASIL</h1><p>Qual dessas silhuetas representa o Brasil?</p></div>
        <div className="silhouette-guide"><div className="silhouette-tip">Observe bem o formato de cada país!</div><img className="challenge-mascot" src="/arara-mascote-v1.png" alt="Arara Ari apontando para as opções" /></div>
        <div className="country-grid" role="group" aria-label="Escolha a silhueta do Brasil">
          {countryOptions.map((country) => <button key={country.id} className={`country-card country-${country.id}`} onClick={() => chooseCountry(country.id)} aria-label={`Opção ${country.label}`}>
            <span className="country-letter">{country.label}</span>
            <img className="country-shape" src={country.image} alt="" />
          </button>)}
        </div>
        <button className="challenge-listen" onClick={() => speak("Qual dessas silhuetas representa o Brasil?")}>🔊 OUVIR PERGUNTA</button>
      </div> : challengeIndex === 1 ? <div className="continent-challenge">
        <div className="challenge-title"><h1>ONDE FICA O BRASIL?</h1><p>Em qual continente o Brasil está localizado?</p></div>
        <div className="continent-guide"><div className="mascot-tip">Observe as cores e escolha o continente certo!</div><img className="continent-mascot" src="/arara-mascote-v1.png" alt="Arara Ari apresentando o mapa-múndi" /></div>
        <div className="world-map-card"><img className="world-map" src="/mapa-mundi-continentes-v3.png" alt="Mapa-múndi: América do Sul verde, América do Norte azul, Europa roxa e África laranja" /></div>
        <div className="continent-options" role="group" aria-label="Escolha o continente onde fica o Brasil">
          {continentOptions.map((continent, index) => <button key={continent} className={`continent-option option-${index + 1}`} onClick={() => chooseContinent(continent)}>{continent}</button>)}
        </div>
        <button className="challenge-listen" onClick={() => speak("Em qual continente o Brasil está localizado?")}>🔊 OUVIR PERGUNTA</button>
      </div> : challengeIndex === 2 ? <div className="ocean-challenge">
        <div className="challenge-title"><h1>QUAL OCEANO?</h1><p>Qual oceano banha o litoral do Brasil?</p></div>
        <div className="ocean-stage">
          <div className="ocean-map-card">
            <img className="ocean-map" src="/mapa-brasil-oceano-atlantico-v1.png" alt="Mapa ilustrado do Brasil ao lado do Oceano Atlântico" />
            <div className="ocean-guide"><div className="ocean-tip">Observe o litoral do Brasil!</div><img src="/arara-mascote-v1.png" alt="Arara Ari indicando o mapa" /></div>
          </div>
          <div className="ocean-panel">
            <h2>ESCOLHA A RESPOSTA</h2>
            <div className="ocean-options" role="group" aria-label="Escolha o oceano que banha o Brasil">
              {oceanOptions.map((ocean, index) => <button key={ocean.id} className={`ocean-option ocean-option-${index + 1}`} onClick={() => chooseOcean(ocean.id)}><span aria-hidden="true"><img src={ocean.icon} alt="" /></span><strong>{ocean.label}</strong></button>)}
            </div>
          </div>
        </div>
        <button className="challenge-listen" onClick={() => speak("Qual oceano banha o litoral do Brasil?")}>🔊 OUVIR PERGUNTA</button>
      </div> : challengeIndex === 3 ? <div className="states-challenge">
        <div className="challenge-title"><h1>QUANTOS ESTADOS?</h1><p>Quantas unidades federativas o Brasil possui?</p></div>
        <div className="states-guide"><div className="states-tip">Conte cada parte colorida.<br /><strong>Não esqueça do Distrito Federal!</strong></div><img src="/arara-mascote-v1.png" alt="Arara Ari ajudando a contar os estados" /></div>
        <div className="states-map-card"><TransparentStateMap /></div>
        <div className="state-count-options" role="group" aria-label="Escolha quantas unidades federativas o Brasil possui">
          {stateCountOptions.map((count) => <button key={count} className="state-count-option" onClick={() => chooseStateCount(count)}>{count}</button>)}
        </div>
        <button className="challenge-listen" onClick={() => speak("Observe o mapa. Quantas unidades federativas o Brasil possui? Conte os 26 estados e o Distrito Federal.")}>🔊 OUVIR PERGUNTA</button>
      </div> : <div className="landscape-challenge">
        <div className="challenge-title"><h1>PAISAGEM DO BRASIL</h1><p>Qual destas paisagens está presente no Brasil?</p></div>
        <div className="landscape-guide"><div className="landscape-tip">Observe a vegetação, as cores e o clima!</div><img src="/arara-mascote-v1.png" alt="Arara Ari convidando a observar as paisagens" /></div>
        <div className="landscape-options" role="group" aria-label="Escolha a paisagem presente no Brasil">
          {landscapeOptions.map((landscape, index) => <button key={landscape.id} className={`landscape-option landscape-option-${index + 1}`} onClick={() => chooseLandscape(landscape.id)}>
            <img src={landscape.image} alt={landscape.label} />
            <strong>{landscape.label}</strong>
          </button>)}
        </div>
        <button className="challenge-listen" onClick={() => speak("Qual destas paisagens está presente no Brasil?")}>🔊 OUVIR PERGUNTA</button>
      </div>}
      {feedback !== "idle" && <div className={`feedback ${feedback}`} role="dialog" aria-live="assertive">{feedback === "wrong" && <><span>🧭</span><h2>Quase lá!</h2><p>{challengeIndex === 0 ? "Observe o formato de cada país e tente novamente." : challengeIndex === 1 ? "Observe as cores e a posição dos continentes no mapa." : challengeIndex === 2 ? "Observe o litoral do Brasil e tente novamente." : challengeIndex === 3 ? "Conte cada parte colorida, incluindo o Distrito Federal." : "Observe a vegetação e o clima de cada paisagem."}</p><button onClick={() => setFeedback("idle")}>TENTAR NOVAMENTE</button></>}{feedback === "correct" && <><span>⭐</span><h2>Muito bem!</h2><p>{challengeIndex === 0 ? "Essa é a silhueta do Brasil!" : challengeIndex === 1 ? "O Brasil está localizado na América do Sul!" : challengeIndex === 2 ? "O Oceano Atlântico banha o litoral do Brasil!" : "O Brasil possui 26 estados e o Distrito Federal: 27 unidades federativas!"}</p><button onClick={nextChallenge}>PRÓXIMO DESAFIO</button></>}{feedback === "finished" && <><span>🏆</span><h2>Nível concluído!</h2><p>Muito bem! A Floresta Amazônica está presente no Brasil. Você concluiu os cinco desafios!</p><button onClick={() => setScreen("journey")}>VOLTAR À JORNADA</button><button className="secondary" onClick={restart}>JOGAR NOVAMENTE</button></>}</div>}
    </section>}

    {modal && <div className="modal-backdrop" role="presentation" onMouseDown={() => setModal(null)}><section className={`modal ${modal === "achievements" ? "achievements-modal" : modal === "sound" ? "sound-modal" : modal === "accessibility" ? "accessibility-modal" : modal === "help" ? "help-modal" : ""}`} role="dialog" aria-modal="true" aria-labelledby="modal-title" onMouseDown={(e) => e.stopPropagation()}><button className="modal-close" onClick={() => setModal(null)} aria-label="Fechar">×</button>{modal === "avatar" && <><h2 id="modal-title">Escolha seu avatar</h2>{avatarReminder && <p className="avatar-alert" role="alert">Escolha um personagem para liberar a aventura!</p>}<div className="avatar-grid">{avatars.map((avatar) => <button key={avatar.id} className={avatar.id === avatarId ? "selected" : ""} onClick={() => chooseAvatar(avatar.id)} aria-pressed={avatar.id === avatarId} aria-label={`Escolher ${avatar.description}`}><img src={avatar.image} alt="" /><strong>{avatar.name}</strong><small>{avatar.description}</small>{avatar.id === avatarId && <b>✓ Escolhido</b>}</button>)}</div><p className="avatar-safety">Você pode trocar de avatar quando quiser.</p></>}{modal === "achievements" && <><header className="achievements-heading"><img src="/icone-conquistas-v1.png" alt="" /><div><h2 id="modal-title">MINHAS CONQUISTAS</h2><p><strong>{unlockedAchievements} de 6</strong> conquistadas</p></div></header><div className="achievement-progress" aria-label={`${unlockedAchievements} de 6 conquistas desbloqueadas`}><span style={{ width: `${(unlockedAchievements / 6) * 100}%` }}></span>{achievements.map((_, index) => <i key={index} className={index < unlockedAchievements ? "earned" : ""}>★</i>)}</div><div className="achievement-grid">{achievements.map((achievement) => <article key={achievement.title} className={achievement.unlocked ? "unlocked" : "locked"}><div className="achievement-medal" aria-hidden="true">{achievement.icon}</div>{!achievement.unlocked && <span className="achievement-lock" aria-label="Conquista bloqueada">🔒</span>}<h3>{achievement.title}</h3><p>{achievement.description}</p><small>{achievement.unlocked ? "✓ CONQUISTADA" : "BLOQUEADA"}</small></article>)}</div><footer className="achievements-footer">Continue explorando para desbloquear novas medalhas!</footer></>}{modal === "sound" && <><header className="sound-heading"><img src="/icone-som-v1.png" alt="" /><h2 id="modal-title">SOM E NARRAÇÃO</h2></header><div className="volume-control"><strong>VOLUME GERAL</strong><div><span aria-hidden="true">🔈</span><input type="range" min="0" max="100" value={volume} onChange={(e) => setVolume(Number(e.target.value))} aria-label="Volume geral" style={{ background: `linear-gradient(90deg, #13aef0 0%, #13aef0 ${volume}%, #66bd38 ${volume}%, #66bd38 100%)` }} /><span aria-hidden="true">🔊</span></div></div><div className="sound-options"><article className="music-option"><img className="sound-option-icon" src="/som-musica-v1.png" alt="" /><div><h3>MÚSICA</h3><p>Música de fundo do jogo</p></div><button className={music ? "toggle on" : "toggle"} onClick={() => setMusic(!music)} role="switch" aria-checked={music} aria-label="Música">{music ? "LIGADO" : "DESLIGADO"}<i></i></button></article><article className="effects-option"><img className="sound-option-icon" src="/som-efeitos-v1.png" alt="" /><div><h3>EFEITOS SONOROS</h3><p>Botões, acertos e recompensas</p></div><button className={effects ? "toggle on" : "toggle"} onClick={() => setEffects(!effects)} role="switch" aria-checked={effects} aria-label="Efeitos sonoros">{effects ? "LIGADO" : "DESLIGADO"}<i></i></button></article><article className="narration-option"><img className="sound-option-icon" src="/som-narracao-v2.png" alt="" /><div><h3>NARRAÇÃO</h3><p>Instruções e perguntas faladas</p></div><button className={sound ? "toggle on" : "toggle"} onClick={() => setSound(!sound)} role="switch" aria-checked={sound} aria-label="Narração">{sound ? "LIGADO" : "DESLIGADO"}<i></i></button></article></div></>}{modal === "accessibility" && <><header className="accessibility-heading"><img src="/icone-acessibilidade-v1.png" alt="" /><h2 id="modal-title">ACESSIBILIDADE</h2></header><div className="accessibility-options"><article className="contrast-option"><span className="accessibility-icon contrast-icon" aria-hidden="true"></span><div><h3>ALTO CONTRASTE</h3><p>Aumenta a diferença entre as cores</p></div><button className={highContrast ? "toggle on" : "toggle"} onClick={() => setHighContrast(!highContrast)} role="switch" aria-checked={highContrast} aria-label="Alto contraste">{highContrast ? "LIGADO" : "DESLIGADO"}<i></i></button></article><article className="text-option"><span className="accessibility-icon text-icon" aria-hidden="true">AA</span><div><h3>TEXTO AMPLIADO</h3><p>Aumenta o tamanho das letras</p></div><div className="text-size-control" role="group" aria-label="Tamanho do texto"><button className={!largeText ? "selected" : ""} onClick={() => setLargeText(false)} aria-pressed={!largeText}>NORMAL</button><button className={largeText ? "selected" : ""} onClick={() => setLargeText(true)} aria-pressed={largeText}>GRANDE</button></div></article><article className="highlight-option"><span className="accessibility-icon highlight-icon" aria-hidden="true">☝</span><div><h3>DESTAQUE DOS BOTÕES</h3><p>Realça os botões interativos</p></div><button className={buttonHighlight ? "toggle on" : "toggle"} onClick={() => setButtonHighlight(!buttonHighlight)} role="switch" aria-checked={buttonHighlight} aria-label="Destaque visual dos botões">{buttonHighlight ? "LIGADO" : "DESLIGADO"}<i></i></button></article></div><div className="accessibility-footprints" aria-hidden="true">👣　👣</div></>}{modal === "help" && <HowToPlay />}</section></div>}
  </div></main>;
}
