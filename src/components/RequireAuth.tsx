import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecked(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  if (!checked) return null;
  if (!session) return <Navigate to="/login" replace />;

  return (
    <div>
      <div className="flex justify-end border-b border-gray-200 p-2">
        <button className="text-sm text-gray-500 hover:text-gray-700" onClick={() => supabase.auth.signOut()}>
          Sair
        </button>
      </div>
      {children}
    </div>
  );
}
