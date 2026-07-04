import Link from "next/link";
import { notFound } from "next/navigation";
import { getSectorBySlug, getCoursesBySector } from "@/lib/academy/queries";

/** Lista os cursos ativos de um setor/trilha (Fase 1). */
export default async function TrilhaPage({
  params,
}: {
  params: { sectorSlug: string };
}) {
  const sector = await getSectorBySlug(params.sectorSlug);
  if (!sector || !sector.is_active) notFound();

  const courses = await getCoursesBySector(sector.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link href="/academy" className="text-sm text-neutral-400 hover:text-emerald-400">
          ← Academy
        </Link>
        <p className="text-sm font-medium uppercase tracking-wide text-neutral-500">Trilha</p>
        <h1 className="text-3xl font-bold leading-tight text-neutral-100">{sector.name}</h1>
        {sector.description && (
          <p className="text-base leading-relaxed text-neutral-400">{sector.description}</p>
        )}
      </div>

      <section className="flex flex-col gap-3">
        {courses.length === 0 ? (
          <p className="text-sm text-neutral-400">Nenhum curso publicado nesta trilha ainda.</p>
        ) : (
          courses.map((course) => (
            <Link
              key={course.id}
              href={`/academy/cursos/${course.slug}`}
              className="rounded-md border border-neutral-800 bg-neutral-900 p-4 hover:border-emerald-600"
            >
              <p className="font-semibold text-neutral-100">{course.title}</p>
              {course.level && (
                <p className="text-xs uppercase tracking-wide text-neutral-500">{course.level}</p>
              )}
              {course.description && (
                <p className="mt-1 text-sm text-neutral-400">{course.description}</p>
              )}
            </Link>
          ))
        )}
      </section>
    </div>
  );
}
