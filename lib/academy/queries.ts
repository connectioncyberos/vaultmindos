import { createClient } from "@/lib/supabase/server";
import type {
  Certificate,
  CertificateWithCourse,
  Competency,
  Course,
  CourseWithContent,
  Enrollment,
  EnrollmentWithCourse,
  Lesson,
  ModuleWithLessons,
  Organization,
  OrganizationMember,
  Sector,
} from "@/lib/types/academy";

function mapCompetency(row: unknown): Competency {
  const r = row as Record<string, unknown>;
  return {
    id: r.id as string,
    sector_id: (r.sector_id as string | null) ?? null,
    name: r.name as string,
    kind: r.kind as Competency["kind"],
  };
}

/**
 * Camada de acesso a dados da Academy (Fase 1). Mesma escolha do
 * lib/content/queries.ts: consultas em varias etapas simples em vez de
 * embeds aninhados do PostgREST — mais round-trips, mas cada `.select()`
 * fica plano e facil de revisar.
 */

function mapSector(row: unknown): Sector {
  const r = row as Record<string, unknown>;
  return {
    id: r.id as string,
    slug: r.slug as string,
    name: r.name as string,
    description: (r.description as string | null) ?? null,
    is_active: r.is_active as boolean,
  };
}

function mapCourse(row: unknown): Course {
  const r = row as Record<string, unknown>;
  return {
    id: r.id as string,
    sector_id: (r.sector_id as string | null) ?? null,
    slug: r.slug as string,
    title: r.title as string,
    description: (r.description as string | null) ?? null,
    level: (r.level as string | null) ?? null,
    is_active: r.is_active as boolean,
    price_cents: (r.price_cents as number | null) ?? null,
  };
}

function mapLesson(row: unknown): Lesson {
  const r = row as Record<string, unknown>;
  return {
    id: r.id as string,
    module_id: r.module_id as string,
    course_id: r.course_id as string,
    slug: r.slug as string,
    title: r.title as string,
    video_url: (r.video_url as string | null) ?? null,
    order_index: r.order_index as number,
    is_preview: r.is_preview as boolean,
  };
}

/** Setores ativos (Fase 1: só Administrativo 4.0) — usado na home da Academy. */
export async function getActiveSectors(): Promise<Sector[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("sectors")
    .select("id, slug, name, description, is_active")
    .eq("is_active", true)
    .order("name", { ascending: true });
  return (data ?? []).map(mapSector);
}

export async function getSectorBySlug(slug: string): Promise<Sector | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("sectors")
    .select("id, slug, name, description, is_active")
    .eq("slug", slug)
    .maybeSingle();
  return data ? mapSector(data) : null;
}

/** Cursos ativos de um setor. */
export async function getCoursesBySector(sectorId: string): Promise<Course[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("courses")
    .select("id, sector_id, slug, title, description, level, is_active, price_cents")
    .eq("sector_id", sectorId)
    .eq("is_active", true)
    .order("title", { ascending: true });
  return (data ?? []).map(mapCourse);
}

/** Curso de Nivelamento — obrigatório, sem sector_id. */
export async function getNivelamentoCourse(): Promise<Course | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("courses")
    .select("id, sector_id, slug, title, description, level, is_active, price_cents")
    .eq("slug", "nivelamento")
    .maybeSingle();
  return data ? mapCourse(data) : null;
}

export async function getCourseBySlug(slug: string): Promise<Course | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("courses")
    .select("id, sector_id, slug, title, description, level, is_active, price_cents")
    .eq("slug", slug)
    .maybeSingle();
  return data ? mapCourse(data) : null;
}

