import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { welcomeMessage } from "./chatbotData";
import { chatbotService } from "./chatbotService";
import { getErrorMessage } from "@/lib/apiError";

const storageKey = "vietfly-chat-conversations";
const createId = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const currentTime = () => new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit" }).format(new Date());
const createConversation = () => ({
  id: createId(),
  messages: [{ ...welcomeMessage, id: createId(), time: currentTime() }],
  title: "Cuộc trò chuyện mới",
  updatedAt: new Date().toISOString(),
});

const loadConversations = () => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(storageKey) ?? "[]");
    const valid = Array.isArray(parsed)
      ? parsed.filter((item) => item?.id && Array.isArray(item.messages) && item.messages.length > 0)
      : [];
    return valid.length > 0 ? valid : [createConversation()];
  } catch {
    return [createConversation()];
  }
};

export const useChatbot = () => {
  const [initialConversations] = useState(loadConversations);
  const [conversations, setConversations] = useState(initialConversations);
  const [activeConversation, setActiveConversation] = useState(initialConversations[0].id);
  const [messages, setMessages] = useState(initialConversations[0].messages);
  const [inputValue, setInputValue] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const requestRef = useRef(0);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [isTyping, messages]);

  useEffect(() => {
    return () => {
      requestRef.current += 1;
    };
  }, []);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(conversations.slice(0, 20)));
  }, [conversations]);

  useEffect(() => {
    setConversations((current) => current.map((conversation) => {
      if (conversation.id !== activeConversation) {
        return conversation;
      }
      const firstQuestion = messages.find((message) => message.role === "user")?.text;
      return {
        ...conversation,
        messages,
        title: firstQuestion ? firstQuestion.replace(/\s+/g, " ").slice(0, 55) : "Cuộc trò chuyện mới",
        updatedAt: new Date().toISOString(),
      };
    }));
  }, [activeConversation, messages]);

  const startNewConversation = () => {
    requestRef.current += 1;
    const conversation = createConversation();
    setConversations((current) => [conversation, ...current].slice(0, 20));
    setActiveConversation(conversation.id);
    setMessages(conversation.messages);
    setInputValue("");
    setAttachment(null);
    setIsTyping(false);
    setIsMenuOpen(false);
    setIsHistoryOpen(false);
  };

  const selectConversation = (conversation) => {
    requestRef.current += 1;
    setActiveConversation(conversation.id);
    setMessages(conversation.messages);
    setIsTyping(false);
    setIsHistoryOpen(false);
  };

  const deleteCurrentConversation = () => {
    requestRef.current += 1;
    const remaining = conversations.filter((conversation) => conversation.id !== activeConversation);
    const nextConversation = remaining[0] ?? createConversation();
    setConversations(remaining.length > 0 ? remaining : [nextConversation]);
    setActiveConversation(nextConversation.id);
    setMessages(nextConversation.messages);
    setInputValue("");
    setAttachment(null);
    setIsTyping(false);
    setIsMenuOpen(false);
  };

  const buildHistory = () =>
    messages
      .filter((message) => ["user", "assistant"].includes(message.role) && message.text)
      .map((message) => ({ role: message.role, text: message.text }))
      .slice(-8);

  const sendMessage = async (rawValue = inputValue) => {
    const value = rawValue.trim();
    if (!value && !attachment) {
      return;
    }

    const messageText = attachment
      ? `${value || "Hãy đọc và hỗ trợ tôi với tệp này."}\n\nTệp ${attachment.name}:\n${attachment.content}`
      : value;
    if (messageText.length > 2000) {
      toast.error("Nội dung câu hỏi và tệp đính kèm không được vượt quá 2.000 ký tự.");
      return;
    }
    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: messageText,
      time: currentTime(),
    };

    setMessages((current) => [...current, userMessage]);
    setInputValue("");
    setAttachment(null);
    setIsTyping(true);
    setActiveConversation("new");

    const requestId = requestRef.current + 1;
    requestRef.current = requestId;

    try {
      const response = await chatbotService.sendMessage({
        message: messageText,
        history: buildHistory(),
      });

      if (requestRef.current !== requestId) {
        return;
      }

      const assistantText = response.data?.text || response.text;
      if (!assistantText) {
        throw new Error("Gemini không trả về nội dung phản hồi.");
      }

      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          text: assistantText,
          time: currentTime(),
        },
      ]);
    } catch (error) {
      if (requestRef.current !== requestId) {
        return;
      }

      const message = getErrorMessage(error, "Không thể nhận phản hồi từ Gemini. Vui lòng thử lại sau.");
      toast.error(message);
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          text: message,
          time: currentTime(),
        },
      ]);
    } finally {
      if (requestRef.current === requestId) {
        setIsTyping(false);
      }
    }
  };

  const handleAttachment = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const allowedExtension = /\.(txt|md|csv|json)$/i.test(file.name);
    if (!allowedExtension || file.size > 100 * 1024) {
      toast.error("Chỉ hỗ trợ tệp văn bản TXT, MD, CSV hoặc JSON tối đa 100 KB.");
      event.target.value = "";
      return;
    }

    try {
      const content = (await file.text()).trim().slice(0, 1200);
      if (!content) {
        toast.error("Tệp đính kèm không có nội dung văn bản.");
        return;
      }
      setAttachment({ content, name: file.name });
    } catch {
      toast.error("Không thể đọc tệp đính kèm.");
    } finally {
      event.target.value = "";
    }
  };

  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.info("Trình duyệt này chưa hỗ trợ nhập liệu bằng giọng nói.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "vi-VN";
    recognition.interimResults = false;
    recognition.onresult = (event) => setInputValue(event.results[0][0].transcript);
    recognition.onerror = () => toast.error("Không thể nhận diện giọng nói. Vui lòng thử lại.");
    recognition.start();
    toast.info("VietFly đang lắng nghe...");
  };

  return {
    activeConversation,
    attachment,
    conversations,
    deleteCurrentConversation,
    handleAttachment,
    handleVoiceInput,
    inputValue,
    isHistoryOpen,
    isMenuOpen,
    isTyping,
    messages,
    messagesEndRef,
    selectConversation,
    sendMessage,
    setAttachment,
    setInputValue,
    setIsHistoryOpen,
    setIsMenuOpen,
    startNewConversation,
  };
};
