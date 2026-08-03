import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware.js';
import { sendChatbotMessageSchema } from './chatbot.schema.js';
import * as chatbotController from './chatbot.controller.js';

const router = Router();

router.post('/messages', validate(sendChatbotMessageSchema), chatbotController.sendMessage);

export default router;
