/**
 * Tipos do domínio Vagas + Matching (Fase 3 — Portal de Empregabilidade).
 * Schema em sql/migrations/001_academy_schema.sql (nunca implementado
 * até agora); RLS de candidato ajustada em 007_vagas_matching.sql.
 */

export type JobPostingStatus = "OPEN" | "PAUSED" | "CLOSED";
export type JobMatchStatus = "SUGGESTED" | "CONTACTED" | "HIRED" | "REJECTED";

export interface JobPosting {
  id: string;
  organizationId: string;
  title: string;
  sectorId: string | null;
  status: JobPostingStatus;
  createdAt: string;
}

/** Vaga com dados pra exibição pública (nome da empresa, setor, competências exigidas). */
export interface JobPostingForCandidate extends JobPosting {
  organizationName: string;
  sectorName: string | null;
  requiredCompetencyIds: string[];
  requiredCompetencyNames: string[];
  /** 0-100 — quanto o perfil autoavaliado do candidato cobre as competências exigidas. */
  matchScore: number;
  /** Já demonstrou interesse nesta vaga? */
  alreadyExpressedInterest: boolean;
}

export interface JobMatch {
  id: string;
  jobPostingId: string;
  userId: string;
  score: number | null;
  status: JobMatchStatus;
  createdAt: string;
}
