"use client";

import { useFormState, useFormStatus } from "react-dom";
import { subscribeAction, type NewsletterState } from "@/app/actions/newsletter";

const INITIAL_STATE: NewsletterState = { status: "idle" };

function BotaoInscrever() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-fit rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
    >
      {pending ? "Enviando..." : "Inscrever"}
    </button>
  );
}

/**
 * Caixa de newsletter (Modulo 6) — unico componente do portal com
 * "use client", porque precisa de feedback inline (sucesso/erro) sem
 * recarregar a pagina. Usa useFormState/useFormStatus (React 18 + Next
 * 14.2) em vez de useState manual pra ficar alinhado com o padrao de
 * Server Actions ja usado no resto do projeto (login, admin).
 */
export function NewsletterBox() {
  const [state, formAction] = useFormState(subscribeAction, INITIAL_STATE);

  return (
    <section className="mt-3 rounded-md border border-neutral-200 bg-neutral-50 p-4">
      <h2 className="text-base font-semibold text-neutral-900">Receba novidades</h2>
      <p className="mt-1 text-sm text-neutral-600">
        Artigos novos do VaultMindOS direto no seu e-mail, sem spam.
      </p>

      <form action={formAction} className="mt-3 flex flex-wrap gap-2">
        <input
          type="email"
          name="email"
          required
          placeholder="seu@email.com"
          className="min-w-[220px] flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none"
        />
        <BotaoInscrever />
      </form>

      {state.status !== "idle" && (
        <p
          className={`mt-2 text-sm ${
            state.status === "success" ? "text-green-700" : "text-red-700"
          }`}
        >
          {state.message}
        </p>
      )}
    </section>
  );
}
