import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, ChevronDown, ChevronRight, X, Plus } from 'lucide-react';
import { MethodBadge } from './MethodBadge';

interface TestCaseSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (selectedCases: string[]) => void;
  requestName: string;
  requestMethod: string;
  requestEndpoint: string;
}

const testCaseCategories = [
  {
    category: 'Functional',
    count: 15,
    tests: [
      {
        id: 'func-1',
        name: 'Successful Response',
        description:
          'Verify the request returns a successful response (2xx status code)',
        tags: ['basic', 'response'],
      },
      {
        id: 'func-2',
        name: 'Input Validation',
        description: 'Test request with invalid input parameters',
        tags: ['validation', 'error'],
      },
      {
        id: 'func-3',
        name: 'Authentication Required',
        description: 'Verify request fails without proper authentication',
        tags: ['auth', 'security'],
      },
      {
        id: 'func-4',
        name: 'Resource Not Found',
        description: 'Test request with non-existent resource ID',
        tags: ['error', 'validation'],
      },
    ],
  },
  {
    category: 'Performance',
    count: 10,
    tests: [
      {
        id: 'perf-1',
        name: 'Response Time',
        description: 'Measure API response time',
        tags: ['timing', 'performance'],
      },
      {
        id: 'perf-2',
        name: 'Load Testing',
        description: 'Test under high load',
        tags: ['load', 'stress'],
      },
    ],
  },
  {
    category: 'Security',
    tests: [
      {
        id: 'sec-1',
        name: 'Authentication',
        description: 'Test authentication mechanisms',
        tags: ['auth', 'security'],
      },
      {
        id: 'sec-2',
        name: 'Authorization',
        description: 'Verify access controls',
        tags: ['auth', 'permissions'],
      },
    ],
  },
];

