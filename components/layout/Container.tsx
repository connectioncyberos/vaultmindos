import type { ReactNode } from "react";

/**
 * Container padrao de largura de conteudo (Modulo 6). Centraliza o
 * `mx-auto max-w-3xl px-4` que vinha sendo repetido em cada page.tsx
 * desde o Modulo 2 — a partir daqui, toda pagina publica usa este
 * componente em vez de reescrever a classe.
 *
 * `wide`: usa `max-w-6xl` em vez de `max-w-3xl`. Criado pra paginas de
 * listagem (home, gloss[a]rio, reviews, comparativos, roadmaps, vault
 * domain/cluster) cujas grades de cards precisam de espaco pra caber
 * 4 colunas em telas grandes — o `max-w-3xl` original e bom pra leitura
 * de texto corrido, mas apertado demais pra grade de cards.
 */
export function Container({
  children,
  className = "",
  wide = false,
}: {
  children: ReactNode;
  className?: string;
  wide?: boolean;
}) {
  return <div className={`mx-auto ${wide ? "max-w-6xl" : "max-w-3xl"} px-4 ${className}`}>{children}</div>;
}
