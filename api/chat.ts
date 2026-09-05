import type { VercelRequest, VercelResponse } from "@vercel/node";
import { askAi } from "./_lib/ai.js";
import { supabaseAdmin } from "./_lib/supabaseAdmin.js";
import { resolveClientId } from "./_lib/resolveClientId.js";

/**
 * POST /api/chat
 * body: { conversationId, question }
 *
 * Fluxo de decisão da spec:
 *  - confidence >= threshold do cliente -> responde direto (mensagem 'ai')
 *  - confidence >= 0.4 e < threshold    -> vai para 'awaiting_approval'
 *  - confidence < 0.4                   -> vai para 'pending_items' (IA não sabe)
 *
 * O tenant é derivado do Host da requisição, nunca de um clientId enviado
 * pelo front. A conversa informada precisa pertencer a esse mesmo tenant.
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

  const { data: config, error: configError } = await supabaseAdmin
    .from("config_per_client")
    .select("ai_confidence_threshold")
    .eq("client_id", clientId)
    .single();

  if (configError || !config) {
    return res.status(404).json({ error: "Configuração do cliente não encontrada" });
  }

  const { data: kb } = await supabaseAdmin
    .from("knowledge_base")
    .select("question, answer")
    .eq("client_id", clientId)
    .limit(50);

  const knowledgeContext = (kb ?? []).map((k) => `P: ${k.question}\nR: ${k.answer}`).join("\n\n");

  await supabaseAdmin.from("messages").insert({
    conversation_id: conversationId,
    client_id: clientId,
    sender: "customer",
    body: question,
  });

  let decision;
  try {
    decision = await askAi(question, knowledgeContext);
  } catch (err) {
    console.error("Erro ao chamar a IA:", err);
    return res.status(502).json({ error: "Falha ao consultar a IA", detail: String(err) });
  }
  const threshold = config.ai_confidence_threshold as number;
  const LOW_CONFIDENCE_FLOOR = 0.4;

  if (decision.confidence >= threshold) {
    await supabaseAdmin.from("messages").insert({
      conversation_id: conversationId,
      client_id: clientId,
      sender: "ai",
      body: decision.answer,
      ai_confidence: decision.confidence,
    });
    return res.json({ status: "answered", answer: decision.answer });
  }

  if (decision.confidence >= LOW_CONFIDENCE_FLOOR) {
    await supabaseAdmin.from("awaiting_approval").insert({
      client_id: clientId,
      conversation_id: conversationId,
      ai_suggestion: decision.answer,
      ai_confidence: decision.confidence,
    });
    return res.json({ status: "awaiting_approval" });
  }

  await supabaseAdmin.from("pending_items").insert({
    client_id: clientId,
    conversation_id: conversationId,
    question,
  });
  return res.json({ status: "pending" });
}
