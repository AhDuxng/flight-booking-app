import * as chatbotService from './chatbot.service.js';

export const sendMessage = async (req, res, next) => {
  try {
    const data = await chatbotService.sendMessage(req.body);
    return res.json({ data });
  } catch (error) {
    return next(error);
  }
};
