import { useState } from "react";
import type { ChatMessage } from "../types";

type ChatStatus = "answered" | "awaiting_approval" | "pending";
type ItemType = "pending_items" | "awaiting_approval";
type PendingContact = { itemType: ItemType; itemId: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const GREETING: ChatMessage = {
  id: "greeting",
  sender: "ai",
  body: "Oi! Pode perguntar o que precisar que eu te ajudo.",
  created_at: new Date().toISOString(),
};

export function ChatWidget() {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingContact, setPendingContact] = useState<PendingContact | null>(null);
  const [emailAsked, setEmailAsked] = useState(false);

  function appendMessage(sender: ChatMessage["sender"], body: string) {
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), sender, body, created_at: new Date().toISOString() }]);
  }

  async function ensureConversation(): Promise<string> {
    if (conversationId) return conversationId;
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel: "chat" }),
    });
    const data: { id?: string } = await res.json();
    if (!res.ok || !data.id) throw new Error("Não foi possível iniciar a conversa");
    setConversationId(data.id);
    return data.id;
  }

  async function submitContactEmail(convId: string, contact: PendingContact, email: string) {
    try {
      const res = await fetch("/api/contact-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: convId, itemType: contact.itemType, itemId: contact.itemId, email }),
      });
      if (!res.ok) throw new Error("Falha ao registrar e-mail");
      appendMessage("ai", "Obrigado! Assim que tivermos uma resposta, entramos em contato por esse e-mail.");
    } catch {
      appendMessage("ai", "Não consegui salvar seu e-mail agora, mas sua mensagem já está registrada — nossa equipe responde por aqui.");
    }
  }

  async function handleSend() {
    if (!input.trim() || loading) return;
    setLoading(true);
    const text = input.trim();
    setInput("");
    appendMessage("customer", text);

    try {
      const convId = await ensureConversation();

      if (pendingContact) {
        const contact = pendingContact;
        setPendingContact(null);
        if (EMAIL_RE.test(text)) {
          await submitContactEmail(convId, contact, text);
          return;
        }
        // Não parece e-mail: trata como "prefiro não informar" e segue o
        // texto como uma pergunta normal — nunca descarta a mensagem.
      }

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: convId, question: text }),
      });
      if (!res.ok) throw new Error("Falha ao obter resposta do servidor");
      const data: { status: ChatStatus; answer?: string; itemType?: ItemType; itemId?: string } = await res.json();

      const reply =
        data.status === "answered"
          ? data.answer!
          : data.status === "awaiting_approval"
            ? "Recebi sua pergunta e vou confirmar a resposta com a equipe antes de te responder."
            : "Não tenho certeza da resposta — encaminhei para a nossa equipe, que vai te responder em breve.";

      appendMessage("ai", reply);

      if ((data.status === "awaiting_approval" || data.status === "pending") && !emailAsked && data.itemType && data.itemId) {
        setEmailAsked(true);
        setPendingContact({ itemType: data.itemType, itemId: data.itemId });
        appendMessage("ai", "Se quiser, deixe seu e-mail que a equipe te avisa por lá assim que tiver uma resposta — ou pode só continuar perguntando.");
      }
    } catch {
      appendMessage("ai", "Ocorreu um erro ao processar sua mensagem. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-64 flex-col rounded-lg border border-gray-200">
      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {messages.map((m) => (
          <div key={m.id} className={m.sender === "customer" ? "text-right" : "text-left"}>
            <span
              className={`inline-block rounded-lg px-3 py-2 text-sm ${
                m.sender === "customer" ? "bg-[var(--brand-primary)] text-white" : "bg-gray-100 text-gray-800"
              }`}
            >
              {m.body}
            </span>
          </div>
        ))}
      </div>
      <div className="flex gap-2 border-t border-gray-200 p-2">
        <input
          className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
          placeholder={pendingContact ? "seu e-mail (opcional)..." : "Digite sua pergunta..."}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          disabled={loading}
        />
        <button
          className="rounded bg-[var(--brand-primary)] px-4 py-2 text-sm text-white transition hover:brightness-90 disabled:opacity-50"
          onClick={handleSend}
          disabled={loading}
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
