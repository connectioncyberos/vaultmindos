import Link from "next/link";
import { Container } from "./Container";

export function Footer() {
  const ano = new Date().getFullYear();

  return (
    <footer className="mt-12 border-t border-neutral-800 bg-neutral-950 py-6">
      <Container className="flex flex-wrap items-center justify-between gap-4 text-sm text-neutral-500">
        <p>
          © {ano} VaultMindOS — Sistema Operacional de Conhecimento.
        </p>
        <nav className="flex flex-wrap gap-4">
          <Link href="/sobre" className="hover:text-emerald-400">
            Sobre
          </Link>
          <Link href="/contato" className="hover:text-emerald-400">
            Contato
          </Link>
          <a
            href="https://github.com/connectioncyberos/vaultmindos"
            className="hover:text-emerald-400"
          >
            Repositório
          </a>
        </nav>
      </Container>
    </footer>
  );
}
