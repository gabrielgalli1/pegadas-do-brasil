"use client";

type Avatar = { image: string; name: string } | null | undefined;

type MobileMenuProps = {
  selectedAvatar: Avatar;
  nickname: string | null;
  onAvatar: () => void;
  onAchievements: () => void;
  onSound: () => void;
  onAccessibility: () => void;
  onHelp: () => void;
  onCredits: () => void;
  onStart: () => void;
};

export default function MobileMenu({
  selectedAvatar, nickname, onAvatar, onAchievements, onSound,
  onAccessibility, onHelp, onCredits, onStart,
}: MobileMenuProps) {
  return <section className="screen mobile-menu-screen" aria-label="Menu principal para celular">
    <nav className="mobile-menu-tools" aria-label="Opções do jogo">
      <button className="mobile-menu-avatar-tool" onClick={onAvatar}><img src={selectedAvatar?.image ?? "/icone-avatar-v1.png"} alt="" />Avatar</button>
      <button onClick={onAchievements}><img src="/icone-conquistas-v1.png" alt="" />Conquistas</button>
      <button onClick={onSound}><img src="/icone-som-v1.png" alt="" />Som</button>
      <button onClick={onAccessibility}><img src="/icone-acessibilidade-v1.png" alt="" />Acessibilidade</button>
      <button onClick={onHelp}><img src="/icone-como-jogar-v1.png" alt="" />Como jogar</button>
    </nav>
    <div className="mobile-menu-main">
      <div className="mobile-menu-welcome">
        <div className="mobile-menu-speech"><strong>Olá, explorador!</strong><span>{selectedAvatar ? (nickname ?? selectedAvatar.name) + ", pronto para conhecer o Brasil?" : "Pronto para conhecer o Brasil?"}</span></div>
        <img src="/arara-mascote-v1.png" alt="Arara mascote do jogo" />
      </div>
      <img className="mobile-menu-logo" src="/pegadas-logo-v1.png" alt="Pegadas do Brasil — jogo de Geografia" />
      <div className="mobile-menu-start-area">
        <button className={"mobile-menu-start" + (selectedAvatar ? "" : " start-locked")} onClick={onStart} aria-disabled={!selectedAvatar}>INICIAR<br />AVENTURA<span aria-hidden="true">➜</span></button>
        <button className="mobile-menu-avatar" onClick={onAvatar}><img src={selectedAvatar?.image ?? "/icone-avatar-v1.png"} alt="" /><span>{selectedAvatar ? "Avatar: " + selectedAvatar.name : "Escolha seu avatar"}</span><b aria-hidden="true">›</b></button>
      </div>
    </div>
    <button className="mobile-menu-credits" onClick={onCredits}>★ CRÉDITOS</button>
  </section>;
}
