import { getCurrentUser } from "@/lib/auth/session";
import { getAllSectorsForAdmin } from "@/lib/academy/queries";
import { createCourseAction } from "../actions";

/** /admin/academy/cursos/novo — formulário de criação de curso (admin). */
export default async function NovoCursoPage({ searchParams }: { searchParams: { erro?: string } }) {
  const user = await getCurrentUser();
  const souAdmin = user?.role === "admin";

  if (!souAdmin) {
    return (
      <p className="rounded-md border border-red-900/50 bg-red-950/40 p-3 text-sm text-red-200">
        Só o admin pode criar cursos.
      </p>
    );
  }

  const setores = await getAllSectorsForAdmin();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium uppercase tracking-wide text-neutral-500">CMS · Academy · Cursos</p>
        <h1 className="text-3xl font-bold leading-tight text-neutral-100">Novo curso</h1>
        <p className="text-base leading-relaxed text-neutral-400">
          Deixe preço em branco pra curso gratuito, e setor em branco pra curso sem trilha (ex.: um
          curso de teste ou algo como o Nivelamento).
        </p>
      </div>

      {searchParams?.erro && (
        <p className="rounded-md border border-red-900/50 bg-red-950/40 p-3 text-sm text-red-200">
          {searchParams.erro}
        </p>
      )}

      <form action={createCourseAction} className="flex flex-col gap-4 rounded-md border border-neutral-800 bg-neutral-900 p-5">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium uppercase tracking-wide text-neutral-500" htmlFor="title">
            Título
          </label>
          <input
            id="title"
            name="title"
            required
            className="rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium uppercase tracking-wide text-neutral-500" htmlFor="slug">
            Slug (opcional — gerado a partir do título se vazio)
          </label>
          <input
            id="slug"
            name="slug"
            placeholder="ex.: meu-curso-basico"
            className="rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium uppercase tracking-wide text-neutral-500" htmlFor="description">
            Descrição
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            className="rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium uppercase tracking-wide text-neutral-500" htmlFor="level">
              Nível
            </label>
            <input
              id="level"
              name="level"
              placeholder="Iniciante, Intermediário..."
              className="rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium uppercase tracking-wide text-neutral-500" htmlFor="sector_id">
              Setor
            </label>
            <select
              id="sector_id"
              name="sector_id"
              className="rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100"
            >
              <option value="">Nenhum</option>
              {setores.map((setor) => (
                <option key={setor.id} value={setor.id}>
                  {setor.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium uppercase tracking-wide text-neutral-500" htmlFor="price_reais">
              Preço (R$)
            </label>
            <input
              id="price_reais"
              name="price_reais"
              placeholder="ex.: 97,00 — vazio = gratuito"
              className="rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-neutral-300">
          <input
            type="checkbox"
            name="is_active"
            defaultChecked
            className="h-4 w-4 rounded border-neutral-700 bg-neutral-950"
          />
          Ativo (aparece no catálogo)
        </label>

        <button
          type="submit"
          className="w-fit rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
        >
          Criar curso
        </button>
      </form>
    </div>
  );
}
