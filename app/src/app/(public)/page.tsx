import { SmoothScroll } from "@/components/scroll/smooth-scroll";
import { AgentSection } from "@/features/landing/agent-section";
import { Families } from "@/features/landing/families";
import { Hero } from "@/features/landing/hero";
import { LiquidBento } from "@/features/landing/liquid-bento/liquid-bento";
import { PageLoader } from "@/features/landing/page-loader";
import { SiteFooter } from "@/features/landing/site-footer";
import { SiteHeader } from "@/features/landing/site-header";

// Strona główna według SPEC.md, układ sekcji jak na granola.ai. Płynne przewijanie (Lenis)
// i ekran ładowania jak w referencji. Kolejne sekcje dochodzą niżej.
export default function HomePage() {
  return (
    <>
      <PageLoader />
      <SmoothScroll />
      <SiteHeader />
      <main id="tresc">
        <Hero />
        <Families />
        <AgentSection />
        <LiquidBento />
      </main>
      <SiteFooter />
    </>
  );
}
