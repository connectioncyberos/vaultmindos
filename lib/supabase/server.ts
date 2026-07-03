import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cliente Supabase para uso em Server Components, Route Handlers e
 * Server Actions. Le/escreve cookies de sessao via next/headers.
 * Ainda usa a anon key — a service role key nunca entra no codigo da
 * aplicacao (fica reservada a jobs administrativos server-only, se
 * algum dia forem necessarios, sempre fora do bundle do cliente).
 *
 * `global.fetch` com `cache: "no-store"`: o App Router intercepta todo
 * `fetch()` do lado do servidor e cacheia por padrao em producao (Data
 * Cache do Next.js). Como o supabase-js usa fetch por baixo, sem isso
 * toda consulta ficava presa no primeiro resultado buscado, ignorando
 * mudancas no banco e ate deploys novos — foi a causa do bug de
 * "pagina em producao nao atualiza" no Modulo 10. Sem cache aqui de
 * proposito: e um site com CMS, o conteudo muda a qualquer momento e
 * precisa refletir na hora, nao faz sentido servir uma versao presa.
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // chamado a partir de um Server Component — ignorado com
            // seguranca quando ha middleware de refresh de sessao.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {
            // idem
          }
        },
      },
      global: {
        fetch: (input: RequestInfo | URL, init?: RequestInit) =>
          fetch(input, { ...init, cache: "no-store" }),
      },
    },
  );
}
