import { useState } from "react";
import { CURRENT_CLIENT_ID } from "../lib/supabaseClient";
import type { ChatMessage } from "../types";

type ChatStatus = "answered" | "awaiting_approval" | "pending";

export function ChatWidget() {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function ensureConversation(): Promise<string> {
    if (conversationId) return conversationId;
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: CURRENT_CLIENT_ID, channel: "chat" }),
    });
    const data: { id?: string } = await res.json();
    if (!res.ok || !data.id) throw new Error("Não foi possível iniciar a conversa");
    setConversationId(data.id);
    return data.id;
  }

  async function handleSend() {
    if (!input.trim() || loading) return;
    setLoading(true);
    const question = input.trim();
    setInput("");
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), sender: "customer", body: question, created_at: new Date().toISOString() },
    ]);

    try {
      const convId = await ensureConversation();
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: CURRENT_CLIENT_ID, conversationId: convId, question }),
      });
      const data: { status: ChatStatus; answer?: string } = await res.json();

      const reply =
        data.status === "answered"
          ? data.answer!
          : data.status === "awaiting_approval"
            ? "Recebi sua pergunta e vou confirmar a resposta com a equipe antes de te responder."
            : "Não tenho certeza da resposta — encaminhei para a nossa equipe, que vai te responder em breve.";

      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), sender: "ai", body: reply, created_at: new Date().toISOString() },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          sender: "ai",
          body: "Ocorreu um erro ao processar sua mensagem. Tente novamente.",
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-96 flex-col rounded-lg border border-gray-200">
      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {messages.map((m) => (
          <div key={m.id} className={m.sender === "customer" ? "text-right" : "text-left"}>
            <span
              className={`inline-block rounded-lg px-3 py-2 text-sm ${
                m.sender === "customer" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-800"
              }`}
            >
              {m.body}
            </span>
          </div>
        ))}
      </div>
      <div className="flex gap-2 border-t border-gray-200 p-2">
        <input
          className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm"
          placeholder="Digite sua pergunta..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          disabled={loading}
        />
        <button
          className="rounded bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50"
          onClick={handleSend}
          disabled={loading}
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
