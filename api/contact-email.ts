import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "./_lib/supabaseAdmin.js";
import { resolveClientId } from "./_lib/resolveClientId.js";

const ITEM_TABLES = ["pending_items", "awaiting_approval"] as const;
type ItemType = (typeof ITEM_TABLES)[number];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/contact-email
 * body: { conversationId, itemType, itemId, email }
 *
 * Anexa um e-mail de contato opcional a uma pendência ou aguardando-aprovação
 * já criada por api/chat.ts, para a equipe saber para quem responder. Não
 * envia nenhum e-mail — só grava. O tenant é derivado do Host da requisição;
 * a conversa e o item precisam pertencer a esse mesmo tenant.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const clientId = await resolveClientId(req);
  if (!clientId) {
    return res.status(404).json({ error: "Domínio não configurado para nenhum cliente" });
  }

  const { conversationId, itemType, itemId, email } = req.body ?? {};
  if (!conversationId || !itemType || !itemId || !email) {
    return res.status(400).json({ error: "conversationId, itemType, itemId e email são obrigatórios" });
  }

  if (!ITEM_TABLES.includes(itemType)) {
    return res.status(400).json({ error: "itemType inválido" });
  }

  if (typeof email !== "string" || !EMAIL_RE.test(email.trim())) {
    return res.status(400).json({ error: "E-mail inválido" });
  }
  const trimmedEmail = email.trim();

  const { data: conversation, error: conversationError } = await supabaseAdmin
    .from("conversations")
    .select("client_id")
    .eq("id", conversationId)
    .single();

  if (conversationError && conversationError.code !== "PGRST116") {
    console.error("Erro ao buscar conversa:", conversationError);
    return res.status(500).json({ error: "Erro ao buscar conversa" });
  }
  if (!conversation || conversation.client_id !== clientId) {
    return res.status(404).json({ error: "Conversa não encontrada" });
  }

  const { data: item, error: itemError } = await supabaseAdmin
    .from(itemType as ItemType)
    .select("client_id, conversation_id")
    .eq("id", itemId)
    .single();

  if (itemError && itemError.code !== "PGRST116") {
    console.error("Erro ao buscar item:", itemError);
    return res.status(500).json({ error: "Erro ao buscar item" });
  }
  if (!item || item.client_id !== clientId || item.conversation_id !== conversationId) {
    return res.status(404).json({ error: "Item não encontrado" });
  }

  const { error: updateError } = await supabaseAdmin
    .from(itemType as ItemType)
    .update({ customer_email: trimmedEmail })
    .eq("id", itemId)
    .eq("client_id", clientId);

  if (updateError) {
    return res.status(500).json({ error: "Falha ao registrar e-mail de contato", detail: updateError.message });
  }

  return res.json({ status: "ok" });
}
