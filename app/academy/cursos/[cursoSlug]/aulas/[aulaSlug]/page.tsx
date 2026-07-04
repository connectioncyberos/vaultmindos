import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import {
  getCourseBySlug,
  getCourseWithContent,
  getLessonBySlug,
  getEnrollment,
  getUserProgressForLessons,
} from "@/lib/academy/queries";
import { toggleLessonProgressAction } from "../../../../actions";

/** Player de aula — vídeo, marcação de conclusão e navegação entre aulas (Fase 1). */
export default async function AulaPage({
  params,
}: {
  params: { cursoSlug: string; aulaSlug: string };
}) {
  const user = (await getCurrentUser())!;

  const course = await getCourseBySlug(params.cursoSlug);
  if (!course || !course.is_active) notFound();

  const lesson = await getLessonBySlug(course.id, params.aulaSlug);
  if (!lesson) notFound();

  const enrollment = await getEnrollment(user.id, course.id);
  if (!enrollment && !lesson.is_preview) {
    redirect(`/academy/cursos/${course.slug}`);
  }

  const content = await getCourseWithContent(course.id);
  const flatLessons = (content?.modules ?? []).flatMap((m) => m.lessons);
  const currentIndex = flatLessons.findIndex((l) => l.id === lesson.id);
  const prevLesson = currentIndex > 0 ? flatLessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex >= 0 && currentIndex < flatLessons.length - 1 ? flatLessons[currentIndex + 1] : null;

  const progressMap = await getUserProgressForLessons(user.id, [lesson.id]);
  const isCompleted = progressMap.get(lesson.id) ?? false;

  const path = `/academy/cursos/${course.slug}/aulas/${lesson.slug}`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link
          href={`/academy/cursos/${course.slug}`}
          className="text-sm text-neutral-400 hover:text-emerald-400"
        >
          ← {course.title}
        </Link>
        <h1 className="text-2xl font-bold leading-tight text-neutral-100">{lesson.title}</h1>
      </div>

      {lesson.video_url ? (
        <div className="aspect-video w-full overflow-hidden rounded-md border border-neutral-800 bg-black">
          <iframe
            src={lesson.video_url}
            title={lesson.title}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <div className="rounded-md border border-neutral-800 bg-neutral-900 p-6 text-sm text-neutral-400">
          Conteúdo desta aula ainda não possui vídeo cadastrado.
        </div>
      )}

      {enrollment && (
        <form action={toggleLessonProgressAction.bind(null, lesson.id, isCompleted, course.id, course.slug, path)}>
          <button
            type="submit"
            className={`w-fit rounded-md px-4 py-2 text-sm font-medium ${
              isCompleted
                ? "border border-neutral-700 text-neutral-100 hover:border-red-700 hover:text-red-300"
                : "bg-emerald-600 text-white hover:bg-emerald-500"
            }`}
          >
            {isCompleted ? "Marcar como não concluída" : "Marcar como concluída"}
          </button>
        </form>
      )}

      <div className="flex items-center justify-between border-t border-neutral-800 pt-4">
        {prevLesson ? (
          <Link
            href={`/academy/cursos/${course.slug}/aulas/${prevLesson.slug}`}
            className="text-sm text-neutral-400 hover:text-emerald-400"
          >
            ← {prevLesson.title}
          </Link>
        ) : (
          <span />
        )}
        {nextLesson ? (
          <Link
            href={`/academy/cursos/${course.slug}/aulas/${nextLesson.slug}`}
            className="text-sm font-medium text-emerald-400 hover:text-emerald-300"
          >
            {nextLesson.title} →
          </Link>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}
