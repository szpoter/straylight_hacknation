import { z } from "zod";

const id = z.string().min(1).max(128);
const day = z.iso.date();
const value = z.discriminatedUnion("kind", [
  z.strictObject({ kind: z.literal("date"), date: day }),
  z.strictObject({ kind: z.literal("money"), grosze: z.int().nonnegative(), currency: z.literal("PLN") }),
  z.strictObject({ kind: z.literal("count"), count: z.int().nonnegative() }),
  z.strictObject({ kind: z.literal("code"), code: id }),
]);
export const factValueKinds = {
  birthDate: "date", insuranceTitle: "code", employerRef: "code", monthlyGrossPay: "money",
  monthlyContributionBasis: "money", submissionStatus: "code",
  benefitRequest: "code", deliveryDate: "date", sicknessCoverage: "code", otherCoverage: "code",
  postInsuranceException: "code", maternityPayVariant: "code", payrollRegime: "code",
  monthlyEmployeeDeduction: "money", monthlyPayAfterDeduction: "money", payerInsuredCount: "count",
  birthChildCount: "count", prenatalLeaveDays: "count", maternityCourse: "code", childDeathDate: "date",
  accountArrears: "money", debtSettlement: "code", sicknessCertificate: "code", benefitHistory: "code",
} as const;
export const factInput = z.strictObject({
  subjectId: id, field: z.enum(Object.keys(factValueKinds) as [keyof typeof factValueKinds, ...(keyof typeof factValueKinds)[]]),
  value, validFrom: day.optional(), validTo: day.optional(), asOf: day.optional(),
  payerRef: id.optional(), titleRef: id.optional(),
  source: z.strictObject({ kind: z.enum(["declaration", "simulated_zus", "document", "workflow"]),
    referenceId: id, page: z.int().positive().optional() }),
}).refine(f => factValueKinds[f.field] === f.value.kind && !!(f.asOf || f.validFrom) &&
  (!f.validTo || (!!f.validFrom && f.validFrom <= f.validTo)), "invalid_fact");
export const profileInput = z.strictObject({ mode: z.enum(["family", "case_import"]) });
export const caseInput = z.strictObject({ profileId: id });
const documentKind = z.enum(["application", "insurance", "payroll", "certificate", "decision", "other"]);
export const docInput = z.strictObject({ clientDocumentId: id, pages: z.int().positive(),
  kind: documentKind, pageKinds: z.array(documentKind).optional()
}).refine(doc => !doc.pageKinds || doc.pageKinds.length === doc.pages, "invalid_page_kinds");
export const profilePatch = z.strictObject({ changes: z.array(z.discriminatedUnion("action", [
  z.strictObject({ action: z.literal("add_subject"), subjectId: id, role: z.enum(["parent", "child", "other"]) }),
  z.strictObject({ action: z.literal("add_fact"), fact: factInput }),
  z.strictObject({ action: z.enum(["correct_fact", "change_from"]), previousFactId: id, fact: factInput }),
  z.strictObject({ action: z.literal("withdraw_fact"), previousFactId: id }),
  z.strictObject({ action: z.enum(["accept_proposal", "dismiss_proposal"]), proposalId: id }),
])).min(1).max(25) });
export type FactInput = z.infer<typeof factInput>;
export type Patch = z.infer<typeof profilePatch>;
export type ProfileInput = z.infer<typeof profileInput>;
export type DocInput = z.infer<typeof docInput>;
export type Profile = ProfileInput & { id: string; revision: number; subjects: string[] };
export type CaseFile = { id: string; profileId: string; revision: number; createdAt: string };
export type EvidenceFact = { factId: string; version: number; fact: FactInput; recordedAt: string;
  verification: "declared" | "confirmed" | "disputed" | "withdrawn"; supersedes?: string };
export type Proposal = { id: string; fact: FactInput; basisRevision: number; reasonCode: string;
  status: "pending" | "accepted" | "dismissed" | "obsolete" };
export type CaseDocument = { id: string; metadata: DocInput };
export type FactFilter = { validAt?: string; knownAt?: string; subjectId?: string; caseId?: string };
export type PageInput = { afterId?: string; limit?: number };
export type Page<T> = { items: T[]; nextAfterId: string | null };

// D authenticates, binds its opaque cursor to scope/filters and handles idempotency in this transaction.
export interface MemoryRepository {
  createProfile(input: ProfileInput): Promise<Profile>;
  getProfile(id: string, lock?: boolean): Promise<Profile>;
  listProfiles(page?: PageInput): Promise<Page<Profile>>;
  patchProfile(id: string, expectedRevision: number, patch: Patch, caseId?: string): Promise<Profile>;
  deleteProfile(id: string, expectedRevision: number): Promise<void>;
  listFacts(profileId: string, filter?: FactFilter, page?: PageInput): Promise<Page<EvidenceFact>>;
  listProposals(profileId: string, page?: PageInput): Promise<Page<Proposal>>;
  createCase(profileId: string): Promise<CaseFile>;
  getCase(id: string, lock?: boolean): Promise<CaseFile>;
  listCases(page?: PageInput): Promise<Page<CaseFile>>;
  deleteCase(id: string, expectedRevision: number): Promise<void>;
  registerDocument(caseId: string, input: DocInput): Promise<CaseDocument>;
  getDocument(caseId: string, documentId: string): Promise<CaseDocument>;
  listDocuments(caseId: string, page?: PageInput): Promise<Page<CaseDocument>>;
}

export class MemoryError extends Error {
  constructor(readonly status: 400 | 404 | 409 | 412 | 422, readonly code: string, readonly revision?: number) {
    super(code);
  }
}
