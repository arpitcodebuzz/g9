import chatBotService from '../chat-bot/chatbot.service'

class chatBotController{
  async chatBot(req, res) {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required.'});
    }

    const reply = await chatBotService.chatBot(message);
    res.json({ reply });
  }
}

export default new chatBotController();