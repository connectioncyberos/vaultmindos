import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import {
  getCourseBySlug,
  getCourseWithContent,
  getEnrollment,
  getUserProgressForLessons,
  getCertificateForCourse,
} from "@/lib/academy/queries";
import { enrollAction } from "../../actions";

/** Detalhe do curso: módulos/aulas, matrícula e progresso (Fase 1). */
export default async function CursoPage({
  params,
}: {
  params: { cursoSlug: string };
}) {
  const user = (await getCurrentUser())!;

  const course = await getCourseBySlug(params.cursoSlug);
  if (!course || !course.is_active) notFound();

  const [content, enrollment, certificate] = await Promise.all([
    getCourseWithContent(course.id),
    getEnrollment(user.id, course.id),
    getCertificateForCourse(user.id, course.id),
  ]);
  if (!content) notFound();

  const allLessonIds = content.modules.flatMap((m) => m.lessons.map((l) => l.id));
  const progressMap = enrollment
    ? await getUserProgressForLessons(user.id, allLessonIds)
    : new Map<string, boolean>();

  const totalLessons = allLessonIds.length;
  const completedLessons = allLessonIds.filter((id) => progressMap.get(id)).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link href="/academy" className="text-sm text-neutral-400 hover:text-emerald-400">
          ← Academy
        </Link>
        <p className="text-sm font-medium uppercase tracking-wide text-neutral-500">
          {course.level ?? "Curso"}
        </p>
        <h1 className="text-3xl font-bold leading-tight text-neutral-100">{course.title}</h1>
        {course.description && (
          <p className="text-base leading-relaxed text-neutral-400">{course.description}</p>
        )}
      </div>

      {!enrollment ? (
        <form action={enrollAction}>
          <input type="hidden" name="course_id" value={course.id} />
          <input type="hidden" name="course_slug" value={course.slug} />
          <button
            type="submit"
            className="w-fit rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
          >
            Matricular-se
          </button>
        </form>
      ) : (
        <div className="rounded-md border border-neutral-800 bg-neutral-900 p-4">
          <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-800">
            <div
              className="h-full rounded-full bg-emerald-500"
              style={{
                width: totalLessons > 0 ? `${Math.round((completedLessons / totalLessons) * 100)}%` : "0%",
              }}
            />
          </div>
          <p className="mt-1 text-xs text-neutral-500">
            {completedLessons} de {totalLessons} aulas concluídas
          </p>
          {certificate && (
            <p className="mt-2 text-sm text-emerald-400">
              Certificado emitido — código <code>{certificate.code}</code>.{" "}
              <Link href="/academy/certificados" className="underline hover:text-emerald-300">
                Ver certificados
              </Link>
            </p>
          )}
        </div>
      )}

      <section className="flex flex-col gap-6">
        {content.modules.map((module) => (
          <div key={module.id} className="flex flex-col gap-2">
            <h2 className="text-lg font-bold text-neutral-100">{module.title}</h2>
            <ul className="flex flex-col gap-2">
              {module.lessons.map((lesson) => {
                const done = progressMap.get(lesson.id) ?? false;
                const canAccess = enrollment || lesson.is_preview;
                return (
                  <li
                    key={lesson.id}
                    className="flex items-center justify-between gap-3 rounded-md border border-neutral-800 bg-neutral-900 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                          done ? "bg-emerald-600 text-white" : "border border-neutral-700 text-neutral-500"
                        }`}
                      >
                        {done ? "✓" : ""}
                      </span>
                      <span className="text-sm text-neutral-200">{lesson.title}</span>
                      {lesson.is_preview && !enrollment && (
                        <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-xs text-neutral-400">
                          Prévia
                        </span>
                      )}
                    </div>
                    {canAccess ? (
                      <Link
                        href={`/academy/cursos/${course.slug}/aulas/${lesson.slug}`}
                        className="text-sm font-medium text-emerald-400 hover:text-emerald-300"
                      >
                        Assistir →
                      </Link>
                    ) : (
                      <span className="text-sm text-neutral-600">Matricule-se para assistir</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </section>
    </div>
  );
}
