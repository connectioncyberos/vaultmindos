import { createClient } from "@/lib/supabase/server";
import { getAllCompetencies, getUserCertificates } from "@/lib/academy/queries";
import type { CandidateProfile, CompetencyRating } from "./types";

function mapCandidateProfile(row: unknown): CandidateProfile {
  const r = row as Record<string, unknown>;
  return {
    id: r.id as string,
    fullName: (r.full_name as string | null) ?? null,
    identityDocType: (r.identity_doc_type as CandidateProfile["identityDocType"]) ?? null,
    identityDocValue: (r.identity_doc_value as string | null) ?? null,
    careerObjective: (r.career_objective as string | null) ?? null,
    isFirstJobSeeker: (r.is_first_job_seeker as boolean | null) ?? null,
  };
}

/** Perfil de candidato (Fase 2) — RLS: dono ou admin (migration 005/006). */
export async function getCandidateProfile(userId: string): Promise<CandidateProfile | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("users_profile")
    .select("id, full_name, identity_doc_type, identity_doc_value, career_objective, is_first_job_seeker")
    .eq("id", userId)
    .maybeSingle();
  return data ? mapCandidateProfile(data) : null;
}

/** Autoavaliação de competências do candidato — Map<competency_id, rating 1-5>. */
export async function getCompetencyRatings(userId: string): Promise<Map<string, number>> {
  const supabase = createClient();
  const { data } = await supabase
    .from("candidate_competency_ratings")
    .select("competency_id, rating")
    .eq("user_id", userId);

  const map = new Map<string, number>();
  (data ?? []).forEach((row) => {
    const r = row as Record<string, unknown>;
    map.set(r.competency_id as string, r.rating as number);
  });
  return map;
}

export type { CompetencyRating };

export interface ResumeData {
  profile: CandidateProfile | null;
  topCompetencies: { name: string; rating: number }[];
  certificates: { courseTitle: string; issuedAt: string; code: string }[];
  email: string | null;
}

/**
 * Agrega os dados do construtor de currículo (Fase 2 — Portal de
 * Empregabilidade): perfil, competências mais bem avaliadas pelo
 * próprio candidato e certificados já emitidos no VaultMindOS. Sem
 * biblioteca de PDF nova — a página de impressão usa CSS de impressão
 * do navegador (ver blueprint seção 14: evitar dependência que exigiria
 * `npm install`, indisponível nesta sessão).
 */
export async function getResumeData(userId: string, userEmail: string | null): Promise<ResumeData> {
  const [profile, ratings, competencies, certificates] = await Promise.all([
    getCandidateProfile(userId),
    getCompetencyRatings(userId),
    getAllCompetencies(),
    getUserCertificates(userId),
  ]);

  const nameById = new Map(competencies.map((c) => [c.id, c.name]));
  const topCompetencies = [...ratings.entries()]
    .filter(([, rating]) => rating >= 3)
    .sort((a, b) => b[1] - a[1])
    .map(([competencyId, rating]) => ({ name: nameById.get(competencyId) ?? "—", rating }));

  return {
    profile,
    topCompetencies,
    certificates: certificates.map((c) => ({
      courseTitle: c.course.title,
      issuedAt: c.issued_at,
      code: c.code,
    })),
    email: userEmail,
  };
}
