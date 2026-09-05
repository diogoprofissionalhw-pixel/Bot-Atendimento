import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "./_lib/supabaseAdmin.js";

/**
 * POST /api/pending-items
 * body: { clientId, conversationId, question }
 *
 * Registra uma pendência vinda de um canal que não passa pela IA (ex.:
 * Reclame Aqui). Antes era um INSERT direto do front na tabela
 * pending_items com policy pública (aceitava client_id arbitrário); agora
 * passa pelo backend com service role.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { clientId, conversationId, question } = req.body ?? {};
  if (!clientId || !conversationId || !question) {
    return res.status(400).json({ error: "clientId, conversationId e question são obrigatórios" });
  }

  const { error } = await supabaseAdmin
    .from("pending_items")
    .insert({ client_id: clientId, conversation_id: conversationId, question });

  if (error) {
    return res.status(500).json({ error: "Falha ao registrar pendência", detail: error.message });
  }

  return res.json({ status: "ok" });
}
