import { Faq } from "../components/Faq";
import { ChatWidget } from "../components/ChatWidget";
import { ReclameAquiForm } from "../components/ReclameAquiForm";

export function CentralAjuda() {
  return (
    <div className="mx-auto max-w-2xl space-y-8 p-6">
      <h1 className="text-2xl font-semibold">Central de Ajuda</h1>

      <section>
        <h2 className="mb-2 text-lg font-medium">Perguntas frequentes</h2>
        <Faq />
      </section>

      <section>
        <h2 className="mb-2 text-lg font-medium">Fale com a gente</h2>
        <ChatWidget />
      </section>

      <section>
        <h2 className="mb-2 text-lg font-medium">Não resolveu?</h2>
        <ReclameAquiForm />
      </section>
    </div>
  );
}
