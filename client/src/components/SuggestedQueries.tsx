import React from 'react';
import { Search } from 'lucide-react';
import { SuggestedQuery } from '../types';

interface SuggestedQueriesProps {
  queries: SuggestedQuery[];
  onQueryClick: (query: SuggestedQuery) => void;
}

const SuggestedQueries: React.FC<SuggestedQueriesProps> = ({ queries, onQueryClick }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {queries.map((query) => (
        <button
          key={query.id}
          onClick={() => onQueryClick(query)}
          className="flex items-center space-x-3 p-4 bg-purple-100 hover:bg-purple-200 rounded-lg transition-colors text-left group"
        >
          <div className="flex-shrink-0">
            <Search className="h-5 w-5 text-purple-600 group-hover:text-purple-700" />
          </div>
          <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
            {query.text}
          </span>
        </button>
      ))}
    </div>
  );
};

export default SuggestedQueries;
