import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";

export const metadata = {
  title: "Política de Privacidade | VaultMindOS",
  description: "Como o VaultMindOS trata seus dados pessoais.",
};

/**
 * /privacidade — RASCUNHO, mesmo aviso de /termos: destrava o checkbox
 * de aceite dos cadastros reais, mas precisa de revisão jurídica (LGPD)
 * antes de operar com dado pessoal real em produção.
 */
export default function PrivacidadePage() {
  return (
    <>
      <Header />
      <Container className="flex flex-col gap-6 py-6">
        <h1 className="text-3xl font-bold leading-tight text-neutral-100">Política de Privacidade</h1>
        <p className="text-sm text-neutral-500">Última atualização: {new Date().toLocaleDateString("pt-BR")}</p>

        <section className="flex flex-col gap-3 text-sm leading-relaxed text-neutral-400">
          <p>
            Esta política descreve quais dados o VaultMindOS coleta e como são usados, em linha com
            a Lei Geral de Proteção de Dados (LGPD).
          </p>

          <h2 className="mt-2 text-base font-semibold text-neutral-100">1. Dados que coletamos</h2>
          <p>
            Nome completo e e-mail no cadastro; dados de progresso nos cursos (aulas concluídas,
            certificados emitidos); quando aplicável, nome/CNPJ/setor da empresa parceira e o vínculo
            entre colaborador e empresa patrocinadora.
          </p>

          <h2 className="mt-2 text-base font-semibold text-neutral-100">2. Para que usamos</h2>
          <p>
            Autenticar seu acesso, controlar matrícula e progresso nos cursos, emitir certificados, e
            permitir que o responsável de uma empresa parceira acompanhe o progresso de colaboradores
            patrocinados por ela.
          </p>

          <h2 className="mt-2 text-base font-semibold text-neutral-100">3. Compartilhamento</h2>
          <p>
            Não vendemos dados pessoais. Dados de progresso de um colaborador só são visíveis ao
            RH/gestor da empresa que patrocina a matrícula dele — nunca a outras empresas ou alunos.
          </p>

          <h2 className="mt-2 text-base font-semibold text-neutral-100">4. Seus direitos</h2>
          <p>
            Você pode solicitar acesso, correção ou exclusão dos seus dados a qualquer momento pelo{" "}
            <a href="/contato" className="text-emerald-400 underline hover:text-emerald-300">
              formulário de contato
            </a>
            .
          </p>

          <p className="mt-4 text-xs text-neutral-600">
            Este é um texto padrão inicial. Recomendamos revisão jurídica (LGPD) antes de qualquer uso
            comercial em produção.
          </p>
        </section>
      </Container>
      <Footer />
    </>
  );
}
