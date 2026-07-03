import type { ReactNode } from "react";

/**
 * Container padrao de largura de conteudo (Modulo 6). Centraliza o
 * `mx-auto max-w-3xl px-4` que vinha sendo repetido em cada page.tsx
 * desde o Modulo 2 — a partir daqui, toda pagina publica usa este
 * componente em vez de reescrever a classe.
 */
export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto max-w-3xl px-4 ${className}`}>{children}</div>;
}
