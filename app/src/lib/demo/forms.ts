import type { FormDef } from "./form-fields";
import { benefitsForms } from "./forms-benefits";
import { civilForms } from "./forms-civil";
import { insuranceForms } from "./forms-insurance";
import { leaveForms } from "./forms-leave";

export { CHANNEL_LABEL, prefillContext } from "./form-fields";
export type { Channel, FieldType, FormDef, FormField, FormSection, PrefillContext } from "./form-fields";

export const FORMS: Record<string, FormDef> = {
  ...benefitsForms,
  ...civilForms,
  ...insuranceForms,
  ...leaveForms,
};

export function formFor(stopId: string): FormDef | undefined {
  return FORMS[stopId.replace(/^e-/, "")];
}
