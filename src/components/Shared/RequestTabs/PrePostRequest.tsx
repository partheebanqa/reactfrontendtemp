'use client';

import { useState } from 'react';
import AssertionManager from '@/components/RequestBuilder/RequestEditor/assertionManager';

interface PrePostRequestProps {
  assertions?: any[];
  setAssertions?: (assertions: any[]) => void;
  responseData?: any;
  activeRequest?: any;
  currentWorkspace?: any;
  updateRequestMutation?: any;
  toggleAssertion?: (index: number) => void;
  showAssertions?: boolean;
}

export function PrePostRequest({
  assertions = [],
  setAssertions,
  responseData,
  activeRequest,
  currentWorkspace,
  updateRequestMutation,
  toggleAssertion,
  showAssertions = true,
}: PrePostRequestProps) {
  const [scriptsTab, setScriptsTab] = useState<'pre-request' | 'post-response'>(
    'pre-request'
  );
  const [preRequestScript, setPreRequestScript] = useState('');
  const [postResponseScript, setPostResponseScript] = useState('');

  return (
    <div className='flex h-full'>
      {/* Left sidebar with Pre-request and Post-response */}
      <div className='w-40 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900'>
        <button
          onClick={() => setScriptsTab('pre-request')}
          className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors ${
            scriptsTab === 'pre-request'
              ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border-l-2 border-blue-500'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Pre-request
        </button>
        <button
          onClick={() => setScriptsTab('post-response')}
          className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors ${
            scriptsTab === 'post-response'
              ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border-l-2 border-blue-500'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Post-response
        </button>
      </div>

      {/* Right content area */}
      <div className='flex-1 overflow-auto'>
        {scriptsTab === 'pre-request' && (
          <div className='p-4'>
            <h3 className='text-lg font-semibold mb-4 text-gray-900 dark:text-white'>
              Pre-request data
            </h3>
            {/* <textarea
              //   placeholder='Use JavaScript to configure this request dynamically. Ctrl+/'
              value={preRequestScript}
              onChange={(e) => setPreRequestScript(e.target.value)}
              className='w-full h-96 p-3 font-mono text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            /> */}
          </div>
        )}

        {scriptsTab === 'post-response' && (
          <div>
            {showAssertions && (
              <AssertionManager
                assertions={assertions}
                setAssertions={setAssertions}
                responseData={responseData}
                activeRequest={activeRequest}
                currentWorkspace={currentWorkspace}
                updateRequestMutation={updateRequestMutation}
                toggleAssertion={toggleAssertion}
              />
            )}

            {!showAssertions && (
              <div className='p-4'>
                <h3 className='text-lg font-semibold mb-4 text-gray-900 dark:text-white'>
                  Post-response Script
                </h3>
                <textarea
                  placeholder='Use JavaScript to process the response dynamically. Ctrl+/'
                  value={postResponseScript}
                  onChange={(e) => setPostResponseScript(e.target.value)}
                  className='w-full h-96 p-3 font-mono text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                />
                <p className='text-xs text-gray-500 dark:text-gray-400 mt-2'>
                  Scripts run after the response is received. Use it to parse
                  data, validate responses, or set variables.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
