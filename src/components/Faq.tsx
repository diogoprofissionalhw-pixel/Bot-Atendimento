import { useEffect, useState } from "react";
import { supabase, CURRENT_CLIENT_ID } from "../lib/supabaseClient";
import type { KnowledgeBaseEntry } from "../types";

export function Faq() {
  const [entries, setEntries] = useState<KnowledgeBaseEntry[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("knowledge_base")
      .select("id, question, answer")
      .eq("client_id", CURRENT_CLIENT_ID)
      .then(({ data }) => setEntries(data ?? []));
  }, []);

  if (entries.length === 0) {
    return <p className="text-sm text-gray-500">Nenhuma pergunta frequente cadastrada ainda.</p>;
  }

  return (
    <div className="divide-y divide-gray-200 rounded-lg border border-gray-200">
      {entries.map((entry) => (
        <div key={entry.id} className="p-4">
          <button
            className="w-full text-left font-medium"
            onClick={() => setOpenId(openId === entry.id ? null : entry.id)}
          >
            {entry.question}
          </button>
          {openId === entry.id && <p className="mt-2 text-sm text-gray-600">{entry.answer}</p>}
        </div>
      ))}
    </div>
  );
}
