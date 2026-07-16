import { api } from "@/services/api";

export const chatbotService = {
  sendMessage: (payload) => api.post("/chatbot/messages", payload),
};