/** Curso completo (módulos + aulas, em ordem) — tela de detalhe do curso e player de aula. */
export async function getCourseWithContent(courseId: string): Promise<CourseWithContent | null> {
  const supabase = createClient();

  const { data: courseRow } = await supabase
    .from("courses")
    .select("id, sector_id, slug, title, description, level, is_active, price_cents")
    .eq("id", courseId)
    .maybeSingle();
  if (!courseRow) return null;

  const { data: moduleRows } = await supabase
    .from("modules")
    .select("id, course_id, title, order_index")
    .eq("course_id", courseId)
    .order("order_index", { ascending: true });

  const { data: lessonRows } = await supabase
    .from("lessons")
    .select("id, module_id, course_id, slug, title, video_url, order_index, is_preview")
    .eq("course_id", courseId)
    .order("order_index", { ascending: true });

  const lessons = (lessonRows ?? []).map(mapLesson);
  const modules: ModuleWithLessons[] = (moduleRows ?? []).map((row) => {
    const r = row as Record<string, unknown>;
    const moduleId = r.id as string;
    return {
      id: moduleId,
      course_id: r.course_id as string,
      title: r.title as string,
      order_index: r.order_index as number,
      lessons: lessons.filter((l) => l.module_id === moduleId),
    };
  });

  return { ...mapCourse(courseRow), modules };
}

export async function getLessonBySlug(courseId: string, lessonSlug: string): Promise<Lesson | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("lessons")
    .select("id, module_id, course_id, slug, title, video_url, order_index, is_preview")
    .eq("course_id", courseId)
    .eq("slug", lessonSlug)
    .maybeSingle();
  return data ? mapLesson(data) : null;
}

export async function countLessonsForCourse(courseId: string): Promise<number> {
  const supabase = createClient();
  const { count } = await supabase
    .from("lessons")
    .select("id", { count: "exact", head: true })
    .eq("course_id", courseId);
  return count ?? 0;
}

/** Matrícula do usuário num curso especifico (null = não matriculado). */
export async function getEnrollment(userId: string, courseId: string): Promise<Enrollment | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("enrollments")
    .select("id, user_id, course_id, organization_id, status, created_at")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .maybeSingle();
  return data as Enrollment | null;
}

/** Todas as matrículas do usuário, com o curso embutido — dashboard da Academy. */
export async function getUserEnrollments(userId: string): Promise<EnrollmentWithCourse[]> {
  const supabase = createClient();
  const { data: enrollmentRows } = await supabase
    .from("enrollments")
    .select("id, user_id, course_id, organization_id, status, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const rows = enrollmentRows ?? [];
  if (rows.length === 0) return [];

  const courseIds = rows.map((r) => r.course_id as string);
  const { data: courseRows } = await supabase
    .from("courses")
    .select("id, sector_id, slug, title, description, level, is_active, price_cents")
    .in("id", courseIds);

  const courseById = new Map<string, Course>();
  (courseRows ?? []).forEach((row) => {
    const course = mapCourse(row);
    courseById.set(course.id, course);
  });

  return rows
    .filter((r) => courseById.has(r.course_id as string))
    .map((r) => ({
      ...(r as unknown as Enrollment),
      course: courseById.get(r.course_id as string)!,
    }));
}

/** Mapa lessonId -> concluída (true/false) do usuário, para um conjunto de aulas. */
export async function getUserProgressForLessons(
  userId: string,
  lessonIds: string[],
): Promise<Map<string, boolean>> {
  const map = new Map<string, boolean>();
  if (lessonIds.length === 0) return map;

  const supabase = createClient();
  const { data } = await supabase
    .from("user_progress")
    .select("lesson_id, is_completed")
    .eq("user_id", userId)
    .in("lesson_id", lessonIds);

  (data ?? []).forEach((row) => {
    map.set(row.lesson_id as string, row.is_completed as boolean);
  });
  return map;
}

export async function countCompletedLessonsForUser(userId: string, courseId: string): Promise<number> {
  const supabase = createClient();

  const { data: lessonRows } = await supabase.from("lessons").select("id").eq("course_id", courseId);
  const lessonIds = (lessonRows ?? []).map((r) => r.id as string);
  if (lessonIds.length === 0) return 0;

  const { count } = await supabase
    .from("user_progress")
    .select("lesson_id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_completed", true)
    .in("lesson_id", lessonIds);

  return count ?? 0;
}

/** Certificados do usuário, com o curso embutido. */
export async function getUserCertificates(userId: string): Promise<CertificateWithCourse[]> {
  const supabase = createClient();
  const { data: certRows } = await supabase
    .from("certificates")
    .select("id, user_id, course_id, issued_at, code")
    .eq("user_id", userId)
    .order("issued_at", { ascending: false });

  const rows = (certRows ?? []) as Certificate[];
  if (rows.length === 0) return [];

  const courseIds = rows.map((r) => r.course_id);
  const { data: courseRows } = await supabase
    .from("courses")
    .select("id, sector_id, slug, title, description, level, is_active, price_cents")
    .in("id", courseIds);

  const courseById = new Map<string, Course>();
  (courseRows ?? []).forEach((row) => {
    const course = mapCourse(row);
    courseById.set(course.id, course);
  });

  return rows
    .filter((r) => courseById.has(r.course_id))
    .map((r) => ({ ...r, course: courseById.get(r.course_id)! }));
}

export async function getCertificateForCourse(userId: string, courseId: string): Promise<Certificate | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("certificates")
    .select("id, user_id, course_id, issued_at, code")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .maybeSingle();
  return data as Certificate | null;
}

