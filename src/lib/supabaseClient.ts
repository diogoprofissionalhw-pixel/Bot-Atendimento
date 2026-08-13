import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY precisam estar definidas no .env");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// client_id do tenant atual — em produção isso vem de config por domínio/subdomínio
// ou é embutido no build de cada cliente revendido.
export const CURRENT_CLIENT_ID = import.meta.env.VITE_CLIENT_ID as string;
