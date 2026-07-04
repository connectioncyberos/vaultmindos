import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import {
  getActiveSectors,
  getNivelamentoCourse,
  getUserEnrollments,
  countLessonsForCourse,
  countCompletedLessonsForUser,
} from "@/lib/academy/queries";

/**
 * Dashboard da Academy (Fase 1) — trilhas matriculadas do aluno +
 * setores disponíveis pra começar uma nova. O layout já garante que
 * `user` existe (redirect acontece antes de chegar aqui).
 */
export default async function AcademyPage() {
  const user = (await getCurrentUser())!;

  const [enrollments, sectors, nivelamento] = await Promise.all([
    getUserEnrollments(user.id),
    getActiveSectors(),
    getNivelamentoCourse(),
  ]);

  const progressByCourse = new Map<string, { total: number; completed: number }>();
  await Promise.all(
    enrollments.map(async (enrollment) => {
      const [total, completed] = await Promise.all([
        countLessonsForCourse(enrollment.course_id),
        countCompletedLessonsForUser(user.id, enrollment.course_id),
      ]);
      progressByCourse.set(enrollment.course_id, { total, completed });
    }),
  );

  const nivelamentoJaMatriculado = nivelamento
    ? enrollments.some((e) => e.course_id === nivelamento.id)
    : true;

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium uppercase tracking-wide text-neutral-500">Academy</p>
        <h1 className="text-3xl font-bold leading-tight text-neutral-100">
          Olá, {user.fullName ?? user.email}
        </h1>
        <p className="text-base leading-relaxed text-neutral-400">
          Suas trilhas de formação e as competências em desenvolvimento.
        </p>
      </div>

      {nivelamento && !nivelamentoJaMatriculado && (
        <section className="rounded-md border border-emerald-800 bg-emerald-950/30 p-4">
          <p className="text-sm font-semibold text-emerald-400">Comece por aqui</p>
          <h2 className="mt-1 text-lg font-bold text-neutral-100">{nivelamento.title}</h2>
          {nivelamento.description && (
            <p className="mt-1 text-sm text-neutral-400">{nivelamento.description}</p>
          )}
          <Link
            href={`/academy/cursos/${nivelamento.slug}`}
            className="mt-3 inline-block rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
          >
            Ver curso de nivelamento
          </Link>
        </section>
      )}

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-bold text-neutral-100">Minhas trilhas</h2>
        {enrollments.length === 0 ? (
          <p className="text-sm text-neutral-400">
            Você ainda não está matriculado em nenhum curso. Escolha uma trilha abaixo para começar.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {enrollments.map((enrollment) => {
              const progress = progressByCourse.get(enrollment.course_id);
              const pct =
                progress && progress.total > 0
                  ? Math.round((progress.completed / progress.total) * 100)
                  : 0;
              return (
                <li
                  key={enrollment.id}
                  className="rounded-md border border-neutral-800 bg-neutral-900 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-neutral-100">{enrollment.course.title}</p>
                      {enrollment.course.level && (
                        <p className="text-xs uppercase tracking-wide text-neutral-500">
                          {enrollment.course.level}
                        </p>
                      )}
                    </div>
                    <Link
                      href={`/academy/cursos/${enrollment.course.slug}`}
                      className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm font-medium text-neutral-100 hover:border-emerald-500"
                    >
                      Continuar
                    </Link>
                  </div>
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-neutral-800">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-neutral-500">
                    {progress?.completed ?? 0} de {progress?.total ?? 0} aulas concluídas ({pct}%)
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-bold text-neutral-100">Trilhas disponíveis</h2>
        {sectors.length === 0 ? (
          <p className="text-sm text-neutral-400">Nenhuma trilha disponível no momento.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {sectors.map((sector) => (
              <li key={sector.id} className="rounded-md border border-neutral-800 bg-neutral-900 p-4">
                <p className="font-semibold text-neutral-100">{sector.name}</p>
                {sector.description && (
                  <p className="mt-1 text-sm text-neutral-400">{sector.description}</p>
                )}
                <Link
                  href={`/academy/trilhas/${sector.slug}`}
                  className="mt-3 inline-block text-sm font-medium text-emerald-400 hover:text-emerald-300"
                >
                  Ver cursos →
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
