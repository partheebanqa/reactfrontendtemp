'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
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
  onVariableSelect,
  onSaveAssertions,
}: PrePostRequestProps) {
  const [postResponseScript, setPostResponseScript] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'assertions' | 'extracted'>(
    'assertions'
  );
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
        <div className='px-2'>
          {selectedVariables.length > 0 && (
            <div className='mb-6'>
              <div className='rounded-xl border border-gray-300 dark:border-gray-700 shadow-sm overflow-hidden bg-white dark:bg-gray-900'>
                <table className='w-full text-sm'>
                  <tbody>
                    <tr className='border-b border-gray-200 dark:border-gray-700'>
                      <td className='px-4 py-3 font-semibold text-gray-900 dark:text-gray-200 w-56 bg-gray-50 dark:bg-gray-800'>
                        Substituted variable
                      </td>
                      <td className='px-4 py-3 text-gray-800 dark:text-gray-300'>
                        <div className='flex flex-wrap gap-2'>
                          {selectedVariables.map((v, i) => (
                            <div
                              key={i}
                              className='inline-flex items-center gap-2 px-2 py-1 text-xs font-medium bg-green-500 text-white rounded-lg shadow-sm group'
                            >
                              <span>
                                {v.path}: {v.name}
                              </span>

                              <button
                                onClick={() => setDeleteTargetPath(v.path)}
                                className='transition-opacity p-0.5 rounded'
                                title='Remove variable'
                              >
                                <Trash2 className='w-3 h-3 text-red-600' />
                              </button>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>

                    <tr>
                      <td className='px-4 py-3 font-semibold text-gray-900 dark:text-gray-200 w-56 bg-gray-50 dark:bg-gray-800'>
                        Extracted variable
                      </td>
                      <td className='px-4 py-3 text-gray-800 dark:text-gray-300'>
                        -
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {selectedVariables.length === 0 && (
            <div className='text-sm text-gray-500 dark:text-gray-400 italic'>
              No variables substituted yet. Substitute variables in the Body tab
              to see them here.
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
            </button>
          </div>

          {activeSubTab === 'assertions' && (
            <>
              {showAssertions && (
                <div className='p-4'>
                  <p className='text-sm text-gray-500'>
                    Assertions component would go here
                  </p>
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
            <div className='mb-6 py-3'>
              <div className='rounded-xl border border-gray-300 dark:border-gray-700 shadow-sm overflow-hidden bg-white dark:bg-gray-900'>
                <table className='w-full text-sm'>
                  <tbody>
                    <tr>
                      <td className='px-4 py-3 font-semibold text-gray-900 dark:text-gray-200 w-56 bg-gray-50 dark:bg-gray-800'>
                        Extracted variable
                      </td>
                      <td className='px-4 py-3 text-gray-800 dark:text-gray-300'>
                        <div className='flex flex-wrap gap-2'>-</div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
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
