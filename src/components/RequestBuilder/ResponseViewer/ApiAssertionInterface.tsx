import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Check,
  X,
  Filter,
  ChevronDown,
  ChevronRight,
  Search,
  AlertCircle,
  Shield,
  Zap,
  Activity,
  CheckCircle,
  FileText,
  Trash2,
  Plus,
  Edit2,
  Play,
  Save,
  RotateCcw,
  Share2,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { ValidationPayload } from '@/services/assertionValidation.service';
import { useValidateAssertionsMutation } from '@/store/assertionValidation';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Assertion {
  id: string;
  category: string;
  type: string;
  description: string;
  field?: string;
  operator?: string;
  expectedValue?: any;
  enabled: boolean;
  group?: string;
  priority?: 'Critical' | 'High' | 'Medium' | 'Low';
  impact?: string;
}

interface ValidationResult extends Assertion {
  validated: true;
  result: 'passed' | 'failed';
  actualValue?: any;
  failureReason?: string;
}

interface ResponseData {
  requestId: string;
  status?: number;
  statusCode?: number;
  headers: Record<string, any>;
  body: any;
  rawBody?: string;
  requestCurl?: string;
  actualRequest?: {
    method: string;
    url: string;
    headers: Record<string, any>;
    body?: any;
  };
  metrics?: {
    bytesReceived: number;
    responseTime: number;
  };
}

interface ApiAssertionInterfaceProps {
  assertions?: Assertion[];
  responseData?: ResponseData;
  onUpdateAssertions?: (assertions: Assertion[]) => void;
  onVerifyAssertions?: () => Promise<void>;
  onSaveAssertions?: () => Promise<void>;
}

