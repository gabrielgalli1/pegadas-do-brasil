"use client";

import { useState } from "react";

type AccessMode = "welcome" | "create" | "login";

export default function PlayerAccessScreen({ onContinue }: { onContinue: () => void }) {
  const [mode, setMode] = useState<AccessMode>("welcome");
  const [showPin, setShowPin] = useState(false);

  const submitPreview = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onContinue();
  };

  return <section className="player-access-screen" aria-label="Acesso do jogador">
    <div className="player-access-brand">
      <img src="/pegadas-logo-v1.png" alt="Pegadas do Brasil" />
      <div className="player-access-welcome">
        <img src="/arara-mascote-v1.png" alt="" aria-hidden="true" />
        <div><strong>Uma aventura pelo Brasil!</strong><p>Explore mapas, conheça animais e descubra paisagens enquanto completa desafios divertidos.</p></div>
      </div>
      <div className="player-access-benefits" aria-label="Destaques do jogo">
        <span><i aria-hidden="true">🗺️</i> Explore as regiões</span>
        <span><i aria-hidden="true">🎯</i> Complete desafios</span>
        <span><i aria-hidden="true">🏅</i> Ganhe emblemas</span>
      </div>
    </div>

    <div className="player-access-card">
      {mode !== "welcome" && <button className="player-access-back" type="button" onClick={() => setMode("welcome")} aria-label="Voltar às opções de acesso">
        <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M14 7 5 16l9 9M6 16h20" /></svg>
      </button>}

      {mode === "welcome" && <>
        <div className="player-access-card-icon" aria-hidden="true"><img src="/feedback-compass-v1.webp" alt="" /></div>
        <h1>Olá, explorador!</h1>
        <p>Escolha como você quer começar.</p>
        <button className="player-access-primary" type="button" onClick={() => setMode("create")}><span aria-hidden="true">＋</span><b>CRIAR MEU APELIDO</b><small>Primeira vez por aqui</small></button>
        <button className="player-access-secondary" type="button" onClick={() => setMode("login")}><span aria-hidden="true"><img src="/acesso-chave-v1.svg" alt="" /></span><b>JÁ TENHO UM APELIDO</b><small>Entrar com apelido e PIN</small></button>
        <button className="player-access-guest" type="button" onClick={onContinue}>Jogar sem conta por enquanto</button>
      </>}

      {mode === "create" && <form className="player-access-form" onSubmit={submitPreview}>
        <div className="player-access-card-icon small" aria-hidden="true"><img src="/feedback-star-v1.webp" alt="" /></div>
        <h1>Crie seu apelido</h1>
        <p>Escolha um apelido e um PIN para acessar seu jogador.</p>
        <label>Apelido do explorador<input type="text" maxLength={15} placeholder="Ex: Onça Veloz" required /></label>
        <label>Crie um PIN de 4 números<div className="player-pin-field"><input type={showPin ? "text" : "password"} inputMode="numeric" pattern="[0-9]{4}" maxLength={4} placeholder="••••" required /><button type="button" onClick={() => setShowPin((value) => !value)} aria-label={showPin ? "Ocultar PIN" : "Mostrar PIN"}><img src={showPin ? "/acesso-olho-fechado-v1.svg" : "/acesso-olho-v1.svg"} alt="" /></button></div></label>
        <p className="player-access-adult-note"><img src="/acesso-escudo-v1.svg" alt="" aria-hidden="true" /> Peça ajuda a um adulto para lembrar seu apelido e PIN.</p>
        <button className="player-access-submit" type="submit">CRIAR E CONTINUAR <span aria-hidden="true">→</span></button>
      </form>}

      {mode === "login" && <form className="player-access-form" onSubmit={submitPreview}>
        <div className="player-access-card-icon small" aria-hidden="true"><img src="/acesso-chave-v1.svg" alt="" /></div>
        <h1>Continue sua aventura</h1>
        <p>Digite o mesmo apelido e PIN usados no cadastro.</p>
        <label>Apelido do explorador<input type="text" maxLength={15} placeholder="Ex: Onça Veloz" required /></label>
        <label>PIN de 4 números<div className="player-pin-field"><input type={showPin ? "text" : "password"} inputMode="numeric" pattern="[0-9]{4}" maxLength={4} placeholder="••••" required /><button type="button" onClick={() => setShowPin((value) => !value)} aria-label={showPin ? "Ocultar PIN" : "Mostrar PIN"}><img src={showPin ? "/acesso-olho-fechado-v1.svg" : "/acesso-olho-v1.svg"} alt="" /></button></div></label>
        <button className="player-access-submit" type="submit">ENTRAR NO JOGO <span aria-hidden="true">→</span></button>
        <button className="player-access-help" type="button">Esqueci meu apelido ou PIN</button>
      </form>}
    </div>

    <small className="player-access-safety"><span aria-hidden="true">★</span> Aprenda Geografia brincando e explorando o Brasil!</small>
  </section>;
}
