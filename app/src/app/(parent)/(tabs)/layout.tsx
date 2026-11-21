import { BottomNav } from "@/components/shell/BottomNav";
import { TopBar } from "@/components/shell/TopBar";
import { ZusikFab, ZusikPanelSlot } from "@/components/shell/ZusikFab";

/** Karty po zalogowaniu: pasek z selektorem dziecka, treść, dolny pasek na telefonie. */
export default function TabsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TopBar />
      <div className="pb-24 md:pb-0">{children}</div>
      <ZusikFab />
      <ZusikPanelSlot />
      <BottomNav />
    </>
  );
}
