import Link from "next/link";

/**
 * Topo minimo — so o logo, sem nav nem "Entrar". Usado em paginas que
 * nao devem expor a navegacao do site publico (ex.: /login), onde a
 * nav completa do Header nao faz sentido nem visualmente nem por UX
 * (nao e um gate de acesso, so ruido numa tela de autenticacao).
 */
export function LogoHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-neutral-800 bg-neutral-950 py-4">
      <div className="mx-auto flex max-w-7xl items-center px-4">
        <Link href="/" className="shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="VaultMindOS" className="h-8 w-auto object-contain" />
        </Link>
      </div>
    </header>
  );
}
