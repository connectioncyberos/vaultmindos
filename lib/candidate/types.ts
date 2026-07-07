/**
 * Tipos do domínio Candidato (Portal de Empregabilidade — Fase 2/3).
 * Ref.: docs/blueprint/vaultmindos-academy-architecture-v1.md, seção 14.
 */

/** Documento de identidade com TIPO variável — decisão de nível universal,
 * não acoplar o schema só ao CPF brasileiro. */
export type IdentityDocType = "CPF" | "PASSPORT" | "NATIONAL_ID" | "OTHER";

export interface CandidateProfile {
  id: string;
  fullName: string | null;
  identityDocType: IdentityDocType | null;
  identityDocValue: string | null;
  careerObjective: string | null;
  isFirstJobSeeker: boolean | null;
}

export interface CompetencyRating {
  userId: string;
  competencyId: string;
  rating: number;
  updatedAt: string;
}
