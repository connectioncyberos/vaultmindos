"use client";

import { useFormState, useFormStatus } from "react-dom";
import { contactAction, type ContactState } from "@/app/actions/contact";

const INITIAL_STATE: ContactState = { status: "idle" };

function BotaoEnviar() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-fit rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
    >
      {pending ? "Enviando..." : "Enviar mensagem"}
    </button>
  );
}

export function ContactForm() {
  const [state, formAction] = useFormState(contactAction, INITIAL_STATE);

  return (
    <div className="flex flex-col gap-4">
      <form action={formAction} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm text-neutral-700">
          Nome
          <input
            type="text"
            name="nome"
            required
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-neutral-700">
          E-mail
          <input
            type="email"
            name="email"
            required
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-neutral-700">
          Mensagem
          <textarea
            name="mensagem"
            required
            rows={5}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none"
          />
        </label>

        <BotaoEnviar />
      </form>

      {state.status !== "idle" && (
        <p className={`text-sm ${state.status === "success" ? "text-green-700" : "text-red-700"}`}>
          {state.message}
        </p>
      )}

      {state.status === "error" && (
        <p className="text-sm text-neutral-600">
          E-mail direto:{" "}
          <a href="mailto:contato@vaultmindos.com" className="underline">
            contato@vaultmindos.com
          </a>
        </p>
      )}
    </div>
  );
}
