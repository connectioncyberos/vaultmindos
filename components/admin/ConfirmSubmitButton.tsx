"use client";

import type { MouseEvent, ReactNode } from "react";

/**
 * Botao de acao destrutiva (Modulo 7) — unico motivo de "use client"
 * nesta parte do CMS: precisa de um confirm() nativo antes de
 * submeter o <form> que envolve este botao (o form chama a Server
 * Action de delete). Sem framework de estado, so um clique.
 */
export function ConfirmSubmitButton({
  children,
  confirmMessage,
  className,
}: {
  children: ReactNode;
  confirmMessage: string;
  className?: string;
}) {
  function handleClick(e: MouseEvent<HTMLButtonElement>) {
    if (!confirm(confirmMessage)) {
      e.preventDefault();
    }
  }

  return (
    <button type="submit" className={className} onClick={handleClick}>
      {children}
    </button>
  );
}
