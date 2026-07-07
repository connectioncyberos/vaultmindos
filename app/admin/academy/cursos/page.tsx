import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { getAllCoursesForAdmin, getAllSectorsForAdmin } from "@/lib/academy/queries";
import { toggleCourseActiveAction } from "./actions";

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/**
 * /admin/academy/cursos — gestão de cursos (Prioridade 2 do cronograma
 * pós-análise Enterprise: criar curso do zero pela própria aplicação,
 * não só via SQL de migration). Role admin, mesma regra das outras
 * telas de negócio da Academy.
 */
export default async function AdminCursosPage() {
  const user = await getCurrentUser();
  const souAdmin = user?.role === "admin";

  if (!souAdmin) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold leading-tight text-neutral-100">Cursos</h1>
        <p className="rounded-md border border-red-900/50 bg-red-950/40 p-3 text-sm text-red-200">
          Só o admin pode gerenciar o catálogo de cursos.
        </p>
      </div>
    );
  }

  const [cursos, setores] = await Promise.all([getAllCoursesForAdmin(), getAllSectorsForAdmin()]);
  const setorById = new Map(setores.map((s) => [s.id, s.name]));

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium uppercase tracking-wide text-neutral-500">CMS · Academy</p>
          <h1 className="text-3xl font-bold leading-tight text-neutral-100">Cursos</h1>
          <p className="text-base leading-relaxed text-neutral-400">
            Catálogo completo, incluindo inativos e cursos de teste.
          </p>
        </div>
        <Link
          href="/admin/academy/cursos/novo"
          className="h-fit rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
        >
          + Novo curso
        </Link>
      </div>

      <div className="overflow-x-auto rounded-md border border-neutral-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-900 text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-3">Título</th>
              <th className="px-4 py-3">Setor</th>
              <th className="px-4 py-3">Preço</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {cursos.map((curso) => (
              <tr key={curso.id} className="text-neutral-300">
                <td className="px-4 py-3">
                  <Link href={`/admin/academy/cursos/${curso.id}`} className="font-medium text-neutral-100 hover:text-emerald-400">
                    {curso.title}
                  </Link>
                  <div className="text-xs text-neutral-500">{curso.slug}</div>
                </td>
                <td className="px-4 py-3 text-neutral-400">
                  {curso.sector_id ? (setorById.get(curso.sector_id) ?? "—") : "Nenhum (nivelamento/teste)"}
                </td>
                <td className="px-4 py-3">
                  {curso.price_cents ? BRL.format(curso.price_cents / 100) : "Gratuito"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${
                      curso.is_active
                        ? "border-emerald-800 bg-emerald-950/30 text-emerald-300"
                        : "border-neutral-700 bg-neutral-900 text-neutral-500"
                    }`}
                  >
                    {curso.is_active ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <form action={toggleCourseActiveAction}>
                    <input type="hidden" name="course_id" value={curso.id} />
                    <input type="hidden" name="next_active" value={(!curso.is_active).toString()} />
                    <button
                      type="submit"
                      className="rounded-md border border-neutral-700 px-2 py-1 text-xs text-neutral-300 hover:border-emerald-500"
                    >
                      {curso.is_active ? "Desativar" : "Ativar"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
