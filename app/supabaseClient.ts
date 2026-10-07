"use client";

import { createClient } from "@supabase/supabase-js";
import { tidyNickname, validateNickname } from "./nicknameValidation";
import { normalizePlayerProgress, type PlayerProgress } from "./progressPersistence";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// The game must stay fully playable without Supabase configured (e.g. a
// contributor running the project without a .env.local yet), so the client
// is only created when both values are present. Every call site treats a
// missing client as "skip syncing, keep playing locally".
export const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export type JogadorSync = {
  avatarId: string;
  apelido: string;
};

export type RemotePlayerProgress = {
  progress: PlayerProgress;
  updatedAt: string;
};

// Messages raised on purpose by the nickname validation triggers in Supabase.
// These are already written for the player, so they pass through as-is.
const KNOWN_VALIDATION_MESSAGES = [
  "Apelido deve ter entre 2 e 15 caracteres",
  "Apelido contém caracteres não permitidos",
  "Apelido não pode conter números longos",
  "Apelido não permitido, escolha outro",
];

function friendlyError(rawMessage: string): string {
  const known = KNOWN_VALIDATION_MESSAGES.find((message) => rawMessage.includes(message));
  if (known) return known;
  console.error("[supabase] falha ao sincronizar jogador:", rawMessage);
  return "Não foi possível salvar agora. Você pode continuar jogando, tentamos de novo mais tarde.";
}

/**
 * Ensures an anonymous Supabase auth session exists, then upserts the
 * player's avatar and nickname. Never throws — callers get back an
 * `error` string (or null) so a Supabase outage never blocks the game.
 */
export async function syncJogador({ avatarId, apelido }: JogadorSync): Promise<{ error: string | null }> {
  const normalizedNickname = tidyNickname(apelido);
  const validationError = validateNickname(normalizedNickname);
  if (validationError) return { error: validationError };
  if (!supabase) return { error: null };

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    let userId = sessionData.session?.user.id;

    if (!userId) {
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error || !data.user) return { error: friendlyError(error?.message ?? "sem usuário anônimo") };
      userId = data.user.id;
    }

    const { error } = await supabase
      .from("jogadores")
      .upsert({ id: userId, avatar_id: avatarId, apelido: normalizedNickname }, { onConflict: "id" });

    return { error: error ? friendlyError(error.message) : null };
  } catch (err) {
    return { error: friendlyError(err instanceof Error ? err.message : String(err)) };
  }
}

/** Reads the authenticated player's server progress without creating a new identity. */
export async function loadPlayerProgress(): Promise<RemotePlayerProgress | null> {
  if (!supabase) return null;
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;
    if (!userId) return null;

    const { data, error } = await supabase
      .from("progresso_jogador")
      .select("fases,pontuacao,maior_pontuacao,atualizado_em")
      .eq("jogador_id", userId)
      .maybeSingle();

    if (error) {
      friendlyError(error.message);
      return null;
    }
    if (!data) return null;

    return {
      progress: normalizePlayerProgress({
        ...(data.fases && typeof data.fases === "object" ? data.fases : {}),
        score: data.pontuacao,
        highestScore: data.maior_pontuacao,
      }),
      updatedAt: typeof data.atualizado_em === "string" ? data.atualizado_em : "",
    };
  } catch (err) {
    friendlyError(err instanceof Error ? err.message : String(err));
    return null;
  }
}

/** Upserts the complete progress snapshot for the authenticated player. */
export async function syncPlayerProgress(progress: PlayerProgress, achievements: string[]): Promise<void> {
  if (!supabase) return;
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;
    if (!userId) return;

    const { error } = await supabase.from("progresso_jogador").upsert({
      jogador_id: userId,
      fases: progress,
      pontuacao: progress.score,
      maior_pontuacao: progress.highestScore,
      conquistas: achievements,
    }, { onConflict: "jogador_id" });

    if (error) friendlyError(error.message);
  } catch (err) {
    friendlyError(err instanceof Error ? err.message : String(err));
  }
}