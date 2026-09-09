import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "./_lib/supabaseAdmin.js";
import { resolveClientId } from "./_lib/resolveClientId.js";

interface Branding {
  primaryColor: string | null;
  logoUrl: string | null;
}

/**
 * GET /api/branding
 *
 * Cores e logo do cliente, do campo config_per_client.branding (jsonb),
 * para a Central de Ajuda montar o visual. Nunca a config de IA/EmailJS do
 * mesmo registro. Campos ausentes ou de tipo errado voltam null — o front
 * usa o visual padrão quando null. O tenant é derivado do Host da
 * requisição.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const clientId = await resolveClientId(req);
  if (!clientId) {
    return res.status(404).json({ error: "Domínio não configurado para nenhum cliente" });
  }

  const { data, error } = await supabaseAdmin
    .from("config_per_client")
    .select("branding")
    .eq("client_id", clientId)
    .single();

  if (error || !data) {
    return res.status(404).json({ error: "Configuração do cliente não encontrada" });
  }

  const branding = (data.branding ?? {}) as Record<string, unknown>;

  const result: Branding = {
    primaryColor: typeof branding.primaryColor === "string" ? branding.primaryColor : null,
    logoUrl: typeof branding.logoUrl === "string" ? branding.logoUrl : null,
  };

  return res.json(result);
}
