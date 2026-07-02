/**
 * Home — segue a hierarquia fixa do Visual Language v1.0 (secao 4):
 * Contexto -> Titulo -> Descricao -> Acao Principal -> Conteudo ->
 * Conteudo Relacionado -> Acoes Secundarias. Mobile-first: a ordem
 * das secoes e a mesma em qualquer largura de tela.
 */
export default function HomePage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6">
      {/* Contexto */}
      <p className="text-sm font-medium uppercase tracking-wide text-neutral-500">
        VaultMindOS
      </p>

      {/* Titulo Principal */}
      <h1 className="text-3xl font-bold leading-tight text-neutral-900">
        Sistema Operacional de Conhecimento
      </h1>

      {/* Descricao */}
      <p className="text-base leading-relaxed text-neutral-600">
        Fundação em construção — a base operacional do VaultMindOS está sendo
        montada sobre a ConnectionCyber Developer Platform (CDP).
      </p>

      {/* Acao Principal */}
      <a
        href="https://github.com/connectioncyberos/vaultmindos"
        className="w-fit rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
      >
        Ver repositório
      </a>

      {/* Conteudo */}
      <section className="mt-3 border-t border-neutral-200 pt-6">
        <h2 className="text-lg font-semibold text-neutral-900">Módulo 2 em andamento</h2>
        <p className="mt-2 text-sm text-neutral-600">
          Bootstrap do projeto Next.js, TypeScript e Tailwind concluído. Os módulos
          seguintes (Supabase, Autenticação, Portal Público, CMS) seguem o{" "}
          <code>Master Execution Roadmap v1.0</code>.
        </p>
      </section>

      {/* Conteudo Relacionado */}
      <section className="mt-3">
        <h2 className="text-lg font-semibold text-neutral-900">Documentação</h2>
        <ul className="mt-2 list-inside list-disc text-sm text-neutral-600">
          <li>docs/blueprint/origem-do-projeto-v1.md</li>
          <li>docs/devops/repository-backup-foundation-v1.md</li>
        </ul>
      </section>

      {/* Acoes Secundarias */}
      <section className="mt-3 border-t border-neutral-200 pt-6">
        <a href="/login" className="text-sm font-medium text-neutral-700 underline">
          Entrar
        </a>
      </section>
    </main>
  );
}
