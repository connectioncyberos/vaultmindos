import { createClient } from "@/lib/supabase/server";
import { getCompetencyRatings } from "@/lib/candidate/queries";
import type { JobMatch, JobPosting, JobPostingForCandidate } from "./types";

function mapJobPosting(row: unknown): JobPosting {
  const r = row as Record<string, unknown>;
  return {
    id: r.id as string,
    organizationId: r.organization_id as string,
    title: r.title as string,
    sectorId: (r.sector_id as string | null) ?? null,
    status: r.status as JobPosting["status"],
    createdAt: r.created_at as string,
  };
}

/**
 * Vagas abertas com dados pra tela pública do candidato: nome da
 * empresa, setor, competências exigidas e o match calculado contra a
 * autoavaliação do próprio candidato (`candidate_competency_ratings`).
 * Cálculo simples de propósito (v1, sem IA — ver blueprint seção 14):
 * média das notas 1-5 do candidato nas competências exigidas, escalada
 * pra 0-100. Sem nenhuma nota nas competências pedidas = match 0.
 */
export async function getOpenJobPostingsForCandidate(userId: string): Promise<JobPostingForCandidate[]> {
  const supabase = createClient();

  const { data: postingRows } = await supabase
    .from("job_postings")
    .select("id, organization_id, title, sector_id, status, created_at")
    .eq("status", "OPEN")
    .order("created_at", { ascending: false });

  const postings = (postingRows ?? []).map(mapJobPosting);
  if (postings.length === 0) return [];

  const orgIds = [...new Set(postings.map((p) => p.organizationId))];
  const sectorIds = [...new Set(postings.map((p) => p.sectorId).filter((id): id is string => !!id))];
  const postingIds = postings.map((p) => p.id);

  const [{ data: orgRows }, { data: sectorRows }, { data: jpcRows }, { data: matchRows }, ratings] =
    await Promise.all([
      supabase.from("organizations").select("id, name").in("id", orgIds),
      sectorIds.length > 0
        ? supabase.from("sectors").select("id, name").in("id", sectorIds)
        : Promise.resolve({ data: [] as { id: string; name: string }[] }),
      supabase.from("job_posting_competencies").select("job_posting_id, competency_id").in("job_posting_id", postingIds),
      supabase.from("job_matches").select("job_posting_id").eq("user_id", userId).in("job_posting_id", postingIds),
      getCompetencyRatings(userId),
    ]);

  const orgNameById = new Map<string, string>();
  (orgRows ?? []).forEach((r) => orgNameById.set(r.id as string, r.name as string));

  const sectorNameById = new Map<string, string>();
  (sectorRows ?? []).forEach((r) => sectorNameById.set(r.id as string, r.name as string));

  const competencyIdsByPosting = new Map<string, string[]>();
  (jpcRows ?? []).forEach((row) => {
    const r = row as Record<string, unknown>;
    const postingId = r.job_posting_id as string;
    const list = competencyIdsByPosting.get(postingId) ?? [];
    list.push(r.competency_id as string);
    competencyIdsByPosting.set(postingId, list);
  });

  const allCompetencyIds = [...new Set([...competencyIdsByPosting.values()].flat())];
  const { data: competencyRows } =
    allCompetencyIds.length > 0
      ? await supabase.from("competencies").select("id, name").in("id", allCompetencyIds)
      : { data: [] as { id: string; name: string }[] };
  const competencyNameById = new Map<string, string>();
  (competencyRows ?? []).forEach((r) => competencyNameById.set(r.id as string, r.name as string));

  const alreadyInterestedSet = new Set((matchRows ?? []).map((r) => (r as Record<string, unknown>).job_posting_id as string));

  return postings.map((posting) => {
    const requiredIds = competencyIdsByPosting.get(posting.id) ?? [];
    const ratedRequired = requiredIds.filter((id) => ratings.has(id));
    const matchScore =
      ratedRequired.length > 0
        ? Math.round((ratedRequired.reduce((sum, id) => sum + (ratings.get(id) ?? 0), 0) / ratedRequired.length / 5) * 100)
        : 0;

    return {
      ...posting,
      organizationName: orgNameById.get(posting.organizationId) ?? "Empresa parceira",
      sectorName: posting.sectorId ? (sectorNameById.get(posting.sectorId) ?? null) : null,
      requiredCompetencyIds: requiredIds,
      requiredCompetencyNames: requiredIds.map((id) => competencyNameById.get(id) ?? "—"),
      matchScore,
      alreadyExpressedInterest: alreadyInterestedSet.has(posting.id),
    };
  });
}

