import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "./_lib/supabaseAdmin.js";
import { resolveClientId } from "./_lib/resolveClientId.js";

/**
 * POST /api/pending-items
 * body: { conversationId, question }
 *
 * Registra uma pendência vinda de um canal que não passa pela IA (ex.:
 * Reclame Aqui). O tenant é derivado do Host da requisição; a conversa
 * precisa pertencer a esse mesmo tenant.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const clientId = await resolveClientId(req);
  if (!clientId) {
    return res.status(404).json({ error: "Domínio não configurado para nenhum cliente" });
  }

  const { conversationId, question } = req.body ?? {};
  if (!conversationId || !question) {
    return res.status(400).json({ error: "conversationId e question são obrigatórios" });
  }

  const { data: conversation } = await supabaseAdmin
    .from("conversations")
    .select("client_id")
    .eq("id", conversationId)
    .single();

  if (!conversation || conversation.client_id !== clientId) {
    return res.status(404).json({ error: "Conversa não encontrada" });
  }

  const { error } = await supabaseAdmin
    .from("pending_items")
    .insert({ client_id: clientId, conversation_id: conversationId, question });

  if (error) {
    return res.status(500).json({ error: "Falha ao registrar pendência", detail: error.message });
  }

  return res.json({ status: "ok" });
}
