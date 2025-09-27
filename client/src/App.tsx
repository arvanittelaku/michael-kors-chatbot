import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import HomePage from './components/HomePage';
import AlbiMallChatbot from './components/AlbiMallChatbot';
import ChatbotTest from './components/ChatbotTest';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* Navigation Header */}
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
                <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-xl font-semibold text-gray-900">Albi Mall</h1>
              </Link>
              <div className="flex items-center space-x-4">
                <Link 
                  to="/" 
                  className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
                >
                  Home
                </Link>
                <Link 
                  to="/test" 
                  className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
                >
                  Test
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/test" element={<ChatbotTest />} />
        </Routes>

        {/* Floating Chatbot */}
        <AlbiMallChatbot />
      </div>
    </Router>
  );
}

export default App;