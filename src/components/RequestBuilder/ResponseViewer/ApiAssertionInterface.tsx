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
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Clock,
  TrendingUp,
  Settings,
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
import AssertionResults from './AssertionReport';

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
  status?: string; // ADD THIS - from API "status" field
  responseStatus?: number; // ADD THIS
  responseTime?: number; // ADD THIS
  responseSize?: number; // ADD THIS
  errorMessage?: string; // ADD THIS - from API
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
  const [failedAssertions, setFailedAssertions] = useState<Assertion[]>([]);
  const [isRerunMode, setIsRerunMode] = useState(false);

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
  const [validationHistory, setValidationHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [resultsViewMode, setResultsViewMode] = useState<'table' | 'category'>(
    'table'
  );
  const [currentTab, setCurrentTab] = useState<'build' | 'results'>('build');

  const [tableSortConfig, setTableSortConfig] = useState<{
    key: string | null;
    direction: 'asc' | 'desc';
  }>({
    key: null,
    direction: 'asc',
  });
  const [tableFilterStatus, setTableFilterStatus] = useState<
    'all' | 'passed' | 'failed'
  >('all');
  const [tableFilterCategory, setTableFilterCategory] = useState('all');
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

    const uniqueAssertions = localAssertions.filter(
      (assertion, index, self) => {
        return (
          index ===
          self.findIndex((a) => {
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
      if (assertion.group === 'data_presence') {
        const category = 'data presence';
        if (!grouped[category]) {
          grouped[category] = [];
        }
        grouped[category].push(assertion);
      } else {
        const category = assertion.category || 'other';
        if (!grouped[category]) {
          grouped[category] = [];
        }
        grouped[category].push(assertion);
      }
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
            : category === 'data presence'
            ? 'Data Presence'
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

    const hasSelected = updated.some((a) => a.enabled);
    setHasUnsavedChanges(hasSelected);

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

    // Clear unsaved changes flag since nothing is selected
    setHasUnsavedChanges(false);

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

    if (category === 'performance') {
      const currentAssertion = localAssertions.find(
        (a) => a.id === assertionId
      );
      const isResponseTime = currentAssertion?.type === 'response_time';
      const isPayloadSize = currentAssertion?.type === 'payload_size';

      setExpandedAddForm(assertionId);
      setInlineFormData({
        field: isResponseTime
          ? 'response_time'
          : isPayloadSize
          ? 'payload_size'
          : '',
        operator: 'less_than',
        value: '',
        dataType: 'performance',
      });
      return;
    }

    const currentAssertion = localAssertions.find((a) => a.id === assertionId);

    let detectedType = 'string';

    if (currentAssertion) {
      if (currentAssertion.dataType) {
        detectedType = currentAssertion.dataType;
      } else if (
        currentAssertion.expectedValue !== undefined &&
        currentAssertion.expectedValue !== null &&
        currentAssertion.expectedValue !== ''
      ) {
        detectedType = inferDataType(currentAssertion.expectedValue);
      } else if (
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
      } else if (field) {
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
    // For null and boolean types, value is not required
    const requiresValue =
      inlineFormData.dataType !== 'null' &&
      inlineFormData.dataType !== 'boolean';

    if (!inlineFormData.field || (requiresValue && !inlineFormData.value)) {
      return;
    }

    if (category === 'status') {
      const newAssertion: Assertion = {
        id: `custom_${Date.now()}`,
        field: undefined,
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

    // Handle performance assertions
    if (category === 'performance') {
      const isResponseTime = inlineFormData.field === 'response_time';
      const isPayloadSize = inlineFormData.field === 'payload_size';

      const operatorLabel =
        inlineFormData.operator === 'less_than'
          ? 'less than'
          : inlineFormData.operator === 'greater_than'
          ? 'greater than'
          : 'equals';

      const newAssertion: Assertion = {
        id: `custom_${Date.now()}`,
        field: undefined,
        type: isResponseTime ? 'response_time' : 'payload_size',
        description: isResponseTime
          ? `Response time ${operatorLabel} ${inlineFormData.value}ms`
          : `Payload size ${operatorLabel} ${inlineFormData.value} bytes`,
        operator: inlineFormData.operator,
        expectedValue: inlineFormData.value,
        enabled: true,
        category: 'performance',
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
      ...(inlineFormData.dataType !== 'null' &&
        inlineFormData.dataType !== 'boolean' && {
          expectedValue: config.expectedValue,
        }),
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

    // Detect data type for the edit form
    // Detect data type for the edit form
    let detectedType = 'string';

    if (assertion.category === 'performance') {
      detectedType = 'performance';
    } else if (assertion.dataType) {
      // Use the stored dataType if available (most reliable)
      detectedType = assertion.dataType;
    } else if (
      assertion.type === 'field_null' ||
      assertion.type === 'field_not_null'
    ) {
      // Null type assertions
      detectedType = 'null';
    } else if (
      assertion.type === 'field_is_true' ||
      assertion.type === 'field_is_false'
    ) {
      // Boolean type assertions
      detectedType = 'boolean';
    } else if (
      assertion.type === 'array_length' ||
      assertion.type === 'array_present'
    ) {
      // Array type assertions
      detectedType = 'array';
    } else if (
      assertion.expectedValue !== undefined &&
      assertion.expectedValue !== null &&
      assertion.expectedValue !== ''
    ) {
      // Infer from expected value only if it exists
      detectedType = inferDataType(assertion.expectedValue);
    }

    setEditFormData({
      field:
        assertion.field ||
        (assertion.type === 'response_time'
          ? 'response_time'
          : assertion.type === 'payload_size'
          ? 'payload_size'
          : ''),
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
    // For null and boolean types, value is not required
    const requiresValue =
      editFormData.dataType !== 'null' && editFormData.dataType !== 'boolean';

    if (requiresValue && !editFormData.value) {
      return;
    }

    const assertionBeingEdited = localAssertions.find(
      (a) => a.id === assertionId
    );

    if (assertionBeingEdited?.category === 'status') {
      const updated = localAssertions.map((a) =>
        a.id === assertionId
          ? {
              ...a,
              expectedValue: editFormData.value,
              description: `Status code equals ${editFormData.value}`,
              type: 'status_equals',
              operator: 'equals',
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

    // Handle performance assertions
    if (assertionBeingEdited?.category === 'performance') {
      const isResponseTime = assertionBeingEdited.type === 'response_time';
      const operatorLabel =
        editFormData.operator === 'less_than'
          ? 'less than'
          : editFormData.operator === 'greater_than'
          ? 'greater than'
          : 'equals';

      const updated = localAssertions.map((a) =>
        a.id === assertionId
          ? {
              ...a,
              expectedValue: editFormData.value,
              description: isResponseTime
                ? `Response time ${operatorLabel} ${editFormData.value}ms`
                : `Payload size ${operatorLabel} ${editFormData.value} bytes`,
              type: assertionBeingEdited.type,
              operator: editFormData.operator,
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
            ...(editFormData.dataType !== 'null' &&
              editFormData.dataType !== 'boolean' && {
                expectedValue: config.expectedValue,
              }),
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
          const originalAssertion = localAssertions.find((a) => {
            const categoryMatch = a.category === result.category;
            const typeMatch = a.type === result.type;
            const fieldMatch = !result.field || a.field === result.field;
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
            status: result.status,
            responseStatus: result.responseStatus,
            responseTime: result.responseTime,
            responseSize: result.responseSize,
            errorMessage: result.errorMessage,
          };
        }
      );

      // ✅ MERGE RESULTS IF IN RERUN MODE
      let finalResults: ValidationResult[];

      if (isRerunMode && validationResults) {
        // Keep all previously passed assertions
        const previouslyPassedResults = validationResults.results.filter(
          (r) => r.status === 'passed'
        );

        // Merge with new results (which only contain re-run failed assertions)
        finalResults = [...previouslyPassedResults, ...mappedResults];

        // Remove duplicates (in case an assertion was re-run)
        finalResults = finalResults.filter((result, index, self) => {
          const firstIndex = self.findIndex((r) => {
            const categoryMatch = r.category === result.category;
            const typeMatch = r.type === result.type;
            const fieldMatch = !result.field || r.field === result.field;
            const expectedValueMatch =
              result.expectedValue === undefined ||
              String(r.expectedValue) === String(result.expectedValue);

            return (
              categoryMatch && typeMatch && fieldMatch && expectedValueMatch
            );
          });

          return index === firstIndex;
        });
      } else {
        // Normal run: use all new results
        finalResults = mappedResults;
      }

      // ✅ EXTRACT FAILED ASSERTIONS FROM FINAL RESULTS
      const failedResults = finalResults.filter((r) => r.status === 'failed');

      const failedAssertionsList: Assertion[] = failedResults
        .map((failedResult) => {
          const originalAssertion = localAssertions.find((a) => {
            const categoryMatch = a.category === failedResult.category;
            const typeMatch = a.type === failedResult.type;
            const fieldMatch =
              !failedResult.field || a.field === failedResult.field;
            const expectedValueMatch =
              failedResult.expectedValue === undefined ||
              String(a.expectedValue) === String(failedResult.expectedValue);

            return (
              categoryMatch && typeMatch && fieldMatch && expectedValueMatch
            );
          });

          return originalAssertion;
        })
        .filter(Boolean) as Assertion[];

      setFailedAssertions(failedAssertionsList);

      // ✅ RECALCULATE SUMMARY BASED ON FINAL RESULTS
      const summary = {
        passed: finalResults.filter((r) => r.status === 'passed').length,
        failed: finalResults.filter((r) => r.status === 'failed').length,
        skipped: isRerunMode
          ? 0 // No skipped when re-running
          : selectedAssertions.length - finalResults.length,
        total: finalResults.length,
      };

      const responseTime = data.response?.metrics?.responseTime
        ? `${data.response.metrics.responseTime}ms`
        : data.assertionResults[0]?.responseTime
        ? `${data.assertionResults[0].responseTime}ms`
        : 'N/A';

      setValidationResults({
        results: finalResults, // ✅ USE MERGED RESULTS
        summary,
        timestamp: new Date().toISOString(),
        responseTime,
      });

      setValidationHistory((prev) => {
        const updated = [
          {
            results: finalResults, // ✅ USE MERGED RESULTS
            summary,
            timestamp: new Date().toISOString(),
            responseTime,
          },
          ...prev,
        ];
        return updated.slice(0, 10);
      });

      // ✅ RESET RERUN MODE
      setIsRerunMode(false);

      setAppState('results');
      setCurrentTab('results');
      setSelectedView('selected');
    },
    onError: (error) => {
      console.error('Validation error:', error);
      setAppState('build');
      setCurrentTab('build');
      console.error('Validation failed:', error.message);
    },
  });

  const saveAssertionsMutation = useSaveAssertionsMutation({
    onSuccess: (data) => {
      setSelectedView('selected');
      setIsSaved(true);
      setHasUnsavedChanges(false);
      setShowSaveMenu(false);
    },
    onError: (error) => {
      console.error('Failed to save assertions:', error);
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

    setFailedAssertions([]);

    setIsRerunMode(false);
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
      setCurrentTab('build');
    }
  };

  const handleSaveAssertions = async () => {
    if (!responseData?.requestId) {
      console.error('No request ID available');
      return;
    }

    const assertionsToSave: SaveAssertion[] = localAssertions
      .filter((a) => a.enabled)
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
        ...(assertion.priority && { severity: assertion.priority }),
        type: assertion.type,
      }));

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

      if (onSaveAssertions) {
        await onSaveAssertions();
      }
    } catch (error) {
      console.error('Error saving assertions:', error);
    }
  };

  const handleSaveAndVerify = async () => {
    await handleSaveAssertions();

    await new Promise((resolve) => setTimeout(resolve, 500));

    if (!saveAssertionsMutation.isError) {
      handleVerifyAssertions();
    }

    setShowSaveMenu(false);
  };

  const handleRerunFailed = async () => {
    if (failedAssertions.length === 0) {
      console.log('No failed assertions to re-run');
      return;
    }

    console.log('Re-running failed assertions:', failedAssertions);

    setIsRerunMode(true);

    setAppState('validating');

    const validationPayload: ValidationPayload = {
      assertions: failedAssertions.map((assertion) => ({
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
      console.error('Failed to re-run failed assertions:', error);
      setAppState('build');
      setCurrentTab('build');
    }
  };

  const handleRerun = () => {
    setAppState('build');
    setCurrentTab('build');
    setTimeout(() => handleVerifyAssertions(), 100);
  };

  const handleEditAssertions = () => {
    setAppState('build');
    setCurrentTab('build');
  };

  const getAssertionHistory = (assertionId: string) => {
    const history = validationHistory
      .map((run) => {
        const result = run.results.find((r: any) => r.id === assertionId);
        return result ? result.result : null;
      })
      .filter((r) => r !== null);

    const totalRuns = history.length;
    const failures = history.filter((r) => r === 'failed').length;
    const passes = history.filter((r) => r === 'passed').length;

    return { totalRuns, failures, passes, history };
  };

  const getFailureRate = (assertionId: string) => {
    const { totalRuns, failures } = getAssertionHistory(assertionId);
    if (totalRuns === 0) return 0;
    return Math.round((failures / totalRuns) * 100);
  };

  const AssertionTypeIcon = ({
    assertion,
  }: {
    assertion: Assertion | ValidationResult;
  }) => {
    const operatorToUse = assertion.operator || assertion.type;

    const icons: Record<string, string> = {
      equals: '=',
      exists: '✓',
      type: 'T',
      contains: '⊃',
      'not contains': '⊄',
      lessThan: '<',
      greaterThan: '>',
      arrayLength: '#',

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
      payload_size: '📦',
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
      case 'data presence':
        return <Zap className='w-5 h-5 text-indigo-600' />;
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
    const isExpanded = expandedAddForm === assertion.id;
    const isEditing = expandedEditForm === assertion.id;

    const history = getAssertionHistory(assertion.id);
    const failureRate = getFailureRate(assertion.id);
    const isFlaky =
      history.totalRuns >= 3 && failureRate > 20 && failureRate < 80;

    return (
      <div key={assertion.id} className='space-y-0 '>
        <div
          className={`group flex items-start gap-3 p-3 border rounded-lg ${
            hasResult
              ? validationResult.result === 'passed'
                ? 'bg-green-50 border-green-300'
                : 'bg-red-50 border-red-300'
              : assertion.enabled
              ? 'bg-blue-50 border-blue-300'
              : 'bg-white border-gray-200'
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

            <div className='flex-1 space-y-2'>
              <div className='flex items-start gap-2 flex-wrap'>
                <div
                  className={`w-6 h-6 rounded flex items-center justify-center text-xs ${
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

                <div className='flex items-center gap-2 flex-1'>
                  {assertion.category === 'status' ? (
                    <>
                      <span className='font-medium text-gray-900 font-mono text-sm'>
                        status
                      </span>
                      <span className='text-xs bg-gray-100 px-2 py-0.5 rounded'>
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
                        <span className='text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded'>
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
                    className={`text-xs px-2 py-1 rounded border ${getPriorityColor(
                      assertion.priority
                    )}`}
                  >
                    {assertion.priority}
                  </span>
                )}
                {isFlaky && (
                  <span className='flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded'>
                    <TrendingUp className='w-3 h-3' />
                    Flaky
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

              {history.totalRuns > 0 && appState === 'results' && (
                <div className='flex items-center gap-4 text-xs'>
                  <div className='flex items-center gap-2 text-gray-600'>
                    <Clock className='w-3 h-3' />
                    <span>
                      History:{' '}
                      <span className='font-medium text-green-600'>
                        {history.passes} passed
                      </span>
                      {history.failures > 0 && (
                        <>
                          ,{' '}
                          <span className='font-medium text-red-600'>
                            {history.failures} failed
                          </span>
                        </>
                      )}{' '}
                      out of {history.totalRuns} runs
                    </span>
                  </div>
                  {failureRate > 0 && (
                    <div
                      className={`px-2 py-0.5 rounded ${
                        failureRate > 50
                          ? 'bg-red-100 text-red-700'
                          : failureRate > 20
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {failureRate}% failure rate
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className='flex items-center gap-2'>
            {assertion.group === 'custom' && appState === 'build' && (
              <button
                onClick={() => handleExpandEditForm(assertion)}
                className={`p-1 rounded ${
                  expandedEditForm === assertion.id
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-gray-100 text-gray-500'
                }`}
                title='Edit assertion'
              >
                <Edit2 className='w-4 h-4' />
              </button>
            )}

            {appState === 'build' && (
              <>
                {assertion.enabled && (
                  <button
                    onClick={() => removeAssertion(assertion.id)}
                    className='sm:opacity-0 sm:group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-opacity'
                    title='Remove assertion'
                  >
                    <X className='w-4 h-4 text-red-600' />
                  </button>
                )}

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
                      : 'hover:bg-blue-100 text-blue-600'
                  }`}
                  title='Create similar assertion'
                >
                  <Plus className='w-4 h-4' />
                </button>
              </>
            )}

            {assertion.group !== 'custom' && (
              <div className='flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded'>
                <Zap className='w-3 h-3' />
                Auto
              </div>
            )}

            {hasResult && (
              <div
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${
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
            {assertion.category === 'status' ? (
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
            ) : assertion.category === 'performance' ? (
              <>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                  <div>
                    <label className='block text-xs font-medium text-gray-700 mb-1'>
                      Metric Type
                    </label>
                    <Input
                      value={
                        inlineFormData.field === 'response_time'
                          ? 'Response Time'
                          : 'Payload Size'
                      }
                      disabled
                      className='bg-gray-50'
                    />
                  </div>

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
                        <SelectItem value='less_than'>
                          Less Than (&lt;)
                        </SelectItem>
                        <SelectItem value='greater_than'>
                          Greater Than (&gt;)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className='block text-xs font-medium text-gray-700 mb-1'>
                    Expected Value{' '}
                    {inlineFormData.field === 'response_time'
                      ? '(milliseconds)'
                      : '(bytes)'}
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
                    placeholder={
                      inlineFormData.field === 'response_time'
                        ? 'e.g., 500'
                        : 'e.g., 1024'
                    }
                  />
                </div>
              </>
            ) : (
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

                  {/* Only show Expected Value field if NOT null or boolean */}
                  {inlineFormData.dataType !== 'null' &&
                    inlineFormData.dataType !== 'boolean' && (
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
                    )}
                </div>
              </>
            )}

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
                ) : assertion.category === 'performance' ? (
                  <>
                    <span className='text-blue-600'>
                      {inlineFormData.field === 'response_time'
                        ? 'response_time'
                        : 'payload_size'}
                    </span>{' '}
                    <span className='text-gray-600'>
                      {getOperatorDisplayLabel(inlineFormData.operator)}
                    </span>{' '}
                    <span className='text-blue-600'>
                      {inlineFormData.value || '...'}
                      {inlineFormData.field === 'response_time'
                        ? 'ms'
                        : ' bytes'}
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
                disabled={
                  // For null and boolean, value is not required
                  inlineFormData.dataType !== 'null' &&
                  inlineFormData.dataType !== 'boolean' &&
                  !inlineFormData.value
                }
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

            {assertion.category === 'status' ? (
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
            ) : assertion.category === 'performance' ? (
              <>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                  <div>
                    <label className='block text-xs font-medium text-gray-700 mb-1'>
                      Metric Type
                    </label>
                    <Input
                      value={
                        editFormData.field === 'response_time'
                          ? 'Response Time'
                          : 'Payload Size'
                      }
                      disabled
                      className='bg-gray-50'
                    />
                  </div>

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
                        <SelectItem value='less_than'>
                          Less Than (&lt;)
                        </SelectItem>
                        <SelectItem value='greater_than'>
                          Greater Than (&gt;)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className='block text-xs font-medium text-gray-700 mb-1'>
                    Expected Value{' '}
                    {editFormData.field === 'response_time'
                      ? '(milliseconds)'
                      : '(bytes)'}
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
                    placeholder={
                      editFormData.field === 'response_time'
                        ? 'e.g., 500'
                        : 'e.g., 1024'
                    }
                  />
                </div>
              </>
            ) : (
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

                  {/* Only show Expected Value field if NOT null or boolean */}
                  {editFormData.dataType !== 'null' &&
                    editFormData.dataType !== 'boolean' && (
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
                    )}
                </div>
              </>
            )}

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
                ) : assertion.category === 'performance' ? (
                  <>
                    <span className='text-purple-600'>
                      {editFormData.field === 'response_time'
                        ? 'response_time'
                        : 'payload_size'}
                    </span>{' '}
                    <span className='text-gray-600'>
                      {getOperatorDisplayLabel(editFormData.operator)}
                    </span>{' '}
                    <span className='text-purple-600'>
                      {editFormData.value || '...'}
                      {editFormData.field === 'response_time' ? 'ms' : ' bytes'}
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
                disabled={
                  // For null and boolean, value is not required
                  editFormData.dataType !== 'null' &&
                  editFormData.dataType !== 'boolean' &&
                  !editFormData.value
                }
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
            {appState === 'build' && selectedInCategory > 0 && (
              <div className='bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-medium'>
                {selectedInCategory} Selected
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
    <div className='space-y-3 ml-2 mt-2 mb-2'>
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
            {/* Tab Controls */}
            {validationResults && (
              <div className='flex items-center bg-gray-100 rounded-xl p-1 w-fit'>
                <Button
                  onClick={() => {
                    setCurrentTab('build');
                    setAppState('build');
                  }}
                  variant='ghost'
                  size='sm'
                  className={`flex items-center gap-2 rounded-lg px-4 ${
                    currentTab === 'build'
                      ? 'bg-white shadow-sm'
                      : 'text-gray-500 hover:bg-transparent'
                  }`}
                >
                  <Settings className='w-4 h-4' />
                  Build
                </Button>

                <Button
                  onClick={() => {
                    setCurrentTab('results');
                    setAppState('results');
                  }}
                  variant='ghost'
                  size='sm'
                  className={`flex items-center gap-2 rounded-lg px-4 ${
                    currentTab === 'results'
                      ? 'bg-white shadow-sm'
                      : 'text-gray-500 hover:bg-transparent'
                  }`}
                >
                  <TrendingUp className='w-4 h-4' />
                  Results
                  {validationResults && (
                    <span className='ml-2 text-xs font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded-full'>
                      {validationResults.summary.failed}/
                      {validationResults.summary.passed +
                        validationResults.summary.failed}
                    </span>
                  )}
                </Button>
              </div>
            )}

            {/* Selected Count */}
            <div className='text-right'>
              <div className='text-sm text-gray-600'>
                {appState === 'results' ? 'Total Selected' : 'Selected'}:{' '}
                <span className='text-2xl font-bold text-blue-600'>
                  {getSelectedCount()}
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

        {appState === 'results' &&
          validationResults &&
          currentTab === 'results' && (
            <AssertionResults
              results={validationResults.results}
              summary={validationResults.summary}
              timestamp={validationResults.timestamp}
              responseTime={validationResults.responseTime}
              validationHistory={validationHistory}
              activeTab={currentTab}
              onTabChange={(tab) => {
                setCurrentTab(tab);
                if (tab === 'build') {
                  setAppState('build');
                }
              }}
              onRerunAll={handleRerun}
              onRerunFailed={handleRerunFailed}
              onShare={() => {}}
            />
          )}

        {appState === 'results' &&
          showHistory &&
          validationHistory.length > 0 && (
            <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-4'>
              <h3 className='font-semibold text-gray-900 mb-4 flex items-center gap-2'>
                <Clock className='w-5 h-5' />
                Validation History ({validationHistory.length} runs)
              </h3>

              <div className='mb-6'>
                <div className='flex items-end gap-2 h-32'>
                  {validationHistory
                    .slice(0, 10)
                    .reverse()
                    .map((run, index) => {
                      const successRate =
                        (run.summary.passed / run.summary.total) * 100;
                      return (
                        <div
                          key={index}
                          className='flex-1 flex flex-col items-center gap-2'
                        >
                          <div
                            className='w-full bg-gray-100 rounded-t relative flex flex-col justify-end'
                            style={{ height: '100%' }}
                          >
                            <div
                              className={`w-full rounded-t transition-all ${
                                successRate === 100
                                  ? 'bg-green-500'
                                  : successRate >= 70
                                  ? 'bg-blue-500'
                                  : successRate >= 40
                                  ? 'bg-amber-500'
                                  : 'bg-red-500'
                              }`}
                              style={{ height: `${successRate}%` }}
                              title={`Run ${index + 1}: ${successRate.toFixed(
                                0
                              )}% passed`}
                            ></div>
                          </div>
                          <span className='text-xs text-gray-500'>
                            #{validationHistory.length - index}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>

              <div className='space-y-2'>
                {validationHistory.map((run, index) => (
                  <div
                    key={index}
                    className='flex items-center justify-between bg-gray-50 rounded-lg p-3 text-sm hover:bg-gray-100 transition-colors'
                  >
                    <div className='flex items-center gap-4'>
                      <div className='font-medium text-gray-700 w-12'>
                        #{validationHistory.length - index}
                      </div>
                      <div className='flex items-center gap-3'>
                        <span className='flex items-center gap-1 text-green-600 font-medium'>
                          <Check className='w-4 h-4' />
                          {run.summary.passed}
                        </span>
                        <span className='flex items-center gap-1 text-red-600 font-medium'>
                          <X className='w-4 h-4' />
                          {run.summary.failed}
                        </span>
                        <span className='text-gray-500'>
                          {run.summary.skipped} skipped
                        </span>
                      </div>
                      <div className='flex items-center gap-1 text-gray-600'>
                        <Clock className='w-3 h-3' />
                        {run.responseTime}
                      </div>
                    </div>
                    <div className='text-gray-500 text-xs'>
                      {new Date(run.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        {(appState === 'build' || currentTab === 'build') && (
          <div className='flex flex-col lg:flex-row gap-3'>
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

            <div className='relative flex-1 lg:max-w-3xl lg:mx-auto'>
              <Search className='w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' />
              <Input
                placeholder='Search assertions...'
                className='pl-10'
                value={searchQuery}
                onChange={(e: any) => setSearchQuery(e.target.value)}
              />
            </div>

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
        )}
      </div>

      <div>
        {(currentTab === 'build' || appState === 'build') && (
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
                  'data presence': 'Data Presence',
                };
                return renderCategorySection(
                  categoryKey,
                  labels[categoryKey] || categoryKey
                );
              })}
          </div>
        )}
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

      <div className='flex items-center gap-4'>
        {/* Left text */}
        {appState === 'build' && getSelectedCount() > 0 && (
          <div className='text-sm font-medium text-blue-600'>
            {getSelectedCount()} assertions are selected for validation
          </div>
        )}

        {/* Right controls */}
        <div className='ml-auto flex items-center gap-3'>
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
                  className='
    border-2 border-blue-500 text-blue-600
    hover:bg-blue-50 hover:text-blue-700

    shadow-sm
  '
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
      </div>
    </div>
  );
};

export default ApiAssertionInterface;
