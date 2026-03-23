'use client';

import type React from 'react';
import { Button } from '@/components/ui/button';
import {
  Activity,
  CheckCircle,
  Clock,
  Code,
  Code2,
  HardDrive,
  Hash,
  Info,
  List,
  Type,
  X,
  XCircle,
  Trash2,
  Plus,
  Pencil,
  ChevronDown,
} from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import {
  getArrayAssertionConfig,
  getCategoryForAssertionType,
} from '@/lib/assertion-utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface Operator {
  id: string;
  label: string;
  description: string;
}

interface AssertionModalProps {
  fieldPath?: string;
  fieldValue?: any;
  isOpen: boolean;
  onSelect?: (assertionType: string, config?: any) => void;
  onClose: () => void;
  allAssertions?: any[];
  variables?: Array<{ name: string; value: string }>;
  dynamicVariables?: Array<{ name: string; value: string }>;
  extractedVariables?: Array<{ name: string; value: string }>;
  setAssertions?: (assertions: any[]) => void;
  onGenerateForPath?: (path: string, value: any) => any[];
  initialField?: string;
  initialValue?: any;
  fieldType?: string;
  availableOperators?: Operator[];
  suggestedAssertions?: any[];
}

function isDateValue(value: any): boolean {
  if (typeof value !== 'string') return false;
  const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
  const commonDateFormats = [
    /^\d{4}-\d{2}-\d{2}$/,
    /^\d{2}\/\d{2}\/\d{4}$/,
    /^\d{2}-\d{2}-\d{4}$/,
  ];
  if (iso8601Regex.test(value)) return true;
  if (commonDateFormats.some((regex) => regex.test(value))) return true;
  return !isNaN(new Date(value).getTime());
}

function getValueType(value: any): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (isDateValue(value)) return 'date';
  return typeof value;
}

const truncate = (text: string, max = 50) =>
  text.length > max ? text.slice(0, max) + '…' : text;

