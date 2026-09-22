type Props = { score: number; compact?: boolean };

export default function ScoreBadge({ score, compact = false }: Props) {
  return <div className={compact ? "score-inline" : "game-score"} aria-label={`${score} pontos`} aria-live="polite">
    <img src="/cruzeiro-do-sul-game-v1.png" alt="" />
    <span><small>PONTOS</small><strong>{score}</strong></span>
  </div>;
}
