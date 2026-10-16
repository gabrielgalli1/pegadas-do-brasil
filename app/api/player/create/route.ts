import {
  bearerToken,
  caughtResponse,
  databaseMessage,
  derivePassword,
  internalEmail,
  json,
  normalizeLoginNickname,
  parseCredentials,
  PlayerAuthError,
  publicSession,
  serverClients,
} from "../playerAuthServer";

type PreviousPlayer = { apelido: string; avatar_id: string | null };

export async function POST(request: Request) {
  try {
    const { nickname, pin, avatarId } = parseCredentials(await request.json());
    const normalizedNickname = normalizeLoginNickname(nickname);
    const password = await derivePassword(normalizedNickname, pin);
    const email = internalEmail(normalizedNickname);
    const { admin, auth } = serverClients();

    const token = bearerToken(request);
    const currentAuth = token ? await admin.auth.getUser(token) : null;
    if (currentAuth?.error) throw new PlayerAuthError(401, "Sua sessão expirou. Entre novamente.", "session_expired");
    const currentUser = currentAuth?.data.user ?? null;
    if (currentUser && !currentUser.is_anonymous) {
      throw new PlayerAuthError(409, "Este aparelho já está conectado a um jogador.", "already_authenticated");
    }

    const { data: existingNickname, error: lookupError } = await admin
      .from("jogadores")
      .select("id")
      .ilike("apelido", nickname)
      .limit(1)
      .maybeSingle();
    if (lookupError) throw lookupError;
    if (existingNickname && existingNickname.id !== currentUser?.id) {
      throw new PlayerAuthError(409, "Esse apelido já existe, escolha outro.", "nickname_taken");
    }

    if (currentUser) {
      const { data: previous, error: previousError } = await admin
        .from("jogadores")
        .select("apelido,avatar_id")
        .eq("id", currentUser.id)
        .maybeSingle();
      if (previousError) throw previousError;

      const playerRecord: Record<string, string> = { id: currentUser.id, apelido: nickname };
      if (avatarId) playerRecord.avatar_id = avatarId;
      const { error: playerError } = await admin.from("jogadores").upsert(playerRecord, { onConflict: "id" });
      if (playerError) throw databaseMessage(playerError);

      const { error: updateError } = await admin.auth.admin.updateUserById(currentUser.id, { email, password, email_confirm: true });
      if (updateError) {
        if (previous) {
          await admin.from("jogadores").update(previous as PreviousPlayer).eq("id", currentUser.id);
        } else {
          await admin.from("jogadores").delete().eq("id", currentUser.id);
        }
        if (updateError.message.toLowerCase().includes("already") || updateError.message.toLowerCase().includes("registered")) {
          throw new PlayerAuthError(409, "Esse apelido já existe, escolha outro.", "nickname_taken");
        }
        throw updateError;
      }

      return json({ ok: true, nickname, convertedAnonymous: true, session: null });
    }

    const { data: signUpData, error: signUpError } = await auth.auth.signUp({ email, password });
    if (signUpError || !signUpData.user) {
      if (signUpError?.message.toLowerCase().includes("already") || signUpError?.message.toLowerCase().includes("registered")) {
        throw new PlayerAuthError(409, "Esse apelido já existe, escolha outro.", "nickname_taken");
      }
      throw signUpError ?? new Error("Supabase não devolveu o usuário criado");
    }

    const playerRecord: Record<string, string> = { id: signUpData.user.id, apelido: nickname };
    if (avatarId) playerRecord.avatar_id = avatarId;
    const { error: playerError } = await admin.from("jogadores").insert(playerRecord);
    if (playerError) {
      await admin.auth.admin.deleteUser(signUpData.user.id);
      throw databaseMessage(playerError);
    }
    if (!signUpData.session) {
      await admin.auth.admin.deleteUser(signUpData.user.id);
      throw new PlayerAuthError(503, "Não foi possível iniciar a sessão criada.", "session_missing");
    }

    return json({ ok: true, nickname, convertedAnonymous: false, session: publicSession(signUpData.session) }, 201);
  } catch (error) {
    return caughtResponse(error);
  }
}
