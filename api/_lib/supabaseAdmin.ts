import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY precisam estar definidas no backend");
}

// Cliente com service role: só usado no servidor, nunca exposto ao front.
// Cada query abaixo filtra client_id manualmente pois RLS não se aplica à service role.
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
