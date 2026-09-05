import type { VercelRequest } from "@vercel/node";
import { supabaseAdmin } from "./supabaseAdmin.js";

// Trava positiva: o atalho de dev só ativa com VERCEL_ENV explicitamente
// "development" ou "preview". Ausente (ex.: produção, ou rodando fora da
// Vercel sem essa env var) conta como produção — nunca ativa por omissão.
const DEV_SHORTCUT_ALLOWED = process.env.VERCEL_ENV === "development" || process.env.VERCEL_ENV === "preview";

/**
 * Deriva o client_id a partir do Host da requisição (mapa domínio ->
 * client_id em client_domains). client_id nunca deve vir de body/query: o
 * caller poderia pedir a config de outro tenant, já que os endpoints usam
 * a service role e ignoram RLS.
 *
 * Em localhost/127.0.0.1 (dev sem domínio configurado) e só fora de
 * produção, cai para DEV_CLIENT_ID como atalho local.
 */
export async function resolveClientId(req: VercelRequest): Promise<string | null> {
  const host = (req.headers.host ?? "").split(":")[0].toLowerCase();
  if (!host) return null;

  if (DEV_SHORTCUT_ALLOWED && (host === "localhost" || host === "127.0.0.1") && process.env.DEV_CLIENT_ID) {
    return process.env.DEV_CLIENT_ID;
  }

  const { data } = await supabaseAdmin
    .from("client_domains")
    .select("client_id")
    .eq("domain", host)
    .maybeSingle();

  return data?.client_id ?? null;
}
