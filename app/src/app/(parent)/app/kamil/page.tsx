import { ScenarioNav } from "@/features/chat/scenario-nav";
import { KamilWorkspace } from "@/features/kamil/workspace";

export default function KamilPage() {
  return (
    <>
      <ScenarioNav current="kamil" />
      <KamilWorkspace />
    </>
  );
}
