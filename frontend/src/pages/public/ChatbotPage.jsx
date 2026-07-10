import TopNavBar from "@/components/layout/TopNavBar";
import ChatbotFeature from "@/features/chatbot/ChatbotFeature";

export default function ChatbotPage() {
  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-surface pt-16 font-body-md text-on-surface antialiased">
      <TopNavBar />
      <ChatbotFeature />
    </div>
  );
}
