"use client";

import { createClient } from "@supabase/supabase-js";

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

// Messages raised on purpose by the "validar_apelido" trigger in Supabase
// (see the project's SQL setup). These are already written for the player,
// so they pass through as-is. Anything else is an infrastructure/config
// problem (network, auth disabled, RLS, ...) that a child shouldn't see
// verbatim — those get a generic message, with the real one logged for us.
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
      .upsert({ id: userId, avatar_id: avatarId, apelido }, { onConflict: "id" });

    return { error: error ? friendlyError(error.message) : null };
  } catch (err) {
    return { error: friendlyError(err instanceof Error ? err.message : String(err)) };
  }
}
