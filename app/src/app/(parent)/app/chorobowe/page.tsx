import { ScenarioNav } from "@/features/chat/scenario-nav";
import { SicknessWorkspace } from "@/features/sickness/workspace";

export default function SicknessPage() {
  return (
    <>
      <ScenarioNav current="chorobowe" />
      <SicknessWorkspace />
    </>
  );
}
