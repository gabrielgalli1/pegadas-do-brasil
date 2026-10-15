export const phaseEmblems = [
  { id: "brasil", title: "Conhecendo o Brasil", description: "Conclua a fase inicial" },
  { id: "norte", title: "Região Norte", description: "Conclua a fase da Região Norte" },
  { id: "nordeste", title: "Região Nordeste", description: "Conclua a fase da Região Nordeste" },
  { id: "centro-oeste", title: "Região Centro-Oeste", description: "Conclua a fase da Região Centro-Oeste" },
  { id: "sudeste", title: "Região Sudeste", description: "Conclua a fase da Região Sudeste" },
  { id: "sul", title: "Região Sul", description: "Conclua a fase da Região Sul" },
] as const;

export type PhaseEmblemId = (typeof phaseEmblems)[number]["id"];

export function PhaseEmblem({ id, label }: { id: PhaseEmblemId; label: string }) {
  return <img className={`phase-emblem phase-emblem-${id}`} src={`/emblema-${id}-v2.webp`} alt={label} />;
}

export function PhaseEmblemReward({ id, isNew }: { id: PhaseEmblemId; isNew: boolean }) {
  const emblem = phaseEmblems.find((item) => item.id === id)!;

  return <div className={`phase-emblem-reward phase-emblem-reward-${id}${isNew ? " is-new" : " is-owned"}`} role="status" aria-label={isNew ? `Você ganhou o emblema ${emblem.title}` : `Emblema ${emblem.title} já conquistado`}>
    <span className="phase-emblem-sparkles" aria-hidden="true"><i>★</i><i>★</i><i>★</i><i>★</i><i>★</i></span>
    <PhaseEmblem id={id} label={`Emblema conquistado: ${emblem.title}`} />
    <div className="phase-emblem-reward-copy">
      <strong>{isNew ? "Você ganhou um emblema!" : "Emblema já conquistado"}</strong>
      <span>{emblem.title}</span>
    </div>
  </div>;
}

