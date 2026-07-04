import { createClient } from "@/lib/supabase/server";

/**
 * Pagina de diagnostico interna do Modulo 4 (nao faz parte do produto,
 * por isso nao segue a hierarquia fixa do Visual Language — e uma
 * ferramenta de validacao, nao uma tela de usuario final).
 *
 * Objetivo: provar que o browser Server Component consegue abrir uma
 * conexao real com o Supabase e rodar uma query usando a anon key,
 * respeitando RLS (le a tabela "categories", que tem policy de leitura
 * publica). Satisfaz o criterio do roadmap: "primeira query de teste
 * executada".
 */
export default async function DbCheckPage() {
  const supabase = createClient();

  const { data, error, status } = await supabase
    .from("categories")
    .select("id, slug, name")
    .limit(5);

  const conectado = !error;

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6">
      <p className="text-sm font-medium uppercase tracking-wide text-neutral-500">
        Módulo 4 — Diagnóstico
      </p>

      <h1 className="text-3xl font-bold leading-tight text-neutral-100">
        Verificação de conexão Supabase
      </h1>

      <section
        className={`mt-3 rounded-md border p-4 text-sm ${
          conectado
            ? "border-emerald-900/50 bg-emerald-950/40 text-emerald-200"
            : "border-red-900/50 bg-red-950/40 text-red-200"
        }`}
      >
        <p className="font-semibold">
          {conectado ? "Conexão OK" : "Falha na conexão"}
        </p>
        <p className="mt-1">HTTP status: {status}</p>
        {error && (
          <p className="mt-1">
            Erro: {error.message}
            {error.hint ? ` — hint: ${error.hint}` : ""}
          </p>
        )}
      </section>

      <section className="mt-3 border-t border-neutral-800 pt-6">
        <h2 className="text-lg font-semibold text-neutral-100">
          Resultado da query
        </h2>
        <p className="mt-2 text-sm text-neutral-400">
          <code>select id, slug, name from categories limit 5</code>
        </p>

        {conectado && data && data.length === 0 && (
          <p className="mt-2 text-sm text-neutral-400">
            Conexão funcionando. Tabela <code>categories</code> existe e está
            vazia (esperado — schema recém-aplicado, nenhum dado ainda).
          </p>
        )}

        {conectado && data && data.length > 0 && (
          <ul className="mt-2 list-inside list-disc text-sm text-neutral-400">
            {data.map((row) => (
              <li key={row.id}>
                {row.name} ({row.slug})
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-3">
        <h2 className="text-lg font-semibold text-neutral-100">
          Checklist antes de testar
        </h2>
        <ul className="mt-2 list-inside list-disc text-sm text-neutral-400">
          <li>
            <code>docs/database/schema-v1.sql</code> aplicado no SQL Editor do
            projeto Supabase.
          </li>
          <li>
            <code>.env.local</code> com <code>NEXT_PUBLIC_SUPABASE_URL</code> e{" "}
            <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> preenchidos.
          </li>
          <li>Servidor rodando com {"`npm run dev`"} reiniciado após criar o {"`.env.local`"}.</li>
        </ul>
      </section>
    </main>
  );
}
