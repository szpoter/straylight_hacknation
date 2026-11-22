import { PlanProvider } from "@/features/family/PlanProvider";

import { publishedSchedule } from "@/lib/admin/rule-store";
import { RuleScheduleProvider } from "@/features/family/RuleScheduleContext";

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  return <RuleScheduleProvider schedule={await publishedSchedule()}><PlanProvider>{children}</PlanProvider></RuleScheduleProvider>;
}
