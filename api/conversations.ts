import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "./_lib/supabaseAdmin.js";
import { resolveClientId } from "./_lib/resolveClientId.js";

/**
 * POST /api/conversations
 * body: { channel, customerRef? }
 *
 * Abre uma conversa para o cliente final (chat ou e-mail). O tenant é
 * derivado do Host da requisição, nunca de um clientId enviado pelo front.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const clientId = await resolveClientId(req);
  if (!clientId) {
    return res.status(404).json({ error: "Domínio não configurado para nenhum cliente" });
  }

  const { channel, customerRef } = req.body ?? {};
  if (!channel) {
    return res.status(400).json({ error: "channel é obrigatório" });
  }

  const { data, error } = await supabaseAdmin
    .from("conversations")
    .insert({ client_id: clientId, channel, customer_ref: customerRef ?? null })
    .select("id")
    .single();

  if (error || !data) {
    return res.status(500).json({ error: "Falha ao abrir conversa", detail: error?.message });
  }

  return res.json({ id: data.id });
}
