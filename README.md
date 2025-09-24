# Michael Kors Style Assistant Chatbot

A sophisticated AI-powered product recommendation chatbot built with React, Node.js, and Groq AI. This chatbot helps customers find the perfect Michael Kors handbags, accessories, and fashion items with intelligent recommendations.

## 🚀 Features

- **AI-Powered Recommendations**: Uses Groq AI for intelligent product suggestions
- **Precise Filtering**: Respects color and price constraints exactly
- **Real-time Search**: Instant product search and filtering
- **Responsive Design**: Beautiful UI built with React and Tailwind CSS
- **Smart Matching**: Advanced product matching algorithm
- **Conversational Interface**: Natural language processing for user queries

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Axios** for API calls

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **Groq AI** for intelligent responses
- **CORS** and **Helmet** for security

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/michael-kors-chatbot.git
   cd michael-kors-chatbot
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install server dependencies
   cd server && npm install
   
   # Install client dependencies
   cd ../client && npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy the example environment file
   cp env.example .env
   
   # Edit .env with your actual API keys
   nano .env
   ```

4. **Start the development servers**
   ```bash
   # Start both frontend and backend
   npm run dev
   ```

## 🔧 Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Groq API Configuration
GROQ_API_KEY=your_groq_api_key_here

# Server Configuration
PORT=5000
NODE_ENV=development

# Frontend Configuration
REACT_APP_API_URL=http://localhost:5000
```

## 🚀 Deployment

### Option 1: Vercel (Recommended)

1. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Configure build settings:
     - **Frontend**: `client` directory
     - **Backend**: `server` directory

2. **Set Environment Variables**
   - Add your `GROQ_API_KEY` in Vercel dashboard
   - Set `NODE_ENV=production`

### Option 2: Netlify + Railway

1. **Frontend (Netlify)**
   - Connect GitHub repository
   - Build command: `cd client && npm run build`
   - Publish directory: `client/build`

2. **Backend (Railway)**
   - Connect GitHub repository
   - Set environment variables
   - Deploy from `server` directory

## 📱 Usage

1. **Open the application** in your browser
2. **Type your query** in the search bar (e.g., "red bag under $300")
3. **Get intelligent recommendations** from the AI assistant
4. **Browse products** with detailed information and images

## 🎯 Example Queries

- "I want a red bag I can wear everyday"
- "Show me black leather handbags under $300"
- "I need a large tote for work and travel"
- "Find me a crossbody bag for hands-free convenience"
- "Phone wallet under $90"

## 🔍 API Endpoints

- `POST /api/search` - Search for products
- `POST /api/recommendations` - Get personalized recommendations
- `POST /api/compare` - Compare products
- `GET /api/products` - Get all products
- `GET /api/suggested-queries` - Get suggested queries
- `GET /api/status` - Check system status

## 🤖 AI Features

- **Natural Language Processing**: Understands complex queries
- **Context Awareness**: Remembers conversation context
- **Smart Filtering**: Respects price and color constraints
- **Personalized Recommendations**: Tailored suggestions
- **Conversational Responses**: Human-like interactions

## 📊 Product Data

The chatbot includes a comprehensive dataset of 300+ Michael Kors products including:
- Handbags (totes, satchels, crossbody, backpacks)
- Accessories (wallets, phone wallets)
- Detailed product information (colors, sizes, materials, prices)
- High-quality product images

## 🛡️ Security

- **CORS** enabled for cross-origin requests
- **Helmet** for security headers
- **Environment variables** for sensitive data
- **Input validation** and sanitization

## 🚀 Performance

- **Fast Response Times**: Optimized API calls
- **Efficient Search**: Smart product matching algorithm
- **Caching**: Product data caching
- **Responsive Design**: Works on all devices

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Groq AI** for providing the AI engine
- **Michael Kors** for product inspiration
- **React** and **Node.js** communities
- **Tailwind CSS** for beautiful styling

## 📞 Support

If you have any questions or need help, please:
- Open an issue on GitHub
- Contact the development team
- Check the documentation

---

**Built with ❤️ by the development team**