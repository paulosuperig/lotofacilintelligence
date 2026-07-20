// Edge Function: admin-delete-user
// Permite que um admin autenticado exclua DEFINITIVAMENTE outro usuário —
// removendo a conta de auth.users (via service_role). O perfil em public.profiles
// é apagado em cascata pelo trigger/FK. Sem isso, apagar só a linha de `profiles`
// deixa a conta de login ativa (o usuário volta a entrar como 'demo').
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  buildCorsHeaders,
  forbiddenOrigin,
  internalError,
  isOriginAllowed,
} from "../_shared/security.ts";

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");
  const cors = buildCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    if (!isOriginAllowed(origin)) return forbiddenOrigin(origin);
    return new Response(null, { headers: cors });
  }

  if (!isOriginAllowed(origin)) return forbiddenOrigin(origin);

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: isAdmin, error: roleErr } = await admin.rpc("has_role", {
      _user_id: user.id, _role: "admin",
    });
    if (roleErr || !isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden: admin only" }), {
        status: 403, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const { userId } = await req.json();
    if (!userId || typeof userId !== "string") {
      return new Response(JSON.stringify({ error: "Invalid payload (userId required)" }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // Um admin não pode excluir a própria conta (evita lockout acidental).
    if (userId === user.id) {
      return new Response(JSON.stringify({ error: "Cannot delete your own account" }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const { error: delErr } = await admin.auth.admin.deleteUser(userId);
    if (delErr) throw delErr;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("admin-delete-user error:", e);
    return internalError(origin);
  }
});
