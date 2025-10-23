// API Configuration
const API_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://michael-kors-chatbot.onrender.com' 
    : 'http://localhost:5000');

const API_ENDPOINTS = {
  CHAT: '/chat', // Main server uses /chat, not /api/albi-mall/chat
  HEALTH: '/api/health'
};

export default {
  API_URL,
  API_ENDPOINTS
};

