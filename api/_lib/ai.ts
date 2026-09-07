// Usa a OpenRouter (API compatível com o formato OpenAI) como provedor de IA
// enquanto a integração com a MiniMax M3 não está configurada. Basta trocar
// AI_API_URL/AI_API_KEY/AI_MODEL para apontar para outro provedor compatível
// (incluindo a própria MiniMax M3 futuramente) sem mudar o restante do código.
const AI_API_URL = process.env.AI_API_URL ?? "https://openrouter.ai/api/v1/chat/completions";

export interface AiDecision {
  answer: string;
  confidence: number; // 0..1
}

/**
 * Chama o provedor de IA e pede para retornar também uma auto-avaliação de
 * confiança (0 a 1), já que o critério de "certeza" precisa ser objetivo e
 * não pode depender de heurística de texto no cliente.
 */
export async function askAi(question: string, knowledgeContext: string): Promise<AiDecision> {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) throw new Error("AI_API_KEY não configurada no backend");

  const systemPrompt = `Você é um assistente de atendimento ao cliente. Use somente o
contexto de base de conhecimento fornecido para responder. Responda em JSON
no formato {"answer": string, "confidence": number} onde confidence é sua
certeza de 0 a 1 de que a resposta está correta e completa.

Base de conhecimento:
${knowledgeContext}`;

  const response = await fetch(AI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.AI_MODEL ?? "openai/gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    throw new Error(`IA retornou ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(content);

  return {
    answer: parsed.answer ?? "",
    confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0,
  };
}
