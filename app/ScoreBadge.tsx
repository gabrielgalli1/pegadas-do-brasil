type Props = { score: number };

export default function ScoreBadge({ score }: Props) {
  return <aside className="game-score" aria-label={`${score} pontos`} aria-live="polite">
    <img src="/cruzeiro-do-sul-game-v1.png" alt="" />
    <span><small>PONTOS</small><strong>{score}</strong></span>
  </aside>;
}
