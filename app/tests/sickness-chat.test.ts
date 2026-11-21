import { expect, it } from "vitest";
import type { SicknessView } from "@/lib/sickness/types";
import { sicknessInput } from "@/features/sickness/chat-input";
const view = { version: 4, closed: false, assessment: { asksOtherCoverage: true, status: "needs_fact" } } as SicknessView;
it("starts the assessment and only records explicit coverage answers to the current question", () => {
  expect(sicknessInput("Czy dostanę zasiłek chorobowy?", null, false)).toEqual({ type: "start" });
  expect(sicknessInput("Nie wiem.", view, false)).toEqual({ type: "confirm", version: 4, answer: "unknown" });
  expect(sicknessInput("Nie, nie miałam żadnego innego ubezpieczenia chorobowego", view, false)).toEqual({ type: "confirm", version: 4, answer: "no" });
  expect(sicknessInput("Nie?", view, false)).toEqual({ type: "help" });
  expect(sicknessInput("Tak, ale nie wiem, czy w tym okresie", view, false)).toEqual({ type: "help" });
  expect(sicknessInput("Zakończ ocenę", view, false)).toEqual({ type: "help" });
  const assessed = { ...view, assessment: { ...view.assessment, status: "not_entitled_for_period", asksOtherCoverage: false } } as SicknessView;
  expect(sicknessInput("Tak", assessed, false)).toEqual({ type: "help" });
  expect(sicknessInput("Zakończ ocenę", assessed, false)).toEqual({ type: "close", version: 4 });
});
