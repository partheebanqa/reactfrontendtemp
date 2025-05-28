import React, { useState } from 'react';
import { useRequest } from '../../context/RequestContext';
import { formatJson } from '../../utils/jsonUtils';
import PrimarySchemaPanel from './schema/PrimarySchemaPanel';

const ResponsePanel: React.FC = () => {
  const { responseData } = useRequest();
  const [activeTab, setActiveTab] = useState<'body' | 'headers' | 'schema'>('body');

  if (!responseData) return null;

  const { data, status, statusText, headers, time } = responseData;
  
  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'bg-green-100 text-green-800';
    if (status >= 400 && status < 500) return 'bg-yellow-100 text-yellow-800';
    if (status >= 500) return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  const formattedJson = formatJson(data);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className={`px-2 py-1 rounded-md font-mono text-sm ${getStatusColor(status)}`}>
            {status} {statusText}
          </span>
          <span className="text-gray-500 text-sm">{time}ms</span>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px">
          {['body', 'headers', 'schema'].map((tab) => (
            <button
              key={tab}
              type="button"
              className={`py-2 px-4 font-medium text-sm border-b-2 focus:outline-none ${
                activeTab === tab
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab(tab as any)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>
      
      {/* Tab Content */}
      <div>
        {activeTab === 'body' && (
          <pre className="bg-gray-50 p-4 rounded-md overflow-auto max-h-96 text-sm font-mono">
            {formattedJson}
          </pre>
        )}
        
        {activeTab === 'headers' && (
          <div className="bg-gray-50 p-4 rounded-md overflow-auto max-h-96">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-4 font-medium text-gray-700">Header</th>
                  <th className="text-left py-2 px-4 font-medium text-gray-700">Value</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(headers).map(([key, value], index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-2 px-4 font-mono">{key}</td>
                    <td className="py-2 px-4 font-mono break-all">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'schema' && (
          <PrimarySchemaPanel />
        )}
      </div>
    </div>
  );
};

export default ResponsePanel;