/** Vagas da própria empresa (painel de RH — /empresas/vagas). */
export async function getJobPostingsForOrg(organizationId: string): Promise<JobPosting[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("job_postings")
    .select("id, organization_id, title, sector_id, status, created_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });
  return (data ?? []).map(mapJobPosting);
}

/**
 * Candidatos que demonstraram interesse numa vaga (pipeline do RH), já
 * com o nome do candidato — RLS de `users_profile` (migration 007)
 * libera isso especificamente pro RH da empresa dona da vaga.
 */
export async function getJobMatchesForPosting(
  jobPostingId: string,
): Promise<(JobMatch & { candidateName: string })[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("job_matches")
    .select("id, job_posting_id, user_id, score, status, created_at")
    .eq("job_posting_id", jobPostingId)
    .order("created_at", { ascending: false });

  const matches = (data ?? []) as Record<string, unknown>[];
  if (matches.length === 0) return [];

  const userIds = [...new Set(matches.map((m) => m.user_id as string))];
  const { data: profileRows } = await supabase.from("users_profile").select("id, full_name").in("id", userIds);
  const nameById = new Map<string, string>();
  (profileRows ?? []).forEach((row) => {
    const r = row as Record<string, unknown>;
    nameById.set(r.id as string, (r.full_name as string | null) ?? `Candidato ${(r.id as string).slice(0, 8)}`);
  });

  return matches.map((row) => ({
    id: row.id as string,
    jobPostingId: row.job_posting_id as string,
    userId: row.user_id as string,
    score: (row.score as number | null) ?? null,
    status: row.status as JobMatch["status"],
    createdAt: row.created_at as string,
    candidateName: nameById.get(row.user_id as string) ?? `Candidato ${(row.user_id as string).slice(0, 8)}`,
  }));
}

/** Vagas em que o próprio candidato demonstrou interesse — dashboard dele. */
export async function getMyJobMatches(userId: string): Promise<(JobMatch & { jobTitle: string; organizationName: string })[]> {
  const supabase = createClient();
  const { data: matchRows } = await supabase
    .from("job_matches")
    .select("id, job_posting_id, user_id, score, status, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const matches = (matchRows ?? []) as Record<string, unknown>[];
  if (matches.length === 0) return [];

  const postingIds = matches.map((m) => m.job_posting_id as string);
  const { data: postingRows } = await supabase
    .from("job_postings")
    .select("id, organization_id, title")
    .in("id", postingIds);

  const postingById = new Map<string, { title: string; organizationId: string }>();
  (postingRows ?? []).forEach((row) => {
    const r = row as Record<string, unknown>;
    postingById.set(r.id as string, { title: r.title as string, organizationId: r.organization_id as string });
  });

  const orgIds = [...new Set([...postingById.values()].map((p) => p.organizationId))];
  const { data: orgRows } = orgIds.length > 0 ? await supabase.from("organizations").select("id, name").in("id", orgIds) : { data: [] };
  const orgNameById = new Map<string, string>();
  (orgRows ?? []).forEach((r) => orgNameById.set((r as Record<string, unknown>).id as string, (r as Record<string, unknown>).name as string));

  return matches.map((row) => {
    const posting = postingById.get(row.job_posting_id as string);
    return {
      id: row.id as string,
      jobPostingId: row.job_posting_id as string,
      userId: row.user_id as string,
      score: (row.score as number | null) ?? null,
      status: row.status as JobMatch["status"],
      createdAt: row.created_at as string,
      jobTitle: posting?.title ?? "Vaga removida",
      organizationName: posting ? (orgNameById.get(posting.organizationId) ?? "Empresa parceira") : "—",
    };
  });
}
