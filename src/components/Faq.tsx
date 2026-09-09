import { useEffect, useState } from "react";
import type { KnowledgeBaseEntry } from "../types";

function FaqList({
  entries,
  openId,
  setOpenId,
}: {
  entries: KnowledgeBaseEntry[];
  openId: string | null;
  setOpenId: (id: string | null) => void;
}) {
  if (entries.length === 0) {
    return <p className="text-sm text-gray-500">Nenhuma pergunta cadastrada ainda.</p>;
  }

  return (
    <div className="divide-y divide-gray-200">
      {entries.map((entry) => (
        <div key={entry.id} className="py-3 first:pt-0 last:pb-0">
          <button
            className="flex w-full items-center justify-between gap-4 text-left font-medium text-gray-900 hover:text-[var(--brand-primary)]"
            onClick={() => setOpenId(openId === entry.id ? null : entry.id)}
          >
            <span>{entry.question}</span>
            <span className="text-gray-400">{openId === entry.id ? "−" : "+"}</span>
          </button>
          {openId === entry.id && <p className="mt-2 text-sm text-gray-600">{entry.answer}</p>}
        </div>
      ))}
    </div>
  );
}

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

  const geral = entries.filter((e) => e.audience === "ambos");
  const medico = entries.filter((e) => e.audience === "medico");
  const rede = entries.filter((e) => e.audience === "rede");

  return (
    <div className="space-y-6">
      {geral.length > 0 && (
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-medium text-gray-900">Perguntas frequentes</h2>
          <FaqList entries={geral} openId={openId} setOpenId={setOpenId} />
        </section>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-medium text-gray-900">Perguntas do médico</h2>
          <FaqList entries={medico} openId={openId} setOpenId={setOpenId} />
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-medium text-gray-900">Perguntas das empresas</h2>
          <FaqList entries={rede} openId={openId} setOpenId={setOpenId} />
        </section>
      </div>
    </div>
  );
}