/**
 * Empresa parceira (Fase 2). Um usuário pertence no máximo a uma
 * organização nesta fase (o form de cadastro assume isso) — busca a
 * primeira membership e a organização correspondente.
 */
export async function getOrganizationForUser(
  userId: string,
): Promise<{ organization: Organization; membership: OrganizationMember } | null> {
  const supabase = createClient();
  const { data: membershipRow } = await supabase
    .from("organization_members")
    .select("id, organization_id, user_id, role, created_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (!membershipRow) return null;

  const { data: orgRow } = await supabase
    .from("organizations")
    .select("id, name, cnpj, sector, status, requested_by, reviewed_by, reviewed_at, created_at")
    .eq("id", membershipRow.organization_id as string)
    .maybeSingle();

  if (!orgRow) return null;

  return {
    organization: orgRow as Organization,
    membership: membershipRow as OrganizationMember,
  };
}

/** Todas as competências do catálogo — usado na autoavaliação do perfil de candidato e no match de vagas. */
export async function getAllCompetencies(): Promise<Competency[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("competencies")
    .select("id, sector_id, name, kind")
    .order("name", { ascending: true });
  return (data ?? []).map(mapCompetency);
}

/** Nivelamento concluído = tem certificado emitido pro curso "nivelamento". Usado no gate real (Fase 2). */
export async function hasCompletedNivelamento(userId: string): Promise<boolean> {
  const nivelamento = await getNivelamentoCourse();
  if (!nivelamento) return true; // sem curso de nivelamento cadastrado, não bloqueia nada
  const certificate = await getCertificateForCourse(userId, nivelamento.id);
  return !!certificate;
}

/** Cursos com preço definido (pagos) — dropdown de filtro do painel financeiro (admin). */
export async function getPaidCourses(): Promise<Course[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("courses")
    .select("id, sector_id, slug, title, description, level, is_active, price_cents")
    .not("price_cents", "is", null)
    .gt("price_cents", 0)
    .order("title", { ascending: true });
  return (data ?? []).map(mapCourse);
}

/** Todos os setores, incluindo inativos — dropdown do formulário de criação de curso (admin). */
export async function getAllSectorsForAdmin(): Promise<Sector[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("sectors")
    .select("id, slug, name, description, is_active")
    .order("name", { ascending: true });
  return (data ?? []).map(mapSector);
}

/** Todos os cursos, incluindo inativos/teste — tela de gestão de cursos (admin). */
export async function getAllCoursesForAdmin(): Promise<Course[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("courses")
    .select("id, sector_id, slug, title, description, level, is_active, price_cents")
    .order("title", { ascending: true });
  return (data ?? []).map(mapCourse);
}

/** Fila de aprovação (admin) — organizações por status, mais recentes primeiro. */
export async function getOrganizationsByStatus(
  status: "PENDING" | "APPROVED" | "REJECTED",
): Promise<Organization[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("organizations")
    .select("id, name, cnpj, sector, status, requested_by, reviewed_by, reviewed_at, created_at")
    .eq("status", status)
    .order("created_at", { ascending: false });
  return (data ?? []) as Organization[];
}
