import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import {
  Search,
  ChevronDown,
  ChevronRight,
  X,
  Plus,
  Loader,
  ChevronUp,
} from 'lucide-react';
import {
  getTestCasesByRequestId,
  saveTestCasesForRequest,
} from '@/services/testcase.service';
import { useToast } from '@/hooks/use-toast';
import { ApiTestCase } from '@/shared/types/testcase.model';
// import ReactJson from 'react18-json-view';
import JsonView from 'react18-json-view';
import 'react18-json-view/src/style.css';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../ui/accordion';

type TestCase = {
  id?: string;
  testSuiteId?: string;
  requestId?: string;
  name: string;
  description: string;
  testcase_id: string;
  validation_type: string;
  severity: string;
  category: string;
  order: number;
  method: string;
  url: string;
  bodyType: string;
  bodyFormData: any;
  bodyRawContent: string;
  authorizationType: string;
  authorization: any;
  headers: any;
  params: any[];
  expectedResponse: any;
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
  deletedAt?: string;
  tags: string[];
  subCategory: string;
};

type TestCaseCategory = {
  category: string;
  count: number;
  tests: TestCase[];
};

type SubcatChip = {
  name: string; count: number,

};

type TestCaseSelectionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (testCaseIds: string[]) => void;
  request: {
    id: string;
    name: string;
    method: string;
    endpoint: string;
    selectedTestCases?: string[];
  } | null;
  testSuiteId: string;
};

// Helper function to map category numbers to category names
const getCategoryName = (categoryNumber: number): string => {
  const categoryMap: { [key: number]: string } = {
    0: 'Positive',
    1: 'Negative',
    2: 'Functional',
    3: 'Semantic',
    4: 'Edge Case',
    5: 'Security',
    6: 'Advanced Security',
  };
  return categoryMap[categoryNumber] || 'Other';
};

// Helper function to generate tags based on test case properties
const generateTags = (testCase: ApiTestCase): string[] => {
  const tags: string[] = [];

  if (testCase.method) {
    tags.push(testCase.method.toLowerCase());
  }

  if (testCase.authorizationType) {
    tags.push('auth');
  }

  if (testCase.expectedResponse?.status === 0) {
    tags.push('success');
  }

  const categoryName = getCategoryName(testCase.category).toLowerCase();
  tags.push(categoryName);

  return tags;
};

// Transform API response to UI format
const transformTestCases = (
  apiTestCases: ApiTestCase[]
): { categories: TestCaseCategory[]; selectedIds: string[] } => {
  const categoriesMap: { [key: string]: TestCase[] } = {};
  const selectedIds: string[] = [];

  apiTestCases.forEach((apiTestCase) => {
    const categoryName = getCategoryName(apiTestCase.category);

    const testCase: TestCase = {
      id: apiTestCase.id,
      name: apiTestCase.name,
      description: apiTestCase.description,
      testcase_id: apiTestCase.testcase_id,
      validation_type: apiTestCase.validation_type,
      severity: apiTestCase.severity,
      category: categoryName,
      order: apiTestCase.order,
      method: apiTestCase.method,
      url: apiTestCase.url,
      bodyType: apiTestCase.bodyType,
      bodyFormData: apiTestCase.bodyFormData,
      bodyRawContent: apiTestCase.bodyRawContent,
      authorizationType: apiTestCase.authorizationType,
      authorization: apiTestCase.authorization,
      headers: apiTestCase.headers,
      params: apiTestCase.params,
      expectedResponse: apiTestCase.expectedResponse,
      tags: generateTags(apiTestCase),
      subCategory: apiTestCase?.subCategory,
    };

    if (!categoriesMap[categoryName]) {
      categoriesMap[categoryName] = [];
    }
    categoriesMap[categoryName].push(testCase);

    if (apiTestCase.isSelected) {
      selectedIds.push(apiTestCase.id);
    }
  });

  const categories = Object.entries(categoriesMap).map(([category, tests]) => ({
    category,
    count: tests.length,
    tests,
  }));

  return { categories, selectedIds };
};

