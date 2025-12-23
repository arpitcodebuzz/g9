import { Router } from "express";
const routes = Router();
import chatbotController from '../chat-bot/chatbot.controller'

routes.post('/',chatbotController.chatBot);

export default routes;