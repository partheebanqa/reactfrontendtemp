import React, { useState, useCallback, useEffect } from 'react';
import {
  CheckSquare,
  Square,
  Zap,
  Filter,
  Settings,
  Search,
} from 'lucide-react';
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
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [uiAssertions, setUiAssertions] = useState<Assertion[]>([]);
  const { toast } = useToast();

  // Sync UI assertions with main assertions when they change
  useEffect(() => {
    if (assertions && Array.isArray(assertions)) {
      setUiAssertions([...assertions]);
    }
  }, [assertions]);

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
            const updateUiAssertions = (prevAssertions: Assertion[]) => {
              if (!Array.isArray(prevAssertions)) {
                console.warn(
                  'Previous UI assertions is not an array:',
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
                  // Update expectedValue if it matches (handle both string and number types)
                  if (assertion.expectedValue == originalValue) {
                    updatedAssertion.expectedValue =
                      typeof assertion.expectedValue === 'string'
                        ? newValue
                        : numericValue;
                  }

                  // Update ID if it contains the original value
                  if (assertion.id.includes(numberValue)) {
                    updatedAssertion.id = assertion.id.replace(
                      new RegExp(`\\b${numberValue}\\b`, 'g'),
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

                  // Update any other string fields that might contain the number
                  ['field', 'operator', 'group', 'priority'].forEach(
                    (fieldName) => {
                      const fieldValue =
                        updatedAssertion[
                          fieldName as keyof typeof updatedAssertion
                        ];
                      if (
                        typeof fieldValue === 'string' &&
                        fieldValue.includes(numberValue)
                      ) {
                        const regex = new RegExp(`\\b${numberValue}\\b`, 'g');
                        (updatedAssertion as any)[fieldName] =
                          fieldValue.replace(regex, newValue);
                      }
                    }
                  );
                }

                return updatedAssertion;
              });
            };

            // Update UI state
            setUiAssertions(updateUiAssertions);

            // Also update main assertions state
            setAssertions(updateUiAssertions);
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
    if (!uiAssertions || !Array.isArray(uiAssertions)) {
      return [];
    }
    return uiAssertions.filter((a) => a.enabled);
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

  const handleGenerateNewAssertions = () => {
    if (!responseData) {
      toast({
        title: 'No Response',
        description: 'Please send a request first to generate new assertions.',
        variant: 'destructive',
      });
      return;
    }

    // Generate new assertions only when we have response data
    const formattedResponse = formatBackendResponse(responseData);
    const generatedAssertions = generateAssertions(formattedResponse);

    // Merge with existing UI assertions, keeping existing ones enabled
    const existingAssertions = Array.isArray(uiAssertions) ? uiAssertions : [];
    const existingIds = new Set(existingAssertions.map((a) => a.id));

    // Add new generated assertions that don't already exist
    const newAssertions = generatedAssertions.filter(
      (newAssertion) => !existingIds.has(newAssertion.id)
    );

    const mergedAssertions = [...existingAssertions, ...newAssertions];
    setUiAssertions(mergedAssertions);
    setAssertions(mergedAssertions);

    setShowAssertionDialog(true);
  };

  const handleManageExistingAssertions = () => {
    // Just open the dialog to manage existing assertions - no response data needed
    setShowAssertionDialog(true);
  };

  const handleToggleAssertion = (id: string) => {
    const updateToggle = (prevAssertions: Assertion[]) => {
      if (!Array.isArray(prevAssertions)) return prevAssertions;

      return prevAssertions.map((assertion) =>
        assertion.id === id
          ? { ...assertion, enabled: !assertion.enabled }
          : assertion
      );
    };

    // Update both UI state and main state
    setUiAssertions(updateToggle);
    setAssertions(updateToggle);
  };

  const handleSaveAssertions = async () => {
    try {
      if (!uiAssertions || !Array.isArray(uiAssertions)) {
        console.error(
          '[AssertionManager] UI Assertions is not an array:',
          uiAssertions
        );
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

      console.log('activeRequest123:', activeRequest);

      const selectedAssertions = uiAssertions
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
        collectionId: activeRequest?.collectionId || null,
        folderId: activeRequest?.folderId || null,
      };

      await updateRequestMutation.mutateAsync({
        requestId: activeRequest.id,
        requestData,
      });

      // Update main assertions state with UI changes
      setAssertions([...uiAssertions]);

      toast({
        title: 'Success',
        description: 'Assertions saved successfully',
      });
      setShowAssertionDialog(false);
    } catch (error) {
      console.error('[AssertionManager] Error saving assertions:', error);
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

  // Get unique categories from UI assertions - with proper array check
  const getCategories = (): string[] => {
    if (
      !uiAssertions ||
      !Array.isArray(uiAssertions) ||
      uiAssertions.length === 0
    )
      return [];
    const categories = [
      ...new Set(uiAssertions.map((assertion) => assertion.category)),
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
    if (!uiAssertions || !Array.isArray(uiAssertions)) {
      return [];
    }

    let filteredAssertions = uiAssertions;

    // Filter by category
    if (selectedCategory !== 'all') {
      filteredAssertions = filteredAssertions.filter(
        (assertion) => assertion.category === selectedCategory
      );
    }

    // Filter by search term (search in both category and description)
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filteredAssertions = filteredAssertions.filter(
        (assertion) =>
          assertion.description.toLowerCase().includes(searchLower) ||
          assertion.category.toLowerCase().includes(searchLower)
      );
    }

    return filteredAssertions;
  };

  const hasExistingAssertions =
    Array.isArray(uiAssertions) && uiAssertions.length > 0;

  // Clear search when dialog closes
  const handleDialogOpenChange = (open: boolean) => {
    setShowAssertionDialog(open);
    if (!open) {
      setSearchTerm('');
      setSelectedCategory('all');
    }
  };

  return (
    <div className='space-y-4'>
      <div className='flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between'>
        <div>
          <h3 className='text-base sm:text-lg font-medium text-gray-900 dark:text-white'>
            Manage Assertions
          </h3>
          <p className='text-sm text-gray-500 dark:text-gray-400 mt-1'>
            Generate new assertions from response data or manage existing ones.
          </p>
        </div>
        <div className='flex gap-2'>
          {hasExistingAssertions && (
            <Button variant='outline' onClick={handleManageExistingAssertions}>
              <Settings className='h-3 w-3 mr-1' />
              Manage Existing
            </Button>
          )}
          <Button onClick={handleGenerateNewAssertions}>
            <Zap className='h-3 w-3 mr-1' />
            Generate New
          </Button>
        </div>
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
                        {assertion?.operator && (
                          <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 ml-2'>
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
      ) : hasExistingAssertions ? (
        <div className='text-center p-6 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg'>
          <p className='text-gray-500 dark:text-gray-400'>
            You have {uiAssertions.length} assertions available. Click "Manage
            Existing" to select which ones to include.
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

      {/* Assertion Management Dialog */}
      <Dialog open={showAssertionDialog} onOpenChange={handleDialogOpenChange}>
        <DialogContent className='max-w-4xl max-h-[80vh] overflow-hidden flex flex-col'>
          <DialogHeader className='flex-shrink-0'>
            <DialogTitle>Select Assertions to Include</DialogTitle>
          </DialogHeader>

          <div className='flex-shrink-0 border-b border-gray-200 dark:border-gray-700 pb-4 space-y-4'>
            {/* Search and Filter Row */}
            <div className='flex items-center justify-between gap-3'>
              {/* Search Input */}
              <div className='relative w-[320px]'>
                <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                  <Search className='h-4 w-4 text-gray-400' />
                </div>
                <input
                  type='text'
                  placeholder='Search assertions...'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className='block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
        bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
        placeholder-gray-500 dark:placeholder-gray-400
        hover:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500
        focus:outline-none transition-all duration-150'
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className='absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600'
                    title='Clear search'
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Category Filter */}
              <div className='flex items-center space-x-2'>
                <Filter className='h-4 w-4 text-gray-500' />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className='border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm
        bg-white dark:bg-gray-800 hover:border-blue-400
        focus:ring-2 focus:ring-blue-500 focus:border-blue-500
        focus:outline-none transition-all duration-150 min-w-[180px]'
                >
                  <option value='all'>
                    All Categories (
                    {Array.isArray(uiAssertions) ? uiAssertions.length : 0})
                  </option>
                  {getCategories().map((category) => {
                    const count =
                      uiAssertions && Array.isArray(uiAssertions)
                        ? uiAssertions.filter((a) => a.category === category)
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
            {hasExistingAssertions ? (
              <div className='space-y-3 p-1'>
                {getFilteredAssertions().length > 0 ? (
                  getFilteredAssertions().map((assertion) => (
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
                          onClick={() => handleToggleAssertion(assertion.id)}
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
                              {assertion.operator && (
                                <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 ml-2'>
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
                  ))
                ) : (
                  <div className='flex flex-col items-center justify-center h-32 text-center'>
                    <Search className='h-8 w-8 text-gray-400 mb-2' />
                    <p className='text-gray-500 dark:text-gray-400'>
                      No assertions found matching your search criteria.
                    </p>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedCategory('all');
                      }}
                      className='mt-2'
                    >
                      Clear filters
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className='flex flex-col items-center justify-center h-48 text-center'>
                <div className='text-gray-400 mb-4'>
                  <CheckSquare className='h-12 w-12 mx-auto' />
                </div>
                <h4 className='text-lg font-medium text-gray-900 dark:text-white mb-2'>
                  No Assertions Available
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
                {Array.isArray(uiAssertions)
                  ? uiAssertions.filter((a) => a.enabled).length
                  : 0}{' '}
                of {Array.isArray(uiAssertions) ? uiAssertions.length : 0}{' '}
                assertions selected
              </span>

              {/* Right side: buttons */}
              <div className='flex space-x-3'>
                <Button
                  variant='outline'
                  onClick={() => setShowAssertionDialog(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveAssertions}>Save Assertions</Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AssertionManager;