export const TestCaseSelectionModal: React.FC<TestCaseSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  request,
  testSuiteId,
}: TestCaseSelectionModalProps) => {
  const [selectedTestCases, setSelectedTestCases] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [expandedCategories, setExpandedCategories] = useState<string[]>([
    'Functional',
  ]);
  const [testCaseCategories, setTestCaseCategories] = useState<
    TestCaseCategory[]
  >([]);

  // console.log(testCaseCategories, 'testCaseCategories');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('request');

  const {
    data: testCasesData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['testCases', request?.id, testSuiteId],
    queryFn: () => getTestCasesByRequestId(request!.id, testSuiteId),
    enabled: !!request?.id && !!testSuiteId && isOpen,
  });

  const saveTestCasesMutation = useMutation({
    mutationFn: ({
      requestId,
      selectedTestCaseIds,
      allTestCaseIds,
    }: {
      requestId: string;
      selectedTestCaseIds: string[];
      allTestCaseIds: string[];
    }) =>
      saveTestCasesForRequest(
        testSuiteId,
        requestId,
        selectedTestCaseIds,
        allTestCaseIds
      ),
    onSuccess: () => {

      queryClient.invalidateQueries({ queryKey: ['testCases'] });
      onSelect(selectedTestCases);
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save test cases',
        variant: 'destructive',
      });
    },
  });

  // Initialize selected test cases when modal opens or request changes
  useEffect(() => {
    if (isOpen && request?.selectedTestCases) {
      setSelectedTestCases([...request.selectedTestCases]);
    } else if (isOpen) {
      setSelectedTestCases([]);
    }
  }, [isOpen, request?.selectedTestCases]);

  // console.log("testCasesData:", testCasesData);

  // Transform and set test cases when data changes
  useEffect(() => {
    if (testCasesData?.testCases) {
      const { categories, selectedIds } = transformTestCases(
        testCasesData.testCases
      );
      setTestCaseCategories(categories);
      setSelectedTestCases(selectedIds);

      if (categories.length > 0) {
        setExpandedCategories([categories[0].category]);
      }
    }
  }, [testCasesData]);

  const handleTestCaseToggle = (testId: string, checked: boolean) => {
    if (checked) {
      setSelectedTestCases((prev) => [...prev, testId]);
    } else {
      setSelectedTestCases((prev) => prev.filter((id) => id !== testId));
    }
  };

  const handleCategoryToggle = (category: TestCaseCategory) => {
    const testIds = category.tests.map((test) => test.id);
    const allSelected = testIds.every((id?: string) =>
      selectedTestCases.includes(id || '')
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
    if (!request?.id) return;

    // Get all test case IDs from current data
    const allTestCaseIds = testCaseCategories.flatMap((category) =>
      category.tests.map((test) => test.id)
    );

    saveTestCasesMutation.mutate({
      requestId: request.id,
      selectedTestCaseIds: selectedTestCases,
      allTestCaseIds,
    });
  };

  const handleCancel = () => {
    // Reset to original selection on cancel
    if (request?.selectedTestCases) {
      setSelectedTestCases([...request.selectedTestCases]);
    } else {
      setSelectedTestCases([]);
    }
    onClose();
  };

  const getTestById = (testId: string) => {
    for (const category of testCaseCategories) {
      const test = category.tests.find((t) => t.id === testId);
      if (test) return test;
    }
    return null;
  };

  // before you compute the final filtered list by subcategory, create a "pre" list:
  const filteredCategoriesPreSubcat = useMemo(() => {
    if (!searchTerm?.trim() && categoryFilter === 'All Categories')
      return testCaseCategories;

    const searchLower = searchTerm?.toLowerCase() ?? '';

    return testCaseCategories
      .filter((category) => {
        if (
          categoryFilter !== 'All Categories' &&
          category.category !== categoryFilter
        )
          return false;
        if (!searchLower) return true;

        return category.tests.some(
          (t) =>
            t.name.toLowerCase().includes(searchLower) ||
            t.description.toLowerCase().includes(searchLower) ||
            t.tags.some((tag) => tag.toLowerCase().includes(searchLower))
        );
      })
      .map((category) => {
        if (!searchLower) return category;
        const tests = category.tests.filter(
          (t) =>
            t.name.toLowerCase().includes(searchLower) ||
            t.description.toLowerCase().includes(searchLower) ||
            t.tags.some((tag) => tag.toLowerCase().includes(searchLower))
        );
        return { ...category, tests };
      });
  }, [testCaseCategories, categoryFilter, searchTerm]);

  // console.log(filteredCategoriesPreSubcat, 'filteredCategories');

  const totalAvailableTests = testCaseCategories.reduce(
    (sum, cat) => sum + cat.tests.length,
    0
  );

  if (!request) return null;
  const { name } = request;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Positive':
        return '✅';
      case 'Negative':
        return '❌';
      case 'Functional':
        return '🔧';
      case 'Semantic':
        return '📝';
      case 'EdgeCase':
        return '🎯';
      case 'Security':
        return '🛡️';
      case 'Advanced Security':
        return '🔒';
      default:
        return '📋';
    }
  };

  const tagColorMap: Record<string, string> = {
    functional: 'bg-green-200',
    performance: 'bg-yellow-200',
    Semantic: 'bg-red-200',
    put: 'bg-blue-200',
    get: 'bg-indigo-200',
    post: 'bg-purple-200',
    patch: 'bg-teal-200',
    all: 'bg-pink-200',
    default: 'bg-gray-200',
  };

  const [expandedTestId, setExpandedTestId] = useState<string | null>(null);

  const [expandedSubCategory, setExpandedSubCategory] = useState<string | null>(
    null
  );

  const [subcatFilter, setSubcatFilter] = useState<string>('All');

  const filteredCategories = useMemo(() => {
    // start from the pre-subcat list
    const base = filteredCategoriesPreSubcat;

    if (subcatFilter === 'All') return base;

    return base
      .map((category) => {
        const tests = category.tests.filter((t) => {
          const name = (t.subCategory && t.subCategory.trim()) || 'Other';
          return name === subcatFilter;
        });
        return { ...category, tests };
      })
      .filter((c) => c.tests.length > 0); // drop empty categories after subcat filter
  }, [filteredCategoriesPreSubcat, subcatFilter]);
  // 'All' means no filter

  const subcatChips: SubcatChip[] = useMemo(() => {
    const counts = new Map<string, number>();

    for (const cat of filteredCategoriesPreSubcat) {
      for (const t of cat.tests) {
        const name = (t.subCategory && t.subCategory.trim()) || 'Other';
        counts.set(name, (counts.get(name) || 0) + 1);
      }
    }

    // Build chips: "All" first (sum of everything), then sorted by count desc
    const total = Array.from(counts.values()).reduce((a, b) => a + b, 0);
    const chips: SubcatChip[] = [{ name: 'All', count: total }];

    const rest = Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return chips.concat(rest);
  }, [filteredCategoriesPreSubcat]);


  const categoryTestMap = React.useMemo(() => {
    const map: Record<string, string[]> = {};

    filteredCategories.forEach((cat) => {
      map[cat.category] = cat.tests
        .map((t) => t.id)
        .filter(Boolean) as string[];
    });

    return map;
  }, [filteredCategories]);



  const subCategoryTestMap = React.useMemo(() => {
    const map: Record<string, string[]> = {};

    filteredCategories.forEach((category) => {
      category.tests.forEach((test) => {
        if (!test.subCategory || !test.id) return;

        if (!map[test.subCategory]) {
          map[test.subCategory] = [];
        }

        map[test.subCategory].push(test.id);
      });
    });

    return map;
  }, [filteredCategories]);



  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-6xl max-h-[90vh] overflow-hidden flex flex-col p-0 justify-center'>
        <div className='p-3 border-b'>
          <DialogHeader>
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
              {/* Left side: Title */}
              <DialogTitle className='text-xl whitespace-nowrap'>
                Select Test Cases:{' '}
                <span className='text-[14px] text-muted-foreground whitespace-nowrap'>
                  {name}
                </span>
              </DialogTitle>

              {/* Right side: Search + Category Filter */}
              <div className='flex items-center gap-3 w-full sm:w-auto mr-8'>
                {/* Search */}
                <div className='relative flex-1 max-w-lg'>
                  <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                  <Input
                    placeholder='Search test cases...'
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className='pl-10 pr-8 w-full'
                    disabled={isLoading}
                  />
                </div>

                {/* Category Select */}
                <Select
                  value={categoryFilter}
                  onValueChange={setCategoryFilter}
                  disabled={isLoading}
                >
                  <SelectTrigger className='w-48'>
                    <SelectValue placeholder='Select category' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='All Categories'>
                      All Categories ({totalAvailableTests})
                    </SelectItem>
                    {testCaseCategories.map((category) => (
                      <SelectItem
                        key={category.category}
                        value={category.category}
                      >
                        {category.category} ({category.count})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/* <button
                  onClick={onClose}
                  className='ml-2 flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 text-gray-500 shrink-0'
                >
                  ×
                </button> */}
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="px-3">
          <div className="flex flex-wrap gap-2 justify-center">
            {subcatChips.map((chip) => {
              const active = subcatFilter === chip.name;

              const subCategoryTestIds = subCategoryTestMap[chip.name] ?? [];

              const selectedInSubCategory = subCategoryTestIds.filter((id) =>
                selectedTestCases.includes(id)
              ).length;

              const hasSelection = selectedInSubCategory > 0;

              return (
                <button
                  key={chip.name}
                  onClick={() => setSubcatFilter(active ? "" : chip.name)}
                  className={`
        relative inline-flex items-center rounded-md border px-2 py-1 text-xs
        ${active
                      ? "bg-[#136fb0] text-white border-[#136fb0]"
                      : "bg-transparent text-foreground border-muted-foreground/30 hover:bg-muted/40"
                    }
      `}
                  title={chip.name}
                >
                  {/* 🔵 DOT if any test selected in this sub-category */}
                  {hasSelection && !active && (
                    <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-green-600" />
                  )}

                  <span className="mr-1 capitalize">{chip.name}</span>

                  <span
                    className={`
          ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1
          ${active
                        ? "bg-white/20 text-white"
                        : "bg-muted text-[#136fb0]"
                      }
        `}
                  >
                    {chip.count}
                  </span>

                  {/* optional x/y */}
                  {hasSelection && (
                    <span
                      className={`ml-1 text-[10px] font-medium ${active ? "text-white/90" : "text-[#136fb0]"
                        }`}
                    >
                      {selectedInSubCategory}/{subCategoryTestIds.length}
                    </span>
                  )}
                </button>
              );
            })}

          </div>
        </div>


        {/* Main Content */}
        <div className='flex-1 flex overflow-hidden flex-col md:flex-row'>
          {/* Left Panel - Available Tests */}
          <div className='flex-1 overflow-y-auto border-r md:border-r border-b md:border-b-0'>
            <div className='p-4'>
              <div className='flex items-center justify-between mb-4'>
                <h3 className='font-medium'>
                  Available testcases ({totalAvailableTests})
                </h3>
                <span className='text-sm text-muted-foreground'>
                  {selectedTestCases.length} selected
                </span>
              </div>

              {isLoading && (
                <div className='flex items-center justify-center py-8'>
                  <Loader className='h-6 w-6 animate-spin' />
                  <span className='ml-2 text-sm text-muted-foreground'>
                    Loading test cases...
                  </span>
                </div>
              )}

              {error && (
                <div className='text-center py-8'>
                  <p className='text-sm text-destructive mb-2'>
                    Failed to load test cases
                  </p>
                  <p className='text-xs text-muted-foreground mb-4'>
                    {(error as Error).message}
                  </p>
                </div>
              )}

              {!isLoading && !error && testCaseCategories.length === 0 && (
                <div className='text-center py-8'>
                  <p className='text-sm text-muted-foreground'>
                    No test cases found for this request
                  </p>
                </div>
              )}

              {!isLoading && !error && (
                <div className='space-y-2'>
                  {filteredCategories.map((category) => {
                    const isExpanded = expandedCategories.includes(
                      category.category
                    );
                    const categoryTests = category.tests;
                    const selectedInCategory = categoryTests.filter((test) =>
                      selectedTestCases.includes(test?.id || '')
                    ).length;

                    const isAllSelected =
                      categoryTests.length > 0 &&
                      selectedInCategory === categoryTests.length;

                    return (
                      <div
                        key={category.category}
                        className='border rounded-lg'
                      >
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

                            <span className='mr-2'>
                              {getCategoryIcon(category.category)}
                            </span>
                            <span className='font-medium'>
                              {category.category}
                              { }
                            </span>
                            <Badge variant='outline'>
                              {categoryTests.length}
                            </Badge>
                            {selectedInCategory > 0 && (
                              <span className='text-xs text-[#136fb0] font-medium'>
                                {selectedInCategory}/{categoryTests.length}{' '}
                                selected
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
                            className='text-[#136fb0] hover:text-blue-700'
                          >
                            {isAllSelected ? 'Unselect All' : 'Select All'}
                          </Button>
                        </div>

                        {isExpanded && (
                          <div className='px-3 pb-3 space-y-2'>
                            {categoryTests.map((test) => {
                              return (
                                <div
                                  key={test.id}
                                  className='flex flex-col p-3 rounded border hover:bg-muted/30'
                                >
                                  <div className='flex items-start space-x-3'>
                                    <Checkbox
                                      checked={selectedTestCases.includes(
                                        test?.id
                                      )}
                                      onCheckedChange={(checked) =>
                                        handleTestCaseToggle(
                                          test?.id,
                                          checked as boolean
                                        )
                                      }
                                      style={{ accentColor: '#136fb0' }}
                                    />
                                    <div
                                      style={{ cursor: 'pointer' }}
                                      className='flex-1 min-w-0'
                                      onClick={() =>
                                        setExpandedTestId(
                                          expandedTestId === test?.id
                                            ? null
                                            : test.id
                                        )
                                      }
                                    >
                                      <div className='flex items-center justify-between space-x-2'>
                                        <h4 className='font-medium text-sm'>
                                          {test?.subCategory}:: {test.name}
                                        </h4>
                                        <button
                                          onClick={() =>
                                            setExpandedTestId(
                                              expandedTestId === test.id
                                                ? null
                                                : test.id
                                            )
                                          }
                                          className='flex items-center text-xs text-blue-500 space-x-1'
                                        >
                                          {expandedTestId === test.id ? (
                                            <>
                                              <ChevronUp
                                                size={20}
                                                color='#136fb0'
                                              />
                                              <span
                                                style={{ color: '#136fb0' }}
                                              >
                                                Hide Details
                                              </span>
                                            </>
                                          ) : (
                                            <>
                                              <ChevronDown
                                                size={20}
                                                color='#136fb0'
                                              />
                                              <span
                                                style={{ color: '#136fb0' }}
                                              >
                                                Show Details
                                              </span>
                                            </>
                                          )}
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                  {expandedTestId === test.id && (
                                    <div className='mt-2 px-6 space-y-2'>
                                      {test.description && (
                                        <p className='text-xs text-muted-foreground'>
                                          {test.description}
                                        </p>
                                      )}

                                      {/* {test.tags?.length > 0 && (
                                        <div className="flex space-x-1">
                                          {test.tags.map((tag) => {
                                            const bgColorClass =
                                              tagColorMap[tag.toLowerCase()] ||
                                              tagColorMap.default;
                                            return (
                                              <span
                                                key={tag}
                                                className={`${bgColorClass} text-xs px-2 py-0 rounded`}
                                              >
                                                {tag}
                                              </span>
                                            );
                                          })}
                                        </div>
                                      )} */}

                                      <div className='space-y-4 mt-4'>
                                        <Tabs
                                          value={activeTab}
                                          onValueChange={setActiveTab}
                                        >
                                          <TabsList className='grid w-full grid-cols-2 mt-4'>
                                            <TabsTrigger value='request'>
                                              Request
                                            </TabsTrigger>
                                            <TabsTrigger value='assertions'>
                                              Assertions
                                            </TabsTrigger>
                                          </TabsList>

                                          <TabsContent value='request'>
                                            {test && (
                                              <div className='mt-4 p-3 bg-gray-900 rounded max-h-96 overflow-auto text-xs text-white'>
                                                {/* <ReactJson 
                                                  src={test}
                                                  collapsed={1}
                                                  enableClipboard={false}
                                                  // displayDataTypes={false}
                                                  // name={false}
                                                  theme="vscode"
                                                /> */}

                                                {/* <JsonView
                                                  data={test}
                                                  collapsed={1}
                                                  enableClipboard={false}
                                                  displayDataTypes={false}
                                                  name={false}
                                                  theme="monokai"
                                                /> */}
                                                <JsonView
                                                  dark
                                                  enableClipboard
                                                  onAdd={() => { }}
                                                  onDelete={() => { }}
                                                  onEdit={() => { }}
                                                  src={test}
                                                  theme='default'
                                                />
                                              </div>
                                            )}
                                          </TabsContent>

                                          <TabsContent value='assertions'>
                                            {test && (
                                              <div className='mt-4 p-3 bg-gray-900 rounded max-h-96 overflow-auto text-xs text-white'>
                                                {/* <ReactJson
                                                  src={test}
                                                  collapsed={1}
                                                  enableClipboard={false}
                                                  // displayDataTypes={false}
                                                  // name={false}
                                                  theme="vscode"
                                                /> */}
                                                <JsonView
                                                  dark
                                                  enableClipboard
                                                  onAdd={() => { }}
                                                  onDelete={() => { }}
                                                  onEdit={() => { }}
                                                  src={test}
                                                  theme='default'
                                                />
                                              </div>
                                            )}
                                          </TabsContent>
                                        </Tabs>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>



        </div>
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
              disabled={
                selectedTestCases.length === 0 ||
                isLoading ||
                saveTestCasesMutation.isPending
              }
            >
              {saveTestCasesMutation.isPending ? (
                <>
                  <Loader className='h-4 w-4 animate-spin mr-2' />
                  Saving...
                </>
              ) : (
                'Save Test Cases'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
