import { PlanProvider } from "@/features/family/PlanProvider";

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return <PlanProvider>{children}</PlanProvider>;
}
