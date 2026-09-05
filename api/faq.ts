import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "./_lib/supabaseAdmin.js";

/**
 * GET /api/faq?clientId=...
 *
 * Lista as perguntas frequentes do cliente. Antes era um SELECT direto do
 * front na tabela knowledge_base com policy pública (vazava a base de todos
 * os tenants); agora o filtro por client_id é aplicado no servidor.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const clientId = req.query.clientId;
  if (!clientId || typeof clientId !== "string") {
    return res.status(400).json({ error: "clientId é obrigatório" });
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
