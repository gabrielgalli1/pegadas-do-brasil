"use client";

type CountryOption = { id: string; label: string; image: string };

type Props = {
  options: readonly CountryOption[];
  score: number;
  sound: boolean;
  onBack: () => void;
  onToggleSound: () => void;
  onChoose: (id: string) => void;
  onListen: () => void;
};

export default function MobileSilhouetteChallenge({
  options, score, sound, onBack, onToggleSound, onChoose, onListen,
}: Props) {
  return <div className="mobile-silhouette" aria-label="Desafio 1: reconheça o Brasil">
    <header className="mobile-silhouette-top">
      <button className="mobile-silhouette-control" onClick={onBack} aria-label="Voltar à jornada"><img src="/fases-voltar-v1.png" alt="" /></button>
      <div className="mobile-silhouette-status"><b>DESAFIO 1 DE 5</b><div aria-label="1 de 5 desafios"><span>★</span>★★★★</div><small>☆ &nbsp; <strong>{score}</strong> PONTOS</small></div>
      <button className="mobile-silhouette-control" onClick={onToggleSound} aria-label={sound ? "Desligar som" : "Ligar som"} aria-pressed={sound}><img src="/fases-som-v1.png" alt="" /></button>
    </header>
    <div className="mobile-silhouette-intro">
      <h1>RECONHEÇA<br />O BRASIL</h1>
      <p className="mobile-silhouette-question">Qual dessas silhuetas representa o Brasil?</p>
      <div className="mobile-silhouette-guide"><img src="/arara-mascote-v1.png" alt="Arara Ari" /><p>Observe bem o formato de cada país!</p></div>
      <button className="mobile-silhouette-listen" onClick={onListen}>🔊 OUVIR PERGUNTA</button>
    </div>
    <div className="mobile-silhouette-grid" role="group" aria-label="Escolha a silhueta do Brasil">
      {options.map((option) => <button key={option.id} className="mobile-silhouette-card" onClick={() => onChoose(option.id)} aria-label={"Opção " + option.label}><span>{option.label}</span><img src={option.image} alt="" /></button>)}
    </div>
  </div>;
}
