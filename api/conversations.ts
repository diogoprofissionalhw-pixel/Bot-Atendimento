import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "./_lib/supabaseAdmin.js";

/**
 * POST /api/conversations
 * body: { clientId, channel, customerRef? }
 *
 * Abre uma conversa para o cliente final (chat ou e-mail). Antes era um
 * INSERT direto do front na tabela conversations com policy pública
 * (aceitava client_id arbitrário, permitindo forjar dados em nome de outro
 * tenant); agora o client_id vem do endpoint e é o único aceito.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { clientId, channel, customerRef } = req.body ?? {};
  if (!clientId || !channel) {
    return res.status(400).json({ error: "clientId e channel são obrigatórios" });
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
