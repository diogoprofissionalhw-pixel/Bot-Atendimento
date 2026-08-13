import { useState } from "react";
import emailjs from "@emailjs/browser";
import { supabase, CURRENT_CLIENT_ID } from "../lib/supabaseClient";

interface EmailConfig {
  emailjs_service_id: string;
  emailjs_template_id: string;
  emailjs_public_key: string;
}

export function ReclameAquiForm() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");

    const { data: config } = await supabase
      .from("config_per_client")
      .select("emailjs_service_id, emailjs_template_id, emailjs_public_key")
      .eq("client_id", CURRENT_CLIENT_ID)
      .single<EmailConfig>();

    if (!config) {
      setStatus("error");
      return;
    }

    try {
      // reply_to é o e-mail do cliente final; o "From" exibido é sempre a caixa
      // real conectada ao EmailJS da empresa, não um endereço forjado.
      await emailjs.send(
        config.emailjs_service_id,
        config.emailjs_template_id,
        { from_name: name, reply_to: email, message },
        { publicKey: config.emailjs_public_key },
      );

      const { data: conversation } = await supabase
        .from("conversations")
        .insert({ client_id: CURRENT_CLIENT_ID, channel: "email", customer_ref: email })
        .select("id")
        .single();

      if (conversation) {
        await supabase.from("pending_items").insert({
          client_id: CURRENT_CLIENT_ID,
          conversation_id: conversation.id,
          question: message,
        });
      }

      setStatus("sent");
      setName("");
      setEmail("");
      setMessage("");
    } catch {
      setStatus("error");
    }
  }

  if (!open) {
    return (
      <button
        className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white"
        onClick={() => setOpen(true)}
      >
        Reclame Aqui
      </button>
    );
  }

  if (status === "sent") {
    return <p className="text-sm text-green-700">Sua mensagem foi enviada. Vamos te responder em breve.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-gray-200 p-4">
      <input
        className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
        placeholder="Seu nome"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <input
        type="email"
        className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
        placeholder="Seu e-mail"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <textarea
        className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
        placeholder="Descreva sua reclamação"
        rows={4}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        required
      />
      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded bg-red-600 px-4 py-2 text-sm text-white disabled:opacity-50"
          disabled={status === "sending"}
        >
          {status === "sending" ? "Enviando..." : "Enviar"}
        </button>
        <button type="button" className="text-sm text-gray-500" onClick={() => setOpen(false)}>
          Cancelar
        </button>
      </div>
      {status === "error" && <p className="text-sm text-red-600">Erro ao enviar. Tente novamente.</p>}
    </form>
  );
}
