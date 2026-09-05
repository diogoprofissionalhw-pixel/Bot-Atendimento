import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "./_lib/supabaseAdmin.js";

/**
 * GET /api/email-config?clientId=...
 *
 * Retorna só os campos do EmailJS necessários para o formulário de Reclame
 * Aqui disparar o envio no client-side. Antes era um SELECT direto do front
 * na tabela config_per_client com policy pública (vazava a config de todos
 * os tenants, inclusive credenciais de EmailJS); agora o filtro por
 * client_id é aplicado no servidor.
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
    .from("config_per_client")
    .select("emailjs_service_id, emailjs_template_id, emailjs_public_key")
    .eq("client_id", clientId)
    .single();

  if (error || !data) {
    return res.status(404).json({ error: "Configuração do cliente não encontrada" });
  }

  return res.json(data);
}
