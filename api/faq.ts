import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "./_lib/supabaseAdmin.js";
import { resolveClientId } from "./_lib/resolveClientId.js";

/**
 * GET /api/faq
 *
 * Lista as perguntas frequentes do tenant, derivado do Host da requisição.
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
    .from("knowledge_base")
    .select("id, question, answer")
    .eq("client_id", clientId);

  if (error) {
    return res.status(500).json({ error: "Falha ao buscar FAQ", detail: error.message });
  }

  return res.json({ entries: data ?? [] });
}
