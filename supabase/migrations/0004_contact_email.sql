-- Quando a IA não responde com confiança suficiente (awaiting_approval ou
-- pending_items), o chat pergunta o e-mail do visitante para a equipe poder
-- responder depois. É opcional: o registro já existe antes de perguntar
-- (question/ai_suggestion já foram salvos), então nulo aqui só significa
-- que a pessoa não quis informar contato.

alter table pending_items add column customer_email text;
alter table awaiting_approval add column customer_email text;
