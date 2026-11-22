import { PlanConversation } from "@/features/chat/case-chat-window";
import { KamilWorkspace } from "@/features/kamil/workspace";
import { SicknessWorkspace } from "@/features/sickness/workspace";
import { ImportConversation } from "@/features/chat/import-conversation";

export const metadata = { title: "Rozmowa z Zusikiem" };

export default async function GeneralChatPage({ searchParams }: { searchParams: Promise<{ historia?: string }> }) {
  const preview = process.env.VERCEL_ENV === "preview" || process.env.NODE_ENV === "development" || process.env.ZUSIK_CHAT_V1 === "1";
  const { historia } = await searchParams;
  if (!preview || process.env.VERCEL_ENV === "production" || process.env.ZUSIK_CHAT_V1 === "0") return <PlanConversation />;
  if (historia === "kamil") return <KamilWorkspace />;
  if (historia === "chorobowe") return <SicknessWorkspace />;
  return historia === "1" ? <PlanConversation /> : <ImportConversation />;
}
