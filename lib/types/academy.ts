/**
 * Tipos do dominio Academy (Fase 1 — docs/blueprint/vaultmindos-academy-architecture-v1.md).
 * Mesma convencao de lib/types/content.ts: escritos a mao, mapeados a
 * partir das linhas cruas do Supabase em lib/academy/queries.ts.
 */

export type CompetencyKind = "TECNICA" | "COMPORTAMENTAL" | "OPERACIONAL" | "DIGITAL";
export type EnrollmentStatus = "ACTIVE" | "COMPLETED" | "CANCELLED";
export type OrganizationStatus = "PENDING" | "APPROVED" | "REJECTED";
export type OrganizationMemberRole = "MEMBER" | "RESPONSAVEL_RH" | "GESTOR_AREA" | "ALUNO_PATROCINADO";

export interface Sector {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  is_active: boolean;
}

export interface Course {
  id: string;
  sector_id: string | null;
  slug: string;
  title: string;
  description: string | null;
  level: string | null;
  is_active: boolean;
}

export interface CourseModule {
  id: string;
  course_id: string;
  title: string;
  order_index: number;
}

export interface Lesson {
  id: string;
  module_id: string;
  course_id: string;
  slug: string;
  title: string;
  video_url: string | null;
  order_index: number;
  is_preview: boolean;
}

export interface Competency {
  id: string;
  sector_id: string | null;
  name: string;
  kind: CompetencyKind;
}

export interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  organization_id: string | null;
  status: EnrollmentStatus;
  created_at: string;
}

export interface Certificate {
  id: string;
  user_id: string;
  course_id: string;
  issued_at: string;
  code: string;
}

export interface ModuleWithLessons extends CourseModule {
  lessons: Lesson[];
}

/** Curso completo com modulos e aulas aninhados — usado na tela de detalhe do curso. */
export interface CourseWithContent extends Course {
  modules: ModuleWithLessons[];
}

export interface EnrollmentWithCourse extends Enrollment {
  course: Course;
}

export interface CertificateWithCourse extends Certificate {
  course: Course;
}

/** Empresa parceira (Fase 2 — auto-cadastro com aprovação do admin). */
export interface Organization {
  id: string;
  name: string;
  cnpj: string | null;
  sector: string | null;
  status: OrganizationStatus;
  requested_by: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: OrganizationMemberRole;
  created_at: string;
}
