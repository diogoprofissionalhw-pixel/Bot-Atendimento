import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "./_lib/supabaseAdmin.js";
import { resolveClientId } from "./_lib/resolveClientId.js";

/**
 * GET /api/email-config
 *
 * Retorna só os campos do EmailJS necessários para o formulário de Reclame
 * Aqui disparar o envio no client-side — nunca a config de IA
 * (ai_confidence_threshold, minimax_model_cfg) do mesmo registro. O tenant
 * é derivado do Host da requisição.
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
    .select("emailjs_service_id, emailjs_template_id, emailjs_public_key")
    .eq("client_id", clientId)
    .single();

  if (error || !data) {
    return res.status(404).json({ error: "Configuração do cliente não encontrada" });
  }

  return res.json(data);
}