export const TestCaseSelectionModal: React.FC<TestCaseSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  requestName,
  requestMethod,
  requestEndpoint,
}) => {
  const [selectedTestCases, setSelectedTestCases] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [expandedCategories, setExpandedCategories] = useState<string[]>([
    'Functional',
  ]);

  const handleTestCaseToggle = (testId: string, checked: boolean) => {
    if (checked) {
      setSelectedTestCases((prev) => [...prev, testId]);
    } else {
      setSelectedTestCases((prev) => prev.filter((id) => id !== testId));
    }
  };

  const handleCategoryToggle = (category: any) => {
    const testIds = category.tests.map((test: any) => test.id);
    const allSelected = testIds.every((id: string) =>
      selectedTestCases.includes(id)
    );

    if (allSelected) {
      setSelectedTestCases((prev) =>
        prev.filter((id) => !testIds.includes(id))
      );
    } else {
      setSelectedTestCases((prev) => {
        const combinedIds = [...prev, ...testIds];
        return Array.from(new Set(combinedIds));
      });
    }
  };

  const toggleCategoryExpansion = (categoryName: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryName)
        ? prev.filter((name) => name !== categoryName)
        : [...prev, categoryName]
    );
  };

  const removeSelectedTest = (testId: string) => {
    setSelectedTestCases((prev) => prev.filter((id) => id !== testId));
  };

  const handleSave = () => {
    onSelect(selectedTestCases);
    setSelectedTestCases([]);
    onClose();
  };

  const handleCancel = () => {
    setSelectedTestCases([]);
    onClose();
  };

  const getTestById = (testId: string) => {
    for (const category of testCaseCategories) {
      const test = category.tests.find((t) => t.id === testId);
      if (test) return { ...test, category: category.category };
    }
    return null;
  };

  const filteredCategories = testCaseCategories.filter((category) => {
    if (
      categoryFilter !== 'All Categories' &&
      category.category !== categoryFilter
    ) {
      return false;
    }
    return true;
  });

  const totalAvailableTests = testCaseCategories.reduce(
    (sum, cat) => sum + cat.tests.length,
    0
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-6xl max-h-[85vh] overflow-hidden flex flex-col p-0'>
        {/* Header */}
        <div className='p-6 border-b'>
          <DialogHeader className='space-y-0'>
            <DialogTitle className='text-xl'>Select Test Cases</DialogTitle>
            <p className='text-sm text-muted-foreground mt-1'>
              Choose test cases for: {requestName}
            </p>
          </DialogHeader>
        </div>

        {/* Search and Filter Bar */}
        <div className='px-6 py-4 border-b bg-muted/20'>
          <div className='flex items-center space-x-4'>
            <div className='relative flex-1'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder='Search test cases by name, description, or tags...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='pl-10'
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className='w-48'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='All Categories'>All Categories</SelectItem>
                {testCaseCategories.map((category) => (
                  <SelectItem key={category.category} value={category.category}>
                    {category.category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Main Content */}
        <div className='flex-1 flex overflow-hidden'>
          {/* Left Panel - Available Tests */}
          <div className='flex-1 overflow-y-auto border-r'>
            <div className='p-4'>
              <div className='flex items-center justify-between mb-4'>
                <h3 className='font-medium'>
                  Available Tests ({totalAvailableTests})
                </h3>
                <span className='text-sm text-muted-foreground'>
                  {selectedTestCases.length} selected
                </span>
              </div>

              <div className='space-y-2'>
                {filteredCategories.map((category) => {
                  const isExpanded = expandedCategories.includes(
                    category.category
                  );
                  const categoryTests = category.tests;
                  const selectedInCategory = categoryTests.filter((test) =>
                    selectedTestCases.includes(test.id)
                  ).length;

                  return (
                    <div key={category.category} className='border rounded-lg'>
                      <div
                        className='flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50'
                        onClick={() =>
                          toggleCategoryExpansion(category.category)
                        }
                      >
                        <div className='flex items-center space-x-3'>
                          {isExpanded ? (
                            <ChevronDown className='h-4 w-4' />
                          ) : (
                            <ChevronRight className='h-4 w-4' />
                          )}
                          <span className='font-medium'>
                            {category.category}
                          </span>
                          <Badge variant='outline'>
                            {category.count || categoryTests.length}
                          </Badge>
                          {selectedInCategory > 0 && (
                            <span className='text-xs text-blue-600 font-medium'>
                              Select All
                            </span>
                          )}
                        </div>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCategoryToggle(category);
                          }}
                          className='text-blue-600 hover:text-blue-700'
                        >
                          Select All
                        </Button>
                      </div>

                      {isExpanded && (
                        <div className='px-3 pb-3 space-y-2'>
                          {categoryTests.map((test) => (
                            <div
                              key={test.id}
                              className='flex items-start space-x-3 p-3 rounded border hover:bg-muted/30'
                            >
                              <Checkbox
                                checked={selectedTestCases.includes(test.id)}
                                onCheckedChange={(checked) =>
                                  handleTestCaseToggle(
                                    test.id,
                                    checked as boolean
                                  )
                                }
                              />
                              <div className='flex-1 min-w-0'>
                                <div className='flex items-center space-x-2'>
                                  <h4 className='font-medium text-sm'>
                                    {test.name}
                                  </h4>
                                  {!selectedTestCases.includes(test.id) && (
                                    <Button
                                      variant='ghost'
                                      size='sm'
                                      onClick={() =>
                                        handleTestCaseToggle(test.id, true)
                                      }
                                      className='h-6 px-2 text-xs'
                                    >
                                      <Plus className='h-3 w-3 mr-1' />
                                      Add
                                    </Button>
                                  )}
                                </div>
                                <p className='text-xs text-muted-foreground mt-1'>
                                  {test.description}
                                </p>
                                <div className='flex space-x-1 mt-2'>
                                  {test.tags?.map((tag) => (
                                    <Badge
                                      key={tag}
                                      variant='secondary'
                                      className='text-xs px-1 py-0'
                                    >
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Panel - Selected Tests */}
          <div className='w-80 bg-muted/20 overflow-y-auto'>
            <div className='p-4'>
              <h3 className='font-medium mb-4'>
                Selected Tests ({selectedTestCases.length})
              </h3>

              {selectedTestCases.length === 0 ? (
                <p className='text-sm text-muted-foreground text-center py-8'>
                  No test cases selected
                </p>
              ) : (
                <div className='space-y-2'>
                  {selectedTestCases.map((testId) => {
                    const testInfo = getTestById(testId);
                    if (!testInfo) return null;

                    return (
                      <div
                        key={testId}
                        className='bg-white rounded-lg p-3 border'
                      >
                        <div className='flex items-start justify-between'>
                          <div className='flex-1 min-w-0'>
                            <h4 className='font-medium text-sm'>
                              {testInfo.name}
                            </h4>
                            <p className='text-xs text-muted-foreground mt-1'>
                              {testInfo.description}
                            </p>
                            <Badge variant='outline' className='mt-2 text-xs'>
                              {testInfo.category}
                            </Badge>
                          </div>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => removeSelectedTest(testId)}
                            className='h-6 w-6 p-0 text-muted-foreground hover:text-destructive ml-2'
                          >
                            <X className='h-3 w-3' />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className='flex items-center justify-between p-6 border-t bg-muted/20'>
          <span className='text-sm text-muted-foreground'>
            {selectedTestCases.length} test cases selected
          </span>
          <div className='flex space-x-3'>
            <Button variant='outline' onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={selectedTestCases.length === 0}
            >
              Save Test Cases
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
