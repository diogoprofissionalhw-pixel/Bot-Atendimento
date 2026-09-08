import { useEffect, useState } from "react";
import { Faq } from "../components/Faq";
import { ChatWidget } from "../components/ChatWidget";
import { ReclameAquiForm } from "../components/ReclameAquiForm";

// Visual atual (Tailwind blue-600) — usado quando o tenant não configurou
// branding.primaryColor em config_per_client.
const DEFAULT_PRIMARY = "#2563eb";

interface Branding {
  primaryColor: string | null;
  logoUrl: string | null;
}

export function CentralAjuda() {
  const [branding, setBranding] = useState<Branding>({ primaryColor: null, logoUrl: null });

  useEffect(() => {
    fetch("/api/branding")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: Branding | null) => data && setBranding(data))
      .catch(() => {
        // Sem branding configurado ou endpoint indisponível: mantém o
        // visual padrão (branding já começa como null/null).
      });
  }, []);

  return (
    <div
      className="min-h-screen bg-gray-50"
      style={{ "--brand-primary": branding.primaryColor ?? DEFAULT_PRIMARY } as React.CSSProperties}
    >
      <div className="mx-auto max-w-2xl space-y-6 p-6">
        <header className="flex items-center gap-3 py-2">
          {branding.logoUrl ? (
            <img src={branding.logoUrl} alt="Logo" className="h-10 w-auto" />
          ) : (
            <h1 className="text-2xl font-semibold text-gray-900">Central de Ajuda</h1>
          )}
        </header>

        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-medium text-gray-900">Perguntas frequentes</h2>
          <Faq />
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-medium text-gray-900">Fale com a gente</h2>
          <ChatWidget />
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-medium text-gray-900">Não resolveu?</h2>
          <ReclameAquiForm />
        </section>
      </div>
    </div>
  );
}
