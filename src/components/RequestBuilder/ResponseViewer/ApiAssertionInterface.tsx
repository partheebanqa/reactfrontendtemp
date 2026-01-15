'use client';

import type React from 'react';
import { useState, useMemo, useRef, useEffect } from 'react';
import {
  Check,
  X,
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
  Loader2,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  inferDataType,
  getFieldAssertionConfig,
  getOperatorsByDataType,
  getOperatorDisplayLabel,
} from '@/lib/assertion-utils';
import {
  useSaveAssertionsMutation,
  useValidateAssertionsMutation,
} from '@/store/assertionValidation';
import {
  SaveAssertion,
  ValidationPayload,
} from '@/services/assertionValidation.service';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useDataManagement } from '@/hooks/useDataManagement';

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
  dataType?: string;
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
  workspaceId?: string;
  environmentId?: string;
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
  const { activeEnvironment } = useDataManagement();

  const { currentWorkspace } = useWorkspace();
  const saveMenuRef = useRef<HTMLDivElement>(null);
  const [localAssertions, setLocalAssertions] =
    useState<Assertion[]>(assertions);
  const [selectedView, setSelectedView] = useState<'all' | 'selected'>('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [appState, setAppState] = useState<'build' | 'validating' | 'results'>(
    'build'
  );
  const [selectedAssertions, setSelectedAssertions] = useState<Assertion[]>([]);

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
  const [quickAddData, setQuickAddData] = useState({
    field: '',
    operator: 'equals',
    value: '',
  });

  const [expandedAddForm, setExpandedAddForm] = useState<string | null>(null);
  const [inlineFormData, setInlineFormData] = useState({
    field: '',
    operator: 'equals',
    value: '',
    dataType: 'string',
  });

  const [expandedEditForm, setExpandedEditForm] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({
    field: '',
    operator: 'equals',
    value: '',
    dataType: 'string',
  });

  console.log('editFormData:', editFormData);

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

    // Remove duplicates based on unique key combination
    const uniqueAssertions = localAssertions.filter(
      (assertion, index, self) => {
        return (
          index ===
          self.findIndex((a) => {
            // Create unique key based on category, type, field, and expectedValue
            const key1 = `${a.category}-${a.type}-${a.field || ''}-${
              a.expectedValue
            }`;
            const key2 = `${assertion.category}-${assertion.type}-${
              assertion.field || ''
            }-${assertion.expectedValue}`;
            return key1 === key2;
          })
        );
      }
    );

    uniqueAssertions.forEach((assertion) => {
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
  };

  const removeAllSelected = () => {
    const updated = localAssertions.map((a) => ({ ...a, enabled: false }));
    setLocalAssertions(updated);
    setHasUnsavedChanges(true);
    if (onUpdateAssertions) {
      onUpdateAssertions(updated);
    }
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => ({ ...prev, [category]: !prev[category] }));
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

  const handleQuickAdd = () => {
    if (!quickAddData.field || !quickAddData.value) {
      return;
    }
    const detectedType = inferDataType(quickAddData.value);
    const config = getFieldAssertionConfig(
      quickAddData.operator,
      quickAddData.value,
      quickAddData.field,
      detectedType
    );

    const newAssertion: Assertion = {
      id: `manual_${Date.now()}`,
      field: config.field,
      type: config.type,
      description: config.description,
      operator: config.operator,
      expectedValue: config.expectedValue,
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
  };

  const handleExpandAddForm = (
    assertionId: string,
    field: string,
    category: string
  ) => {
    if (expandedAddForm === assertionId) {
      handleCancelInlineAdd();
      return;
    }

    if (expandedEditForm) {
      handleCancelEdit();
    }

    if (category === 'status') {
      setExpandedAddForm(assertionId);
      setInlineFormData({
        field: 'status',
        operator: 'equals',
        value: '',
        dataType: 'number',
      });
      return;
    }

    // Find the current assertion to detect its data type
    const currentAssertion = localAssertions.find((a) => a.id === assertionId);

    // STEP 1: Use dataType from assertion if available, otherwise infer
    let detectedType = 'string'; // default fallback

    if (currentAssertion) {
      // Priority 1: Use the dataType field if it exists
      if (currentAssertion.dataType) {
        detectedType = currentAssertion.dataType;
      }
      // Priority 2: Infer from expectedValue if it exists
      else if (
        currentAssertion.expectedValue !== undefined &&
        currentAssertion.expectedValue !== null &&
        currentAssertion.expectedValue !== ''
      ) {
        detectedType = inferDataType(currentAssertion.expectedValue);
      }
      // Priority 3: Infer from assertion type
      else if (
        category === 'performance' ||
        currentAssertion.type.includes('time') ||
        currentAssertion.type.includes('size')
      ) {
        detectedType = 'number';
      } else if (
        currentAssertion.type.includes('array') ||
        currentAssertion.type === 'arrayLength'
      ) {
        detectedType = 'array';
      } else if (
        currentAssertion.type.includes('boolean') ||
        currentAssertion.type.includes('true') ||
        currentAssertion.type.includes('false')
      ) {
        detectedType = 'boolean';
      }
      // Priority 4: Infer from field name
      else if (field) {
        const lowerField = field.toLowerCase();
        if (
          lowerField.includes('count') ||
          lowerField.includes('size') ||
          lowerField.includes('length') ||
          lowerField.includes('age') ||
          lowerField.includes('id')
        ) {
          detectedType = 'number';
        } else if (
          lowerField.includes('is') ||
          lowerField.includes('has') ||
          lowerField.includes('active') ||
          lowerField.includes('enabled')
        ) {
          detectedType = 'boolean';
        } else if (
          lowerField.includes('array') ||
          lowerField.includes('list') ||
          lowerField.includes('items')
        ) {
          detectedType = 'array';
        }
      }
    }

    const availableOperators = getOperatorsByDataType(detectedType);

    setExpandedAddForm(assertionId);
    setInlineFormData({
      field: field || '',
      operator: availableOperators[0] || 'equals',
      value: '',
      dataType: detectedType,
    });
  };

  const handleCancelInlineAdd = () => {
    setExpandedAddForm(null);
    setInlineFormData({
      field: '',
      operator: 'equals',
      value: '',
      dataType: 'string',
    });
  };

  const handleSaveInlineAssertion = (category: string) => {
    if (!inlineFormData.field || !inlineFormData.value) {
      return;
    }

    if (category === 'status') {
      const newAssertion: Assertion = {
        id: `custom_${Date.now()}`,
        field: undefined, // Status doesn't need a field
        type: 'status_equals',
        description: `Status code equals ${inlineFormData.value}`,
        operator: 'equals',
        expectedValue: inlineFormData.value,
        enabled: true,
        category: 'status',
        group: 'custom',
      };
      const updated = [...localAssertions, newAssertion];
      setLocalAssertions(updated);
      setHasUnsavedChanges(true);
      if (onUpdateAssertions) {
        onUpdateAssertions(updated);
      }
      handleCancelInlineAdd();
      return;
    }

    const config = getFieldAssertionConfig(
      inlineFormData.operator,
      inlineFormData.value,
      inlineFormData.field,
      inlineFormData.dataType
    );

    const newAssertion: Assertion = {
      id: `custom_${Date.now()}`,
      field: config.field,
      type: config.type,
      description: config.description,
      operator: config.operator,
      expectedValue: config.expectedValue,
      enabled: true,
      category: category,
      group: 'custom',
    };
    const updated = [...localAssertions, newAssertion];
    setLocalAssertions(updated);
    setHasUnsavedChanges(true);
    if (onUpdateAssertions) {
      onUpdateAssertions(updated);
    }
    handleCancelInlineAdd();
  };

  const handleExpandEditForm = (assertion: Assertion) => {
    if (expandedEditForm === assertion.id) {
      handleCancelEdit();
      return;
    }

    if (expandedAddForm) {
      handleCancelInlineAdd();
    }

    setExpandedEditForm(assertion.id);
    const detectedType = inferDataType(assertion.expectedValue);
    setEditFormData({
      field: assertion.field || '',
      operator: assertion.operator || 'equals',
      value: String(assertion.expectedValue || ''),
      dataType: detectedType,
    });
  };

  const handleCancelEdit = () => {
    setExpandedEditForm(null);
    setEditFormData({
      field: '',
      operator: 'equals',
      value: '',
      dataType: 'string',
    });
  };

  const handleSaveEdit = (assertionId: string) => {
    if (!editFormData.value) {
      return;
    }

    // Find the assertion being edited to check its category
    const assertionBeingEdited = localAssertions.find(
      (a) => a.id === assertionId
    );

    // Handle status assertions differently
    if (assertionBeingEdited?.category === 'status') {
      const updated = localAssertions.map((a) =>
        a.id === assertionId
          ? {
              ...a,
              expectedValue: editFormData.value,
              description: `Status code equals ${editFormData.value}`,
              type: 'status_equals', // ✅ ADDED: Preserve the correct type
              operator: 'equals', // ✅ ADDED: Preserve the operator
            }
          : a
      );
      setLocalAssertions(updated);
      setHasUnsavedChanges(true);
      if (onUpdateAssertions) {
        onUpdateAssertions(updated);
      }
      handleCancelEdit();
      return;
    }

    // Handle non-status assertions with full config
    if (!editFormData.field) {
      return;
    }

    const config = getFieldAssertionConfig(
      editFormData.operator,
      editFormData.value,
      editFormData.field,
      editFormData.dataType
    );

    const updated = localAssertions.map((a) =>
      a.id === assertionId
        ? {
            ...a,
            field: config.field,
            operator: config.operator,
            type: config.type,
            expectedValue: config.expectedValue,
            description: config.description,
          }
        : a
    );
    setLocalAssertions(updated);
    setHasUnsavedChanges(true);
    if (onUpdateAssertions) {
      onUpdateAssertions(updated);
    }
    handleCancelEdit();
  };

  const validationMutation = useValidateAssertionsMutation({
    onSuccess: (data) => {
      const mappedResults: ValidationResult[] = data.assertionResults.map(
        (result) => {
          // Find the original assertion by matching multiple fields for better accuracy
          const originalAssertion = localAssertions.find((a) => {
            const categoryMatch = a.category === result.category;
            const typeMatch = a.type === result.type;
            const fieldMatch = !result.field || a.field === result.field;

            // ADDED: Also match by expectedValue for better accuracy
            const expectedValueMatch =
              result.expectedValue === undefined ||
              String(a.expectedValue) === String(result.expectedValue);

            return (
              categoryMatch && typeMatch && fieldMatch && expectedValueMatch
            );
          });

          return {
            id:
              originalAssertion?.id || `result_${Date.now()}_${Math.random()}`,
            category: result.category,
            type: result.type,
            description: result.description,
            field: result.field,
            operator: result.operator,
            expectedValue: result.expectedValue,
            enabled: originalAssertion?.enabled ?? true,
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

      console.log('Validation complete:', {
        passed: summary.passed,
        failed: summary.failed,
        total: summary.total,
      });

      setAppState('results');
      setSelectedView('selected');
    },
    onError: (error) => {
      console.error('Validation error:', error);
      setAppState('build');
      console.error('Validation failed:', error.message);
    },
  });

  const saveAssertionsMutation = useSaveAssertionsMutation({
    onSuccess: (data) => {
      setSelectedView('selected');
      console.log('Assertions saved successfully:', data);
      setIsSaved(true);
      setHasUnsavedChanges(false);
      setShowSaveMenu(false);
      // You can add a toast notification here
    },
    onError: (error) => {
      console.error('Failed to save assertions:', error);
      // You can add an error toast notification here
    },
  });

  const handleVerifyAssertions = async () => {
    if (getSelectedCount() === 0) {
      // toast({
      //   title: 'No assertions selected',
      //   description: 'Please select at least one assertion to verify',
      //   variant: 'destructive',
      //   duration: 3000,
      // });
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
    if (!responseData?.requestId) {
      console.error('No request ID available');
      return;
    }

    // Map localAssertions to the format expected by the API
    const assertionsToSave: SaveAssertion[] = localAssertions
      .filter((a) => a.enabled) // Only save enabled assertions
      .map((assertion) => ({
        category: assertion.category,
        description: assertion.description,
        enabled: assertion.enabled,
        ...(assertion.expectedValue !== undefined && {
          expectedValue: String(assertion.expectedValue),
        }),
        ...(assertion.field && { field: assertion.field }),
        ...(assertion.group && { group: assertion.group }),
        ...(assertion.impact && { impact: assertion.impact }),
        ...(assertion.operator && { operator: assertion.operator }),
        requestId: responseData.requestId,
        ...(assertion.priority && { severity: assertion.priority }), // Map priority to severity
        type: assertion.type,
      }));

    // Prepare the payload
    const payload = {
      assertions: assertionsToSave,
      environmentId: activeEnvironment?.id,
      workspaceId: currentWorkspace?.id,
    };

    try {
      await saveAssertionsMutation.mutateAsync({
        requestId: responseData.requestId,
        payload,
      });

      // Call the parent callback if provided
      if (onSaveAssertions) {
        await onSaveAssertions();
      }
    } catch (error) {
      console.error('Error saving assertions:', error);
    }
  };

  const handleSaveAndVerify = async () => {
    await handleSaveAssertions();

    // Wait a bit for the save to complete
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Only run verification if save was successful
    if (!saveAssertionsMutation.isError) {
      handleVerifyAssertions();
    }

    setShowSaveMenu(false);
  };

  const handleRerun = () => {
    setAppState('build');
    setTimeout(() => handleVerifyAssertions(), 100);
  };

  const handleEditAssertions = () => {
    setAppState('build');
    setValidationResults(null);
  };

  const AssertionTypeIcon = ({
    assertion,
  }: {
    assertion: Assertion | ValidationResult;
  }) => {
    const operatorToUse = assertion.operator || assertion.type;

    const icons: Record<string, string> = {
      // Operator-based mappings
      equals: '=',
      exists: '✓',
      type: 'T',
      contains: '⊃',
      'not contains': '⊄',
      lessThan: '<',
      greaterThan: '>',
      arrayLength: '#',

      // Type-based mappings (when operator is missing)
      field_contains: '⊃',
      field_equals: '=',
      field_exists: '✓',
      field_type: 'T',
      field_not_contains: '⊄',
      status_equals: '=',
      response_time: '⏱',
      response_time_less_than: '<',
      header_exists: '✓',
      header_equals: '=',
      header_contains: '⊃',
      security_header_missing: '🛡',
      // Add more type mappings as needed
    };

    return (
      <span className='text-xs font-mono font-semibold'>
        {icons[operatorToUse] || '='}
      </span>
    );
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
    console.log('assertion-render:', assertion);

    const validationResult = validationResults?.results?.find(
      (r) => r.id === assertion.id
    );
    const hasResult = validationResult && appState === 'results';
    const isExpanded = expandedAddForm === assertion.id;
    const isEditing = expandedEditForm === assertion.id;

    return (
      <div key={assertion.id} className='space-y-0 '>
        <div
          className={`group flex flex-col sm:flex-row sm:items-start gap-3 p-4 border transition-all ${
            isExpanded || isEditing ? 'rounded-t-lg border-b-0' : 'rounded-lg'
          } ${
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
                  {hasResult ? (
                    validationResult.result === 'passed' ? (
                      '✓'
                    ) : (
                      '✗'
                    )
                  ) : (
                    <AssertionTypeIcon assertion={assertion} />
                  )}
                </div>

                <div className='flex items-center gap-2 flex-1 min-w-0'>
                  {assertion.category === 'status' ? (
                    <>
                      <span className='font-medium text-gray-900 font-mono text-sm'>
                        status
                      </span>
                      <span className='text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded whitespace-nowrap'>
                        =
                      </span>
                      <span className='text-sm text-gray-700 font-mono'>
                        <span className='text-blue-600'>
                          {assertion.expectedValue}
                        </span>
                      </span>
                    </>
                  ) : (
                    <>
                      {assertion.field && (
                        <span className='font-medium text-gray-900 font-mono text-sm truncate'>
                          {assertion.field}
                        </span>
                      )}
                      {assertion.operator && (
                        <span className='text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded whitespace-nowrap'>
                          {getOperatorDisplayLabel(assertion.operator)}{' '}
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
                    </>
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
                  <div className='font-semibold'>
                    Failed: {validationResult.failureReason}
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
                  onClick={() => handleExpandEditForm(assertion)}
                  className={`p-1 rounded transition-all ${
                    expandedEditForm === assertion.id
                      ? 'bg-blue-600 text-white'
                      : 'sm:opacity-0 sm:group-hover:opacity-100 hover:bg-gray-100 text-gray-500'
                  }`}
                  title='Edit assertion'
                >
                  <Edit2 className='w-4 h-4' />
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
                  handleExpandAddForm(
                    assertion.id,
                    assertion.field || '',
                    assertion.category
                  )
                }
                className={`p-1 rounded transition-all ${
                  isExpanded
                    ? 'bg-blue-600 text-white'
                    : 'sm:opacity-0 sm:group-hover:opacity-100 hover:bg-blue-100 text-blue-600'
                }`}
                title='Create similar assertion'
              >
                <Plus className='w-4 h-4' />
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
        {isExpanded && appState === 'build' && (
          <div className='bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-300 border-t-0 rounded-b-lg p-4 space-y-4 shadow-inner'>
            <div className='flex items-center gap-2 mb-2'>
              <Zap className='w-4 h-4 text-blue-600' />
              <h4 className='font-semibold text-gray-900 text-sm'>
                {assertion.category === 'status'
                  ? 'Add Status Code Assertion'
                  : 'Create Similar Assertion'}
              </h4>
            </div>

            {/* MODIFIED: Conditional rendering based on category */}
            {assertion.category === 'status' ? (
              // Simple form for status - only value input
              <div>
                <label className='block text-xs font-medium text-gray-700 mb-1'>
                  Expected Status Code
                </label>
                <Input
                  type='number'
                  value={inlineFormData.value}
                  onChange={(e: any) =>
                    setInlineFormData({
                      ...inlineFormData,
                      value: e.target.value,
                    })
                  }
                  placeholder='e.g., 200, 404, 500'
                />
                <p className='text-xs text-gray-500 mt-1'>
                  Status assertions always check if the response status code
                  equals your expected value
                </p>
              </div>
            ) : (
              // Original full form for other categories
              <>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                  <div>
                    <label className='block text-xs font-medium text-gray-700 mb-1'>
                      Field Path
                    </label>
                    <Input
                      value={inlineFormData.field}
                      onChange={(e: any) =>
                        setInlineFormData({
                          ...inlineFormData,
                          field: e.target.value,
                        })
                      }
                      placeholder='e.g., data.user.email'
                    />
                  </div>

                  <div>
                    <label className='block text-xs font-medium text-gray-700 mb-1'>
                      Data Type
                    </label>
                    <Select
                      value={inlineFormData.dataType}
                      onValueChange={(newDataType: string) => {
                        setInlineFormData({
                          ...inlineFormData,
                          dataType: newDataType,
                          operator: getOperatorsByDataType(newDataType)[0],
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='string'>String</SelectItem>
                        <SelectItem value='number'>Number</SelectItem>
                        <SelectItem value='boolean'>Boolean</SelectItem>
                        <SelectItem value='date'>Date</SelectItem>
                        <SelectItem value='null'>null</SelectItem>
                        <SelectItem value='object'>Object</SelectItem>
                        <SelectItem value='array'>Array</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                  <div>
                    <label className='block text-xs font-medium text-gray-700 mb-1'>
                      Operator
                    </label>
                    <Select
                      value={inlineFormData.operator}
                      onValueChange={(value: string) =>
                        setInlineFormData({
                          ...inlineFormData,
                          operator: value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {getOperatorsByDataType(inlineFormData.dataType).map(
                          (op) => (
                            <SelectItem key={op} value={op}>
                              {getOperatorDisplayLabel(op)}{' '}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className='block text-xs font-medium text-gray-700 mb-1'>
                      Expected Value
                    </label>
                    <Input
                      value={inlineFormData.value}
                      onChange={(e: any) =>
                        setInlineFormData({
                          ...inlineFormData,
                          value: e.target.value,
                        })
                      }
                      placeholder='Enter expected value'
                    />
                  </div>
                </div>
              </>
            )}

            {/* MODIFIED: Conditional preview */}
            <div className='bg-white border border-blue-200 rounded-lg p-3'>
              <div className='text-xs font-medium text-gray-600 mb-1'>
                Preview
              </div>
              <div className='font-mono text-sm text-gray-900'>
                {assertion.category === 'status' ? (
                  <>
                    <span className='text-blue-600'>status</span>{' '}
                    <span className='text-gray-600'>=</span>{' '}
                    <span className='text-blue-600'>
                      {inlineFormData.value || '...'}
                    </span>
                  </>
                ) : (
                  <>
                    <span className='text-blue-600'>
                      {inlineFormData.field || '...'}
                    </span>{' '}
                    <span className='text-gray-600'>
                      {getOperatorDisplayLabel(inlineFormData.operator)}
                    </span>{' '}
                    <span className='text-blue-600'>
                      {inlineFormData.value || '...'}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className='flex justify-end gap-2 pt-2 border-t border-blue-200'>
              <Button onClick={handleCancelInlineAdd} variant='outline'>
                Cancel
              </Button>
              <Button
                onClick={() => handleSaveInlineAssertion(assertion.category)}
                disabled={!inlineFormData.value}
              >
                <Plus className='w-4 h-4 mr-1' />
                Add Assertion
              </Button>
            </div>
          </div>
        )}
        {isEditing && appState === 'build' && (
          <div className='bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-300 border-t-0 rounded-b-lg p-4 space-y-4 shadow-inner'>
            <div className='flex items-center gap-2 mb-2'>
              <Edit2 className='w-4 h-4 text-purple-600' />
              <h4 className='font-semibold text-gray-900 text-sm'>
                {assertion.category === 'status'
                  ? 'Edit Status Code Assertion'
                  : 'Edit Assertion'}
              </h4>
            </div>

            {/* MODIFIED: Conditional rendering based on category */}
            {assertion.category === 'status' ? (
              // Simple form for status - only value input
              <div>
                <label className='block text-xs font-medium text-gray-700 mb-1'>
                  Expected Status Code
                </label>
                <Input
                  type='number'
                  value={editFormData.value}
                  onChange={(e: any) =>
                    setEditFormData({
                      ...editFormData,
                      value: e.target.value,
                    })
                  }
                  placeholder='e.g., 200, 404, 500'
                />
                <p className='text-xs text-gray-500 mt-1'>
                  Status assertions always check if the response status code
                  equals your expected value
                </p>
              </div>
            ) : (
              // Original full form for other categories
              <>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                  <div>
                    <label className='block text-xs font-medium text-gray-700 mb-1'>
                      Field Path
                    </label>
                    <Input
                      value={editFormData.field}
                      onChange={(e: any) =>
                        setEditFormData({
                          ...editFormData,
                          field: e.target.value,
                        })
                      }
                      placeholder='e.g., data.user.email'
                    />
                  </div>

                  <div>
                    <label className='block text-xs font-medium text-gray-700 mb-1'>
                      Data Type
                    </label>
                    <Select
                      value={editFormData.dataType}
                      onValueChange={(newDataType: string) => {
                        setEditFormData({
                          ...editFormData,
                          dataType: newDataType,
                          operator: getOperatorsByDataType(newDataType)[0],
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='string'>String</SelectItem>
                        <SelectItem value='number'>Number</SelectItem>
                        <SelectItem value='boolean'>Boolean</SelectItem>
                        <SelectItem value='date'>Date</SelectItem>
                        <SelectItem value='object'>Object</SelectItem>
                        <SelectItem value='null'>null</SelectItem>
                        <SelectItem value='array'>Array</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                  <div>
                    <label className='block text-xs font-medium text-gray-700 mb-1'>
                      Operator
                    </label>
                    <Select
                      value={editFormData.operator}
                      onValueChange={(value: string) =>
                        setEditFormData({ ...editFormData, operator: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {getOperatorsByDataType(editFormData.dataType).map(
                          (op) => (
                            <SelectItem key={op} value={op}>
                              {getOperatorDisplayLabel(op)}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className='block text-xs font-medium text-gray-700 mb-1'>
                      Expected Value
                    </label>
                    <Input
                      value={editFormData.value}
                      onChange={(e: any) =>
                        setEditFormData({
                          ...editFormData,
                          value: e.target.value,
                        })
                      }
                      placeholder='Enter expected value'
                    />
                  </div>
                </div>
              </>
            )}

            {/* MODIFIED: Conditional preview */}
            <div className='bg-white border border-purple-200 rounded-lg p-3'>
              <div className='text-xs font-medium text-gray-600 mb-1'>
                Preview
              </div>
              <div className='font-mono text-sm text-gray-900'>
                {assertion.category === 'status' ? (
                  <>
                    <span className='text-purple-600'>status</span>{' '}
                    <span className='text-gray-600'>=</span>{' '}
                    <span className='text-purple-600'>
                      {editFormData.value || '...'}
                    </span>
                  </>
                ) : (
                  <>
                    <span className='text-purple-600'>
                      {editFormData.field || '...'}
                    </span>{' '}
                    <span className='text-gray-600'>
                      {getOperatorDisplayLabel(editFormData.operator)}
                    </span>{' '}
                    <span className='text-purple-600'>
                      {editFormData.value || '...'}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className='flex justify-end gap-2 pt-2 border-t border-purple-200'>
              <Button onClick={handleCancelEdit} variant='outline'>
                Cancel
              </Button>
              <Button
                onClick={() => handleSaveEdit(assertion.id)}
                disabled={!editFormData.value}
              >
                <Save className='w-4 h-4 mr-1' />
                Save Changes
              </Button>
            </div>
          </div>
        )}
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

            <div className='space-y-3 ml-2 mt-2'>
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
          <h2 className='text-xl sm:text-2xl font-semibold text-gray-900 mb-2'>
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
    <div className='space-y-3 ml-2 mt-2'>
      <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-5 md:p-6'>
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4'>
          <div>
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
                {appState === 'results' ? 'Total Selected' : 'Selected'}:{' '}
                <span className='text-2xl font-bold text-blue-600'>
                  {' '}
                  {getSelectedCount()}{' '}
                </span>
              </div>
            </div>
          </div>
        </div>

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

        <div className='flex flex-col lg:flex-row gap-3'>
          {/* Category Selector - Left side, smaller width */}
          <div className='lg:w-52'>
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger>
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
          </div>

          {/* Search Bar - Center, larger width */}
          <div className='relative flex-1 lg:max-w-3xl lg:mx-auto'>
            <Search className='w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' />
            <Input
              placeholder='Search assertions...'
              className='pl-10'
              value={searchQuery}
              onChange={(e: any) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Action Buttons - Right side */}
          <div className='flex gap-2 lg:ml-auto'>
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

          {/* Clear All Button */}
          <Button
            variant='outline'
            onClick={removeAllSelected}
            disabled={getSelectedCount() === 0}
            className='w-full lg:w-auto bg-transparent'
          >
            <Trash2 className='w-4 h-4 mr-2' />
            Clear All
          </Button>
        </div>
      </div>

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

      {appState === 'build' && (
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-5 md:p-6'>
          <h3 className='font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm sm:text-base'>
            <Plus className='w-5 h-5' />
            Quick Add Custom Assertion
          </h3>
          <p className='text-xs text-gray-500 mb-3'>
            For status code assertions, use the "+" button in the Status Code
            section
          </p>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3'>
            <Input
              placeholder='Field path'
              value={quickAddData.field}
              onChange={(e: any) =>
                setQuickAddData({ ...quickAddData, field: e.target.value })
              }
            />
            <Select
              value={quickAddData.operator}
              onValueChange={(value: string) =>
                setQuickAddData({ ...quickAddData, operator: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='equals'>Equals (=)</SelectItem>
                <SelectItem value='contains'>Contains</SelectItem>
                <SelectItem value='field_not_contains'>
                  Not Contains
                </SelectItem>{' '}
                <SelectItem value='exists'>Exists</SelectItem>
                <SelectItem value='field_type'>Type Check</SelectItem>{' '}
                <SelectItem value='field_less_than'>
                  Less Than (&lt;)
                </SelectItem>{' '}
                <SelectItem value='field_greater_than'>
                  Greater Than (&gt;)
                </SelectItem>{' '}
                <SelectItem value='array_length'>Array Length</SelectItem>{' '}
              </SelectContent>
            </Select>
            <Input
              placeholder='Expected value'
              value={quickAddData.value}
              onChange={(e: any) =>
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
                disabled={
                  getSelectedCount() === 0 || saveAssertionsMutation.isPending
                }
                variant='outline'
              >
                {saveAssertionsMutation.isPending ? (
                  <Loader2 className='w-5 h-5 mr-2 animate-spin' />
                ) : (
                  <Save className='w-5 h-5 mr-2' />
                )}
                Save Assertions
                <ChevronDown className='w-4 h-4 ml-2' />
              </Button>

              {showSaveMenu && (
                <div className='absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10'>
                  <button
                    onClick={handleSaveAssertions}
                    disabled={saveAssertionsMutation.isPending}
                    className='w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    {saveAssertionsMutation.isPending ? (
                      <Loader2 className='w-4 h-4 text-gray-600 animate-spin' />
                    ) : (
                      <Save className='w-4 h-4 text-gray-600' />
                    )}
                    <div>
                      <div className='font-medium text-gray-900 text-sm'>
                        {saveAssertionsMutation.isPending
                          ? 'Saving...'
                          : 'Save Only'}
                      </div>
                      <div className='text-xs text-gray-500'>
                        Persist to database
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={handleSaveAndVerify}
                    disabled={saveAssertionsMutation.isPending}
                    className='w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors rounded-b-lg flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    <div className='flex items-center gap-1'>
                      {saveAssertionsMutation.isPending ? (
                        <Loader2 className='w-4 h-4 text-gray-600 animate-spin' />
                      ) : (
                        <>
                          <Save className='w-4 h-4 text-gray-600' />
                          <Play className='w-3 h-3 text-gray-600' />
                        </>
                      )}
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
