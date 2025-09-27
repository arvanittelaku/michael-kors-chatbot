import React, { useState } from 'react';
import axios from 'axios';

const ChatbotTest: React.FC = () => {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    try {
      console.log('Testing connection to backend...');
      const result = await axios.post('http://localhost:5000/api/albi-mall/chat', {
        message: message || 'test',
        sessionId: 'test-debug'
      });
      
      console.log('Backend response:', result.data);
      setResponse(JSON.stringify(result.data, null, 2));
    } catch (error: any) {
      console.error('Connection error:', error);
      setResponse(`Error: ${error.message}\nStatus: ${error.response?.status}\nData: ${JSON.stringify(error.response?.data, null, 2)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Chatbot Connection Test</h1>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Test Message:</label>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter test message..."
          className="w-full p-2 border border-gray-300 rounded"
        />
      </div>
      
      <button
        onClick={testConnection}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Test Connection'}
      </button>
      
      {response && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Response:</h3>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {response}
          </pre>
        </div>
      )}
    </div>
  );
};

export default ChatbotTest;
