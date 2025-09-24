import React from 'react';

interface ChatResponseProps {
  response: string;
  query: string;
}

const ChatResponse: React.FC<ChatResponseProps> = ({ response, query }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-start space-x-3">
        <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-white text-sm font-semibold">SA</span>
        </div>
        <div className="flex-1">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-800 text-sm leading-relaxed">
              {response}
            </p>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Response to: "{query}"
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatResponse;