const ApiAssertionInterface: React.FC<ApiAssertionInterfaceProps> = ({
  assertions = [],
  responseData,
  onUpdateAssertions,
  onVerifyAssertions,
  onSaveAssertions,
}) => {
  const { toast } = useToast();
  const saveMenuRef = useRef<HTMLDivElement>(null);

  const [localAssertions, setLocalAssertions] =
    useState<Assertion[]>(assertions);
  const [selectedView, setSelectedView] = useState<'all' | 'selected'>('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [appState, setAppState] = useState<'build' | 'validating' | 'results'>(
    'build'
  );
  const [validationResults, setValidationResults] = useState<{
    results: ValidationResult[];
    summary: { passed: number; failed: number; skipped: number; total: number };
    timestamp: string;
    responseTime: string;
  } | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showSaveMenu, setShowSaveMenu] = useState(false);
  const [sortBy, setSortBy] = useState<
    Record<string, 'none' | 'field' | 'type'>
  >({});
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({
    body: true,
    headers: true,
    'HeaderGuard™': true,
    performance: true,
    status: true,
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalData, setModalData] = useState({
    field: '',
    dataType: 'string',
    operator: 'equals',
    value: '',
    category: 'body',
  });
  const [quickAddData, setQuickAddData] = useState({
    field: '',
    operator: 'equals',
    value: '',
  });
  const [nlpInput, setNlpInput] = useState('');
  const [selectedAssertions, setSelectedAssertions] = useState<Assertion[]>([]);

  useEffect(() => {
    const selected = localAssertions.filter((a) => a.enabled);
    setSelectedAssertions(selected);
  }, [localAssertions]);

  useEffect(() => {
    setLocalAssertions(assertions);
  }, [assertions]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        saveMenuRef.current &&
        !saveMenuRef.current.contains(event.target as Node)
      ) {
        setShowSaveMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const groupedAssertions = useMemo(() => {
    const grouped: Record<string, Assertion[]> = {};
    localAssertions.forEach((assertion) => {
      const category = assertion.category || 'other';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(assertion);
    });
    return grouped;
  }, [localAssertions]);

  const categories = useMemo(() => {
    const cats = [
      { id: 'all', label: 'All Assertions', count: localAssertions.length },
    ];
    Object.entries(groupedAssertions).forEach(([category, items]) => {
      cats.push({
        id: category,
        label:
          category === 'HeaderGuard™'
            ? 'HeaderGuard™'
            : category.charAt(0).toUpperCase() + category.slice(1),
        count: items.length,
      });
    });
    return cats;
  }, [localAssertions, groupedAssertions]);

  const toggleAssertion = (id: string) => {
    const updated = localAssertions.map((a) =>
      a.id === id ? { ...a, enabled: !a.enabled } : a
    );
    setLocalAssertions(updated);
    setHasUnsavedChanges(true);
    if (onUpdateAssertions) {
      onUpdateAssertions(updated);
    }
  };

  const removeAssertion = (id: string) => {
    const updated = localAssertions.filter((a) => a.id !== id);
    setLocalAssertions(updated);
    setHasUnsavedChanges(true);
    if (onUpdateAssertions) {
      onUpdateAssertions(updated);
    }
    toast({
      title: 'Assertion removed',
      description: 'The assertion has been removed successfully',
      duration: 2000,
    });
  };

  const removeAllSelected = () => {
    const updated = localAssertions.map((a) => ({ ...a, enabled: false }));
    setLocalAssertions(updated);
    setHasUnsavedChanges(true);
    if (onUpdateAssertions) {
      onUpdateAssertions(updated);
    }
    toast({
      title: 'All assertions cleared',
      description: 'All assertions have been disabled',
      duration: 2000,
    });
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const getSelectedCount = () => {
    return localAssertions.filter((a) => a.enabled).length;
  };

  const getFilteredAssertions = (
    categoryAssertions: Assertion[],
    categoryKey?: string
  ) => {
    let filtered = [...categoryAssertions];

    if (selectedView === 'selected') {
      filtered = filtered.filter((a) => a.enabled);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.description.toLowerCase().includes(query) ||
          a.field?.toLowerCase().includes(query) ||
          a.type.toLowerCase().includes(query)
      );
    }

    if (categoryKey && sortBy[categoryKey] && sortBy[categoryKey] !== 'none') {
      filtered = [...filtered].sort((a, b) => {
        if (sortBy[categoryKey] === 'field') {
          return (a.field || '').localeCompare(b.field || '');
        } else if (sortBy[categoryKey] === 'type') {
          return a.type.localeCompare(b.type);
        }
        return 0;
      });
    }

    return filtered;
  };

  const getOperatorsByDataType = (dataType: string) => {
    const operators: Record<string, string[]> = {
      string: [
        'contains',
        'not contains',
        'equals',
        'not equals',
        'starts with',
        'ends with',
      ],
      number: [
        'equals',
        'not equals',
        'greater than',
        'less than',
        'greater than or equal',
        'less than or equal',
      ],
      boolean: ['equals', 'not equals'],
      array: [
        'contains',
        'not contains',
        'length equals',
        'length greater than',
        'length less than',
      ],
      object: ['exists', 'not exists', 'has property'],
    };
    return operators[dataType] || operators.string;
  };

  const handleQuickAdd = () => {
    if (!quickAddData.field || !quickAddData.value) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in both field and value',
        variant: 'destructive',
        duration: 3000,
      });
      return;
    }

    const newAssertion: Assertion = {
      id: `manual_${Date.now()}`,
      field: quickAddData.field,
      type: quickAddData.operator,
      description: `Field '${quickAddData.field}' ${quickAddData.operator} '${quickAddData.value}'`,
      operator: quickAddData.operator,
      expectedValue: quickAddData.value,
      enabled: true,
      category: 'body',
      group: 'custom',
    };

    const updated = [...localAssertions, newAssertion];
    setLocalAssertions(updated);
    setQuickAddData({ field: '', operator: 'equals', value: '' });
    setHasUnsavedChanges(true);
    if (onUpdateAssertions) {
      onUpdateAssertions(updated);
    }
    toast({
      title: 'Assertion added',
      description: 'Custom assertion has been added successfully',
      duration: 2000,
    });
  };

  const openAddModal = (
    field: string,
    dataType = 'string',
    category = 'body'
  ) => {
    setModalData({
      field,
      dataType,
      operator: getOperatorsByDataType(dataType)[0],
      value: '',
      category,
    });
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setModalData({
      field: '',
      dataType: 'string',
      operator: 'equals',
      value: '',
      category: 'body',
    });
  };

  const handleAddAssertion = () => {
    const newAssertion: Assertion = {
      id: `manual_${Date.now()}`,
      field: modalData.field,
      type: modalData.operator,
      description: `Field '${modalData.field}' ${modalData.operator} '${modalData.value}'`,
      operator: modalData.operator,
      expectedValue: modalData.value,
      enabled: true,
      category: modalData.category,
      group: 'custom',
    };

    const updated = [...localAssertions, newAssertion];
    setLocalAssertions(updated);
    setHasUnsavedChanges(true);
    if (onUpdateAssertions) {
      onUpdateAssertions(updated);
    }
    closeAddModal();
    toast({
      title: 'Assertion created',
      description: `New assertion for '${modalData.field}' has been created`,
      duration: 2000,
    });
  };

  const validationMutation = useValidateAssertionsMutation({
    onSuccess: (data) => {
      const mappedResults: ValidationResult[] = data.assertionResults.map(
        (result) => {
          const originalAssertion = localAssertions.find(
            (a) =>
              a.field === result.field &&
              a.type === result.type &&
              a.category === result.category
          );

          return {
            id:
              originalAssertion?.id || `result_${Date.now()}_${Math.random()}`,
            category: result.category,
            type: result.type,
            description: result.description,
            field: result.field,
            operator: result.operator,
            expectedValue: result.expectedValue,
            enabled: originalAssertion?.enabled || true,
            group: result.group || originalAssertion?.group,
            priority: originalAssertion?.priority,
            impact: originalAssertion?.impact,
            validated: true as const,
            result:
              result.status === 'passed'
                ? ('passed' as const)
                : ('failed' as const),
            actualValue: result.actualValue,
            failureReason: result.errorMessage,
          };
        }
      );

      const summary = {
        passed: data.assertionResults.filter((r) => r.status === 'passed')
          .length,
        failed: data.assertionResults.filter((r) => r.status === 'failed')
          .length,
        skipped: selectedAssertions.length - data.assertionResults.length,
        total: selectedAssertions.length,
      };

      const responseTime = data.response?.metrics?.responseTime
        ? `${data.response.metrics.responseTime}ms`
        : data.assertionResults[0]?.responseTime
        ? `${data.assertionResults[0].responseTime}ms`
        : 'N/A';

      setValidationResults({
        results: mappedResults,
        summary,
        timestamp: new Date().toISOString(),
        responseTime,
      });

      toast({
        title: 'Validation complete',
        description: `${summary.passed} passed, ${summary.failed} failed out of ${summary.total} assertions`,
        duration: 4000,
      });
      setAppState('results');
    },
    onError: (error) => {
      console.error('Validation error:', error);
      setAppState('build');
      toast({
        title: 'Validation failed',
        description:
          error.message || 'Failed to validate assertions. Please try again.',
        variant: 'destructive',
        duration: 5000,
      });
    },
  });

  const handleVerifyAssertions = async () => {
    if (getSelectedCount() === 0) {
      toast({
        title: 'No assertions selected',
        description: 'Please select at least one assertion to verify',
        variant: 'destructive',
        duration: 3000,
      });
      return;
    }

    setAppState('validating');

    const validationPayload: ValidationPayload = {
      assertions: selectedAssertions.map((assertion) => ({
        category: assertion.category,
        type: assertion.type,
        description: assertion.description,
        ...(assertion.field && { field: assertion.field }),
        ...(assertion.operator && { operator: assertion.operator }),
        ...(assertion.expectedValue !== undefined && {
          expectedValue: assertion.expectedValue,
        }),
        ...(assertion.priority && { priority: assertion.priority }),
        ...(assertion.impact && { impact: assertion.impact }),
        enabled: assertion.enabled,
        ...(assertion.group && { group: assertion.group }),
      })),
      response: responseData
        ? {
            requestId: responseData.requestId,
            requestName: responseData.requestId,
            ...(responseData.requestCurl && {
              requestCurl: responseData.requestCurl,
            }),
            statusCode: responseData.statusCode || responseData.status || 0,
            headers: responseData.headers,
            body:
              typeof responseData.body === 'string'
                ? responseData.body
                : JSON.stringify(responseData.body),
            error: '',
            extractedVariables: [],
            ...(responseData.metrics && { metrics: responseData.metrics }),
          }
        : {
            requestId: 'unknown',
            requestName: 'unknown',
            requestCurl: '',
            statusCode: 0,
            headers: {},
            body: '',
            error: 'No response data available',
            extractedVariables: [],
            metrics: { bytesReceived: 0, responseTime: 0 },
          },
    };

    try {
      await validationMutation.mutateAsync(validationPayload);
    } catch (error) {
      console.error('Failed to validate assertions:', error);
      setAppState('build');
    }
  };

  const handleSaveAssertions = async () => {
    try {
      if (onSaveAssertions) {
        await onSaveAssertions();
      }
      setIsSaved(true);
      setHasUnsavedChanges(false);
      setShowSaveMenu(false);
      toast({
        title: 'Assertions saved',
        description: 'All assertions have been saved successfully',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Save failed',
        description: 'Failed to save assertions. Please try again.',
        variant: 'destructive',
        duration: 4000,
      });
    }
  };

  const handleSaveAndVerify = async () => {
    try {
      await handleSaveAssertions();
      await new Promise((resolve) => setTimeout(resolve, 500));
      handleVerifyAssertions();
      setShowSaveMenu(false);
    } catch (error) {
      toast({
        title: 'Operation failed',
        description: 'Failed to save and verify assertions',
        variant: 'destructive',
        duration: 4000,
      });
    }
  };

  const handleRerun = () => {
    setAppState('build');
    setTimeout(() => handleVerifyAssertions(), 100);
  };

  const handleEditAssertions = () => {
    setAppState('build');
    setValidationResults(null);
    toast({
      title: 'Edit mode',
      description: 'You can now edit your assertions',
      duration: 2000,
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'HeaderGuard™':
        return <Shield className='w-5 h-5 text-red-600' />;
      case 'body':
        return <FileText className='w-5 h-5 text-blue-600' />;
      case 'headers':
        return <FileText className='w-5 h-5 text-purple-600' />;
      case 'performance':
        return <Activity className='w-5 h-5 text-green-600' />;
      case 'status':
        return <CheckCircle className='w-5 h-5 text-orange-600' />;
      default:
        return <Zap className='w-5 h-5 text-gray-600' />;
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'Critical':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'High':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'Low':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const renderAssertion = (assertion: Assertion) => {
    const validationResult = validationResults?.results?.find(
      (r) => r.id === assertion.id
    );
    const hasResult = validationResult && appState === 'results';

    return (
      <div
        key={assertion.id}
        className={`group flex flex-col sm:flex-row sm:items-start gap-3 p-4 rounded-lg border transition-all ${
          hasResult
            ? validationResult.result === 'passed'
              ? 'bg-green-50 border-green-300'
              : 'bg-red-50 border-red-300'
            : assertion.enabled
            ? 'bg-blue-50 border-blue-300 shadow-sm'
            : 'bg-white border-gray-200 hover:border-gray-300'
        }`}
      >
        <div className='flex items-start gap-3 flex-1 min-w-0'>
          <button
            onClick={() => toggleAssertion(assertion.id)}
            disabled={appState !== 'build'}
            className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all mt-0.5 ${
              assertion.enabled
                ? 'bg-blue-600 border-blue-600'
                : 'border-gray-300 hover:border-blue-400'
            } ${appState !== 'build' ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {assertion.enabled && <Check className='w-3 h-3 text-white' />}
          </button>

          <div className='flex-1 min-w-0 space-y-2'>
            <div className='flex items-start gap-2 flex-wrap'>
              <div
                className={`w-6 h-6 rounded flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
                  hasResult
                    ? validationResult.result === 'passed'
                      ? 'bg-green-600 text-white'
                      : 'bg-red-600 text-white'
                    : assertion.enabled
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {hasResult
                  ? validationResult.result === 'passed'
                    ? '✓'
                    : '✗'
                  : '='}
              </div>

              <div className='flex items-center gap-2 flex-1 min-w-0'>
                {assertion.field && (
                  <span className='font-medium text-gray-900 font-mono text-sm truncate'>
                    {assertion.field}
                  </span>
                )}
                {assertion.operator && (
                  <span className='text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded whitespace-nowrap'>
                    {assertion.operator}
                  </span>
                )}
                {assertion.expectedValue !== undefined &&
                  assertion.expectedValue !== null && (
                    <span className='text-sm text-gray-700 font-mono truncate'>
                      ={' '}
                      <span className='text-blue-600'>
                        {String(assertion.expectedValue)}
                      </span>
                    </span>
                  )}
              </div>

              {assertion.priority && (
                <span
                  className={`text-xs px-2 py-1 rounded border whitespace-nowrap ${getPriorityColor(
                    assertion.priority
                  )}`}
                >
                  {assertion.priority}
                </span>
              )}
            </div>

            <p className='text-sm text-gray-700'>{assertion.description}</p>

            {hasResult && validationResult.result === 'failed' && (
              <div className='mt-2 text-xs text-red-700 bg-red-100 p-2 rounded'>
                <div className='font-semibold'>Failed:</div>
                <div>{validationResult.failureReason}</div>
                <div className='mt-1 text-red-600'>
                  Actual: {validationResult.actualValue}
                </div>
              </div>
            )}

            {assertion.impact && (
              <div className='text-xs text-gray-600 bg-gray-50 p-2 rounded border border-gray-200'>
                <span className='font-semibold'>Impact:</span>{' '}
                {assertion.impact}
              </div>
            )}
          </div>
        </div>

        <div className='flex items-center gap-2 justify-end sm:justify-start'>
          {assertion.group === 'custom' && appState === 'build' && (
            <>
              <button
                className='sm:opacity-0 sm:group-hover:opacity-100 p-1 hover:bg-gray-100 rounded transition-opacity'
                title='Edit assertion'
              >
                <Edit2 className='w-4 h-4 text-gray-500' />
              </button>
              <button
                onClick={() => removeAssertion(assertion.id)}
                className='sm:opacity-0 sm:group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-opacity'
                title='Remove assertion'
              >
                <X className='w-4 h-4 text-red-600' />
              </button>
            </>
          )}

          {appState === 'build' && (
            <button
              onClick={() =>
                openAddModal(
                  assertion.field || '',
                  'string',
                  assertion.category
                )
              }
              className='sm:opacity-0 sm:group-hover:opacity-100 p-1 hover:bg-blue-100 rounded transition-opacity'
              title='Create new assertion from this field'
            >
              <Plus className='w-4 h-4 text-blue-600' />
            </button>
          )}

          {assertion.group !== 'custom' && (
            <div className='flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded whitespace-nowrap'>
              <Zap className='w-3 h-3' />
              Auto
            </div>
          )}

          {hasResult && (
            <div
              className={`flex items-center gap-1 text-xs px-2 py-1 rounded whitespace-nowrap ${
                validationResult.result === 'passed'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {validationResult.result === 'passed' ? 'Passed' : 'Failed'}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderCategorySection = (
    categoryKey: string,
    categoryLabel: string
  ) => {
    const sourceAssertions =
      appState === 'results' && validationResults
        ? validationResults.results.filter((r) => r.category === categoryKey)
        : groupedAssertions[categoryKey] || [];

    const categoryAssertions = getFilteredAssertions(
      sourceAssertions,
      categoryKey
    );

    if (
      categoryAssertions.length === 0 &&
      (selectedView === 'selected' || searchQuery)
    ) {
      return null;
    }

    const selectedInCategory = sourceAssertions.filter((a) => a.enabled).length;
    const totalInCategory = sourceAssertions.length;

    return (
      <div
        key={categoryKey}
        className='border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm mb-4'
      >
        <button
          onClick={() => toggleCategory(categoryKey)}
          className='w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors'
        >
          <div className='flex items-center gap-3'>
            {expandedCategories[categoryKey] ? (
              <ChevronDown className='w-5 h-5 text-gray-600' />
            ) : (
              <ChevronRight className='w-5 h-5 text-gray-600' />
            )}
            {getCategoryIcon(categoryKey)}
            <h3 className='font-semibold text-gray-900'>{categoryLabel}</h3>
            <span className='text-sm text-gray-500'>
              ({totalInCategory}{' '}
              {totalInCategory === 1 ? 'assertion' : 'assertions'})
            </span>
          </div>
          <div className='flex items-center gap-2'>
            {appState === 'results' && validationResults && (
              <div className='flex items-center gap-2'>
                <span className='text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium'>
                  {
                    sourceAssertions.filter(
                      (a) => 'result' in a && a.result === 'passed'
                    ).length
                  }{' '}
                  passed
                </span>
                {sourceAssertions.filter(
                  (a) => 'result' in a && a.result === 'failed'
                ).length > 0 && (
                  <span className='text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium'>
                    {
                      sourceAssertions.filter(
                        (a) => 'result' in a && a.result === 'failed'
                      ).length
                    }{' '}
                    failed
                  </span>
                )}
              </div>
            )}
            {appState === 'build' && selectedInCategory > 0 && (
              <div className='bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-medium'>
                {selectedInCategory} enabled
              </div>
            )}
          </div>
        </button>

        {expandedCategories[categoryKey] && (
          <div className='p-4'>
            {categoryKey === 'body' &&
              totalInCategory > 0 &&
              appState === 'build' && (
                <div className='mb-4 flex items-center gap-2 pb-3 border-b border-gray-200'>
                  <span className='text-sm font-medium text-gray-700'>
                    Sort by:
                  </span>
                  <div className='flex gap-2'>
                    <Button
                      variant={
                        sortBy[categoryKey] === 'none' || !sortBy[categoryKey]
                          ? 'default'
                          : 'outline'
                      }
                      size='sm'
                      onClick={() =>
                        setSortBy({ ...sortBy, [categoryKey]: 'none' })
                      }
                    >
                      None
                    </Button>
                    <Button
                      variant={
                        sortBy[categoryKey] === 'field' ? 'default' : 'outline'
                      }
                      size='sm'
                      onClick={() =>
                        setSortBy({ ...sortBy, [categoryKey]: 'field' })
                      }
                    >
                      Field Name
                    </Button>
                    <Button
                      variant={
                        sortBy[categoryKey] === 'type' ? 'default' : 'outline'
                      }
                      size='sm'
                      onClick={() =>
                        setSortBy({ ...sortBy, [categoryKey]: 'type' })
                      }
                    >
                      Assertion Type
                    </Button>
                  </div>
                </div>
              )}

            <div className='space-y-3'>
              {categoryAssertions.map((assertion) =>
                renderAssertion(assertion)
              )}
              {categoryAssertions.length === 0 && (
                <p className='text-center text-gray-500 py-8'>
                  No assertions match your filters
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };
  if (!localAssertions || localAssertions.length === 0) {
    return (
      <div className='min-h-screen bg-gray-50 p-6 flex items-center justify-center'>
        <div className='text-center'>
          <AlertCircle className='w-16 h-16 text-gray-400 mx-auto mb-4' />
          <h2 className='text-xl font-semibold text-gray-900 mb-2'>
            No Assertions Found
          </h2>
          <p className='text-gray-600'>
            No assertions are available to display. Try making an API request
            first.
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className='space-y-3'>
      {/* Header Section */}
      <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-5 md:p-6'>
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4'>
          <div>
            <h1 className='text-xl sm:text-2xl font-bold text-gray-900'>
              API Assertions
            </h1>
            <p className='text-sm sm:text-base text-gray-600 mt-1'>
              {appState === 'build' &&
                'Select assertions to validate your API responses'}
              {appState === 'validating' && 'Running validation...'}
              {appState === 'results' && 'Validation results'}
            </p>
          </div>
          <div className='flex items-center gap-3'>
            <div className='text-right'>
              <div className='text-sm text-gray-600'>
                {appState === 'results' ? 'Total Selected' : 'Selected'}
              </div>
              <div className='text-2xl font-bold text-blue-600'>
                {getSelectedCount()}
              </div>
            </div>
          </div>
        </div>
        {/* Status Indicator */}
        {appState === 'build' && hasUnsavedChanges && (
          <div className='flex items-center gap-2 mb-4 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2'>
            <AlertCircle className='w-4 h-4' />
            <span>You have unsaved changes</span>
          </div>
        )}

        {appState === 'build' && isSaved && !hasUnsavedChanges && (
          <div className='flex items-center gap-2 mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2'>
            <Check className='w-4 h-4' />
            <span>All changes saved</span>
          </div>
        )}

        {/* Validation Summary */}
        {appState === 'results' && validationResults && (
          <div className='bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-4'>
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
              <div>
                <h3 className='font-semibold text-gray-900 mb-2'>
                  Validation Complete
                </h3>
                <div className='flex flex-wrap gap-3 text-sm'>
                  <div className='flex items-center gap-1'>
                    <div className='w-3 h-3 rounded-full bg-green-500'></div>
                    <span className='font-medium'>
                      {validationResults.summary.passed} Passed
                    </span>
                  </div>
                  <div className='flex items-center gap-1'>
                    <div className='w-3 h-3 rounded-full bg-red-500'></div>
                    <span className='font-medium'>
                      {validationResults.summary.failed} Failed
                    </span>
                  </div>
                  <div className='flex items-center gap-1'>
                    <div className='w-3 h-3 rounded-full bg-gray-400'></div>
                    <span className='font-medium'>
                      {validationResults.summary.skipped} Skipped
                    </span>
                  </div>
                  <div className='text-gray-600'>
                    Response Time:{' '}
                    <span className='font-medium'>
                      {validationResults.responseTime}
                    </span>
                  </div>
                </div>
              </div>
              <div className='flex flex-wrap gap-2'>
                <Button onClick={handleRerun} variant='default' size='sm'>
                  <RotateCcw className='w-4 h-4 mr-2' />
                  Re-run
                </Button>
                <Button
                  onClick={handleEditAssertions}
                  variant='outline'
                  size='sm'
                >
                  <Edit2 className='w-4 h-4 mr-2' />
                  Edit
                </Button>
                <Button variant='outline' size='sm'>
                  <Share2 className='w-4 h-4 mr-2' />
                  Share
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className='flex flex-col lg:flex-row gap-3'>
          <div className='relative flex-1'>
            <Search className='w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' />
            <Input
              placeholder='Search assertions...'
              className='pl-10'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className='w-full lg:w-48'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.label} ({cat.count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className='flex gap-2'>
            <Button
              variant={selectedView === 'all' ? 'default' : 'outline'}
              onClick={() => setSelectedView('all')}
              className='flex-1 lg:flex-none'
            >
              All
            </Button>
            <Button
              variant={selectedView === 'selected' ? 'default' : 'outline'}
              onClick={() => setSelectedView('selected')}
              className='flex-1 lg:flex-none'
            >
              Selected
            </Button>
          </div>

          <Button
            variant='outline'
            onClick={removeAllSelected}
            disabled={getSelectedCount() === 0}
            className='w-full lg:w-auto'
          >
            <Trash2 className='w-4 h-4 mr-2' />
            Clear All
          </Button>
        </div>
      </div>

      {/* Assertions List */}
      <div>
        {(selectedCategory === 'all'
          ? Object.keys(groupedAssertions)
          : [selectedCategory]
        )
          .filter((key) => key !== 'all' && groupedAssertions[key])
          .map((categoryKey) => {
            const labels: Record<string, string> = {
              body: 'Response Body',
              headers: 'Response Headers',
              'HeaderGuard™': 'HeaderGuard™ Security',
              performance: 'Performance Metrics',
              status: 'Status Code',
            };
            return renderCategorySection(
              categoryKey,
              labels[categoryKey] || categoryKey
            );
          })}
      </div>

      {/* Quick Add Section */}
      {appState === 'build' && (
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-5 md:p-6'>
          <h3 className='font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm sm:text-base'>
            <Plus className='w-5 h-5' />
            Quick Add Custom Assertion
          </h3>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3'>
            <Input
              placeholder='Field path'
              value={quickAddData.field}
              onChange={(e) =>
                setQuickAddData({ ...quickAddData, field: e.target.value })
              }
            />
            <Select
              value={quickAddData.operator}
              onValueChange={(value) =>
                setQuickAddData({ ...quickAddData, operator: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='equals'>equals</SelectItem>
                <SelectItem value='contains'>contains</SelectItem>
                <SelectItem value='not contains'>not contains</SelectItem>
                <SelectItem value='exists'>exists</SelectItem>
                <SelectItem value='type'>type</SelectItem>
                <SelectItem value='lessThan'>lessThan</SelectItem>
                <SelectItem value='greaterThan'>greaterThan</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder='Expected value'
              value={quickAddData.value}
              onChange={(e) =>
                setQuickAddData({ ...quickAddData, value: e.target.value })
              }
            />
            <Button
              onClick={handleQuickAdd}
              disabled={!quickAddData.field || !quickAddData.value}
            >
              Add Assertion
            </Button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className='flex flex-col sm:flex-row justify-end gap-3'>
        {appState === 'build' && (
          <>
            <Button
              onClick={handleVerifyAssertions}
              disabled={getSelectedCount() === 0}
              variant='default'
            >
              <Play className='w-5 h-5 mr-2' />
              Verify {getSelectedCount() > 0 && `${getSelectedCount()} `}
              Assertions
            </Button>

            <div className='relative' ref={saveMenuRef}>
              <Button
                onClick={() => setShowSaveMenu(!showSaveMenu)}
                disabled={getSelectedCount() === 0}
                variant='outline'
              >
                <Save className='w-5 h-5 mr-2' />
                Save Assertions
                <ChevronDown className='w-4 h-4 ml-2' />
              </Button>

              {showSaveMenu && (
                <div className='absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10'>
                  <button
                    onClick={handleSaveAssertions}
                    className='w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 flex items-center gap-3'
                  >
                    <Save className='w-4 h-4 text-gray-600' />
                    <div>
                      <div className='font-medium text-gray-900 text-sm'>
                        Save Only
                      </div>
                      <div className='text-xs text-gray-500'>
                        Persist to database
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={handleSaveAndVerify}
                    className='w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors rounded-b-lg flex items-center gap-3'
                  >
                    <div className='flex items-center gap-1'>
                      <Save className='w-4 h-4 text-gray-600' />
                      <Play className='w-3 h-3 text-gray-600' />
                    </div>
                    <div>
                      <div className='font-medium text-gray-900 text-sm'>
                        Save & Verify
                      </div>
                      <div className='text-xs text-gray-500'>
                        Save then run validation
                      </div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {appState === 'validating' && (
          <Button disabled variant='default'>
            <Loader2 className='w-5 h-5 mr-2 animate-spin' />
            Validating assertions...
          </Button>
        )}
      </div>

      {/* Add Assertion Modal */}
      {showAddModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-start sm:items-center justify-center z-50 overflow-y-auto'>
          <div className='bg-white rounded-lg shadow-xl w-full max-w-2xl my-4 mx-3 sm:mx-4 flex flex-col max-h-[calc(100vh-2rem)]'>
            <div className='flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 flex-shrink-0'>
              <h2 className='text-lg sm:text-xl font-bold text-gray-900'>
                Add Assertion
              </h2>
              <button
                onClick={closeAddModal}
                className='p-1 hover:bg-gray-100 rounded transition-colors'
              >
                <X className='w-5 h-5 text-gray-500' />
              </button>
            </div>

            <div className='p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto flex-1'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Field
                </label>
                <div className='px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 border border-gray-200 rounded-lg font-mono text-xs sm:text-sm text-gray-900 break-all'>
                  {modalData.field}
                </div>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-3'>
                  Operator
                </label>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3'>
                  {getOperatorsByDataType(modalData.dataType).map((op) => (
                    <Button
                      key={op}
                      onClick={() =>
                        setModalData({ ...modalData, operator: op })
                      }
                      variant={
                        modalData.operator === op ? 'default' : 'outline'
                      }
                      className='justify-start'
                    >
                      {op}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Expected Value
                </label>
                <Input
                  value={modalData.value}
                  onChange={(e) =>
                    setModalData({ ...modalData, value: e.target.value })
                  }
                  placeholder='Enter expected value'
                />
              </div>

              <div className='bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4'>
                <div className='text-sm font-medium text-gray-700 mb-2'>
                  Preview
                </div>
                <div className='font-mono text-xs sm:text-sm text-gray-900 break-all'>
                  <span className='text-blue-600'>{modalData.field}</span>{' '}
                  <span className='text-gray-600'>{modalData.operator}</span>{' '}
                  <span className='text-blue-600'>
                    {modalData.value || '...'}
                  </span>
                </div>
              </div>
            </div>

            <div className='bg-gray-50 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 p-4 sm:p-6 border-t border-gray-200 flex-shrink-0'>
              <Button
                onClick={closeAddModal}
                variant='outline'
                className='w-full sm:w-auto'
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddAssertion}
                disabled={!modalData.value}
                className='w-full sm:w-auto'
              >
                Add Assertion
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Footer */}
      <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-4'>
        <div className='flex items-center justify-between'>
          <div className='text-sm text-gray-600'>
            Showing{' '}
            {selectedView === 'all'
              ? localAssertions.length
              : getSelectedCount()}{' '}
            of {localAssertions.length} assertions
          </div>
          {getSelectedCount() > 0 && (
            <div className='text-sm font-medium text-blue-600'>
              {getSelectedCount()} assertions are enabled for validation
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default ApiAssertionInterface;
