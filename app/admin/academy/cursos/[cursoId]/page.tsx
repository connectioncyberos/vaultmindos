import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getCourseWithContent } from "@/lib/academy/queries";
import { createModuleAction, createLessonAction } from "./actions";

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/**
 * /admin/academy/cursos/[cursoId] — gestão de módulos e aulas de um
 * curso. Formulários simples e sequenciais (cria módulo → aparece na
 * lista → cria aula dentro dele) em vez de uma UI de arrastar/soltar —
 * suficiente pro objetivo de montar um curso básico do zero pela
 * aplicação, sem exigir nenhuma biblioteca nova.
 */
export default async function GerenciarCursoPage({
  params,
  searchParams,
}: {
  params: { cursoId: string };
  searchParams: { criado?: string };
}) {
  const user = await getCurrentUser();
  const souAdmin = user?.role === "admin";

  if (!souAdmin) {
    return (
      <p className="rounded-md border border-red-900/50 bg-red-950/40 p-3 text-sm text-red-200">
        Só o admin pode gerenciar cursos.
      </p>
    );
  }

  const curso = await getCourseWithContent(params.cursoId);
  if (!curso) notFound();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Link href="/admin/academy/cursos" className="text-sm text-neutral-400 hover:text-emerald-400">
          ← Cursos
        </Link>
        <h1 className="text-3xl font-bold leading-tight text-neutral-100">{curso.title}</h1>
        <p className="text-sm text-neutral-500">
          <code>{curso.slug}</code> ·{" "}
          {curso.price_cents ? BRL.format(curso.price_cents / 100) : "Gratuito"} ·{" "}
          {curso.is_active ? "Ativo" : "Inativo"}
        </p>
      </div>

      {searchParams?.criado === "1" && (
        <p className="rounded-md border border-emerald-800 bg-emerald-950/30 p-3 text-sm text-emerald-300">
          Curso criado. Agora adicione ao menos um módulo e uma aula pra ele funcionar de verdade.
        </p>
      )}

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-neutral-100">Módulos e aulas</h2>

        {curso.modules.length === 0 && (
          <p className="text-sm text-neutral-400">Nenhum módulo ainda — crie o primeiro abaixo.</p>
        )}

        {curso.modules.map((module) => (
          <div key={module.id} className="flex flex-col gap-3 rounded-md border border-neutral-800 bg-neutral-900 p-4">
            <p className="font-medium text-neutral-100">
              {module.title} <span className="text-xs text-neutral-500">(ordem {module.order_index})</span>
            </p>

            {module.lessons.length > 0 && (
              <ul className="flex flex-col gap-1 pl-4">
                {module.lessons.map((lesson) => (
                  <li key={lesson.id} className="text-sm text-neutral-400">
                    {lesson.title} <span className="text-xs text-neutral-600">({lesson.slug})</span>
                    {lesson.is_preview && (
                      <span className="ml-2 rounded-full bg-neutral-800 px-2 py-0.5 text-xs text-neutral-400">
                        Prévia
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}

            <details className="mt-1">
              <summary className="cursor-pointer text-xs font-medium uppercase tracking-wide text-emerald-400">
                + Adicionar aula neste módulo
              </summary>
              <form action={createLessonAction} className="mt-3 flex flex-col gap-3">
                <input type="hidden" name="course_id" value={curso.id} />
                <input type="hidden" name="module_id" value={module.id} />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <input
                    name="title"
                    placeholder="Título da aula"
                    required
                    className="rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100"
                  />
                  <input
                    name="slug"
                    placeholder="Slug (opcional)"
                    className="rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100"
                  />
                  <input
                    name="video_url"
                    placeholder="URL do vídeo (opcional)"
                    className="rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100"
                  />
                  <input
                    name="order_index"
                    type="number"
                    defaultValue={module.lessons.length}
                    className="rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100"
                  />
                </div>
                <label className="flex items-center gap-2 text-sm text-neutral-300">
                  <input type="checkbox" name="is_preview" className="h-4 w-4 rounded border-neutral-700 bg-neutral-950" />
                  Prévia gratuita (visível sem matrícula)
                </label>
                <button
                  type="submit"
                  className="w-fit rounded-md border border-emerald-700 px-3 py-1.5 text-sm font-medium text-emerald-300 hover:bg-emerald-950/40"
                >
                  Adicionar aula
                </button>
              </form>
            </details>
          </div>
        ))}

        <details className="rounded-md border border-neutral-800 bg-neutral-900 p-4">
          <summary className="cursor-pointer text-sm font-medium text-emerald-400">+ Adicionar módulo</summary>
          <form action={createModuleAction} className="mt-3 flex flex-wrap items-end gap-3">
            <input type="hidden" name="course_id" value={curso.id} />
            <div className="flex flex-col gap-1">
              <label className="text-xs text-neutral-500">Título do módulo</label>
              <input
                name="title"
                required
                className="rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-neutral-500">Ordem</label>
              <input
                name="order_index"
                type="number"
                defaultValue={curso.modules.length}
                className="w-24 rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100"
              />
            </div>
            <button
              type="submit"
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
            >
              Adicionar módulo
            </button>
          </form>
        </details>
      </section>

      <Link
        href={`/academy/cursos/${curso.slug}`}
        target="_blank"
        className="w-fit rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 hover:border-emerald-500"
      >
        Ver página do curso →
      </Link>
    </div>
  );
}
