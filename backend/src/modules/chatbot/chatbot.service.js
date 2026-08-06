import { env } from '../../config/env.js';
import { createHttpError } from '../../utils/error.js';
import { logger } from '../../utils/logger.js';
import { loadFlightPromptContext } from './chatbot.flight-context.js';
import { buildChatbotFallback, isGeminiCredentialFailure } from './chatbot.fallback.js';

const GEMINI_API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

const SYSTEM_INSTRUCTION = [
  'Bạn là trợ lý ảo VietFly cho website đặt vé máy bay.',
  'Trả lời bằng tiếng Việt, thân thiện, ngắn gọn và chính xác.',
  'Hỗ trợ tìm chuyến bay, hành lý, đổi/hoàn vé, khuyến mãi và thông tin đặt chỗ.',
  'Không tự xác nhận đặt vé, thanh toán, hoàn tiền hoặc thay đổi booking khi người dùng chưa thực hiện trên hệ thống.',
  'Nếu cần dữ liệu cá nhân, mã đặt chỗ hoặc thông tin thời gian thực mà bạn không có, hãy hỏi lại người dùng hoặc hướng dẫn họ kiểm tra trong tài khoản VietFly.',
].join(' ');

let nextApiKeyIndex = 0;
const disabledApiKeyIndexes = new Set();

const normalizeModelName = (model) => model.replace(/^models\//, '');

const selectNextGeminiApiKey = () => {
  for (let offset = 0; offset < env.geminiApiKeys.length; offset += 1) {
    const keyIndex = nextApiKeyIndex % env.geminiApiKeys.length;
    nextApiKeyIndex = (nextApiKeyIndex + 1) % env.geminiApiKeys.length;
    if (!disabledApiKeyIndexes.has(keyIndex)) {
      return { apiKey: env.geminiApiKeys[keyIndex], keyIndex };
    }
  }
  return null;
};

const toGeminiRole = (role) => (role === 'assistant' ? 'model' : 'user');

const buildGeminiPayload = ({ message, history, flightPrompt }) => ({
  systemInstruction: {
    parts: [{ text: [SYSTEM_INSTRUCTION, flightPrompt].filter(Boolean).join('\n\n') }],
  },
  contents: [
    ...history.slice(-8).map((item) => ({
      role: toGeminiRole(item.role),
      parts: [{ text: item.text }],
    })),
    {
      role: 'user',
      parts: [{ text: message }],
    },
  ],
  generationConfig: {
    temperature: 0.4,
    topP: 0.9,
    maxOutputTokens: 700,
  },
});

const parseGeminiError = (status, body) => {
  const message = body?.error?.message || 'Gemini request failed';
  const error = createHttpError(status >= 500 ? 502 : status, message);
  error.credentialFailure = isGeminiCredentialFailure(status, body);
  error.retryable = error.credentialFailure || [429, 500, 502, 503, 504].includes(status);
  return error;
};

const requestGemini = async (apiKey, payload) => {
  const model = normalizeModelName(env.geminiModel);
  const endpoint = `${GEMINI_API_BASE_URL}/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), env.geminiRequestTimeoutMs);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const body = await response.json().catch(() => null);

    if (!response.ok) {
      throw parseGeminiError(response.status, body);
    }

    return body;
  } catch (error) {
    if (error.name === 'AbortError') {
      const timeoutError = createHttpError(504, 'Gemini request timed out');
      timeoutError.retryable = true;
      throw timeoutError;
    }

    if (error.status) {
      throw error;
    }

    const upstreamError = createHttpError(502, 'Gemini request failed');
    upstreamError.retryable = true;
    throw upstreamError;
  } finally {
    clearTimeout(timeoutId);
  }
};

const extractText = (body) => {
  const parts = body?.candidates?.[0]?.content?.parts ?? [];
  const text = parts
    .map((part) => part.text)
    .filter(Boolean)
    .join('\n')
    .trim();

  if (!text) {
    const blockReason = body?.promptFeedback?.blockReason || body?.candidates?.[0]?.finishReason;
    throw createHttpError(
      502,
      blockReason ? `Gemini returned no text: ${blockReason}` : 'Gemini returned an empty response',
    );
  }

  return text;
};

export const sendMessage = async (payload) => {
  const flightContext = await loadFlightPromptContext(payload);
  const geminiPayload = buildGeminiPayload({
    ...payload,
    flightPrompt: flightContext?.prompt,
  });
  const attempts = env.geminiApiKeys.length;
  let lastError;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const selectedKey = selectNextGeminiApiKey();
    if (!selectedKey) break;

    try {
      const body = await requestGemini(selectedKey.apiKey, geminiPayload);
      return {
        text: extractText(body),
        model: env.geminiModel,
        grounding: flightContext?.metadata ?? null,
      };
    } catch (error) {
      lastError = error;
      if (error.credentialFailure) {
        disabledApiKeyIndexes.add(selectedKey.keyIndex);
      }

      if (!error.retryable || attempt === attempts - 1) {
        break;
      }
    }
  }

  logger.warn('chatbot_provider_degraded', {
    error: lastError?.message ?? 'No usable Gemini API key',
    provider_status: lastError?.status,
  });
  return {
    degraded: true,
    grounding: flightContext?.metadata ?? null,
    model: 'vietfly-fallback',
    text: buildChatbotFallback(payload.message, flightContext),
  };
};
