import {
  blockedMessage,
  caughtResponse,
  derivePassword,
  internalEmail,
  isInvalidCredentials,
  json,
  normalizeLoginNickname,
  parseCredentials,
  publicSession,
  serverClients,
} from "../playerAuthServer";

export async function POST(request: Request) {
  try {
    const { nickname, pin } = parseCredentials(await request.json());
    const normalizedNickname = normalizeLoginNickname(nickname);
    const { admin, auth } = serverClients();

    const { data: blockedUntil, error: blockedError } = await admin.rpc("login_bloqueado_ate", { p_apelido: normalizedNickname });
    if (blockedError) throw blockedError;
    if (typeof blockedUntil === "string" && new Date(blockedUntil).getTime() > Date.now()) {
      return json({ ok: false, code: "login_blocked", message: blockedMessage(blockedUntil), blockedUntil }, 423);
    }

    const password = await derivePassword(normalizedNickname, pin);
    const { data, error } = await auth.auth.signInWithPassword({ email: internalEmail(normalizedNickname), password });

    if (error) {
      if (isInvalidCredentials(error)) {
        const { data: newBlockedUntil, error: registerError } = await admin.rpc("login_registrar_resultado", { p_apelido: normalizedNickname, p_sucesso: false });
        if (registerError) throw registerError;
        if (typeof newBlockedUntil === "string" && new Date(newBlockedUntil).getTime() > Date.now()) {
          return json({ ok: false, code: "login_blocked", message: blockedMessage(newBlockedUntil), blockedUntil: newBlockedUntil }, 423);
        }
        return json({ ok: false, code: "invalid_credentials", message: "Apelido ou PIN incorreto." }, 401);
      }
      if (error.status === 429) return json({ ok: false, code: "rate_limited", message: "Muitos acessos ao mesmo tempo. Aguarde um pouco e tente novamente." }, 429);
      throw error;
    }

    if (!data.session) throw new Error("Supabase não devolveu uma sessão após o login");
    const { error: registerError } = await admin.rpc("login_registrar_resultado", { p_apelido: normalizedNickname, p_sucesso: true });
    if (registerError) throw registerError;

    return json({ ok: true, nickname, session: publicSession(data.session) });
  } catch (error) {
    return caughtResponse(error);
  }
}
