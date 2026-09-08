// Script local para criar um usuário de staff — roda com a service role,
// nunca deve virar um endpoint HTTP. Cria o usuário em auth.users com o
// claim app_metadata.client_id já preenchido (é isso que a RLS
// tenant_isolation usa) e insere a linha correspondente em staff_users.
//
// Uso:
//   node --env-file=.env scripts/create-staff-user.mjs <email> <senha> <client_id>
//
// (--env-file requer Node 20.6+; em versões mais antigas, exporte
// SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no shell antes de rodar.)

import { createClient } from "@supabase/supabase-js";

const [, , email, password, clientId] = process.argv;

if (!email || !password || !clientId) {
  console.error("Uso: node --env-file=.env scripts/create-staff-user.mjs <email> <senha> <client_id>");
  process.exit(1);
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
if (!UUID_RE.test(clientId)) {
  console.error(`client_id "${clientId}" não é um UUID válido. current_client_id() em 0001_init.sql faz ::uuid nesse valor — um formato errado só falharia mais tarde, em runtime.`);
  process.exit(1);
}

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY precisam estar no ambiente.");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  app_metadata: { client_id: clientId },
});

if (userError) {
  console.error("Erro ao criar usuário em auth.users:", userError.message);
  process.exit(1);
}

const authUserId = userData.user.id;

const { error: staffError } = await supabaseAdmin.from("staff_users").insert({
  client_id: clientId,
  auth_user_id: authUserId,
  email,
});

if (staffError) {
  console.error("Usuário criado em auth.users, mas falhou ao inserir em staff_users:", staffError.message);
  console.error(`auth_user_id gerado: ${authUserId} — insira a linha em staff_users manualmente se necessário.`);
  process.exit(1);
}

console.log(`Staff user criado: ${email} (auth_user_id=${authUserId}, client_id=${clientId})`);
