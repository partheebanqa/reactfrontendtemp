'use client';

import type React from 'react';
import { useToast } from '@/hooks/use-toast';
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
  Loader2,
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

export interface Assertion {
  displayType: string;
  id: string;
  category: string;
  type: string;
  description: string;
  field?: string;
  operator?: string;
  expectedValue?: any;
  enabled: boolean;
  group?: string;
  priority?: string;
  impact?: string;
  dataType?: string;
  actualValue?: any;
}

interface ValidationResult extends Assertion {
  validated: true;
  result: 'passed' | 'failed';
  actualValue?: any;
  failureReason?: string;
  status?: string;
  responseStatus?: number;
  responseTime?: number;
  responseSize?: number;
  errorMessage?: string;
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
  onAddAssertionsToRequest?: (assertions: Assertion[]) => void;
  mode?: 'save' | 'add';
  allDynamicVariables?: Array<{ name: string; value: string }>;
  allStaticVariables?: Array<{ name: string; value: string }>;
  allExtractedVariables?: Array<{ name: string; value: string }>;
}

const ApiAssertionInterface: React.FC<ApiAssertionInterfaceProps> = ({
  assertions = [],
  responseData,
  onUpdateAssertions,
  onVerifyAssertions,
  onSaveAssertions,
  onAddAssertionsToRequest,
  mode = 'save',
  allDynamicVariables = [],
  allStaticVariables = [],
  allExtractedVariables = [],
}) => {
  const { activeEnvironment } = useDataManagement();
  const { currentWorkspace } = useWorkspace();
  const { toast } = useToast();
  const saveMenuRef = useRef<HTMLDivElement>(null);
  const [localAssertions, setLocalAssertions] =
    useState<Assertion[]>(assertions);

  const [selectedView, setSelectedView] = useState<'all' | 'selected'>('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [failedAssertions, setFailedAssertions] = useState<Assertion[]>([]);
  const [isRerunMode, setIsRerunMode] = useState(false);
  const [selectedVariable, setSelectedVariable] = useState<string>('');

  const [appState, setAppState] = useState<'build' | 'validating' | 'results'>(
    'build',
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
    'table',
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
    body: false,
    headers: false,
    'HeaderGuard™': false,
    performance: false,
    status: false,
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
  const [availableOperators, setAvailableOperators] = useState<string[]>([
    'equals',
    'contains',
    'field_not_contains',
    'exists',
    'field_type',
    'field_less_than',
    'field_greater_than',
    'array_length',
  ]);

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
      },
    );

    uniqueAssertions.forEach((assertion) => {
      if (assertion.group === 'data_presence') {
        const category = 'data presence';
        if (!grouped[category]) {
          grouped[category] = [];
        }
        grouped[category].push(assertion);
      } else {
        if (
          !(
            (assertion.category === 'body' &&
              assertion?.displayType === 'contains_dynamic') ||
            assertion?.displayType === 'contains_static'
          )
        ) {
          const category = assertion.category || 'other';
          if (!grouped[category]) {
            grouped[category] = [];
          }
          grouped[category].push(assertion);
        }
      }
    });

    return grouped;
  }, [localAssertions]);

  const formatFieldDisplay = (field: string): string => {
    if (!field) return '';

    if (
      field === '*' ||
      field === 'response' ||
      field === 'RESPONSE' ||
      field === 'Response'
    ) {
      return 'response(*)';
    }

    if (field === 'response_time') {
      return 'responseTime';
    }

    if (field === 'payload_size') {
      return 'payloadSize';
    }

    return field;
  };

  const categories = useMemo(() => {
    const totalUniqueAssertions = Object.values(groupedAssertions).reduce(
      (sum, items) => sum + items.length,
      0,
    );

    const cats = [
      {
        id: 'all',
        label: 'All Assertions',
        count: totalUniqueAssertions,
      },
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
  }, [groupedAssertions]);
  const toggleAssertion = (id: string) => {
    const updated = localAssertions.map((a) =>
      a.id === id ? { ...a, enabled: !a.enabled } : a,
    );
    setLocalAssertions(updated);

    const hasSelected = updated.some((a) => a.enabled);
    setHasUnsavedChanges(hasSelected);

    if (onUpdateAssertions) {
      onUpdateAssertions(updated);
    }
  };

  const getAvailableOperatorsForField = (field: string): string[] => {
    if (!field) {
      return [
        'equals',
        'contains',
        'field_not_contains',
        'exists',
        'field_type',
        'field_less_than',
        'field_greater_than',
        'array_length',
      ];
    }

    const normalizedField = field.trim().toLowerCase();

    if (
      normalizedField === 'status' ||
      normalizedField === 'statuscode' ||
      normalizedField === 'status_code'
    ) {
      return ['equals'];
    }

    if (normalizedField === 'response_time' || normalizedField === 'response') {
      return ['field_less_than', 'field_greater_than'];
    }

    if (normalizedField === 'payload_size' || normalizedField === 'payload') {
      return ['field_less_than', 'field_greater_than'];
    }

    if (normalizedField === '*') {
      return ['contains', 'field_not_contains'];
    }

    return [
      'equals',
      'contains',
      'field_not_contains',
      'exists',
      'field_type',
      'field_less_than',
      'field_greater_than',
      'array_length',
    ];
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

    setHasUnsavedChanges(false);

    if (onUpdateAssertions) {
      onUpdateAssertions(updated);
    }
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => ({ ...prev, [category]: !prev[category] }));
  };

  const getSelectedCount = () => {
    const enabledIds = new Set<string>();
    Object.values(groupedAssertions).forEach((assertions) => {
      assertions.forEach((a) => {
        if (a.enabled) enabledIds.add(a.id);
      });
    });
    return enabledIds.size;
  };

  const getFilteredAssertions = (
    categoryAssertions: Assertion[],
    categoryKey?: string,
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
          a.type.toLowerCase().includes(query),
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

    const field = quickAddData.field.trim().toLowerCase();
    const value = quickAddData.value.trim();

    if (
      field === 'status' ||
      field === 'statuscode' ||
      field === 'status_code'
    ) {
      const newAssertion: Assertion = {
        id: `manual_${Date.now()}`,
        field: undefined,
        type: 'status_equals',
        description: `Status code equals ${value}`,
        operator: 'equals',
        expectedValue: value,
        enabled: true,
        category: 'status',
        group: 'custom',
      };

      const updated = [...localAssertions, newAssertion];
      setLocalAssertions(updated);
      setQuickAddData({ field: '', operator: 'equals', value: '' });
      setHasUnsavedChanges(true);

      setAvailableOperators([
        'equals',
        'contains',
        'field_not_contains',
        'exists',
        'field_type',
        'field_less_than',
        'field_greater_than',
        'array_length',
      ]);

      if (onUpdateAssertions) {
        onUpdateAssertions(updated);
      }
      return;
    }

    if (field === 'response_time' || field === 'response') {
      const operatorLabel =
        quickAddData.operator === 'field_less_than'
          ? 'less than'
          : quickAddData.operator === 'field_greater_than'
            ? 'greater than'
            : 'less than';

      const finalOperator =
        quickAddData.operator === 'field_less_than'
          ? 'less_than'
          : quickAddData.operator === 'field_greater_than'
            ? 'greater_than'
            : 'less_than';

      const newAssertion: Assertion = {
        id: `manual_${Date.now()}`,
        field: undefined,
        type: 'response_time',
        description: `Response time ${operatorLabel} ${value}ms`,
        operator: finalOperator,
        expectedValue: value,
        enabled: true,
        category: 'performance',
        group: 'custom',
      };

      const updated = [...localAssertions, newAssertion];
      setLocalAssertions(updated);
      setQuickAddData({ field: '', operator: 'equals', value: '' });
      setHasUnsavedChanges(true);

      setAvailableOperators([
        'equals',
        'contains',
        'field_not_contains',
        'exists',
        'field_type',
        'field_less_than',
        'field_greater_than',
        'array_length',
      ]);

      if (onUpdateAssertions) {
        onUpdateAssertions(updated);
      }
      return;
    }

    if (field === 'payload_size' || field === 'payload') {
      const operatorLabel =
        quickAddData.operator === 'field_less_than'
          ? 'less than'
          : quickAddData.operator === 'field_greater_than'
            ? 'greater than'
            : 'less than';

      const finalOperator =
        quickAddData.operator === 'field_less_than'
          ? 'less_than'
          : quickAddData.operator === 'field_greater_than'
            ? 'greater_than'
            : 'less_than';

      const newAssertion: Assertion = {
        id: `manual_${Date.now()}`,
        field: undefined,
        type: 'payload_size',
        description: `Payload size ${operatorLabel} ${value} kb`,
        operator: finalOperator,
        expectedValue: value,
        enabled: true,
        category: 'performance',
        group: 'custom',
      };

      const updated = [...localAssertions, newAssertion];
      setLocalAssertions(updated);
      setQuickAddData({ field: '', operator: 'equals', value: '' });
      setHasUnsavedChanges(true);

      setAvailableOperators([
        'equals',
        'contains',
        'field_not_contains',
        'exists',
        'field_type',
        'field_less_than',
        'field_greater_than',
        'array_length',
      ]);

      if (onUpdateAssertions) {
        onUpdateAssertions(updated);
      }
      return;
    }

    const detectedType = inferDataType(quickAddData.value);
    const config = getFieldAssertionConfig(
      quickAddData.operator,
      quickAddData.value,
      quickAddData.field,
      detectedType,
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

    setAvailableOperators([
      'equals',
      'contains',
      'field_not_contains',
      'exists',
      'field_type',
      'field_less_than',
      'field_greater_than',
      'array_length',
    ]);

    if (onUpdateAssertions) {
      onUpdateAssertions(updated);
    }
  };
  const handleExpandAddForm = (
    assertionId: string,
    field: string,
    category: string,
  ) => {
    if (expandedAddForm === assertionId) {
      handleCancelInlineAdd();
      return;
    }

    if (expandedEditForm) {
      handleCancelEdit();
    }

    const currentAssertion = localAssertions.find((a) => a.id === assertionId);
    const isDataPresence = currentAssertion?.group === 'data_presence';

    if (isDataPresence) {
      setExpandedAddForm(assertionId);
      setInlineFormData({
        field: 'response',
        operator: 'contains',
        value: '',
        dataType: 'string',
      });
      setSelectedVariable('');
      return;
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
        (a) => a.id === assertionId,
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
    setSelectedVariable('');
  };
  const handleSaveInlineAssertion = (category: string) => {
    const assertionBeingAdded = localAssertions.find(
      (a) => a.id === expandedAddForm,
    );
    const isDataPresence = assertionBeingAdded?.group === 'data_presence';

    if (isDataPresence) {
      if (!selectedVariable) {
        return;
      }

      const allVariables = [
        ...allStaticVariables,
        ...allDynamicVariables,
        ...allExtractedVariables,
      ];
      const selectedVar = allVariables.find((v) => v.name === selectedVariable);

      if (!selectedVar) {
        return;
      }

      const isStatic = allStaticVariables.some(
        (v) => v.name === selectedVariable,
      );
      const isDynamic = allDynamicVariables.some(
        (v) => v.name === selectedVariable,
      );
      const isExtracted = allExtractedVariables.some(
        (v) => v.name === selectedVariable,
      );

      const variableType = isStatic
        ? 'Static'
        : isDynamic
          ? 'Dynamic'
          : 'Extracted';

      const newAssertion: Assertion = {
        id: `custom_data_presence_${Date.now()}`,
        category: 'body',
        type: 'contains',
        description: `${variableType} variable ${selectedVar.name} is present`,
        field: 'response',
        expectedValue: `{{${selectedVar.name}}}`,
        actualValue: selectedVar.value,
        enabled: true,
        group: 'data_presence',
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
          : `Payload size ${operatorLabel} ${inlineFormData.value} kb`,
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
      inlineFormData.dataType,
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
    const isDataPresence = assertion.group === 'data_presence';

    if (isDataPresence) {
      const varName = assertion.expectedValue?.replace(/{{|}}/g, '') || '';

      setSelectedVariable(varName);
      setEditFormData({
        field: 'response',
        operator: 'contains',
        value: '',
        dataType: 'string',
      });
      return;
    }
    let detectedType = 'string';

    if (assertion.category === 'performance') {
      detectedType = 'performance';
    } else if (assertion.dataType) {
      detectedType = assertion.dataType;
    } else if (
      assertion.type === 'field_null' ||
      assertion.type === 'field_not_null'
    ) {
      detectedType = 'null';
    } else if (
      assertion.type === 'field_is_true' ||
      assertion.type === 'field_is_false'
    ) {
      detectedType = 'boolean';
    } else if (
      assertion.type === 'array_length' ||
      assertion.type === 'array_present'
    ) {
      detectedType = 'array';
    } else if (
      assertion.expectedValue !== undefined &&
      assertion.expectedValue !== null &&
      assertion.expectedValue !== ''
    ) {
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
    setSelectedVariable('');
  };
  const handleSaveEdit = (assertionId: string) => {
    const assertionBeingEdited = localAssertions.find(
      (a) => a.id === assertionId,
    );

    const isDataPresence = assertionBeingEdited?.group === 'data_presence';

    if (isDataPresence) {
      if (!selectedVariable) {
        return;
      }

      const allVariables = [
        ...allStaticVariables,
        ...allDynamicVariables,
        ...allExtractedVariables,
      ];
      const selectedVar = allVariables.find((v) => v.name === selectedVariable);

      if (!selectedVar) {
        return;
      }

      const isStatic = allStaticVariables.some(
        (v) => v.name === selectedVariable,
      );
      const isDynamic = allDynamicVariables.some(
        (v) => v.name === selectedVariable,
      );
      const isExtracted = allExtractedVariables.some(
        (v) => v.name === selectedVariable,
      );

      const variableType = isStatic
        ? 'Static'
        : isDynamic
          ? 'Dynamic'
          : 'Extracted';

      const updated = localAssertions.map((a) =>
        a.id === assertionId
          ? {
              ...a,
              description: `${variableType} variable ${selectedVar.name} is present`,
              expectedValue: `{{${selectedVar.name}}}`,
              actualValue: selectedVar.value,
            }
          : a,
      );

      setLocalAssertions(updated);
      setHasUnsavedChanges(true);
      if (onUpdateAssertions) {
        onUpdateAssertions(updated);
      }
      handleCancelEdit();
      return;
    }

    const requiresValue =
      editFormData.dataType !== 'null' && editFormData.dataType !== 'boolean';

    if (requiresValue && !editFormData.value) {
      return;
    }

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
          : a,
      );
      setLocalAssertions(updated);
      setHasUnsavedChanges(true);
      if (onUpdateAssertions) {
        onUpdateAssertions(updated);
      }
      handleCancelEdit();
      return;
    }

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
                : `Payload size ${operatorLabel} ${editFormData.value} kb`,
              type: assertionBeingEdited.type,
              operator: editFormData.operator,
            }
          : a,
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
      editFormData.dataType,
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
        : a,
    );
    setLocalAssertions(updated);
    setHasUnsavedChanges(true);
    if (onUpdateAssertions) {
      onUpdateAssertions(updated);
    }
    handleCancelEdit();
  };
  const handleAddToRequest = () => {
    if (getSelectedCount() === 0) {
      return;
    }

    const selectedAssertionsList = localAssertions.filter((a) => a.enabled);

    if (onAddAssertionsToRequest) {
      onAddAssertionsToRequest(selectedAssertionsList);
      setHasUnsavedChanges(false);
      setSelectedView('selected');
    }
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
        },
      );

      let finalResults: ValidationResult[];

      if (isRerunMode && validationResults) {
        const previouslyPassedResults = validationResults.results.filter(
          (r) => r.status === 'passed',
        );

        finalResults = [...previouslyPassedResults, ...mappedResults];

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
        finalResults = mappedResults;
      }

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

      const summary = {
        passed: finalResults.filter((r) => r.status === 'passed').length,
        failed: finalResults.filter((r) => r.status === 'failed').length,
        skipped: isRerunMode
          ? 0
          : selectedAssertions.length - finalResults.length,
        total: finalResults.length,
      };

      const responseTime = data.response?.metrics?.responseTime
        ? `${data.response.metrics.responseTime}ms`
        : data.assertionResults[0]?.responseTime
          ? `${data.assertionResults[0].responseTime}ms`
          : 'N/A';

      setValidationResults({
        results: finalResults,
        summary,
        timestamp: new Date().toISOString(),
        responseTime,
      });

      setValidationHistory((prev) => {
        const updated = [
          {
            results: finalResults,
            summary,
            timestamp: new Date().toISOString(),
            responseTime,
          },
          ...prev,
        ];
        return updated.slice(0, 10);
      });

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
      return;
    }

    if (responseData?.statusCode !== 200 && responseData?.statusCode !== 201) {
      toast({
        description:
          'Cannot verify assertions: API returned an error response.',
        variant: 'destructive',
      });
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

        ...(assertion.group === 'data_presence'
          ? { expectedValue: assertion.actualValue }
          : assertion.expectedValue !== undefined
            ? { expectedValue: assertion.expectedValue }
            : {}),

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
      return;
    }

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
      field_present: '✓',
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
      (r) => r.id === assertion.id,
    );
    const hasResult = validationResult && appState === 'results';
    const isExpanded = expandedAddForm === assertion.id;
    const isEditing = expandedEditForm === assertion.id;

    const history = getAssertionHistory(assertion.id);
    const failureRate = getFailureRate(assertion.id);
    const isFlaky =
      history.totalRuns >= 3 && failureRate > 20 && failureRate < 80;

    return (
      <div key={assertion.id} className='space-y-0'>
        <div
          className={`group flex items-center gap-3 p-3 border rounded-lg ${
            hasResult
              ? validationResult.result === 'passed'
                ? 'bg-green-50 border-green-300'
                : 'bg-red-50 border-red-300'
              : assertion.enabled
                ? 'bg-blue-50 border-blue-300'
                : 'bg-white border-gray-200'
          }`}
        >
          {/* Checkbox */}
          <button
            onClick={() => toggleAssertion(assertion.id)}
            disabled={appState !== 'build'}
            className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
              assertion.enabled
                ? 'bg-blue-600 border-blue-600'
                : 'border-gray-300 hover:border-blue-400'
            } ${appState !== 'build' ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {assertion.enabled && <Check className='w-3 h-3 text-white' />}
          </button>

          {/* Status Icon */}
          <div
            className={`flex-shrink-0 w-7 h-7 rounded flex items-center justify-center text-xs font-semibold ${
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

          {/* Main Content */}
          <div className='flex flex-col gap-0.5 flex-1 min-w-0'>
            {/* Description line */}
            <div className='flex items-center gap-2 min-w-0'>
              {assertion.category === 'status' ? (
                <>
                  <span className='font-medium text-gray-900 font-mono text-sm'>
                    statusCode
                  </span>
                  <span className='text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded'>
                    equals
                  </span>
                  <span className='text-sm text-gray-700 font-mono'>
                    ={' '}
                    <span className='text-blue-600'>
                      {assertion.expectedValue}
                    </span>
                  </span>
                </>
              ) : assertion.category === 'performance' ? (
                <>
                  <span className='font-medium text-gray-900 font-mono text-sm truncate'>
                    {assertion.type === 'response_time'
                      ? 'responseTime'
                      : 'payloadSize'}
                  </span>
                  <span className='text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded'>
                    {getOperatorDisplayLabel(assertion.operator || 'less_than')}
                  </span>
                  <span className='text-sm text-blue-600 font-mono'>
                    {assertion.expectedValue}
                    {assertion.type === 'response_time' ? ' ms' : ' kb'}
                  </span>
                </>
              ) : (
                <>
                  {assertion.field && (
                    <span className='font-medium text-gray-900 font-mono text-sm truncate'>
                      {formatFieldDisplay(assertion.field)}
                    </span>
                  )}

                  {assertion.type === 'field_present' ||
                  assertion.type === 'field_exists' ||
                  assertion.type === 'header_present' ||
                  assertion.type === 'header_exists' ||
                  assertion.type === 'field_null' ||
                  assertion.type === 'field_not_null' ||
                  assertion.type === 'field_is_true' ||
                  assertion.type === 'field_is_false' ||
                  assertion.type === 'field_not_empty' ||
                  assertion.type === 'array_present' ||
                  assertion.type === 'security_header_missing' ? (
                    <span className='text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded'>
                      {assertion.type === 'field_present' ||
                      assertion.type === 'field_exists' ||
                      assertion.type?.startsWith('header') ||
                      assertion.type === 'array_present'
                        ? 'exists'
                        : assertion.type === 'field_null'
                          ? 'is null'
                          : assertion.type === 'field_not_null'
                            ? 'is not null'
                            : assertion.type === 'field_not_empty'
                              ? 'not empty'
                              : assertion.type === 'field_is_true'
                                ? 'is true'
                                : assertion.type === 'field_is_false'
                                  ? 'is false'
                                  : assertion.type === 'security_header_missing'
                                    ? 'should be present'
                                    : getOperatorDisplayLabel(
                                        assertion.operator || 'exists',
                                      )}
                    </span>
                  ) : (
                    <>
                      {assertion.operator && (
                        <span className='text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded'>
                          {getOperatorDisplayLabel(assertion.operator)}
                        </span>
                      )}
                      {assertion.expectedValue !== undefined &&
                        assertion.expectedValue !== null &&
                        assertion.expectedValue !== '' && (
                          <span className='text-sm text-gray-700 font-mono truncate'>
                            ={' '}
                            <span className='text-blue-600'>
                              {String(assertion.expectedValue)}
                            </span>
                          </span>
                        )}
                    </>
                  )}
                </>
              )}

              {hasResult &&
                validationResult.result === 'failed' &&
                validationResult.failureReason && (
                  <span className='text-xs text-red-700 ml-2 truncate'>
                    ({validationResult.failureReason})
                  </span>
                )}
            </div>

            {(assertion.priority || assertion.impact) && (
              <div className='flex items-center gap-1.5 flex-wrap'>
                {assertion.impact && (
                  <span className='text-xs text-gray-600 mt-1 italic'>
                    Impact: {assertion.impact}
                  </span>
                )}

                {assertion.priority && (
                  <span
                    className={`text-xs italic px-1.5 py-0.5 rounded w-fit ${
                      assertion.priority?.toLowerCase() === 'critical'
                        ? 'bg-red-100 text-red-700'
                        : assertion.priority?.toLowerCase() === 'high'
                          ? 'bg-orange-100 text-orange-700'
                          : assertion.priority?.toLowerCase() === 'medium'
                            ? 'bg-yellow-100 text-yellow-700'
                            : assertion.priority?.toLowerCase() === 'low'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {assertion.priority}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Buttons - outside flex-col, stays on the right */}
          <div className='flex items-center gap-2 flex-shrink-0'>
            {assertion.group === 'custom' && appState === 'build' && (
              <>
                <button
                  onClick={() => handleExpandEditForm(assertion)}
                  className={`p-1 rounded transition-opacity
    sm:opacity-0 sm:group-hover:opacity-100
    ${
      expandedEditForm === assertion.id
        ? 'bg-blue-600 text-white opacity-100'
        : 'hover:bg-gray-100 text-gray-500'
    }
  `}
                  title='Edit assertion'
                >
                  <Edit2 className='w-4 h-4' />
                </button>

                <button
                  onClick={() => removeAssertion(assertion.id)}
                  className='p-1 rounded transition-opacity
    sm:opacity-0 sm:group-hover:opacity-100
    hover:bg-red-100'
                  title='Remove assertion'
                >
                  <X className='w-4 h-4 text-red-600' />
                </button>
              </>
            )}

            {assertion.group === 'data_presence' && appState === 'build' && (
              <>
                <button
                  onClick={() => handleExpandEditForm(assertion)}
                  className={`opacity-0 group-hover:opacity-100 p-1 rounded transition-opacity ${
                    expandedEditForm === assertion.id
                      ? 'bg-blue-600 text-white !opacity-100'
                      : 'hover:bg-gray-100 text-gray-500'
                  }`}
                  title='Edit assertion'
                >
                  <Edit2 className='w-4 h-4' />
                </button>

                <button
                  onClick={() => removeAssertion(assertion.id)}
                  className='opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-opacity'
                  title='Remove assertion'
                >
                  <X className='w-4 h-4 text-red-600' />
                </button>
              </>
            )}

            {appState === 'build' && (
              <>
                <button
                  onClick={() =>
                    handleExpandAddForm(
                      assertion.id,
                      assertion.field || '',
                      assertion.category,
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

        {/* Expanded Add Form */}
        {isExpanded && appState === 'build' && (
          <div className='bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-300 border-t-0 rounded-b-lg p-4 space-y-4 shadow-inner'>
            {assertion.group === 'data_presence' ? (
              <>
                <div>
                  <label className='block text-xs font-medium text-gray-700 mb-1'>
                    Field Path
                  </label>
                  <Input
                    value='response'
                    disabled
                    className='bg-gray-100 cursor-not-allowed'
                  />
                  <p className='text-xs text-gray-500 mt-1'>
                    Data presence assertions always check the full response
                  </p>
                </div>

                <div>
                  <label className='block text-xs font-medium text-gray-700 mb-1'>
                    Select Variable
                  </label>
                  <Select
                    value={selectedVariable}
                    onValueChange={(value: string) =>
                      setSelectedVariable(value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Choose a variable...' />
                    </SelectTrigger>
                    <SelectContent>
                      {allStaticVariables.length > 0 && (
                        <>
                          <div className='px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50'>
                            Static Variables
                          </div>
                          {allStaticVariables.map((variable) => (
                            <SelectItem
                              key={`static-${variable.name}`}
                              value={variable.name}
                            >
                              <div className='flex items-center gap-2'>
                                <span className='text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded flex-shrink-0'>
                                  Static
                                </span>
                                <span className='truncate'>
                                  {variable.name} ={' '}
                                  {variable.value.length > 50
                                    ? `${variable.value.substring(0, 50)}...`
                                    : variable.value}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </>
                      )}

                      {allDynamicVariables.length > 0 && (
                        <>
                          <div className='px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50'>
                            Dynamic Variables
                          </div>
                          {allDynamicVariables.map((variable) => (
                            <SelectItem
                              key={`dynamic-${variable.name}`}
                              value={variable.name}
                            >
                              <div className='flex items-center gap-2'>
                                <span className='text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded flex-shrink-0'>
                                  Dynamic
                                </span>
                                <span className='truncate'>
                                  {variable.name} ={' '}
                                  {variable.value.length > 50
                                    ? `${variable.value.substring(0, 50)}...`
                                    : variable.value}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </>
                      )}

                      {allExtractedVariables.length > 0 && (
                        <>
                          <div className='px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50'>
                            Extracted Variables
                          </div>
                          {allExtractedVariables.map((variable) => (
                            <SelectItem
                              key={`extracted-${variable.name}`}
                              value={variable.name}
                            >
                              <div className='flex items-center gap-2'>
                                <span className='text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded flex-shrink-0'>
                                  Extracted
                                </span>
                                <span className='truncate'>
                                  {variable.name} ={' '}
                                  {variable.value.length > 50
                                    ? `${variable.value.substring(0, 50)}...`
                                    : variable.value}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </>
                      )}
                      {allStaticVariables.length === 0 &&
                        allDynamicVariables.length === 0 &&
                        allExtractedVariables.length === 0 && (
                          <SelectItem value='no-vars' disabled>
                            No variables available
                          </SelectItem>
                        )}
                    </SelectContent>
                  </Select>
                </div>

                <div className='bg-white border border-blue-200 rounded-lg p-3'>
                  <div className='text-xs font-medium text-gray-600 mb-1'>
                    Preview1
                  </div>
                  <div className='font-mono text-sm text-gray-900'>
                    <span className='text-blue-600'>response</span>{' '}
                    <span className='text-gray-600'>contains</span>{' '}
                    <span className='text-blue-600'>
                      {selectedVariable ? `{{${selectedVariable}}}` : '...'}
                    </span>
                  </div>
                </div>

                <div className='flex justify-end gap-2 pt-2 border-t border-blue-200'>
                  <Button onClick={handleCancelInlineAdd} variant='outline'>
                    Cancel
                  </Button>
                  <Button
                    onClick={() =>
                      handleSaveInlineAssertion(assertion.category)
                    }
                    disabled={!selectedVariable}
                  >
                    <Plus className='w-4 h-4' />
                    Add Assertion
                  </Button>
                </div>
              </>
            ) : assertion.category === 'status' ? (
              <>
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

                <div className='bg-white border border-blue-200 rounded-lg p-3'>
                  <div className='text-xs font-medium text-gray-600 mb-1'>
                    Preview
                  </div>
                  <div className='font-mono text-sm text-gray-900'>
                    <span className='text-blue-600'>status</span>{' '}
                    <span className='text-gray-600'>=</span>{' '}
                    <span className='text-blue-600'>
                      {inlineFormData.value || '...'}
                    </span>
                  </div>
                </div>

                <div className='flex justify-end gap-2 pt-2 border-t border-blue-200'>
                  <Button onClick={handleCancelInlineAdd} variant='outline'>
                    Cancel
                  </Button>
                  <Button
                    onClick={() =>
                      handleSaveInlineAssertion(assertion.category)
                    }
                    disabled={!inlineFormData.value}
                  >
                    <Plus className='w-4 h-4' />
                    Add Assertion
                  </Button>
                </div>
              </>
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
                      : '(kb)'}
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

                <div className='bg-white border border-blue-200 rounded-lg p-3'>
                  <div className='text-xs font-medium text-gray-600 mb-1'>
                    Preview
                  </div>
                  <div className='font-mono text-sm text-gray-900'>
                    <span className='text-blue-600'>
                      {inlineFormData.field === 'response_time'
                        ? 'responseTime'
                        : 'payloadSize'}
                    </span>{' '}
                    <span className='text-gray-600'>
                      {getOperatorDisplayLabel(inlineFormData.operator)}
                    </span>{' '}
                    <span className='text-blue-600'>
                      {inlineFormData.value || '...'}
                      {inlineFormData.field === 'response_time' ? ' ms' : ' kb'}
                    </span>
                  </div>
                </div>

                <div className='flex justify-end gap-2 pt-2 border-t border-blue-200'>
                  <Button onClick={handleCancelInlineAdd} variant='outline'>
                    Cancel
                  </Button>
                  <Button
                    onClick={() =>
                      handleSaveInlineAssertion(assertion.category)
                    }
                    disabled={!inlineFormData.value}
                  >
                    <Plus className='w-4 h-4' />
                    Add Assertion
                  </Button>
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
                    <Input
                      value={
                        inlineFormData.dataType.charAt(0).toUpperCase() +
                        inlineFormData.dataType.slice(1)
                      }
                      disabled
                      className='bg-gray-50 cursor-not-allowed'
                    />
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
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </div>

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

                <div className='bg-white border border-blue-200 rounded-lg p-3'>
                  <div className='text-xs font-medium text-gray-600 mb-1'>
                    Preview
                  </div>
                  <div className='font-mono text-sm text-gray-900'>
                    <span className='text-blue-600'>
                      {inlineFormData.field || '...'}
                    </span>{' '}
                    <span className='text-gray-600'>
                      {getOperatorDisplayLabel(inlineFormData.operator)}
                    </span>{' '}
                    <span className='text-blue-600'>
                      {inlineFormData.value || '...'}
                    </span>
                  </div>
                </div>

                <div className='flex justify-end gap-2 pt-2 border-t border-blue-200'>
                  <Button onClick={handleCancelInlineAdd} variant='outline'>
                    Cancel
                  </Button>
                  <Button
                    onClick={() =>
                      handleSaveInlineAssertion(assertion.category)
                    }
                    disabled={
                      inlineFormData.dataType !== 'null' &&
                      inlineFormData.dataType !== 'boolean' &&
                      !inlineFormData.value
                    }
                  >
                    <Plus className='w-4 h-4' />
                    Add Assertion
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Expanded Edit Form */}
        {isEditing && appState === 'build' && (
          <div className='bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-300 border-t-0 rounded-b-lg p-4 space-y-4 shadow-inner'>
            <div className='flex items-center gap-2 mb-2'>
              <Edit2 className='w-4 h-4 text-purple-600' />
              <h4 className='font-semibold text-gray-900 text-sm'>
                {assertion.group === 'data_presence'
                  ? 'Edit Data Presence Assertion'
                  : assertion.category === 'status'
                    ? 'Edit Status Code Assertion'
                    : 'Edit Assertion'}
              </h4>
            </div>

            {assertion.group === 'data_presence' ? (
              <>
                <div>
                  <label className='block text-xs font-medium text-gray-700 mb-1'>
                    Field Path
                  </label>
                  <Input
                    value='response'
                    disabled
                    className='bg-gray-100 cursor-not-allowed'
                  />
                  <p className='text-xs text-gray-500 mt-1'>
                    Data presence assertions always check the full response
                  </p>
                </div>

                <div>
                  <label className='block text-xs font-medium text-gray-700 mb-1'>
                    Select Variable
                  </label>
                  <Select
                    value={selectedVariable}
                    onValueChange={(value: string) =>
                      setSelectedVariable(value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Choose a variable...' />
                    </SelectTrigger>
                    <SelectContent>
                      {allStaticVariables.length > 0 && (
                        <>
                          <div className='px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50'>
                            Static Variables
                          </div>
                          {allStaticVariables.map((variable) => (
                            <SelectItem
                              key={`static-${variable.name}`}
                              value={variable.name}
                            >
                              <div className='flex items-center gap-2'>
                                <span className='text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded'>
                                  Static
                                </span>
                                <span>
                                  {variable.name} = {variable.value}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </>
                      )}

                      {allDynamicVariables.length > 0 && (
                        <>
                          <div className='px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50'>
                            Dynamic Variables
                          </div>
                          {allDynamicVariables.map((variable) => (
                            <SelectItem
                              key={`dynamic-${variable.name}`}
                              value={variable.name}
                            >
                              <div className='flex items-center gap-2'>
                                <span className='text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded'>
                                  Dynamic
                                </span>
                                <span>
                                  {variable.name} = {variable.value}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </>
                      )}
                      {allExtractedVariables.length > 0 && (
                        <>
                          <div className='px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50'>
                            Extracted Variables
                          </div>
                          {allExtractedVariables.map((variable) => (
                            <SelectItem
                              key={`extracted-${variable.name}`}
                              value={variable.name}
                            >
                              <div className='flex items-center gap-2'>
                                <span className='text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded'>
                                  Extracted
                                </span>
                                <span>
                                  {variable.name} = {variable.value}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </>
                      )}

                      {allStaticVariables.length === 0 &&
                        allDynamicVariables.length === 0 &&
                        allExtractedVariables.length === 0 && (
                          <SelectItem value='no-vars' disabled>
                            No variables available
                          </SelectItem>
                        )}
                    </SelectContent>
                  </Select>
                </div>

                <div className='bg-white border border-purple-200 rounded-lg p-3'>
                  <div className='text-xs font-medium text-gray-600 mb-1'>
                    Preview3
                  </div>
                  <div className='font-mono text-sm text-gray-900'>
                    <span className='text-purple-600'>response</span>{' '}
                    <span className='text-gray-600'>contains</span>{' '}
                    <span className='text-purple-600'>
                      {selectedVariable ? `{{${selectedVariable}}}` : '...'}
                    </span>
                  </div>
                </div>

                <div className='flex justify-end gap-2 pt-2 border-t border-purple-200'>
                  <Button onClick={handleCancelEdit} variant='outline'>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => handleSaveEdit(assertion.id)}
                    disabled={!selectedVariable}
                  >
                    <Save className='w-4 h-4 mr-1' />
                    Save Changes
                  </Button>
                </div>
              </>
            ) : assertion.category === 'status' ? (
              <>
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

                <div className='bg-white border border-purple-200 rounded-lg p-3'>
                  <div className='text-xs font-medium text-gray-600 mb-1'>
                    Preview
                  </div>
                  <div className='font-mono text-sm text-gray-900'>
                    <span className='text-purple-600'>status</span>{' '}
                    <span className='text-gray-600'>=</span>{' '}
                    <span className='text-purple-600'>
                      {editFormData.value || '...'}
                    </span>
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
              </>
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
                      : '(kb)'}
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

                <div className='bg-white border border-purple-200 rounded-lg p-3'>
                  <div className='text-xs font-medium text-gray-600 mb-1'>
                    Preview
                  </div>
                  <div className='font-mono text-sm text-gray-900'>
                    <span className='text-purple-600'>
                      {editFormData.field === 'response_time'
                        ? 'responseTime'
                        : 'payloadSize'}
                    </span>{' '}
                    <span className='text-gray-600'>
                      {getOperatorDisplayLabel(editFormData.operator)}
                    </span>{' '}
                    <span className='text-purple-600'>
                      {editFormData.value || '...'}
                      {editFormData.field === 'response_time' ? ' ms' : ' kb'}
                    </span>
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
                    <Input
                      value={
                        editFormData.dataType.charAt(0).toUpperCase() +
                        editFormData.dataType.slice(1)
                      }
                      disabled
                      className='bg-gray-50 cursor-not-allowed'
                    />
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
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </div>

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

                <div className='bg-white border border-purple-200 rounded-lg p-3'>
                  <div className='text-xs font-medium text-gray-600 mb-1'>
                    Preview
                  </div>
                  <div className='font-mono text-sm text-gray-900'>
                    <span className='text-purple-600'>
                      {editFormData.field || '...'}
                    </span>{' '}
                    <span className='text-gray-600'>
                      {getOperatorDisplayLabel(editFormData.operator)}
                    </span>{' '}
                    <span className='text-purple-600'>
                      {editFormData.value || '...'}
                    </span>
                  </div>
                </div>

                <div className='flex justify-end gap-2 pt-2 border-t border-purple-200'>
                  <Button onClick={handleCancelEdit} variant='outline'>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => handleSaveEdit(assertion.id)}
                    disabled={
                      editFormData.dataType !== 'null' &&
                      editFormData.dataType !== 'boolean' &&
                      !editFormData.value
                    }
                  >
                    <Save className='w-4 h-4 mr-1' />
                    Save Changes
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderCategorySection = (
    categoryKey: string,
    categoryLabel: string,
  ) => {
    const sourceAssertions =
      appState === 'results' && validationResults
        ? validationResults.results.filter((r) => r.category === categoryKey)
        : groupedAssertions[categoryKey] || [];

    const categoryAssertions = getFilteredAssertions(
      sourceAssertions,
      categoryKey,
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
              <ChevronDown className='w-4 h-4 text-[rgb(19_111_176)]' />
            ) : (
              <ChevronRight className='w-4 h-4 text-[rgb(19_111_176)]' />
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
                <div className='mb-4 flex items-center pb-3 border-b border-gray-200'>
                  <div className='flex items-center gap-2 ml-auto'>
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
                          sortBy[categoryKey] === 'field'
                            ? 'default'
                            : 'outline'
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
                </div>
              )}

            <div className='space-y-3 ml-2 mt-2'>
              {categoryAssertions.map((assertion) =>
                renderAssertion(assertion),
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
                    <span
                      className={`ml-2 text-xs font-semibold px-2 py-0.5 rounded-full ${
                        validationResults.summary.failed === 0
                          ? 'bg-green-100 text-green-700'
                          : validationResults.summary.failed /
                                (validationResults.summary.passed +
                                  validationResults.summary.failed) >=
                              0.5
                            ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {validationResults.summary.passed}/
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
                                0,
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
                  labels[categoryKey] || categoryKey,
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

          {/* Helper text with field options */}
          <div className='bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4'>
            <h4 className='text-sm font-semibold text-blue-900 mb-2'>
              Field Options:
            </h4>
            <ul className='text-xs text-blue-800 space-y-1'>
              <li>
                • <code className='bg-blue-100 px-1 rounded'>status</code> -
                Status code (equals only)
              </li>
              <li>
                • <code className='bg-blue-100 px-1 rounded'>*</code> - Full
                response (contains/not contains only)
              </li>
              <li>
                •{' '}
                <code className='bg-blue-100 px-1 rounded'>response_time</code>{' '}
                or <code className='bg-blue-100 px-1 rounded'>response</code> -
                Time-based (greater/less than only)
              </li>
              <li>
                • <code className='bg-blue-100 px-1 rounded'>payload_size</code>{' '}
                or <code className='bg-blue-100 px-1 rounded'>payload</code> -
                Size-based (greater/less than only)
              </li>
              <li>
                •{' '}
                <code className='bg-blue-100 px-1 rounded'>data.user.name</code>{' '}
                - JSON path (all operators available)
              </li>
            </ul>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3'>
            <Input
              placeholder='Field path'
              value={quickAddData.field}
              onChange={(e: any) => {
                const newField = e.target.value;
                setQuickAddData({ ...quickAddData, field: newField });

                const operators = getAvailableOperatorsForField(newField);
                setAvailableOperators(operators);

                if (!operators.includes(quickAddData.operator)) {
                  setQuickAddData({
                    ...quickAddData,
                    field: newField,
                    operator: operators[0] || 'equals',
                  });
                }
              }}
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
                {availableOperators.includes('equals') && (
                  <SelectItem value='equals'>Equals (=)</SelectItem>
                )}
                {availableOperators.includes('contains') && (
                  <SelectItem value='contains'>Contains</SelectItem>
                )}
                {availableOperators.includes('field_not_contains') && (
                  <SelectItem value='field_not_contains'>
                    Not Contains
                  </SelectItem>
                )}
                {availableOperators.includes('exists') && (
                  <SelectItem value='exists'>Exists</SelectItem>
                )}
                {availableOperators.includes('field_type') && (
                  <SelectItem value='field_type'>Type Check</SelectItem>
                )}
                {availableOperators.includes('field_less_than') && (
                  <SelectItem value='field_less_than'>
                    Less Than (&lt;)
                  </SelectItem>
                )}
                {availableOperators.includes('field_greater_than') && (
                  <SelectItem value='field_greater_than'>
                    Greater Than (&gt;)
                  </SelectItem>
                )}
                {availableOperators.includes('array_length') && (
                  <SelectItem value='array_length'>Array Length</SelectItem>
                )}
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
              <Plus className='w-4 h-4' />
              Add Assertion
            </Button>
          </div>

          {/* Dynamic preview */}
          {quickAddData.field && (
            <div className='mt-3 bg-gray-50 border border-gray-200 rounded-lg p-3'>
              <div className='text-xs font-medium text-gray-600 mb-1'>
                Preview:
              </div>
              <div className='font-mono text-sm text-gray-900'>
                <span className='text-blue-600'>
                  {quickAddData.field.trim().toLowerCase() === 'status' ||
                  quickAddData.field.trim().toLowerCase() === 'statuscode' ||
                  quickAddData.field.trim().toLowerCase() === 'status_code'
                    ? 'statusCode'
                    : quickAddData.field.trim().toLowerCase() ===
                          'response_time' ||
                        quickAddData.field.trim().toLowerCase() === 'response'
                      ? 'responseTime'
                      : quickAddData.field.trim().toLowerCase() ===
                            'payload_size' ||
                          quickAddData.field.trim().toLowerCase() === 'payload'
                        ? 'payloadSize'
                        : quickAddData.field}
                </span>
                <span className='text-gray-600'>
                  {getOperatorDisplayLabel(quickAddData.operator)}
                </span>{' '}
                <span className='text-blue-600'>
                  {quickAddData.value || '...'}
                  {(quickAddData.field.trim().toLowerCase() ===
                    'response_time' ||
                    quickAddData.field.trim().toLowerCase() === 'response') &&
                    ' ms'}
                  {(quickAddData.field.trim().toLowerCase() ===
                    'payload_size' ||
                    quickAddData.field.trim().toLowerCase() === 'payload') &&
                    ' kb'}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
      <div className='flex flex-col md:flex-row items-center justify-center gap-4'>
        {/* Left text */}

        {appState === 'build' && getSelectedCount() > 0 && (
          <div className='text-sm font-medium text-blue-600'>
            {getSelectedCount()} assertions are selected for validation
          </div>
        )}

        {/* Right controls */}
        <div className='flex items-center justify-center gap-3'>
          {appState === 'build' && (
            <>
              <Button
                onClick={handleVerifyAssertions}
                disabled={getSelectedCount() === 0}
                variant='default'
              >
                <Play className='w-5 h-5' />
                Verify {getSelectedCount() > 0 && `${getSelectedCount()} `}
                Assertions
              </Button>
              {mode === 'add' ? (
                <Button
                  onClick={handleAddToRequest}
                  disabled={getSelectedCount() === 0}
                  variant='outline'
                  className='border-2 border-blue-500 text-blue-600 hover:bg-blue-50 hover:text-blue-700 shadow-sm'
                >
                  <Plus className='w-5 h-5' />
                  Add to Request ({getSelectedCount()})
                </Button>
              ) : (
                <div className='relative' ref={saveMenuRef}>
                  <Button
                    onClick={handleSaveAssertions}
                    disabled={
                      getSelectedCount() === 0 ||
                      saveAssertionsMutation.isPending
                    }
                    variant='outline'
                    className='border-2 border-blue-500 text-blue-600 hover:bg-blue-50 hover:text-blue-700 shadow-sm'
                  >
                    {saveAssertionsMutation.isPending ? (
                      <Loader2 className='w-5 h-5 animate-spin' />
                    ) : (
                      <Save className='w-5 h-5' />
                    )}
                    Save Assertions
                  </Button>
                </div>
              )}
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