function TypeBadge({ type }: { type: string }) {
  const colours: Record<string, string> = {
    string:
      'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    number:
      'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    boolean:
      'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
    array: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    object: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
    date: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
    null: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
  };
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide ${colours[type] ?? colours.null}`}
    >
      {type}
    </span>
  );
}

function CountBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span className='ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[#136fb0] text-white text-[10px] font-bold leading-none'>
      {count}
    </span>
  );
}

function EmptyState({
  icon,
  title,
  body,
}: {
  icon: string;
  title: string;
  body: string;
}) {
  return (
    <div className='text-center py-10'>
      <span className='text-4xl'>{icon}</span>
      <p className='mt-3 text-sm font-semibold text-gray-700 dark:text-gray-300'>
        {title}
      </p>
      <p className='mt-1 text-xs text-gray-400 dark:text-gray-500 max-w-xs mx-auto'>
        {body}
      </p>
    </div>
  );
}

function AssertionModal({
  fieldPath,
  fieldValue,
  isOpen,
  onSelect,
  onClose,
  allAssertions = [],
  variables = [],
  dynamicVariables = [],
  extractedVariables = [],
  setAssertions,
  onGenerateForPath,
  initialField,
  initialValue,
  fieldType,
  availableOperators,
  suggestedAssertions = [],
}: AssertionModalProps) {
  const [activeTab, setActiveTab] = useState<
    'suggested' | 'manual' | 'general'
  >('suggested');
  const [selectedOperator, setSelectedOperator] = useState<string>('equals');
  const [manualValue, setManualValue] = useState('');
  const [generalType, setGeneralType] = useState<string>('');
  const [generalValue, setGeneralValue] = useState<string>('');
  const [generalComparison, setGeneralComparison] = useState<string>('less');
  const [selectedSuggestedAssertions, setSelectedSuggestedAssertions] =
    useState<Set<string>>(new Set());
  const [assertionsToRemove, setAssertionsToRemove] = useState<Set<string>>(
    new Set(),
  );
  const [localDateValue, setLocalDateValue] = useState('');
  const [pendingAssertions, setPendingAssertions] = useState<any[]>([]);
  const [selectedGeneralAssertions, setSelectedGeneralAssertions] = useState<
    Map<string, { value: string; comparison?: string }>
  >(new Map());

  const displayFieldPath = initialField || fieldPath || '';
  const displayFieldValue =
    initialValue !== undefined ? initialValue : fieldValue;
  const hasChanges =
    assertionsToRemove.size > 0 ||
    pendingAssertions.length > 0 ||
    selectedGeneralAssertions.size > 0;
  const valueType = getValueType(displayFieldValue);
  const isArray = Array.isArray(displayFieldValue);

  const valuePreview =
    typeof displayFieldValue === 'object' && displayFieldValue !== null
      ? JSON.stringify(displayFieldValue).slice(0, 60) +
        (JSON.stringify(displayFieldValue).length > 60 ? '…' : '')
      : String(displayFieldValue ?? 'null').slice(0, 60);

  const getOperatorsForType = (type: string, isArr: boolean) => {
    if (isArr)
      return [
        {
          id: 'array_length',
          label: 'length =',
          description: 'Array length equals',
        },
        {
          id: 'field_not_equals',
          label: 'length ≠',
          description: 'Array length not equals',
        },
        {
          id: 'field_greater_than',
          label: 'length >',
          description: 'Array length greater than',
        },
        {
          id: 'field_less_than',
          label: 'length <',
          description: 'Array length less than',
        },
        {
          id: 'field_greater_equal',
          label: 'length ≥',
          description: 'Array length at least',
        },
        {
          id: 'field_less_equal',
          label: 'length ≤',
          description: 'Array length at most',
        },
      ];
    switch (type) {
      case 'string':
        return [
          { id: 'contains', label: 'contains', description: 'Contains' },
          {
            id: 'field_not_contains',
            label: 'not contains',
            description: 'Does not contain',
          },
        ];
      case 'number':
        return [
          { id: 'equals', label: '=', description: 'Equals' },
          { id: 'field_not_equals', label: '≠', description: 'Not equals' },
          { id: 'field_greater_than', label: '>', description: 'Greater than' },
          { id: 'field_less_than', label: '<', description: 'Less than' },
          {
            id: 'field_greater_equal',
            label: '≥',
            description: 'Greater than or equal',
          },
          {
            id: 'field_less_equal',
            label: '≤',
            description: 'Less than or equal',
          },
        ];
      case 'boolean':
        return [
          { id: 'field_is_true', label: 'is true', description: 'Is true' },
          { id: 'field_is_false', label: 'is false', description: 'Is false' },
        ];
      case 'date':
        return [
          {
            id: 'date_greater_than',
            label: '>',
            description: 'Date after (greater than)',
          },
          {
            id: 'date_less_than',
            label: '<',
            description: 'Date before (less than)',
          },
        ];
      case 'null':
        return [
          { id: 'field_null', label: 'is null', description: 'Is null' },
          {
            id: 'field_not_null',
            label: 'not null',
            description: 'Is not null',
          },
        ];
      case 'object':
        return [
          { id: 'exists', label: 'exists', description: 'Field exists' },
          {
            id: 'field_not_present',
            label: 'not exists',
            description: 'Field does not exist',
          },
        ];
      default:
        return [
          { id: 'equals', label: '=', description: 'Equals' },
          { id: 'field_not_equals', label: '≠', description: 'Not equals' },
        ];
    }
  };

  const operators = getOperatorsForType(valueType, isArray);
  const NO_VALUE_OPERATORS = [
    'field_null',
    'field_not_null',
    'field_is_true',
    'field_is_false',
    'exists',
    'field_not_present',
  ];

  const suggestedAssertionsList = useMemo(() => {
    const isNonZeroIndex = /\[([1-9]\d*)\]/.test(displayFieldPath);
    let assertionsToFilter = suggestedAssertions;
    if (isNonZeroIndex && onGenerateForPath) {
      const dynamicAssertions = onGenerateForPath(
        displayFieldPath,
        displayFieldValue,
      );
      const newOnes = dynamicAssertions.map((a: any) => ({
        ...a,
        id: `dynamic-${displayFieldPath}-${a.type}-${Date.now()}-${Math.random()}`,
        field: displayFieldPath,
        enabled: false,
      }));
      assertionsToFilter = [...suggestedAssertions, ...newOnes];
    }
    return assertionsToFilter.map((assertion) => {
      let label = '';
      let description = '';
      let icon = CheckCircle;
      switch (assertion.type) {
        case 'field_present':
          label = 'Field Exists';
          description = assertion.description;
          icon = CheckCircle;
          break;
        case 'header_present':
          label = 'Header Exists';
          description = assertion.description;
          icon = CheckCircle;
          break;
        case 'header_equals':
          label = 'Header Equals';
          description = assertion.description;
          icon = CheckCircle;
          break;
        case 'header_contains':
          label = 'Header Contains';
          description = assertion.description;
          icon = Code;
          break;
        case 'header_security_present':
          label = 'Security Header Present';
          description = assertion.description;
          icon = CheckCircle;
          break;
        case 'header_security_value':
          label = 'Security Header Value Check';
          description = assertion.description;
          icon = CheckCircle;
          break;
        case 'field_type':
          label = 'Check Data Type';
          description = assertion.description;
          icon = Type;
          break;
        case 'field_not_empty':
          label = 'Not Empty';
          description = assertion.description;
          icon = CheckCircle;
          break;
        case 'field_equals':
          label = 'Equals Value';
          description = assertion.description;
          icon = CheckCircle;
          break;
        case 'field_contains':
          label = 'Contains';
          description = assertion.description;
          icon = Code;
          break;
        case 'field_pattern':
          label = 'Matches Pattern';
          description = assertion.description;
          icon = Code;
          break;
        case 'field_range':
          label = 'Range Check';
          description = assertion.description;
          icon = CheckCircle;
          break;
        case 'field_null':
          label = 'Is Null';
          description = assertion.description;
          icon = XCircle;
          break;
        case 'array_length':
          label = 'Array Length';
          description = assertion.description;
          icon = List;
          break;
        case 'array_present':
          label = 'Array Present';
          description = assertion.description;
          icon = List;
          break;
        default:
          label = assertion.type.replace(/_/g, ' ');
          description = assertion.description;
          icon = CheckCircle;
      }
      return { id: assertion.id, label, description, icon, assertion };
    });
  }, [
    suggestedAssertions,
    displayFieldPath,
    displayFieldValue,
    onGenerateForPath,
  ]);

  const allGeneralAssertions = [
    {
      id: 'response_time',
      label: 'Response Time',
      icon: Clock,
      needsInput: true,
      inputType: 'number',
      inputLabel: 'Time in milliseconds',
      hasComparison: true,
      showForTypes: ['all'],
    },
    {
      id: 'payload_size',
      label: 'Payload Size',
      icon: HardDrive,
      needsInput: true,
      inputType: 'number',
      inputLabel: 'Size in KB',
      hasComparison: true,
      showForTypes: ['all'],
    },
    {
      id: 'status_equals',
      label: 'Status Code',
      icon: Hash,
      needsInput: true,
      inputType: 'number',
      inputLabel: 'Status code (e.g., 200, 404, 500)',
      showForTypes: ['all'],
    },
    {
      id: 'contains_text',
      label: 'Contains Text',
      icon: Code,
      needsInput: true,
      inputType: 'text',
      inputLabel: 'Text value',
      showForTypes: ['all'],
    },
    {
      id: 'contains_static',
      label: 'Contains Static Variable',
      icon: Code,
      needsInput: true,
      inputType: 'select',
      inputLabel: 'Select static variable',
      showForTypes: ['all'],
    },
    {
      id: 'contains_dynamic',
      label: 'Contains Dynamic Variable',
      icon: Code,
      needsInput: true,
      inputType: 'select',
      inputLabel: 'Select dynamic variable',
      showForTypes: ['all'],
    },
    {
      id: 'contains_extracted',
      label: 'Contains Extracted Variable',
      icon: Code,
      needsInput: true,
      inputType: 'text',
      inputLabel: 'Variable name',
      showForTypes: ['all'],
    },
  ];

  const generalAssertions = allGeneralAssertions.filter(
    (a) => a.showForTypes.includes('all') || a.showForTypes.includes(valueType),
  );

  const staticVariables = variables.filter((v) => v.name.startsWith('S_'));
  const filteredDynamicVariables = dynamicVariables.filter((v) =>
    v.name.startsWith('D_'),
  );
  const filteredExtractedVariables = extractedVariables.filter((v) =>
    v.name.startsWith('E_'),
  );

  const getAssertionTypeForOperator = (
    operator: string,
    isHeader = false,
  ): string => {
    if (isHeader) {
      const map: Record<string, string> = {
        equals: 'header_equals',
        field_not_equals: 'header_equals',
        contains: 'header_contains',
        field_not_contains: 'header_contains',
        field_starts_with: 'header_contains',
        field_ends_with: 'header_contains',
        exists: 'header_present',
        field_not_present: 'header_present',
      };
      return map[operator] || 'header_equals';
    }
    const map: Record<string, string> = {
      equals: 'field_equals',
      field_not_equals: 'field_equals',
      contains: 'field_contains',
      field_not_contains: 'field_not_contains',
      field_starts_with: 'field_contains',
      field_ends_with: 'field_contains',
      field_greater_than: 'field_greater_than',
      field_less_than: 'field_less_than',
      field_greater_equal: 'field_greater_equal',
      field_less_equal: 'field_less_equal',
      field_is_true: 'field_is_true',
      field_is_false: 'field_is_false',
      field_null: 'field_null',
      field_not_null: 'field_not_null',
      array_length: 'equals',
      exists: 'field_present',
      field_not_present: 'field_not_present',
      field_has_property: 'field_present',
      date_greater_than: 'date_greater_than',
      date_less_than: 'date_less_than',
    };
    return map[operator] || 'field_equals';
  };

  const buildRichDescription = (
    gType: string,
    value: string,
    comparison: string,
  ): string => {
    const generalTpl = generalAssertions.find((a) => a.id === gType);
    const compLabel = comparison === 'less' ? 'less than' : 'more than';
    const unitSuffix =
      gType === 'response_time' ? 'ms' : gType === 'payload_size' ? 'KB' : '';
    if (generalTpl?.hasComparison) {
      return `Response ${gType === 'response_time' ? 'time' : 'payload size'} should be ${compLabel} ${value}${unitSuffix}`;
    }
    if (gType === 'status_equals')
      return `Response status code should be ${value}`;
    if (gType === 'contains_text')
      return `Response body should contain the text "${value}"`;
    if (
      ['contains_static', 'contains_dynamic', 'contains_extracted'].includes(
        gType,
      )
    ) {
      return `Response body should contain variable ${value}`;
    }
    return `${generalTpl?.label ?? gType} should equal ${value}`;
  };

  const handleSuggestedClick = (assertionItem: any) => {
    const isAlreadyEnabled = assertionItem.assertion.enabled;
    const isMarkedForRemoval = assertionsToRemove.has(assertionItem.id);
    if (isAlreadyEnabled && !isMarkedForRemoval) return;
    if (isMarkedForRemoval) {
      const s = new Set(assertionsToRemove);
      s.delete(assertionItem.id);
      setAssertionsToRemove(s);
      return;
    }
    const alreadyPending = pendingAssertions.find(
      (a) => a._isSuggested && a._suggestedId === assertionItem.id,
    );
    if (alreadyPending) {
      setPendingAssertions((prev) =>
        prev.filter((a) => a._suggestedId !== assertionItem.id),
      );
      return;
    }
    setPendingAssertions((prev) => [
      ...prev,
      {
        ...assertionItem.assertion,
        _isSuggested: true,
        _suggestedId: assertionItem.id,
        _label: assertionItem.label,
      },
    ]);
  };

  const handleMarkForRemoval = (
    assertionId: string,
    event: React.MouseEvent,
  ) => {
    event.stopPropagation();
    const s = new Set(assertionsToRemove);
    s.has(assertionId) ? s.delete(assertionId) : s.add(assertionId);
    setAssertionsToRemove(s);
  };

  const handleRemovePendingAssertion = (id: string) => {
    setPendingAssertions(
      pendingAssertions.filter((a) => (a.id || a._suggestedId) !== id),
    );
  };

  const handleGeneralClick = (id: string) => {
    const assertion = generalAssertions.find((a) => a.id === id);
    const alreadySelected = selectedGeneralAssertions.has(id);
    if (alreadySelected) {
      const savedData = selectedGeneralAssertions.get(id);
      setGeneralType(id);
      setGeneralValue(savedData?.value || '');
      setGeneralComparison(savedData?.comparison || 'less');
    } else if (!assertion?.needsInput) {
      const newMap = new Map(selectedGeneralAssertions);
      newMap.set(id, { value: '', comparison: undefined });
      setSelectedGeneralAssertions(newMap);
    } else {
      setGeneralType(id);
      setGeneralValue('');
      setGeneralComparison('less');
    }
  };

  const buildManualConfig = (op: string, value: string) => {
    const isHeader = displayFieldPath.startsWith('headers.');
    const normalizedFieldPath = isHeader
      ? displayFieldPath.replace(/^headers\./, '').toLowerCase()
      : displayFieldPath;
    let config: any;
    if (isArray) {
      config = {
        id: `manual-${Date.now()}-${op}`,
        ...getArrayAssertionConfig(op, value, normalizedFieldPath),
        source: 'manual',
      };
    } else {
      const assertionType = getAssertionTypeForOperator(op, isHeader);
      config = {
        id: `manual-${Date.now()}-${op}`,
        type: assertionType,
        displayType: assertionType,
        category: isHeader
          ? 'headers'
          : getCategoryForAssertionType(assertionType),
        field: normalizedFieldPath,
        value,
        enabled: true,
        source: 'manual',
        operator: op,
      };
      if (op === 'contains' || op === 'field_not_contains') {
        const mappedOp =
          op === 'contains' ? 'field_contains' : 'field_not_contains';
        config.type = mappedOp;
        config.displayType = mappedOp;
        config.operator = mappedOp;
        config.expectedValue = value;
        config.description = `${normalizedFieldPath} ${op === 'contains' ? 'contains' : 'does not contain'} "${value}"`;
      } else if (
        [
          'field_greater_than',
          'field_less_than',
          'field_greater_equal',
          'field_less_equal',
        ].includes(op)
      ) {
        config.expectedValue = parseFloat(value);
        const sym =
          op === 'field_greater_than'
            ? '>'
            : op === 'field_less_than'
              ? '<'
              : op === 'field_greater_equal'
                ? '≥'
                : '≤';
        config.description = `${normalizedFieldPath} ${sym} ${value}`;
      } else if (['date_greater_than', 'date_less_than'].includes(op)) {
        config.expectedValue = value;
        config.description = `${normalizedFieldPath} ${op === 'date_greater_than' ? 'after' : 'before'} ${value}`;
      } else {
        config.expectedValue = value;
        config.description = `${normalizedFieldPath} ${operators.find((o) => o.id === op)?.label || '='} ${value}`;
      }
    }
    return config;
  };

  const handleAddAssertion = () => {
    if (activeTab === 'suggested' && selectedSuggestedAssertions.size > 0) {
      const newPending: any[] = [];
      selectedSuggestedAssertions.forEach((assertionId) => {
        const assertionItem = suggestedAssertionsList.find(
          (a) => a.id === assertionId,
        );
        if (assertionItem)
          newPending.push({
            ...assertionItem.assertion,
            _isSuggested: true,
            _suggestedId: assertionItem.id,
            _label: assertionItem.label,
          });
      });
      setPendingAssertions([...pendingAssertions, ...newPending]);
      setSelectedSuggestedAssertions(new Set());
      return;
    }
    if (
      activeTab === 'manual' &&
      manualValue &&
      !NO_VALUE_OPERATORS.includes(selectedOperator)
    ) {
      const config = buildManualConfig(selectedOperator, manualValue);
      setPendingAssertions([...pendingAssertions, config]);
      setManualValue('');
      setLocalDateValue('');
      return;
    }
    if (activeTab === 'general' && generalType && generalValue) {
      const richDesc = buildRichDescription(
        generalType,
        generalValue,
        generalComparison,
      );
      const newMap = new Map(selectedGeneralAssertions);
      newMap.set(generalType, {
        value: generalValue,
        comparison: generalComparison,
        _richDescription: richDesc,
      } as any);
      setSelectedGeneralAssertions(newMap);
      setGeneralType('');
      setGeneralValue('');
      setGeneralComparison('less');
      return;
    }
  };

  const handleFinalSave = () => {
    if (!onSelect) return;
    const suggestedToAdd = pendingAssertions
      .filter((a) => a._isSuggested)
      .map(({ _isSuggested, _suggestedId, _label, ...rest }) => rest);
    const manualToAdd = pendingAssertions.filter((a) => !a._isSuggested);
    const toRemove = Array.from(assertionsToRemove);
    if (suggestedToAdd.length > 0 || toRemove.length > 0) {
      onSelect('suggested-multiple', {
        assertions: suggestedToAdd,
        assertionsToRemove: toRemove,
      });
    }
    selectedGeneralAssertions.forEach((data, gType) => {
      const assertion = generalAssertions.find((a) => a.id === gType);
      const config: any = {
        isGeneral: true,
        value: data.value,
        comparison: data.comparison,
      };
      if (assertion?.hasComparison) {
        config.operator =
          data.comparison === 'less' ? 'less_than' : 'greater_than';
        if (gType === 'response_time') config.expectedTime = data.value;
        if (gType === 'payload_size') config.expectedSize = data.value;
      } else {
        config.operator = 'equals';
      }
      onSelect(gType, config);
    });
    manualToAdd.forEach((assertion) =>
      onSelect('manual-direct', { assertion }),
    );
    setSelectedSuggestedAssertions(new Set());
    setAssertionsToRemove(new Set());
    setPendingAssertions([]);
    setSelectedGeneralAssertions(new Map());
  };

  const handleCloseWithSave = () => {
    const hasUnsubmittedManual =
      activeTab === 'manual' &&
      manualValue &&
      !NO_VALUE_OPERATORS.includes(selectedOperator);
    const hasUnsubmittedGeneral =
      activeTab === 'general' && generalType && generalValue;
    if (hasUnsubmittedManual || hasUnsubmittedGeneral || hasChanges) {
      if (hasUnsubmittedManual) {
        const config = buildManualConfig(selectedOperator, manualValue);
        setPendingAssertions((prev) => [...prev, config]);
      }
      if (hasUnsubmittedGeneral) {
        const richDesc = buildRichDescription(
          generalType,
          generalValue,
          generalComparison,
        );
        const newMap = new Map(selectedGeneralAssertions);
        newMap.set(generalType, {
          value: generalValue,
          comparison: generalComparison,
          _richDescription: richDesc,
        } as any);
        setSelectedGeneralAssertions(newMap);
      }
      setTimeout(() => {
        handleFinalSave();
        onClose();
      }, 0);
    } else {
      onClose();
    }
  };

  const canAddAssertion = () => {
    if (activeTab === 'manual')
      return manualValue && !NO_VALUE_OPERATORS.includes(selectedOperator);
    if (activeTab === 'general') return generalType && generalValue;
    return false;
  };

  const canSaveAssertion = () => hasChanges || canAddAssertion();

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') hasChanges ? handleCloseWithSave() : onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, hasChanges]);

  useEffect(() => {
    if (isOpen && operators.length > 0 && activeTab === 'manual')
      setSelectedOperator(operators[0].id);
  }, [isOpen, activeTab]);

  useEffect(() => {
    if (!isOpen) {
      setAssertionsToRemove(new Set());
      setSelectedSuggestedAssertions(new Set());
      setSelectedOperator('');
      setManualValue('');
      setLocalDateValue('');
      setGeneralType('');
      setGeneralValue('');
      setGeneralComparison('less');
      setPendingAssertions([]);
      setSelectedGeneralAssertions(new Map());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const suggestedCount = pendingAssertions.filter((a) => a._isSuggested).length;
  const manualCount = pendingAssertions.filter((a) => !a._isSuggested).length;
  const generalCount = selectedGeneralAssertions.size;
  const totalPending =
    pendingAssertions.length + selectedGeneralAssertions.size;

  const TABS = [
    { id: 'suggested' as const, label: 'Suggested', count: suggestedCount },
    { id: 'manual' as const, label: 'Manual', count: manualCount },
    { id: 'general' as const, label: 'General', count: generalCount },
  ];

  return (
    <TooltipProvider delayDuration={400}>
      <div
        className='fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-[2px] p-0 sm:p-4'
        onClick={handleCloseWithSave}
      >
        <div
          className='w-full sm:max-w-2xl bg-white dark:bg-gray-950 rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92dvh] sm:max-h-[85vh] overflow-hidden border border-gray-200 dark:border-gray-800'
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className='flex-shrink-0 border-b border-gray-100 dark:border-gray-800'>
            <div className='flex justify-center pt-3 pb-1 sm:hidden'>
              <div className='w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-700' />
            </div>
            <div className='flex items-start justify-between px-4 pt-2 sm:pt-4 pb-2 gap-2'>
              <div className='min-w-0 flex-1'>
                <h2 className='text-base font-semibold text-gray-900 dark:text-gray-100 leading-tight'>
                  Add Assertions
                </h2>
                <div className='flex items-center gap-1.5 mt-1 flex-wrap'>
                  <span
                    className='text-xs font-mono text-[#136fb0] font-medium truncate max-w-[160px]'
                    title={displayFieldPath}
                  >
                    {displayFieldPath}
                  </span>
                  <TypeBadge type={valueType} />
                  <span
                    className='text-xs text-gray-400 font-mono truncate max-w-[120px]'
                    title={valuePreview}
                  >
                    {valuePreview}
                  </span>
                </div>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type='button'
                    onClick={handleCloseWithSave}
                    className='flex-shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#136fb0]'
                    aria-label='Close'
                  >
                    <X className='w-4 h-4' />
                  </button>
                </TooltipTrigger>
                <TooltipContent side='left'>Close</TooltipContent>
              </Tooltip>
            </div>
            <div className='flex px-4'>
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type='button'
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      borderBottom: isActive
                        ? '2px solid #136fb0'
                        : '2px solid transparent',
                      color: isActive ? '#136fb0' : undefined,
                    }}
                    className={`flex items-center gap-0.5 px-3 py-2 text-sm font-medium transition-colors outline-none ${!isActive ? 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300' : ''}`}
                  >
                    {tab.label}
                    <CountBadge count={tab.count} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Body */}
          <div className='flex-1 overflow-y-auto overflow-x-hidden p-4 scrollbar-thin'>
            {/* Suggested Tab */}
            {activeTab === 'suggested' && (
              <div className='space-y-2'>
                <p className='text-xs text-gray-500 dark:text-gray-400 mb-2 flex items-start gap-1.5 bg-blue-100 dark:bg-blue-950/30 rounded px-2 py-1'>
                  <Info className='w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-[#136fb0]' />
                  Toggle assertions on or off. They will be saved when you
                  close.
                </p>
                {suggestedAssertionsList.length === 0 ? (
                  <EmptyState
                    icon='🔍'
                    title='No suggestions available'
                    body='No suggestions found for this field.'
                  />
                ) : (
                  suggestedAssertionsList.map((assertionItem) => {
                    const isAlreadyEnabled = assertionItem.assertion.enabled;
                    const isMarkedForRemoval = assertionsToRemove.has(
                      assertionItem.id,
                    );
                    const isDisabled = isAlreadyEnabled && !isMarkedForRemoval;
                    const isPending = pendingAssertions.some(
                      (a) =>
                        a._isSuggested && a._suggestedId === assertionItem.id,
                    );
                    const isVisuallySelected = isPending || isDisabled;
                    return (
                      <div
                        key={assertionItem.id}
                        className={`flex items-center justify-between gap-3 p-3 rounded-lg border transition-all overflow-hidden group/assertion
                          ${
                            isMarkedForRemoval
                              ? 'border-red-300 bg-red-50 dark:bg-red-950/20'
                              : isVisuallySelected
                                ? 'border-[#136fb0] bg-blue-50 dark:bg-blue-950/30'
                                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                      >
                        <div className='flex-1 min-w-0'>
                          <div className='flex items-center gap-2'>
                            <p
                              className={`text-sm font-medium leading-snug truncate ${isMarkedForRemoval ? 'text-red-700' : 'text-gray-800 dark:text-gray-200'}`}
                            >
                              {assertionItem.label}
                            </p>
                            {isAlreadyEnabled && !isMarkedForRemoval && (
                              <span className='flex-shrink-0 flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-medium'>
                                <CheckCircle className='w-3 h-3' />
                                Added
                              </span>
                            )}
                          </div>
                          <p className='text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate'>
                            {assertionItem.description}
                          </p>
                        </div>
                        <div className='flex items-center gap-2 flex-shrink-0'>
                          {isAlreadyEnabled && (
                            <button
                              type='button'
                              onClick={(e) =>
                                handleMarkForRemoval(assertionItem.id, e)
                              }
                              className={`p-1.5 rounded-lg transition-all ${isMarkedForRemoval ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover/assertion:opacity-100'}`}
                              title={
                                isMarkedForRemoval
                                  ? 'Undo removal'
                                  : 'Remove assertion'
                              }
                            >
                              <X className='w-3.5 h-3.5' />
                            </button>
                          )}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type='button'
                                role='switch'
                                aria-checked={isVisuallySelected}
                                onClick={() =>
                                  handleSuggestedClick(assertionItem)
                                }
                                disabled={isDisabled}
                                className={`relative inline-flex h-5 w-9 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#136fb0]
                                  ${isMarkedForRemoval ? 'bg-red-400 cursor-pointer' : isVisuallySelected ? 'bg-[#136fb0]' : 'bg-[#b0bec5] dark:bg-gray-600'}
                                  ${isDisabled ? 'cursor-default opacity-70' : ''}`}
                              >
                                <span
                                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${isVisuallySelected || isMarkedForRemoval ? 'translate-x-4' : 'translate-x-0'}`}
                                />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side='top'>
                              {isMarkedForRemoval
                                ? 'Undo removal'
                                : isDisabled
                                  ? 'Already added'
                                  : isVisuallySelected
                                    ? 'Deselect'
                                    : 'Select to stage'}
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Manual Tab */}
            {activeTab === 'manual' && (
              <div className='space-y-4'>
                <div className='rounded-lg border border-dashed border-[#136fb0]/50 bg-blue-50/50 dark:bg-blue-950/20 p-3 space-y-3'>
                  <p className='text-xs font-semibold text-[#136fb0] uppercase tracking-wider'>
                    New Assertion
                  </p>
                  <div>
                    <p className='text-xs text-gray-500 dark:text-gray-400 mb-2'>
                      Operator
                    </p>
                    <div className='flex flex-wrap gap-1.5'>
                      {operators.map((op) => (
                        <button
                          key={op.id}
                          type='button'
                          title={op.description}
                          onClick={() => {
                            setSelectedOperator(op.id);
                            if (NO_VALUE_OPERATORS.includes(op.id)) {
                              const isHeader =
                                displayFieldPath.startsWith('headers.');
                              const assertionType = getAssertionTypeForOperator(
                                op.id,
                                isHeader,
                              );
                              const normalizedFieldPath = isHeader
                                ? displayFieldPath
                                    .replace(/^headers\./, '')
                                    .toLowerCase()
                                : displayFieldPath;
                              const config: any = {
                                id: `manual-${Date.now()}-${op.id}`,
                                type: assertionType,
                                displayType: assertionType,
                                category: isHeader
                                  ? 'headers'
                                  : getCategoryForAssertionType(assertionType),
                                field: normalizedFieldPath,
                                enabled: true,
                                source: 'manual',
                                description: `${normalizedFieldPath} ${op.description}`,
                                operator: op.id,
                              };
                              setPendingAssertions((prev) => [...prev, config]);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors
                            ${selectedOperator === op.id ? 'border-[#136fb0] bg-[#136fb0] text-white' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-[#136fb0] hover:text-[#136fb0] bg-white dark:bg-gray-900'}`}
                        >
                          {op.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {!NO_VALUE_OPERATORS.includes(selectedOperator) && (
                    <div className='flex flex-col sm:flex-row gap-2'>
                      <input
                        type={valueType === 'date' ? 'datetime-local' : 'text'}
                        value={
                          valueType === 'date' ? localDateValue : manualValue
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          if (valueType === 'date') {
                            setLocalDateValue(val);
                            if (val)
                              setManualValue(new Date(val).toISOString());
                          } else setManualValue(val);
                        }}
                        onKeyDown={(e) =>
                          e.key === 'Enter' &&
                          canAddAssertion() &&
                          handleAddAssertion()
                        }
                        placeholder={
                          valueType === 'date'
                            ? 'Select date and time'
                            : 'Enter the expected value…'
                        }
                        className='flex-1 min-w-0 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#136fb0] placeholder-gray-400'
                        autoFocus
                      />
                      <button
                        type='button'
                        onClick={handleAddAssertion}
                        disabled={!canAddAssertion()}
                        className='flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-[#136fb0] hover:bg-[#0f5d97] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#136fb0] focus:ring-offset-1'
                      >
                        <Plus className='w-4 h-4' />
                        <span className='whitespace-nowrap'>Add</span>
                      </button>
                    </div>
                  )}
                  {valueType === 'date' && (
                    <p className='text-xs text-gray-500'>
                      Format:{' '}
                      <span className='font-medium'>DD-MM-YYYY HH:mm</span> (24
                      hrs) Example:{' '}
                      <span className='font-medium'>10-01-2026 20:44</span>
                    </p>
                  )}
                  <div className='rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 px-3 py-2'>
                    <p className='text-sm text-gray-700 dark:text-gray-300'>
                      <span className='font-mono text-[#136fb0]'>
                        {displayFieldPath}
                      </span>
                      <span className='mx-2 text-gray-500'>
                        {
                          operators.find((o) => o.id === selectedOperator)
                            ?.label
                        }
                      </span>
                      {!NO_VALUE_OPERATORS.includes(selectedOperator) && (
                        <span className='font-mono text-gray-700 dark:text-gray-300'>
                          {manualValue || '…'}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* General Tab */}
            {activeTab === 'general' && (
              <div className='space-y-4'>
                <p className='text-xs text-gray-500 dark:text-gray-400 mb-2 flex items-start gap-1.5 bg-blue-100 dark:bg-blue-950/30 rounded px-2 py-1'>
                  <Info className='w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-[#136fb0]' />
                  Global assertions that apply to the entire response, not a
                  specific field.
                </p>
                {!generalType && (
                  <div className='flex flex-wrap gap-2'>
                    {generalAssertions.map((a) => {
                      const isSelected = selectedGeneralAssertions.has(a.id);
                      const alreadyExists = allAssertions.some(
                        (assertion) =>
                          assertion.type === a.id && assertion.enabled,
                      );
                      return (
                        <button
                          key={a.id}
                          type='button'
                          onClick={() => handleGeneralClick(a.id)}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-full border text-sm font-medium transition-colors
                            ${isSelected ? 'border-[#136fb0] bg-[#136fb0] text-white' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-[#136fb0] hover:text-[#136fb0] dark:hover:text-[#136fb0]'}`}
                        >
                          <Plus className='w-3.5 h-3.5' />
                          {a.label}
                          {alreadyExists && (
                            <span className='ml-1 text-[10px] text-green-400 font-bold'>
                              ✓
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
                {generalType &&
                  (() => {
                    const tpl = generalAssertions.find(
                      (t) => t.id === generalType,
                    )!;
                    return (
                      <div className='rounded-lg border border-dashed border-[#136fb0]/50 bg-blue-50/50 dark:bg-blue-950/20 p-3 space-y-2'>
                        <div className='flex items-center justify-between'>
                          <div className='flex items-center gap-2'>
                            <p className='text-xs font-semibold text-[#136fb0]'>
                              {tpl.label}
                            </p>
                            {[
                              'contains_static',
                              'contains_dynamic',
                              'contains_extracted',
                            ].includes(generalType) && (
                              <div className='relative inline-flex items-center group/tooltip'>
                                <Info className='w-3.5 h-3.5 cursor-pointer text-gray-400' />
                                <div className='absolute left-0 top-full mt-1 w-64 p-2 border rounded text-xs shadow-lg z-10 bg-white opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-opacity pointer-events-none'>
                                  {generalType === 'contains_static' &&
                                    'Static variables for the request will be listed below'}
                                  {generalType === 'contains_dynamic' &&
                                    'Dynamic variables for the request will be listed below'}
                                  {generalType === 'contains_extracted' &&
                                    'Extracted variables for the request will be listed below'}
                                </div>
                              </div>
                            )}
                          </div>
                          <button
                            type='button'
                            onClick={() => setGeneralType('')}
                            className='text-xs text-gray-500 hover:text-gray-700 hover:underline'
                          >
                            ← Back
                          </button>
                        </div>
                        {tpl.hasComparison && (
                          <div className='flex gap-2'>
                            {(['less', 'more'] as const).map((c) => (
                              <button
                                key={c}
                                type='button'
                                onClick={() => setGeneralComparison(c)}
                                className={`flex-1 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors
                                ${generalComparison === c ? 'border-[#136fb0] bg-[#136fb0] text-white' : 'border-gray-300 text-gray-700 hover:border-[#136fb0] bg-white dark:bg-gray-900 dark:text-gray-300'}`}
                              >
                                {c === 'less' ? 'Less than' : 'More than'}
                              </button>
                            ))}
                          </div>
                        )}
                        <div className='flex flex-col sm:flex-row gap-2'>
                          <div className='relative flex-1 min-w-0'>
                            {(generalType === 'response_time' ||
                              generalType === 'payload_size') && (
                              <span className='absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400 pointer-events-none z-10'>
                                {generalType === 'response_time' ? 'ms' : 'KB'}
                              </span>
                            )}
                            {generalType === 'contains_static' ? (
                              <select
                                value={generalValue}
                                onChange={(e) =>
                                  setGeneralValue(e.target.value)
                                }
                                className='w-full appearance-none bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#136fb0] pr-8'
                                autoFocus
                              >
                                <option value=''>
                                  Select static variable...
                                </option>
                                {staticVariables.map((v) => (
                                  <option key={v.name} value={`{{${v.name}}}`}>
                                    {v.name} = {truncate(v.value, 60)}
                                  </option>
                                ))}
                              </select>
                            ) : generalType === 'contains_dynamic' ? (
                              <select
                                value={generalValue}
                                onChange={(e) =>
                                  setGeneralValue(e.target.value)
                                }
                                className='w-full appearance-none bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#136fb0] pr-8'
                                autoFocus
                              >
                                <option value=''>
                                  Select dynamic variable...
                                </option>
                                {filteredDynamicVariables.map((v) => (
                                  <option key={v.name} value={`{{${v.name}}}`}>
                                    {v.name} = {truncate(v.value, 60)}
                                  </option>
                                ))}
                              </select>
                            ) : generalType === 'contains_extracted' ? (
                              <select
                                value={generalValue}
                                onChange={(e) =>
                                  setGeneralValue(e.target.value)
                                }
                                className='w-full appearance-none bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#136fb0] pr-8'
                                autoFocus
                              >
                                <option value=''>
                                  Select extracted variable...
                                </option>
                                {filteredExtractedVariables.length > 0 ? (
                                  filteredExtractedVariables.map((v) => (
                                    <option
                                      key={v.name}
                                      value={`{{${v.name}}}`}
                                    >
                                      {v.name} = {truncate(v.value, 60)}
                                    </option>
                                  ))
                                ) : (
                                  <option disabled>
                                    No extracted variables available
                                  </option>
                                )}
                              </select>
                            ) : (
                              <input
                                type={tpl.inputType || 'text'}
                                value={generalValue}
                                onChange={(e) =>
                                  setGeneralValue(e.target.value)
                                }
                                onKeyDown={(e) =>
                                  e.key === 'Enter' &&
                                  canAddAssertion() &&
                                  handleAddAssertion()
                                }
                                placeholder={`Enter ${tpl.inputLabel}`}
                                className={`w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#136fb0] placeholder-gray-400 ${generalType === 'response_time' || generalType === 'payload_size' ? 'pr-12' : ''}`}
                                autoFocus
                              />
                            )}
                          </div>
                          <div className='flex gap-1 flex-shrink-0'>
                            <button
                              type='button'
                              onClick={handleAddAssertion}
                              disabled={!generalValue}
                              className='px-3 py-2 bg-[#136fb0] hover:bg-[#0f5d97] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors'
                            >
                              Add
                            </button>
                            <button
                              type='button'
                              onClick={() => setGeneralType('')}
                              className='px-3 py-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-sm transition-colors'
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
              </div>
            )}

            {/* Pending Panel */}
            {(pendingAssertions.length > 0 ||
              selectedGeneralAssertions.size > 0) && (
              <div className='border-t border-gray-200 dark:border-gray-700 mt-4 pt-4'>
                <h3 className='text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3'>
                  Added (
                  {pendingAssertions.length + selectedGeneralAssertions.size})
                </h3>
                <div className='space-y-2 max-h-48 overflow-y-auto scrollbar-thin pr-1'>
                  {Array.from(selectedGeneralAssertions.entries()).map(
                    ([gType, data]) => {
                      const assertion = generalAssertions.find(
                        (a) => a.id === gType,
                      );
                      if (!assertion) return null;
                      let displayValue = data.value;
                      if (assertion.hasComparison) {
                        displayValue = `${data.comparison === 'less' ? '< ' : '> '}${data.value}${gType === 'response_time' ? 'ms' : gType === 'payload_size' ? 'KB' : ''}`;
                      }
                      return (
                        <div
                          key={gType}
                          className='flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-lg'
                        >
                          <div className='flex-1 min-w-0'>
                            <p className='text-sm font-medium text-purple-900 leading-snug'>
                              {(data as any)._richDescription ??
                                `${assertion.label}: ${displayValue}`}
                            </p>
                            <p className='text-xs text-purple-600 mt-0.5'>
                              General assertion
                            </p>
                          </div>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type='button'
                                onClick={() => {
                                  const m = new Map(selectedGeneralAssertions);
                                  m.delete(gType);
                                  setSelectedGeneralAssertions(m);
                                }}
                                className='p-1.5 text-purple-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all flex-shrink-0'
                              >
                                <Trash2 className='w-4 h-4' />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side='top'>
                              Remove Assertions
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      );
                    },
                  )}
                  {pendingAssertions.map((assertion) => (
                    <div
                      key={assertion.id || assertion._suggestedId}
                      className={`flex items-center justify-between p-3 rounded-lg border ${assertion._isSuggested ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'}`}
                    >
                      <div className='flex-1 min-w-0'>
                        <p
                          className={`text-sm font-medium leading-snug ${assertion._isSuggested ? 'text-blue-900' : 'text-green-900'}`}
                        >
                          {assertion._label ||
                            assertion.description ||
                            assertion.type}
                        </p>
                        <p
                          className={`text-xs mt-0.5 ${assertion._isSuggested ? 'text-blue-600' : 'text-green-600'}`}
                        >
                          {assertion._isSuggested
                            ? 'Suggested assertion'
                            : 'Manual assertion'}
                        </p>
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type='button'
                            onClick={() =>
                              handleRemovePendingAssertion(
                                assertion.id || assertion._suggestedId,
                              )
                            }
                            className={`p-1.5 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all flex-shrink-0 ${assertion._isSuggested ? 'text-blue-600' : 'text-green-600'}`}
                          >
                            <Trash2 className='w-4 h-4' />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side='top'>
                          Remove Assertion
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className='flex-shrink-0 border-t border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center justify-between gap-3 bg-gray-50 dark:bg-gray-900/50'>
            <div className='flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400'>
              {totalPending > 0 ? (
                <>
                  <CheckCircle className='w-3.5 h-3.5 text-green-500 flex-shrink-0' />
                  <span>
                    <span className='font-semibold text-gray-700 dark:text-gray-300'>
                      {totalPending}
                    </span>{' '}
                    assertion{totalPending !== 1 ? 's' : ''} Selected
                  </span>
                </>
              ) : (
                <span>No assertions selected yet</span>
              )}
            </div>
            <div className='flex gap-2'>
              <button
                type='button'
                onClick={onClose}
                className='px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#136fb0]'
              >
                Cancel
              </button>
              <Button
                onClick={
                  canAddAssertion() ? handleAddAssertion : handleCloseWithSave
                }
                disabled={!canSaveAssertion()}
                className='px-6 py-2 text-sm font-medium text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
              >
                Add Assertion
              </Button>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

export default AssertionModal;
