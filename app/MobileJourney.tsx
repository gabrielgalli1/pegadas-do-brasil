"use client";

type Level = { id: string; title: string; image: string; phases: number };

type Props = {
  levels: readonly Level[];
  unlockedLevel: number;
  completedPhase: boolean;
  sound: boolean;
  notice: string | null;
  onOpen: (index: number) => void;
  onBack: () => void;
  onToggleSound: () => void;
  onCloseNotice: () => void;
};

export default function MobileJourney({
  levels, unlockedLevel, completedPhase, sound, notice,
  onOpen, onBack, onToggleSound, onCloseNotice,
}: Props) {
  return <section className="screen mobile-journey-screen" aria-label="Escolha sua aventura no celular">
    <header className="mobile-journey-header">
      <button onClick={onBack} aria-label="Voltar ao menu"><img src="/fases-voltar-v1.png" alt="" /></button>
      <div><h1>ESCOLHA SUA AVENTURA</h1><p>Explore o Brasil passo a passo!</p></div>
      <button onClick={onToggleSound} aria-label={sound ? "Desligar som" : "Ligar som"} aria-pressed={sound}><img src="/fases-som-v1.png" alt="" /></button>
    </header>
    <div className="mobile-journey-levels" aria-label="Fases do jogo">
      {levels.map((level, index) => {
        const unlocked = index <= unlockedLevel;
        const completed = index < unlockedLevel || (index === 0 && completedPhase);
        return <button key={level.id} className={"mobile-journey-level" + (unlocked ? " unlocked" : " locked")} disabled={!unlocked} onClick={() => onOpen(index)} aria-label={level.title + ", " + level.phases + " fases, " + (completed ? "concluída" : unlocked ? "disponível" : "bloqueada")}>
          <img src={level.image} alt="" />
          <span aria-hidden="true">{!unlocked ? "🔒" : completed ? "★" : "▶"}</span>
        </button>;
      })}
    </div>
    <p className="mobile-journey-footer">Deslize para ver todas as regiões e complete as fases na ordem!</p>
    {notice && <div className="mobile-journey-notice" role="status">{notice}<button onClick={onCloseNotice} aria-label="Fechar aviso">×</button></div>}
  </section>;
}
