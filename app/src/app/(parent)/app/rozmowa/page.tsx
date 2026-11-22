import { CaseChatWindow } from "@/features/chat/case-chat-window";

export default function GeneralChatPage() {
  return (
    <CaseChatWindow scenario="ogolna" label="Rozmowa ogólna" ready busy={false} entries={[]} documents={null}
      introduction={<p>O jakie świadczenie albo dokument chcesz zapytać?</p>} />
  );
}
