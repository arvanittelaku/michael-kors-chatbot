import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  recommendedProducts?: Array<{
    id: string;
    title: string;
    highlight: string[];
    image?: string;
  }>;
}

interface ChatbotResponse {
  success: boolean;
  data: {
    assistant_text: string;
    recommended_products: Array<{
      id: string;
      title: string;
      highlight: string[];
    }>;
    audit_notes?: string;
  };
  sessionId: string;
}

const AlbiMallChatbot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{ id: string; title: string; highlight: string[]; image?: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Welcome suggestions
  const welcomeSuggestions = [
    "Dua pantofla",
    "Kërkoj kemishe",
    "Kam nevojë për peshqir",
    "Çfarë produkte të reja keni?"
  ];

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    sendMessage(suggestion);
  };

  const handleProductClick = (product: { id: string; title: string; highlight: string[]; image?: string }) => {
    setSelectedProduct(product);
  };

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputValue.trim();
    if (!textToSend || isLoading) return;

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      text: textToSend,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    console.log('Sending message:', userMessage.text, 'to session:', sessionId);

    try {
      const response = await axios.post<ChatbotResponse>('http://localhost:5000/api/albi-mall/chat', {
        message: userMessage.text,
        sessionId: sessionId
      });

      console.log('Received response:', response.data);

      if (response.data.success) {
        const assistantMessage: Message = {
          id: `assistant_${Date.now()}`,
          text: response.data.data.assistant_text,
          isUser: false,
          timestamp: new Date(),
          recommendedProducts: response.data.data.recommended_products
        };

        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error('API returned unsuccessful response');
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      
      let errorMessage = 'Më falni, por kam një problem teknik. Mund të provoni përsëri?';
      
      if (error.response) {
        // Server responded with error status
        console.error('Server error:', error.response.status, error.response.data);
        if (error.response.status === 500) {
          errorMessage = 'Serveri ka një problem teknik. Mund të provoni përsëri?';
        } else if (error.response.status === 429) {
          errorMessage = 'Shumë kërkesa në të njëjtën kohë. Mund të prisni pak dhe të provoni përsëri?';
        }
      } else if (error.request) {
        // Request was made but no response received
        console.error('No response received:', error.request);
        errorMessage = 'Nuk mund të lidhem me serverin. Kontrolloni lidhjen tuaj të internetit.';
      } else {
        // Something else happened
        console.error('Request setup error:', error.message);
      }
      
      const errorMsg: Message = {
        id: `error_${Date.now()}`,
        text: errorMessage,
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 w-96 h-[600px] bg-white rounded-lg shadow-lg border border-gray-200 flex flex-col">
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 rounded-t-lg flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Albi Mall Assistant</h3>
              <p className="text-sm opacity-90">Asistenti juaj për blerje</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center">
                <div className="mb-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">Mirë se vini!</h4>
                  <p className="text-gray-600 text-sm mb-4">Si mund t'ju ndihmoj sot?</p>
                </div>
                
                <div className="space-y-2">
                  {welcomeSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full text-left p-3 bg-gray-50 hover:bg-blue-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors text-sm"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-lg ${
                  message.isUser 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  <p className="text-sm">{message.text}</p>
                  
                  {message.recommendedProducts && message.recommendedProducts.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {message.recommendedProducts.map((product, index) => (
                        <div key={index} className="bg-white text-gray-800 p-3 rounded border hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleProductClick(product)}>
                          <div className="flex items-start space-x-3">
                            <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center flex-shrink-0 overflow-hidden">
                              {product.image ? (
                                <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
                              ) : (
                                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm text-gray-900 truncate">{product.title}</h4>
                              <ul className="text-xs mt-1 space-y-1">
                                {Array.isArray(product.highlight) ? (
                                  product.highlight.map((highlight, i) => (
                                    <li key={i} className="text-gray-600">• {highlight}</li>
                                  ))
                                ) : (
                                  <li className="text-gray-600">• {product.highlight || 'No details available'}</li>
                                )}
                              </ul>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-800 p-3 rounded-lg">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Shkruani mesazhin tuaj..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!inputValue.trim() || isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Dërgo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Detajet e Produktit</h3>
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <div className="mb-4">
                <div className="w-full h-48 bg-gray-200 rounded flex items-center justify-center overflow-hidden">
                  {selectedProduct.image ? (
                    <img src={selectedProduct.image} alt={selectedProduct.title} className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  )}
                </div>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">{selectedProduct.title}</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                {Array.isArray(selectedProduct.highlight) ? (
                  selectedProduct.highlight.map((highlight, i) => (
                    <li key={i}>• {highlight}</li>
                  ))
                ) : (
                  <li>• {selectedProduct.highlight || 'No details available'}</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AlbiMallChatbot;
