const MINIMAX_API_URL = process.env.MINIMAX_API_URL ?? "https://api.minimax.io/v1/chat/completions";

export interface AiDecision {
  answer: string;
  confidence: number; // 0..1
}

/**
 * Chama a API MiniMax M3 e pede ao modelo para retornar também uma auto-avaliação
 * de confiança (0 a 1), já que o critério de "certeza" precisa ser objetivo e
 * não pode depender de heurística de texto no cliente.
 */
export async function askMiniMax(question: string, knowledgeContext: string): Promise<AiDecision> {
  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) throw new Error("MINIMAX_API_KEY não configurada no backend");

  const systemPrompt = `Você é um assistente de atendimento ao cliente. Use somente o
contexto de base de conhecimento fornecido para responder. Responda em JSON
no formato {"answer": string, "confidence": number} onde confidence é sua
certeza de 0 a 1 de que a resposta está correta e completa.

Base de conhecimento:
${knowledgeContext}`;

  const response = await fetch(MINIMAX_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.MINIMAX_MODEL ?? "MiniMax-M3",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    throw new Error(`MiniMax API retornou ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(content);

  return {
    answer: parsed.answer ?? "",
    confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0,
  };
}
