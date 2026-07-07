"use client";

/** Botão simples que aciona a impressão do navegador — vira "Salvar como PDF" no diálogo de impressão. Sem lib nova. */
export function PrintButton({ label = "Imprimir / Salvar como PDF" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="print:hidden w-fit rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
    >
      {label}
    </button>
  );
}
