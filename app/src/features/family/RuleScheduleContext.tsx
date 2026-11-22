"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { RuleSchedule } from "@/lib/rules/parameters";

const Context = createContext<RuleSchedule>({});
export const useRuleSchedule = () => useContext(Context);

export function RuleScheduleProvider({ schedule, children }: { schedule: RuleSchedule; children: ReactNode }) {
  return <Context.Provider value={schedule}>{children}</Context.Provider>;
}
