import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";

export const metadata = {
  title: "Sobre | VaultMindOS",
  description: "O que é o VaultMindOS e por que ele existe.",
};

/** /sobre — pagina estatica institucional. */
export default function SobrePage() {
  return (
    <>
      <Header />
      <Container className="flex flex-col gap-6 py-6">
        <p className="text-sm font-medium uppercase tracking-wide text-neutral-500">VaultMindOS</p>
        <h1 className="text-3xl font-bold leading-tight text-neutral-900">Sobre</h1>
        <p className="text-base leading-relaxed text-neutral-600">
          VaultMindOS é um Sistema Operacional de Conhecimento — não um blog. O
          conteúdo é organizado em domínios e clusters (IA, Tecnologia,
          Automação, SEO e Negócios Digitais), com links internos e estrutura
          pensada pra navegação e busca, não só pra publicação cronológica.
        </p>

        <section className="mt-3 border-t border-neutral-200 pt-6">
          <h2 className="text-lg font-semibold text-neutral-900">Como o conteúdo é organizado</h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600">
            Cada domínio (ex.: Inteligência Artificial) se divide em clusters
            (ex.: LLMs), e cada cluster reúne artigos relacionados. Além dos
            artigos do Vault, o site tem glossário, reviews, comparativos e
            roadmaps — formatos diferentes pra necessidades diferentes de
            quem está pesquisando.
          </p>
        </section>

        <section className="mt-3">
          <h2 className="text-lg font-semibold text-neutral-900">Construído sobre a CDP</h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600">
            O VaultMindOS roda sobre a ConnectionCyber Developer Platform
            (CDP) — a infraestrutura interna de backup, versionamento e
            padronização usada em todos os projetos ConnectionCyber.
          </p>
        </section>
      </Container>
      <Footer />
    </>
  );
}
