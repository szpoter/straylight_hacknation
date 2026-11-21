import { ZusikWorkspace } from "@/features/chat/workspace";

import { citationUrl } from "@/lib/rag/corpus";
import { loadCorpus } from "@/lib/rag/corpus-fs";

export default function AppPage() {
  const corpus = loadCorpus();
  const fragment = corpus.fragments.get("kp-art182-1d-par1");
  const deadlineSource = fragment && {
    label: `Kodeks pracy · ${fragment.locator}`,
    text: fragment.sourceText,
    url: citationUrl(corpus, fragment),
  };
  return (
    <main>
      <ZusikWorkspace initialChatOpen deadlineSource={deadlineSource} />
    </main>
  );
}
