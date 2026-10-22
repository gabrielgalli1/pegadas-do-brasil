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
  showSignOut: boolean;
  onSignOut: () => void;
  onStart: () => void;
};

export default function MobileMenu({
  selectedAvatar, nickname, onAvatar, onAchievements, onSound,
  onAccessibility, onHelp, onCredits, showSignOut, onSignOut, onStart,
}: MobileMenuProps) {
  return <section className="screen mobile-menu-screen" aria-label="Menu principal para celular">
    <nav className="mobile-menu-tools" aria-label="Opções do jogo">
      <button className="mobile-menu-avatar-tool" onClick={onAvatar}><img src={selectedAvatar?.image ?? "/icone-avatar-v1.webp"} alt="" />Avatar</button>
      <button onClick={onAchievements}><img src="/icone-conquistas-v1.png" alt="" />Conquistas</button>
      <button onClick={onSound}><img src="/icone-som-v1.png" alt="" />Som</button>
      <button onClick={onAccessibility}><img src="/icone-acessibilidade-v1.webp" alt="" />Acessibilidade</button>
      <button onClick={onHelp}><img src="/icone-como-jogar-v1.webp" alt="" />Como jogar</button>
    </nav>
    <div className="mobile-menu-main">
      <div className="mobile-menu-welcome">
        <div className="mobile-menu-speech"><strong>Olá, explorador!</strong><span>{selectedAvatar ? (nickname ?? selectedAvatar.name) + ", pronto para conhecer o Brasil?" : "Pronto para conhecer o Brasil?"}</span></div>
        <img src="/arara-mascote-v1.webp" alt="Arara mascote do jogo" />
      </div>
      <img className="mobile-menu-logo" src="/pegadas-logo-v1.webp" alt="Pegadas do Brasil — jogo de Geografia" />
      <div className="mobile-menu-start-area">
        <button className={"mobile-menu-start" + (selectedAvatar ? "" : " start-locked")} onClick={onStart} aria-disabled={!selectedAvatar}>INICIAR<br />AVENTURA<span aria-hidden="true">➜</span></button>
        <button className="mobile-menu-avatar" onClick={onAvatar}><img src={selectedAvatar?.image ?? "/icone-avatar-v1.webp"} alt="" /><span>{selectedAvatar ? "Avatar: " + selectedAvatar.name : "Escolha seu avatar"}</span><b aria-hidden="true">›</b></button>
      </div>
    </div>
    <button className="mobile-menu-credits" onClick={onCredits}>★ CRÉDITOS</button>
    {showSignOut && <button className="mobile-menu-sign-out" onClick={onSignOut} aria-label="Sair deste jogador" title="Sair"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M5 3h13v26H5zM18 16h10m-4-4 4 4-4 4" /></svg></button>}
  </section>;
}
