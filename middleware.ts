import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware de sessao Supabase (Modulo 5).
 *
 * Roda em toda request (exceto assets estaticos, ver `config.matcher`
 * abaixo) e chama `supabase.auth.getUser()`, que renova o token de
 * sessao automaticamente quando ele esta perto de expirar, escrevendo
 * o cookie novo na resposta. Sem isso, sessoes expiram silenciosamente
 * e o usuario e deslogado sem aviso no meio do uso.
 *
 * Nao faz redirecionamento de rota aqui de proposito — a checagem de
 * "esta pagina exige login/role X" fica em cada rota protegida
 * (ex.: app/admin/page.tsx), para manter a logica de autorizacao perto
 * de onde ela e usada e facil de auditar.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    },
  );

  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
