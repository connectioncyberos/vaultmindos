import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { ContactForm } from "@/components/content/ContactForm";

export const metadata = {
  title: "Contato | VaultMindOS",
  description: "Fale com a equipe do VaultMindOS.",
};

/** /contato — formulario de contato (envio real via Resend no Modulo 9). */
export default function ContatoPage() {
  return (
    <>
      <Header />
      <Container className="flex flex-col gap-6 py-6">
        <p className="text-sm font-medium uppercase tracking-wide text-neutral-500">VaultMindOS</p>
        <h1 className="text-3xl font-bold leading-tight text-neutral-900">Contato</h1>
        <p className="text-base leading-relaxed text-neutral-600">
          Dúvida, sugestão de conteúdo ou parceria — manda uma mensagem.
        </p>

        <section className="mt-3 border-t border-neutral-200 pt-6">
          <ContactForm />
        </section>
      </Container>
      <Footer />
    </>
  );
}
