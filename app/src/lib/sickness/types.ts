export type Answer = "yes" | "no" | "unknown";
export type Period = { from: string; to: string };
export type Law = { id: string; title: string; url: string };
export type EvidenceKind = "certificate" | "employment" | "history";

export type PageFact = {
  kind: EvidenceKind;
  subject: string;
  payer: string;
  title: string;
  period: Period;
  onset: string | null;
  value: "incapacity" | "excluded" | "covered" | "never" | "ended";
  page: number;
  manual?: boolean;
  text: string;
};
export interface SicknessFacts {
  pages: PageFact[];
  otherCoverage: Answer | null;
}
export interface SicknessAssessment {
  status: "not_entitled_for_period" | "needs_fact" | "requires_review";
  summary: string;
  period: { from: string | null; to: string | null };
  asksOtherCoverage: boolean;
  reasons: string[];
  evidenceIds: string[];
  law: Law[];
  question: string | null;
}
export interface SicknessExchange {
  version: number;
  at: string;
  message?: string;
  closed: boolean;
  assessment: SicknessAssessment;
}
export interface SicknessView {
  history?: SicknessExchange[];
  sourceRequests?: {
    id: string;
    message: string;
    at: string;
    evidence: SicknessView["evidence"];
    law: Law[];
  }[];
  version: number;
  closed: boolean;
  assessment: SicknessAssessment;
  evidence: { id: string; title: string; page: number; url: string }[];
  otherCoverage: Answer | null;
  includeEmployment: boolean;
  canRestoreEmployment: boolean;
}
