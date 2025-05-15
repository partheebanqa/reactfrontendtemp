import React, { useState, useEffect } from 'react';
import { validateGraphQLQuery, validateGraphQLVariables } from '../utils/graphqlValidator';
import { Code } from 'lucide-react';

interface GraphQLEditorProps {
  query: string;
  variables: string;
  onChange: (updates: { query?: string; variables?: string }) => void;
}

const GraphQLEditor: React.FC<GraphQLEditorProps> = ({
  query,
  variables,
  onChange
}) => {
  const [queryError, setQueryError] = useState<string | null>(null);
  const [variablesError, setVariablesError] = useState<string | null>(null);

  useEffect(() => {
    const result = validateGraphQLQuery(query);
    setQueryError(result.error || null);
  }, [query]);

  useEffect(() => {
    if (variables.trim()) {
      const result = validateGraphQLVariables(variables);
      setVariablesError(result.error || null);
    } else {
      setVariablesError(null);
    }
  }, [variables]);

  const formatQuery = () => {
    try {
      const result = validateGraphQLQuery(query);
      if (result.isValid && result.ast) {
        onChange({ query: print(result.ast) });
      }
    } catch (error) {
      // Keep original query if formatting fails
    }
  };

  const formatVariables = () => {
    try {
      const parsed = JSON.parse(variables);
      onChange({ variables: JSON.stringify(parsed, null, 2) });
    } catch (error) {
      // Keep original variables if formatting fails
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">GraphQL Query</h3>
          <button
            onClick={formatQuery}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <Code size={14} />
            Format Query
          </button>
        </div>
        <div className="relative">
          <textarea
            value={query}
            onChange={(e) => onChange({ query: e.target.value })}
            className={`w-full h-64 px-3 py-2 text-sm font-mono border rounded ${
              queryError ? 'border-red-500' : 'border-gray-200'
            }`}
            placeholder="Enter your GraphQL query"
            spellCheck={false}
          />
          {queryError && (
            <div className="absolute bottom-2 right-2 text-sm text-red-500 bg-white px-2 py-1 rounded-md shadow">
              {queryError}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Query Variables (Optional)</h3>
          <button
            onClick={formatVariables}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <Code size={14} />
            Format JSON
          </button>
        </div>
        <div className="relative">
          <textarea
            value={variables}
            onChange={(e) => onChange({ variables: e.target.value })}
            className={`w-full h-32 px-3 py-2 text-sm font-mono border rounded ${
              variablesError ? 'border-red-500' : 'border-gray-200'
            }`}
            placeholder="Enter variables as JSON (optional)"
            spellCheck={false}
          />
          {variablesError && (
            <div className="absolute bottom-2 right-2 text-sm text-red-500 bg-white px-2 py-1 rounded-md shadow">
              {variablesError}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GraphQLEditor;