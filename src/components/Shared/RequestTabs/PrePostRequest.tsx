'use client';

import { useState } from 'react';
import { Trash2, Plus, Copy, Shuffle } from 'lucide-react';
import AssertionManager from '@/components/RequestBuilder/RequestEditor/assertionManager';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

interface SelectedVariable {
  name: string;
  path: string;
}

interface PrePostRequestProps {
  type: 'pre-request' | 'post-response';
  assertions?: any[];
  setAssertions?: (assertions: any[]) => void;
  responseData?: any;
  activeRequest?: any;
  currentWorkspace?: any;
  updateRequestMutation?: any;
  toggleAssertion?: (index: number) => void;
  showAssertions?: boolean;
  selectedVariables?: SelectedVariable[];
  onRemoveVariable?: (path: string) => void;
  onVariableSelect?: (variables: SelectedVariable[]) => void;
  onSaveAssertions?: () => Promise<void>;
  staticVariables?: { name: string; value: string }[];
  dynamicVariables?: { name: string; value: string }[];
  extractedVariables?: Record<string, any>;
}

export function PrePostRequest({
  type = 'pre-request',
  assertions = [],
  setAssertions,
  responseData,
  activeRequest,
  currentWorkspace,
  updateRequestMutation,
  toggleAssertion,
  showAssertions = true,
  selectedVariables = [],
  onRemoveVariable,
  onSaveAssertions,
  staticVariables = [],
  dynamicVariables = [],
  extractedVariables = [],
}: PrePostRequestProps) {
  const [postResponseScript, setPostResponseScript] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'assertions' | 'extracted'>(
    'assertions'
  );
  const enabledCount = assertions.filter((a) => a.enabled === true).length;

  const [deleteTargetPath, setDeleteTargetPath] = useState<string | null>(null);

  const handleDeleteVariable = (path: string) => {
    if (onRemoveVariable) {
      onRemoveVariable(path);
    }
    setDeleteTargetPath(null);
  };

  return (
    <div className='w-full h-full'>
      {type === 'pre-request' && (
        <div className='px-2 space-y-6'>
          {selectedVariables.length > 0 && (
            <div>
              <h4 className='text-sm font-semibold text-gray-900 dark:text-gray-200 mb-3'>
                Substituted Variables
              </h4>
              <div className='rounded-xl border border-gray-300 dark:border-gray-700 shadow-sm overflow-hidden bg-white dark:bg-gray-900'>
                <table className='w-full text-sm'>
                  <tbody>
                    <tr className='border-b border-gray-200 dark:border-gray-700'>
                      <td className='px-4 py-3 font-semibold text-gray-900 dark:text-gray-200 w-48 bg-gray-50 dark:bg-gray-800'>
                        Variable Path
                      </td>
                      <td className='px-4 py-3 text-gray-800 dark:text-gray-300'>
                        <div className='flex flex-wrap gap-2'>
                          {selectedVariables.map((v, i) => (
                            <div
                              key={i}
                              className='inline-flex items-center gap-2 px-2 py-1 text-xs font-medium text-white rounded-lg shadow-sm group'
                              style={{
                                backgroundColor:
                                  'rgb(19 111 176 / var(--tw-bg-opacity))',
                              }}
                            >
                              <span>
                                {v.path}: {v.name}
                              </span>
                              <button
                                onClick={() => setDeleteTargetPath(v.path)}
                                className='transition-colors p-0.5 rounded group-hover:text-red-500 text-white'
                                title='Remove variable'
                              >
                                <Trash2 className='w-3 h-3' />
                              </button>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {(staticVariables.length > 0 || dynamicVariables.length > 0) && (
            <div>
              <h4 className='text-sm font-semibold text-gray-900 dark:text-gray-200 mb-3'>
                Variables Used in Request
              </h4>
              <div className='rounded-xl border border-gray-300 dark:border-gray-700 shadow-sm overflow-hidden bg-white dark:bg-gray-900'>
                <table className='w-full text-sm'>
                  <tbody>
                    {dynamicVariables.length > 0 && (
                      <tr className='border-b border-gray-200 dark:border-gray-700'>
                        <td className='px-4 py-3 font-semibold text-gray-900 dark:text-gray-200 w-48 bg-gray-50 dark:bg-gray-800 align-top'>
                          Dynamic Variables
                        </td>
                        <td className='px-4 py-3 text-gray-800 dark:text-gray-300'>
                          <div className='flex flex-wrap gap-2'>
                            {dynamicVariables.map((variable, i) => (
                              <div
                                key={i}
                                className='inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-lg border border-purple-300 dark:border-purple-700 group hover:bg-purple-200 dark:hover:bg-purple-800/40 transition-colors'
                              >
                                <code className='text-xs font-mono font-medium'>
                                  {`{{${variable.name}}}`}
                                </code>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}

                    {staticVariables.length > 0 && (
                      <tr>
                        <td className='px-4 py-3 font-semibold text-gray-900 dark:text-gray-200 w-48 bg-gray-50 dark:bg-gray-800 align-top'>
                          Static Variables
                        </td>
                        <td className='px-4 py-3 text-gray-800 dark:text-gray-300'>
                          <div className='flex flex-wrap gap-2'>
                            {staticVariables.map((variable, i) => (
                              <div
                                key={i}
                                className='inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-lg border border-blue-300 dark:border-blue-700 group hover:bg-blue-200 dark:hover:bg-blue-800/40 transition-colors'
                              >
                                <code className='text-xs font-mono font-medium'>
                                  {`{{${variable.name}}}`}
                                </code>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {selectedVariables.length === 0 &&
            staticVariables.length === 0 &&
            dynamicVariables.length === 0 && (
              <div className='text-center py-8'>
                <div className='text-sm text-gray-500 dark:text-gray-400 italic'>
                  No variables used in this request yet. Add variables to your
                  request URL, headers, body, or parameters to see them here.
                </div>
              </div>
            )}
        </div>
      )}

      {type === 'post-response' && (
        <div>
          <div className='border-b border-gray-200 mb-4 flex space-x-8 px-4'>
            <button
              onClick={() => setActiveSubTab('assertions')}
              className={`pb-2 text-sm font-medium ${
                activeSubTab === 'assertions'
                  ? 'border-b-2 border-blue-600 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Assertions
              <span className='ml-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full px-2 py-0.5 text-xs'>
                {enabledCount}
              </span>
            </button>

            <button
              onClick={() => setActiveSubTab('extracted')}
              className={`pb-2 text-sm font-medium ${
                activeSubTab === 'extracted'
                  ? 'border-b-2 border-blue-600 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Extracted Variables
              {extractedVariables &&
                typeof extractedVariables === 'object' &&
                Object.keys(extractedVariables).length > 0 && (
                  <span className='ml-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full px-2 py-0.5 text-xs'>
                    {Object.keys(extractedVariables).length}
                  </span>
                )}
            </button>
          </div>

          {activeSubTab === 'assertions' && (
            <>
              {showAssertions && (
                <div>
                  <AssertionManager
                    assertions={assertions}
                    setAssertions={setAssertions}
                    responseData={responseData}
                    activeRequest={activeRequest}
                    currentWorkspace={currentWorkspace}
                    updateRequestMutation={updateRequestMutation}
                    toggleAssertion={toggleAssertion}
                    onSaveAssertions={onSaveAssertions}
                  />
                </div>
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
            </>
          )}

          {activeSubTab === 'extracted' && (
            <div className='mb-6 py-3 px-4'>
              <div className='rounded-xl border border-gray-300 dark:border-gray-700 shadow-sm overflow-hidden bg-white dark:bg-gray-900'>
                <table className='w-full text-sm'>
                  <tbody>
                    {extractedVariables &&
                    typeof extractedVariables === 'object' &&
                    Object.keys(extractedVariables).length > 0 ? (
                      <tr>
                        <td className='px-2 py-3 font-semibold text-gray-900 dark:text-gray-200 w-40 bg-gray-50 dark:bg-gray-800 align-top'>
                          Extracted Variables
                        </td>
                        <td className='px-4 py-3 text-gray-800 dark:text-gray-300'>
                          <div className='flex flex-wrap gap-2'>
                            {Object.entries(extractedVariables).map(
                              ([name, value], i) => (
                                <div
                                  key={i}
                                  className='inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-lg border border-blue-300 dark:border-blue-700 group hover:bg-blue-200 dark:hover:bg-blue-800/40 transition-colors'
                                  title={`Value: ${String(value)}`}
                                >
                                  <code className='text-xs font-mono font-medium'>
                                    {`{{${name}}}`}
                                  </code>
                                </div>
                              )
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <tr>
                        <td className='px-4 py-3 font-semibold text-gray-900 dark:text-gray-200 w-48 bg-gray-50 dark:bg-gray-800'>
                          Extracted Variables
                        </td>
                        <td className='px-4 py-3 text-gray-800 dark:text-gray-300'>
                          <div className='flex flex-wrap gap-2'>
                            <span className='text-sm text-gray-500 dark:text-gray-400 italic'>
                              No variables extracted yet. Variables will appear
                              here after running the request with extraction
                              rules.
                            </span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {extractedVariables &&
                typeof extractedVariables === 'object' &&
                Object.keys(extractedVariables).length > 0 && (
                  <div className='mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800'>
                    <h5 className='text-sm font-medium text-blue-800 dark:text-blue-200 mb-2'>
                      Using Extracted Variables
                    </h5>
                    <p className='text-xs text-blue-700 dark:text-blue-300'>
                      These variables have been extracted from the response and
                      can be used in subsequent requests. Reference them using
                      the syntax{' '}
                      <code className='px-1 py-0.5 bg-blue-100 dark:bg-blue-900/50 rounded'>{`{{variable_name}}`}</code>{' '}
                      in your request URL, headers, body, or parameters.
                    </p>
                  </div>
                )}
            </div>
          )}
        </div>
      )}

      <AlertDialog
        open={deleteTargetPath !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTargetPath(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove substituted variable?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the variable mapping for "{deleteTargetPath}".
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              onClick={() =>
                deleteTargetPath && handleDeleteVariable(deleteTargetPath)
              }
            >
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
