-- Classifica cada entrada da knowledge_base por público-alvo, para a
-- Central de Ajuda separar "Perguntas do médico" e "Perguntas das
-- empresas" em colunas, com uma seção geral acima para quem serve aos
-- dois. Default 'ambos' -- entradas existentes ficam na seção geral até
-- serem reclassificadas.

alter table knowledge_base
  add column audience text not null default 'ambos'
  check (audience in ('medico', 'rede', 'ambos'));
