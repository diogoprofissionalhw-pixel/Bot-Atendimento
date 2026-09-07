import { useEffect, useState } from "react";
import type { KnowledgeBaseEntry } from "../types";

export function Faq() {
  const [entries, setEntries] = useState<KnowledgeBaseEntry[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/faq")
      .then((res) => {
        if (!res.ok) throw new Error("Falha ao carregar o FAQ");
        return res.json();
      })
      .then((data: { entries: KnowledgeBaseEntry[] }) => setEntries(data.entries ?? []))
      .catch(() => setError(true));
  }, []);

  if (error) {
    return <p className="text-sm text-red-600">Não foi possível carregar as perguntas frequentes. Tente novamente mais tarde.</p>;
  }

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
