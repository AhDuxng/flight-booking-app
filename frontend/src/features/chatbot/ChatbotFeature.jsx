import ChatComposer from "./components/ChatComposer";
import ChatMessage from "./components/ChatMessage";
import ChatbotHeader from "./components/ChatbotHeader";
import HistorySidebar from "./components/HistorySidebar";
import MobileChatNavigation from "./components/MobileChatNavigation";
import SuggestionChips from "./components/SuggestionChips";
import TripContextPanel from "./components/TripContextPanel";
import TypingIndicator from "./components/TypingIndicator";
import { useChatbot } from "./useChatbot";

export default function ChatbotFeature() {
  const chatbot = useChatbot();

  return (
    <div className="relative flex h-[calc(100dvh-4rem)] min-h-[560px] w-full min-w-0 max-w-full overflow-hidden bg-surface text-on-surface">
      <HistorySidebar
        activeConversation={chatbot.activeConversation}
        className="hidden lg:flex"
        onNewConversation={chatbot.startNewConversation}
        onSelect={chatbot.selectConversation}
      />

      {chatbot.isHistoryOpen ? (
        <div className="fixed inset-0 top-16 z-40 lg:hidden">
          <button
            aria-label="Đóng lịch sử trò chuyện"
            className="absolute inset-0 bg-primary/40"
            onClick={() => chatbot.setIsHistoryOpen(false)}
            type="button"
          />
          <HistorySidebar
            activeConversation={chatbot.activeConversation}
            className="relative h-full w-[min(19rem,88vw)] animate-in slide-in-from-left"
            onClose={() => chatbot.setIsHistoryOpen(false)}
            onNewConversation={chatbot.startNewConversation}
            onSelect={chatbot.selectConversation}
          />
        </div>
      ) : null}

      <section className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-surface">
        <ChatbotHeader
          isMenuOpen={chatbot.isMenuOpen}
          onMenuToggle={() => chatbot.setIsMenuOpen((current) => !current)}
          onNewConversation={chatbot.startNewConversation}
          onOpenHistory={() => chatbot.setIsHistoryOpen(true)}
        />

        <div className="chat-scrollbar flex min-w-0 flex-1 flex-col gap-7 overflow-x-hidden overflow-y-auto px-4 py-6 md:px-container-padding md:py-stack-lg">
          {chatbot.messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          {chatbot.isTyping ? <TypingIndicator /> : null}
          {!chatbot.isTyping ? <SuggestionChips onSelect={chatbot.sendMessage} /> : null}
          <div ref={chatbot.messagesEndRef} />
        </div>

        <ChatComposer
          attachment={chatbot.attachment}
          inputValue={chatbot.inputValue}
          isTyping={chatbot.isTyping}
          onAttachmentChange={chatbot.handleAttachment}
          onAttachmentRemove={() => chatbot.setAttachment(null)}
          onInputChange={chatbot.setInputValue}
          onSubmit={chatbot.sendMessage}
          onVoiceInput={chatbot.handleVoiceInput}
        />
      </section>

      <TripContextPanel />
      <MobileChatNavigation />
    </div>
  );
}
