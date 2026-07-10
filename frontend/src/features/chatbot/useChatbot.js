import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { buildResponse } from "./chatbotUtils";
import { showcaseMessages, welcomeMessage } from "./chatbotData";

export const useChatbot = () => {
  const [activeConversation, setActiveConversation] = useState("phuquoc");
  const [messages, setMessages] = useState(showcaseMessages);
  const [inputValue, setInputValue] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [isTyping, messages]);

  useEffect(() => {
    return () => {
      window.clearTimeout(timerRef.current);
    };
  }, []);

  const startNewConversation = () => {
    window.clearTimeout(timerRef.current);
    setActiveConversation("new");
    setMessages([welcomeMessage]);
    setInputValue("");
    setAttachment(null);
    setIsTyping(false);
    setIsMenuOpen(false);
    setIsHistoryOpen(false);
  };

  const selectConversation = (conversation) => {
    window.clearTimeout(timerRef.current);
    setActiveConversation(conversation.id);
    setMessages(conversation.messages);
    setIsTyping(false);
    setIsHistoryOpen(false);
  };

  const sendMessage = (rawValue = inputValue) => {
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

    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          text: buildResponse(value),
          time: "Vừa xong",
        },
      ]);
      setIsTyping(false);
    }, 850);
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
