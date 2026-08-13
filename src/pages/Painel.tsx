import { useEffect, useState } from "react";
import { supabase, CURRENT_CLIENT_ID } from "../lib/supabaseClient";
import type { AwaitingApprovalItem, PendingItem } from "../types";

export function Painel() {
  const [pending, setPending] = useState<PendingItem[]>([]);
  const [awaiting, setAwaiting] = useState<AwaitingApprovalItem[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  async function load() {
    const [pendingRes, awaitingRes] = await Promise.all([
      supabase
        .from("pending_items")
        .select("id, conversation_id, question, status, created_at")
        .eq("client_id", CURRENT_CLIENT_ID)
        .eq("status", "open"),
      supabase
        .from("awaiting_approval")
        .select("id, conversation_id, ai_suggestion, ai_confidence, status, created_at")
        .eq("client_id", CURRENT_CLIENT_ID)
        .eq("status", "pending"),
    ]);
    setPending(pendingRes.data ?? []);
    setAwaiting(awaitingRes.data ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function answerPending(item: PendingItem, answer: string) {
    await supabase.from("messages").insert({
      conversation_id: item.conversation_id,
      client_id: CURRENT_CLIENT_ID,
      sender: "staff",
      body: answer,
    });
    await supabase.from("pending_items").update({ status: "answered", answered_at: new Date().toISOString() }).eq("id", item.id);
    load();
  }

  async function approveItem(item: AwaitingApprovalItem, finalResponse: string, editedFlag: boolean) {
    await supabase.from("messages").insert({
      conversation_id: item.conversation_id,
      client_id: CURRENT_CLIENT_ID,
      sender: editedFlag ? "staff" : "ai",
      body: finalResponse,
    });
    await supabase
      .from("awaiting_approval")
      .update({
        status: editedFlag ? "edited" : "approved",
        final_response: finalResponse,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", item.id);
    load();
  }

  return (
    <div className="mx-auto max-w-4xl space-y-10 p-6">
      <h1 className="text-2xl font-semibold">Painel interno</h1>

      <section>
        <h2 className="mb-3 text-lg font-medium">Pendências ({pending.length})</h2>
        <div className="space-y-3">
          {pending.map((item) => (
            <div key={item.id} className="rounded border border-gray-200 p-3">
              <p className="text-sm text-gray-700">{item.question}</p>
              <textarea
                className="mt-2 w-full rounded border border-gray-300 px-2 py-1 text-sm"
                rows={2}
                placeholder="Escreva a resposta..."
                value={drafts[item.id] ?? ""}
                onChange={(e) => setDrafts((d) => ({ ...d, [item.id]: e.target.value }))}
              />
              <button
                className="mt-2 rounded bg-blue-600 px-3 py-1 text-sm text-white"
                onClick={() => answerPending(item, drafts[item.id] ?? "")}
              >
                Responder
              </button>
            </div>
          ))}
          {pending.length === 0 && <p className="text-sm text-gray-500">Nenhuma pendência.</p>}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">Aguardando aprovação ({awaiting.length})</h2>
        <div className="space-y-3">
          {awaiting.map((item) => (
            <div key={item.id} className="rounded border border-gray-200 p-3">
              <p className="text-xs text-gray-500">
                Confiança da IA: {item.ai_confidence != null ? Math.round(item.ai_confidence * 100) : "?"}%
              </p>
              <textarea
                className="mt-2 w-full rounded border border-gray-300 px-2 py-1 text-sm"
                rows={2}
                value={drafts[item.id] ?? item.ai_suggestion}
                onChange={(e) => setDrafts((d) => ({ ...d, [item.id]: e.target.value }))}
              />
              <div className="mt-2 flex gap-2">
                <button
                  className="rounded bg-green-600 px-3 py-1 text-sm text-white"
                  onClick={() => approveItem(item, item.ai_suggestion, false)}
                >
                  Aprovar
                </button>
                <button
                  className="rounded bg-yellow-600 px-3 py-1 text-sm text-white"
                  onClick={() => approveItem(item, drafts[item.id] ?? item.ai_suggestion, true)}
                >
                  Editar e enviar
                </button>
              </div>
            </div>
          ))}
          {awaiting.length === 0 && <p className="text-sm text-gray-500">Nada aguardando aprovação.</p>}
        </div>
      </section>
    </div>
  );
}
