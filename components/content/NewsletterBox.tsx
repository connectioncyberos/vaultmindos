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
      className="w-fit rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
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
    <section className="mt-3 rounded-md border border-neutral-800 bg-neutral-900 p-4">
      <h2 className="text-base font-semibold text-neutral-100">Receba novidades</h2>
      <p className="mt-1 text-sm text-neutral-400">
        Artigos novos do VaultMindOS direto no seu e-mail, sem spam.
      </p>

      <form action={formAction} className="mt-3 flex flex-wrap gap-2">
        <input
          type="email"
          name="email"
          required
          placeholder="seu@email.com"
          className="min-w-[220px] flex-1 rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 focus:border-emerald-500 focus:outline-none"
        />
        <BotaoInscrever />
      </form>

      {state.status !== "idle" && (
        <p
          className={`mt-2 text-sm ${
            state.status === "success" ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {state.message}
        </p>
      )}
    </section>
  );
}
