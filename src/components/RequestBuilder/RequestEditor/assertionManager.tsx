import React, { useState, useCallback } from 'react';
import { CheckSquare, Square, Zap, Filter } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/useToast';
import { generateAssertions } from '@/utils/assertionGenerator';
import EditableNumber from '@/components/ui/EditableNumber';
import type { Assertion } from '@/store/requestStore';

interface FormattedResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
  responseTime: number;
  size: number;
}

interface AssertionManagerProps {
  assertions: Assertion[];
  setAssertions: React.Dispatch<React.SetStateAction<Assertion[]>>;
  responseData: any;
  activeRequest: any;
  currentWorkspace: any;
  updateRequestMutation: any;
  toggleAssertion: (id: string) => void;
}

const AssertionManager: React.FC<AssertionManagerProps> = ({
  assertions,
  setAssertions,
  responseData,
  activeRequest,
  currentWorkspace,
  updateRequestMutation,
  toggleAssertion,
}) => {
  const [showAssertionDialog, setShowAssertionDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { toast } = useToast();

  const parseTextWithEditableNumbers = (
    text: string,
    assertionId: string,
    field: 'description' | 'impact'
  ): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    const numberRegex = /\b\d+\b/g;
    let lastIndex = 0;
    let match;

    while ((match = numberRegex.exec(text)) !== null) {
      // Add text before the number
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }

      const numberValue = match[0];
      const numberIndex = match.index;
      const editKey = `${assertionId}-${field}-${numberIndex}`;

      // Add the editable number
      parts.push(
        <EditableNumber
          key={editKey}
          value={numberValue}
          onSave={(newValue) => {
            // Create a safe update function that preserves response data
            const updateAssertions = (prevAssertions: Assertion[]) => {
              if (!Array.isArray(prevAssertions)) {
                console.warn(
                  'Previous assertions is not an array:',
                  prevAssertions
                );
                return prevAssertions;
              }

              return prevAssertions.map((assertion) => {
                if (assertion.id !== assertionId) return assertion;

                const updatedAssertion = { ...assertion };

                // Update the description/impact text
                const regex = new RegExp(`\\b${numberValue}\\b`, 'g');
                if (field === 'description') {
                  updatedAssertion.description = assertion.description.replace(
                    regex,
                    newValue
                  );
                } else if (field === 'impact') {
                  updatedAssertion.impact = assertion.impact.replace(
                    regex,
                    newValue
                  );
                }

                // Update related numeric properties
                const numericValue = Number.parseInt(newValue);
                const originalValue = Number.parseInt(numberValue);

                if (!isNaN(numericValue) && !isNaN(originalValue)) {
                  // Update expectedValue if it matches
                  if (assertion.expectedValue === originalValue) {
                    updatedAssertion.expectedValue = numericValue;
                  }

                  // Update ID if it contains the original value
                  if (assertion.id.includes(numberValue)) {
                    updatedAssertion.id = assertion.id.replace(
                      numberValue,
                      newValue
                    );
                  }

                  // Update other numeric properties that might match
                  if (assertion.minValue === originalValue) {
                    updatedAssertion.minValue = numericValue;
                  }
                  if (assertion.maxValue === originalValue) {
                    updatedAssertion.maxValue = numericValue;
                  }
                }

                return updatedAssertion;
              });
            };

            // Use the update function
            setAssertions(updateAssertions);
          }}
        />
      );

      lastIndex = numberRegex.lastIndex;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts;
  };

  const getSelectedAssertions = (): Assertion[] => {
    if (!assertions || !Array.isArray(assertions)) {
      return [];
    }
    return assertions.filter((a) => a.enabled);
  };

  const formatBackendResponse = (result: any): FormattedResponse => {
    const importantHeaders = [
      'cache-control',
      'content-type',
      'expires',
      'pragma',
    ];
    const filteredHeaders: Record<string, string> = {};

    if (result.headers) {
      Object.entries(result.headers).forEach(([key, value]) => {
        if (importantHeaders.includes(key.toLowerCase())) {
          filteredHeaders[key.toLowerCase()] = value as string;
        }
      });
    }

    let parsedBody: any = result.body;
    if (typeof result.body === 'string') {
      try {
        parsedBody = JSON.parse(result.body);
      } catch {
        parsedBody = result.body;
      }
    }

    return {
      status: result.statusCode,
      statusText: '',
      headers: filteredHeaders,
      data: parsedBody,
      responseTime: result.metrics?.responseTime ?? 0,
      size: result.metrics?.bytesReceived ?? 0,
    };
  };

  const handleGenerateAssertions = () => {
    if (!responseData) {
      toast({
        title: 'No Response',
        description: 'Please send a request first to generate assertions.',
        variant: 'destructive',
      });
      return;
    }

    // Generate assertions if not already available or if we want to refresh them
    const formattedResponse = formatBackendResponse(responseData);
    const generatedAssertions = generateAssertions(formattedResponse);

    // Merge with existing assertions, keeping existing ones enabled
    const existingAssertions = Array.isArray(assertions) ? assertions : [];
    const existingIds = new Set(existingAssertions.map((a) => a.id));

    // Add new generated assertions that don't already exist
    const newAssertions = generatedAssertions.filter(
      (newAssertion) => !existingIds.has(newAssertion.id)
    );

    const mergedAssertions = [...existingAssertions, ...newAssertions];
    setAssertions(mergedAssertions);

    setShowAssertionDialog(true);
  };

  const handleSaveAssertions = async () => {
    try {
      if (!assertions || !Array.isArray(assertions)) {
        console.error('[v0] Assertions is not an array:', assertions);
        return;
      }

      if (!activeRequest?.id) {
        toast({
          title: 'Error',
          description: 'Cannot update a request without an id.',
          variant: 'destructive',
        });
        return;
      }

      const selectedAssertions = assertions
        .filter((assertion) => assertion.enabled)
        .map((assertion) => ({
          ...assertion,
          requestId: activeRequest.id,
          expectedValue:
            assertion.expectedValue !== undefined &&
            assertion.expectedValue !== null
              ? typeof assertion.expectedValue === 'string'
                ? assertion.expectedValue
                : JSON.stringify(assertion.expectedValue)
              : '',
        }));

      const requestData = {
        assertions: selectedAssertions,
        workspaceId: currentWorkspace?.id,
      };

      await updateRequestMutation.mutateAsync({
        requestId: activeRequest.id,
        requestData,
      });

      toast({
        title: 'Success',
        description: 'Assertions saved successfully',
      });
      setShowAssertionDialog(false);
    } catch (error) {
      console.error('[v0] Error saving assertions:', error);
      toast({
        title: 'Error',
        description: 'Failed to save assertions',
        variant: 'destructive',
      });
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case 'critical':
        return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  // Get unique categories from assertions - with proper array check
  const getCategories = (): string[] => {
    if (!assertions || !Array.isArray(assertions) || assertions.length === 0)
      return [];
    const categories = [
      ...new Set(assertions.map((assertion) => assertion.category)),
    ];
    return categories.sort();
  };

  // Get category display name with proper capitalization
  const getCategoryDisplayName = (category: string): string => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  // Get assertion type badge color
  const getAssertionTypeColor = (category: string): string => {
    const colors: Record<string, string> = {
      status:
        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      headers: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      body: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      response:
        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      performance:
        'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    };
    return (
      colors[category] ||
      'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    );
  };

  const getFilteredAssertions = (): Assertion[] => {
    if (!assertions || !Array.isArray(assertions)) {
      return [];
    }
    if (selectedCategory === 'all') return assertions;
    return assertions.filter(
      (assertion) => assertion.category === selectedCategory
    );
  };

  return (
    <div className='space-y-4'>
      <div className='flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between'>
        <div>
          <h3 className='text-base sm:text-lg font-medium text-gray-900 dark:text-white'>
            Manage Assertions
          </h3>
          <p className='text-sm text-gray-500 dark:text-gray-400 mt-1'>
            Send a request and click "Generate Assertions" to automatically
            create and manage test assertions.
          </p>
        </div>
        <Button onClick={handleGenerateAssertions}>
          <Zap className='h-3 w-3 mr-1' />
          Generate Assertions
        </Button>
      </div>

      {/* Show selected assertions with full details */}
      {getSelectedAssertions().length > 0 ? (
        <div className='space-y-4'>
          <div className='border-b border-gray-200 dark:border-gray-600 pb-3'>
            <h4 className='text-md font-semibold text-gray-900 dark:text-white'>
              Selected Assertions ({getSelectedAssertions().length})
            </h4>
            <p className='text-sm text-gray-500 dark:text-gray-400 mt-1'>
              These assertions will be included when the request is saved
            </p>
          </div>

          <div className='space-y-3'>
            {getSelectedAssertions().map((assertion) => (
              <div
                key={assertion.id}
                className='border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20 rounded-lg p-4 hover:shadow-sm transition-all duration-200'
              >
                <div className='flex items-start space-x-3'>
                  {/* Enabled indicator */}
                  <div className='flex-shrink-0 mt-0.5'>
                    <CheckSquare className='h-5 w-5 text-blue-600 dark:text-blue-400' />
                  </div>

                  {/* Content */}
                  <div className='flex-1 min-w-0'>
                    {/* Top row: Description + Category + Priority */}
                    <div className='flex items-center justify-between gap-2 mb-2'>
                      <p className='text-sm font-medium text-gray-900 dark:text-white'>
                        {parseTextWithEditableNumbers(
                          assertion.description,
                          assertion.id,
                          'description'
                        )}
                        {assertion.operator && (
                          <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'>
                            Operator: {assertion.operator}
                          </span>
                        )}
                      </p>

                      <div className='flex items-center gap-2'>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getAssertionTypeColor(
                            assertion.category
                          )}`}
                        >
                          {getCategoryDisplayName(assertion.category)}
                        </span>

                        {assertion?.priority && (
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                              assertion.priority
                            )}`}
                          >
                            {assertion.priority}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Impact */}
                    {assertion?.impact && (
                      <div className='text-xs text-gray-500 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-800 rounded px-2 py-1 italic'>
                        Impact:{' '}
                        {parseTextWithEditableNumbers(
                          assertion.impact,
                          assertion.id,
                          'impact'
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : Array.isArray(assertions) && assertions.length > 0 ? (
        <div className='text-center p-6 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg'>
          <p className='text-gray-500 dark:text-gray-400'>
            You have {assertions.length} assertions available. Click "Generate
            Assertions" to select which ones to include.
          </p>
        </div>
      ) : (
        <div className='flex flex-col items-center justify-center h-48 text-center border border-dashed border-gray-300 dark:border-gray-700 rounded-lg'>
          <div className='text-gray-400 mb-4'>
            <CheckSquare className='h-12 w-12 mx-auto' />
          </div>
          <h4 className='text-lg font-medium text-gray-900 dark:text-white mb-2'>
            No Assertions Available
          </h4>
          <p className='text-gray-500 dark:text-gray-400 max-w-md'>
            Send a request first to generate test assertions based on the
            response.
          </p>
        </div>
      )}

      {/* Assertion Generation Dialog */}
      <Dialog open={showAssertionDialog} onOpenChange={setShowAssertionDialog}>
        <DialogContent className='max-w-4xl max-h-[80vh] overflow-hidden flex flex-col'>
          <DialogHeader className='flex-shrink-0'>
            <DialogTitle>Select Assertions to Include</DialogTitle>
          </DialogHeader>

          <div className='flex-shrink-0 border-b border-gray-200 dark:border-gray-700 pb-4 space-y-4'>
            {/* Category Filter only */}
            <div className='flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-end'>
              <div className='flex items-center space-x-2'>
                <Filter className='h-4 w-4 text-gray-500' />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className='border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1.5 text-sm 
             bg-white dark:bg-gray-800 hover:border-blue-400 
             focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
             focus:outline-none transition-all duration-150'
                >
                  <option value='all'>
                    All Categories (
                    {Array.isArray(assertions) ? assertions.length : 0})
                  </option>
                  {getCategories().map((category) => {
                    const count =
                      assertions && Array.isArray(assertions)
                        ? assertions.filter((a) => a.category === category)
                            .length
                        : 0;
                    return (
                      <option key={category} value={category}>
                        {getCategoryDisplayName(category)} ({count})
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          </div>

          <div className='flex-1 overflow-y-auto'>
            {assertions &&
            Array.isArray(assertions) &&
            assertions.length > 0 ? (
              <div className='space-y-3 p-1'>
                {getFilteredAssertions().map((assertion) => (
                  <div
                    key={assertion.id}
                    className={`border rounded-lg p-4 transition-all duration-200 ${
                      assertion.enabled
                        ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
                        : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/20'
                    } hover:shadow-sm`}
                  >
                    <div className='flex items-start space-x-3'>
                      {/* Checkbox */}
                      <button
                        onClick={() => toggleAssertion(assertion.id)}
                        className='flex-shrink-0 mt-0.5 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors'
                        title={
                          assertion.enabled
                            ? 'Unselect assertion'
                            : 'Select assertion'
                        }
                      >
                        {assertion.enabled ? (
                          <CheckSquare className='h-5 w-5 text-blue-600 dark:text-blue-400' />
                        ) : (
                          <Square className='h-5 w-5 text-gray-400' />
                        )}
                      </button>

                      {/* Content */}
                      <div className='flex-1 min-w-0'>
                        {/* Top row: Description + Category + Priority */}
                        <div className='flex items-center justify-between gap-2'>
                          <p
                            className={`text-sm font-medium truncate ${
                              assertion.enabled
                                ? 'text-gray-900 dark:text-white'
                                : 'text-gray-600 dark:text-gray-400'
                            }`}
                            title={assertion.description}
                          >
                            {parseTextWithEditableNumbers(
                              assertion.description,
                              assertion.id,
                              'description'
                            )}

                            <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'>
                              Operator: {assertion.operator}
                            </span>
                          </p>

                          <div className='flex items-center gap-2'>
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getAssertionTypeColor(
                                assertion.category
                              )}`}
                            >
                              {getCategoryDisplayName(assertion.category)}
                            </span>

                            {assertion?.priority && (
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                                  assertion.priority
                                )}`}
                              >
                                {assertion.priority}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Impact */}
                        {assertion?.impact && (
                          <div className='mt-2 text-xs text-gray-500 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-800 rounded px-2 py-1 italic'>
                            Impact:{' '}
                            {parseTextWithEditableNumbers(
                              assertion.impact,
                              assertion.id,
                              'impact'
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className='flex flex-col items-center justify-center h-48 text-center'>
                <div className='text-gray-400 mb-4'>
                  <CheckSquare className='h-12 w-12 mx-auto' />
                </div>
                <h4 className='text-lg font-medium text-gray-900 dark:text-white mb-2'>
                  No Response Data Available
                </h4>
                <p className='text-gray-500 dark:text-gray-400 max-w-md'>
                  Send a request first to generate assertions based on the
                  response data.
                </p>
              </div>
            )}
          </div>

          <DialogFooter className='flex-shrink-0'>
            <div className='w-full flex items-center justify-between'>
              {/* Left side: count */}
              <span className='text-sm text-gray-600 dark:text-gray-400'>
                {Array.isArray(assertions)
                  ? assertions.filter((a) => a.enabled).length
                  : 0}{' '}
                of {Array.isArray(assertions) ? assertions.length : 0}{' '}
                assertions selected
              </span>

              {/* Right side: buttons*/}
              <div className='flex space-x-3'>
                <button
                  onClick={() => setShowAssertionDialog(false)}
                  className='px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md'
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAssertions}
                  className='px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md'
                >
                  Save Assertions
                </button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AssertionManager;
