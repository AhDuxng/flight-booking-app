import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { showcaseMessages, welcomeMessage } from "./chatbotData";
import { chatbotService } from "./chatbotService";
import { getErrorMessage } from "@/lib/apiError";

export const useChatbot = () => {
  const [activeConversation, setActiveConversation] = useState("phuquoc");
  const [messages, setMessages] = useState(showcaseMessages);
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

  const startNewConversation = () => {
    requestRef.current += 1;
    setActiveConversation("new");
    setMessages([welcomeMessage]);
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

    const messageText = attachment ? `${value || "Tôi gửi một tệp đính kèm."}\nTệp: ${attachment.name}` : value;
    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: messageText,
      time: "Bây giờ",
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
          time: "Vừa xong",
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
          time: "Vừa xong",
        },
      ]);
    } finally {
      if (requestRef.current === requestId) {
        setIsTyping(false);
      }
    }
  };

  const handleAttachment = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Tệp đính kèm không được vượt quá 5 MB.");
      event.target.value = "";
      return;
    }

    setAttachment(file);
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
