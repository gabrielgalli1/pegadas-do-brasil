import { createClient, type AuthError, type Session, type SupabaseClient } from "@supabase/supabase-js";
import { tidyNickname, validateNickname } from "../../nicknameValidation";

const INTERNAL_EMAIL_DOMAIN = "jogadores.pegadasdobrasil.app";

export const VALIDATION_MESSAGES = [
  "Apelido deve ter entre 2 e 15 caracteres",
  "Apelido contém caracteres não permitidos",
  "Apelido não pode conter números longos",
  "Apelido não permitido, escolha outro",
] as const;

export class PlayerAuthError extends Error {
  constructor(public status: number, message: string, public code: string) {
    super(message);
  }
}

export function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

export function parseCredentials(value: unknown): { nickname: string; pin: string; avatarId: string | null } {
  const body = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const nickname = tidyNickname(typeof body.nickname === "string" ? body.nickname : "");
  const nicknameError = validateNickname(nickname);
  if (nicknameError) throw new PlayerAuthError(400, nicknameError, "invalid_nickname");
  const pin = typeof body.pin === "string" ? body.pin : "";
  if (!/^\d{4}$/.test(pin)) throw new PlayerAuthError(400, "Digite um PIN com 4 números.", "invalid_pin");
  const avatarId = typeof body.avatarId === "string" && /^[a-z-]{2,30}$/.test(body.avatarId) ? body.avatarId : null;
  return { nickname, pin, avatarId };
}

export function normalizeLoginNickname(nickname: string): string {
  return tidyNickname(nickname)
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export function internalEmail(normalizedNickname: string): string {
  return `${normalizedNickname}@${INTERNAL_EMAIL_DOMAIN}`;
}

export async function derivePassword(normalizedNickname: string, pin: string): Promise<string> {
  const secret = process.env.PIN_SECRET_V1;
  if (!secret) throw new PlayerAuthError(503, "O acesso está temporariamente indisponível.", "server_not_configured");
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${normalizedNickname}:${pin}`));
  return `v1_${Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

export function serverClients(): { admin: SupabaseClient; auth: SupabaseClient } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anonKey || !serviceKey) {
    throw new PlayerAuthError(503, "O acesso está temporariamente indisponível.", "server_not_configured");
  }
  const options = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };
  return {
    admin: createClient(url, serviceKey, options),
    auth: createClient(url, anonKey, options),
  };
}

export function bearerToken(request: Request): string | null {
  const authorization = request.headers.get("authorization");
  return authorization?.startsWith("Bearer ") ? authorization.slice(7).trim() : null;
}

export function isInvalidCredentials(error: AuthError): boolean {
  return error.code === "invalid_credentials" || error.message.toLowerCase().includes("invalid login credentials");
}

export function publicSession(session: Session) {
  return {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at,
    expires_in: session.expires_in,
    token_type: session.token_type,
  };
}

export function databaseMessage(error: { code?: string; message: string }): PlayerAuthError {
  if (error.code === "23505") return new PlayerAuthError(409, "Esse apelido já existe, escolha outro.", "nickname_taken");
  const known = VALIDATION_MESSAGES.find((message) => error.message.includes(message));
  if (known) return new PlayerAuthError(400, known, "invalid_nickname");
  return new PlayerAuthError(503, "Não foi possível salvar agora. Tente novamente.", "database_error");
}

export function caughtResponse(error: unknown) {
  if (error instanceof PlayerAuthError) return json({ ok: false, code: error.code, message: error.message }, error.status);
  console.error("[player-auth] erro inesperado", error instanceof Error ? error.message : String(error));
  return json({ ok: false, code: "unexpected_error", message: "Não foi possível conectar agora. Tente novamente." }, 503);
}

export function blockedMessage(blockedUntil: string): string {
  const milliseconds = new Date(blockedUntil).getTime() - Date.now();
  const minutes = Math.max(1, Math.round(milliseconds / 60_000));
  return `Muitas tentativas. Tente de novo em ${minutes} min.`;
}
