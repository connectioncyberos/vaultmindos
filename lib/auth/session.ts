import { createClient } from "@/lib/supabase/server";

export type Role = "admin" | "editor" | "author" | "subscriber";

export type CurrentUser = {
  id: string;
  email: string | null;
  role: Role;
  fullName: string | null;
};

/**
 * Le o usuario autenticado (via `getUser()`, que valida o token contra
 * o servidor Supabase — mais seguro que confiar apenas no cookie de
 * sessao local) e junta com o papel salvo em `users_profile`.
 *
 * Retorna `null` quando nao ha sessao valida. Usado por toda rota
 * protegida (Modulo 5 em diante) para decidir acesso.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("users_profile")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  return {
    id: user.id,
    email: user.email ?? null,
    role: (profile?.role as Role) ?? "subscriber",
    fullName: profile?.full_name ?? null,
  };
}

/** Papeis com algum nivel de acesso ao CMS (Modulo 7). */
export const CMS_ROLES: Role[] = ["admin", "editor", "author"];
