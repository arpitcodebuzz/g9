import axios from 'axios'
import axiosRetry from 'axios-retry'
require('dotenv').config();
import { HttpAgent, HttpsAgent } from 'agentkeepalive';

axiosRetry(axios, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) =>
    axiosRetry.isNetworkOrIdempotentRequestError(error) || error.code === 'ECONNABORTED'
});

class chatBotService {
  constructor() {
    this.conversation = [
      { role: 'system', content: 'You are a helpful assistant.' }
    ];
  }

  async chatBot(message) {
    try {
      const today = new Date().toISOString().split('T')[0];

      this.conversation.push({ role: 'user', content: message });

      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'llama-3.1-8b-instant',
          messages: [
            ...this.conversation,
            { role: 'system', content: `Today's date is ${today}.` }
          ]
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const reply = response.data.choices[0].message.content;

      // add assistant reply to history
      this.conversation.push({ role: 'assistant', content: reply });

      return reply;;
    } catch (err) {
      console.error('Groq API Error:', err.response?.data || err.message);
      return 'Sorry, something went wrong.';
    }


  }
}
export default new chatBotService();