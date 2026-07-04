import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";

export const metadata = {
  title: "Termos de Uso | VaultMindOS",
  description: "Termos de Uso do VaultMindOS.",
};

/**
 * /termos — RASCUNHO. Texto genérico o suficiente pra destravar o
 * checkbox de aceite do /signup e /empresas/cadastro (cadastro real
 * de dado pessoal exige algum termo publicado), mas isto NÃO substitui
 * revisão por um advogado antes de operar com usuários reais em
 * produção — ver aviso equivalente no chat que acompanhou a criação
 * deste arquivo.
 */
export default function TermosPage() {
  return (
    <>
      <Header />
      <Container className="flex flex-col gap-6 py-6">
        <h1 className="text-3xl font-bold leading-tight text-neutral-100">Termos de Uso</h1>
        <p className="text-sm text-neutral-500">Última atualização: {new Date().toLocaleDateString("pt-BR")}</p>

        <section className="flex flex-col gap-3 text-sm leading-relaxed text-neutral-400">
          <p>
            Estes Termos regulam o uso do VaultMindOS, plataforma operada pela ConnectionCyber
            Assessoria e Treinamento. Ao criar uma conta, você concorda com estes termos.
          </p>

          <h2 className="mt-2 text-base font-semibold text-neutral-100">1. Cadastro</h2>
          <p>
            Você é responsável pela veracidade dos dados informados no cadastro (pessoal ou de
            empresa parceira) e pela guarda da sua senha. Contas de empresa parceira passam por
            aprovação antes de terem acesso liberado.
          </p>

          <h2 className="mt-2 text-base font-semibold text-neutral-100">2. Uso da Academy</h2>
          <p>
            O conteúdo dos cursos é disponibilizado para uso pessoal de aprendizado. Certificados
            emitidos atestam a conclusão das aulas do curso na plataforma, não uma certificação
            profissional formal de terceiros.
          </p>

          <h2 className="mt-2 text-base font-semibold text-neutral-100">3. Empresas parceiras</h2>
          <p>
            Empresas que patrocinam matrícula de colaboradores são responsáveis por garantir que têm
            consentimento desses colaboradores para o compartilhamento de dados de progresso com o
            responsável (RH/gestor) indicado no cadastro.
          </p>

          <h2 className="mt-2 text-base font-semibold text-neutral-100">4. Alterações</h2>
          <p>
            Podemos atualizar estes Termos conforme a plataforma evolui. Mudanças relevantes serão
            comunicadas por e-mail ou aviso na plataforma.
          </p>

          <p className="mt-4 text-xs text-neutral-600">
            Este é um texto padrão inicial. Recomendamos revisão jurídica antes de qualquer uso
            comercial em produção.
          </p>
        </section>
      </Container>
      <Footer />
    </>
  );
}
