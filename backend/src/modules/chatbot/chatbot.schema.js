import { z } from 'zod';

const chatHistoryItemSchema = z.object({
  role: z.enum(['user', 'assistant']),
  text: z.string().trim().min(1).max(4_000),
});

export const sendChatbotMessageSchema = z.object({
  message: z.string().trim().min(1).max(2_000),
  history: z.array(chatHistoryItemSchema).max(12).optional().default([]),
});
