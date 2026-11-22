import { PlanConversation } from "@/features/chat/case-chat-window";
import { ImportConversation } from "@/features/chat/import-conversation";

export const metadata = { title: "Rozmowa z Zusikiem" };

export default async function GeneralChatPage({ searchParams }: { searchParams: Promise<{ historia?: string }> }) {
  const preview = process.env.VERCEL_ENV === "preview" || process.env.NODE_ENV === "development" || process.env.ZUSIK_CHAT_V1 === "1";
  const legacy = (await searchParams).historia === "1" || process.env.ZUSIK_CHAT_V1 === "0";
  return preview && !legacy && process.env.VERCEL_ENV !== "production" ? <ImportConversation /> : <PlanConversation />;
}
