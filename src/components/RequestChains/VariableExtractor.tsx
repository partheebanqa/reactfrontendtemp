'use client';

import { useState } from 'react';
import { Plus, Trash2, Eye, Code, Hash, Type, HelpCircle } from 'lucide-react';
import type {
  DataExtraction,
  APIRequest,
} from '@/shared/types/requestChain.model';
interface VariableExtractorProps {
  request: APIRequest;
  onUpdate: (extractions: DataExtraction[]) => void;
}

export function VariableExtractor({
  request,
  onUpdate,
}: VariableExtractorProps) {
  const [showHelp, setShowHelp] = useState(false);

  const addExtraction = () => {
    const newExtraction: DataExtraction = {
      variableName: '',
      name: '',
      source: 'response_body',
      path: '',
      transform: '',
      value: '',
    };

    const currentExtractions = request.extractVariables || [];
    onUpdate([...currentExtractions, newExtraction]);
  };

  const updateExtraction = (
    index: number,
    updates: Partial<DataExtraction>
  ) => {
    const currentExtractions = request.extractVariables || [];
    const updated = currentExtractions.map((extraction, i) =>
      i === index ? { ...extraction, ...updates } : extraction
    );
    onUpdate(updated);
  };

  const removeExtraction = (index: number) => {
    const currentExtractions = request.extractVariables || [];
    const updated = currentExtractions.filter((_, i) => i !== index);
    onUpdate(updated);
  };

  const getSourceIcon = (source: DataExtraction['source']) => {
    switch (source) {
      case 'response_body':
        return <Code className='w-4 h-4' />;
      case 'response_header':
        return <Hash className='w-4 h-4' />;
      case 'request_header':
        return <Type className='w-4 h-4' />;
      default:
        return <Code className='w-4 h-4' />;
    }
  };

  const pathExamples = {
    response_body: [
      'data.id',
      'user.email',
      'items[0].name',
      'response.token',
      'results.data[0].id',
    ],
    response_header: [
      'authorization',
      'x-api-key',
      'content-type',
      'x-rate-limit-remaining',
    ],
    request_header: ['authorization', 'x-request-id', 'user-agent'],
  };

  const extractVariables = request.extractVariables || [];

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center space-x-2'>
          <h4 className='font-medium text-gray-900'>Variable Extraction</h4>
          <button
            onClick={() => setShowHelp(!showHelp)}
            className='p-1 text-gray-400 hover:text-gray-600 rounded transition-colors'
          >
            <HelpCircle className='w-4 h-4' />
          </button>
        </div>
        <button
          onClick={addExtraction}
          className='flex items-center space-x-2 px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
        >
          <Plus className='w-4 h-4' />
          <span>Add Extraction</span>
        </button>
      </div>

      {showHelp && (
        <div className='p-4 bg-blue-50 border border-blue-200 rounded-lg'>
          <h5 className='font-medium text-blue-900 mb-2'>
            Variable Extraction Guide
          </h5>
          <div className='text-sm text-blue-800 space-y-2'>
            <p>
              <strong>Response Body:</strong> Use JSON path notation (e.g.,
              data.user.id, items[0].name)
            </p>
            <p>
              <strong>Response Header:</strong> Use header name (e.g.,
              authorization, x-api-key)
            </p>
            <p>
              <strong>Request Header:</strong> Extract from outgoing request
              headers
            </p>
            <p>
              <strong>Variables:</strong> Use extracted variables in other
              requests with {`{{variableName}}`}
            </p>
          </div>
        </div>
      )}

      {extractVariables.length > 0 ? (
        <div className='space-y-3'>
          {extractVariables.map((extraction, index) => (
            <div key={index} className='border border-gray-200 rounded-lg p-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Variable Name
                  </label>
                  <input
                    type='text'
                    value={extraction.variableName}
                    onChange={(e) =>
                      updateExtraction(index, { variableName: e.target.value })
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm'
                    placeholder='myVariable'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Extract From
                  </label>
                  <select
                    value={extraction.source}
                    onChange={(e) =>
                      updateExtraction(index, {
                        source: e.target.value as DataExtraction['source'],
                        path: '', // Reset path when source changes
                      })
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm'
                  >
                    <option value='response_body'>Response Body</option>
                    <option value='response_header'>Response Header</option>
                    <option value='request_header'>Request Header</option>
                  </select>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Path/Key
                  </label>
                  <input
                    type='text'
                    value={extraction.path}
                    onChange={(e) =>
                      updateExtraction(index, { path: e.target.value })
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm'
                    placeholder={
                      extraction.source === 'response_body'
                        ? 'data.user.id'
                        : extraction.source === 'response_header'
                        ? 'authorization'
                        : 'x-request-id'
                    }
                  />
                  {/* {extraction.source && (
                    <div className='mt-1'>
                      <p className='text-xs text-gray-500'>Examples:</p>
                      <div className='flex flex-wrap gap-1 mt-1'>
                        {pathExamples[extraction.source]
                          .slice(0, 2)
                          .map((example) => (
                            <button
                              key={example}
                              onClick={() =>
                                updateExtraction(index, { path: example })
                              }
                              className='px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors'
                            >
                              {example}
                            </button>
                          ))}
                      </div>
                    </div>
                  )} */}
                </div>

                <div className='flex items-end'>
                  <button
                    onClick={() => removeExtraction(index)}
                    className='p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors'
                  >
                    <Trash2 className='w-4 h-4' />
                  </button>
                </div>
              </div>

              {/* Transform Function (Advanced) */}
              <div className='mt-4'>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Transform Function (Optional)
                </label>
                <input
                  type='text'
                  value={extraction.transform || ''}
                  onChange={(e) =>
                    updateExtraction(index, { transform: e.target.value })
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono'
                  placeholder="e.g., value.toUpperCase(), parseInt(value), value.split(',')[0]"
                />
                <p className='text-xs text-gray-500 mt-1'>
                  JavaScript expression to transform the extracted value (use
                  'value' as the variable)
                </p>
              </div>

              {/* Preview */}
              <div className='mt-3 p-3 bg-gray-50 rounded-lg'>
                <div className='flex items-center space-x-2 text-sm'>
                  {getSourceIcon(extraction.source)}
                  <span className='text-gray-600'>
                    Extract{' '}
                    <strong>{extraction.variableName || 'variableName'}</strong>{' '}
                    from <strong>{extraction.source.replace('_', ' ')}</strong>
                    {extraction.path && (
                      <>
                        {' '}
                        using path <strong>{extraction.path}</strong>
                      </>
                    )}
                    {extraction.transform && (
                      <>
                        {' '}
                        with transform <strong>{extraction.transform}</strong>
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className='text-center py-8 border-2 border-dashed border-gray-300 rounded-lg'>
          <Eye className='w-12 h-12 text-gray-300 mx-auto mb-3' />
          <p className='text-gray-500 mb-4'>
            No variable extractions configured
          </p>
          <p className='text-sm text-gray-400 mb-4'>
            Extract data from responses to use in subsequent requests
          </p>
          <button
            onClick={addExtraction}
            className='inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
          >
            <Plus className='w-4 h-4' />
            <span>Add First Extraction</span>
          </button>
        </div>
      )}
    </div>
  );
}
