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
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { getCategoryForAssertionType } from '@/lib/assertion-utils';

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
  initialField?: string;
  initialValue?: any;
  fieldType?: string;
  availableOperators?: Operator[];
  suggestedAssertions?: any[];
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
    new Set()
  );
  const [localDateValue, setLocalDateValue] = useState('');

  const isDateValue = (value: any): boolean => {
    if (typeof value !== 'string') return false;

    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;

    const commonDateFormats = [
      /^\d{4}-\d{2}-\d{2}$/,
      /^\d{2}\/\d{2}\/\d{4}$/,
      /^\d{2}-\d{2}-\d{4}$/,
    ];

    if (iso8601Regex.test(value)) return true;
    if (commonDateFormats.some((regex) => regex.test(value))) return true;

    const date = new Date(value);
    return !isNaN(date.getTime());
  };

  const truncate = (text: string, max = 50) =>
    text.length > max ? text.slice(0, max) + '…' : text;

  const displayFieldPath = initialField || fieldPath || '';
  const displayFieldValue =
    initialValue !== undefined ? initialValue : fieldValue;

  const getOperatorsForType = (type: string, isArray: boolean) => {
    if (isArray) {
      return [
        { id: 'array_length', label: 'length', description: 'Array length' },
        { id: 'equals', label: '=', description: 'Equals' },
        { id: 'field_not_equals', label: '≠', description: 'Not equals' },
      ];
    }

    switch (type) {
      case 'string':
        return [
          // { id: 'equals', label: '=', description: 'Equals' },
          // { id: 'field_not_equals', label: '≠', description: 'Not equals' },
          { id: 'contains', label: 'contains', description: 'Contains' },
          {
            id: 'field_not_contains',
            label: 'not contains',
            description: 'Does not contain',
          },
          // {
          //   id: 'field_starts_with',
          //   label: 'starts with',
          //   description: 'Starts with',
          // },
          // {
          //   id: 'field_ends_with',
          //   label: 'ends with',
          //   description: 'Ends with',
          // },
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
          // {
          //   id: 'between',
          //   label: 'between',
          //   description: 'Between (inclusive)',
          // },
        ];

      case 'boolean':
        return [
          // { id: 'equals', label: '=', description: 'Equals' },
          // { id: 'field_not_equals', label: '≠', description: 'Not equals' },
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
          // {
          //   id: 'field_has_property',
          //   label: 'has property',
          //   description: 'Has property',
          // },
          // { id: 'equals', label: '=', description: 'Equals' },
          // { id: 'field_not_equals', label: '≠', description: 'Not equals' },
        ];

      default:
        return [
          { id: 'equals', label: '=', description: 'Equals' },
          { id: 'field_not_equals', label: '≠', description: 'Not equals' },
        ];
    }
  };

  const getValueType = (value: any): string => {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    if (isDateValue(value)) return 'date';
    return typeof value;
  };

  const valueType = getValueType(displayFieldValue);

  const isArray = Array.isArray(displayFieldValue);

  const operators = getOperatorsForType(valueType, isArray);

  const suggestedAssertionsList = suggestedAssertions.map((assertion) => {
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

    return {
      id: assertion.id,
      label,
      description,
      icon,
      assertion,
    };
  });

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
      inputType: 'select',
      inputLabel: 'Select extracted variable',
      showForTypes: ['all'],
    },
  ];

  const generalAssertions = allGeneralAssertions.filter((assertion) => {
    if (assertion.showForTypes.includes('all')) {
      return true;
    }
    return assertion.showForTypes.includes(valueType);
  });

  const handleSuggestedClick = (assertionItem: any) => {
    const isAlreadyEnabled = assertionItem.assertion.enabled;
    const isMarkedForRemoval = assertionsToRemove.has(assertionItem.id);

    if (isAlreadyEnabled && !isMarkedForRemoval) {
      return;
    }

    if (isMarkedForRemoval) {
      const newRemoveSet = new Set(assertionsToRemove);
      newRemoveSet.delete(assertionItem.id);
      setAssertionsToRemove(newRemoveSet);
      return;
    }

    const newSelected = new Set(selectedSuggestedAssertions);
    if (newSelected.has(assertionItem.id)) {
      newSelected.delete(assertionItem.id);
    } else {
      newSelected.add(assertionItem.id);
    }
    setSelectedSuggestedAssertions(newSelected);
  };

  const handleMarkForRemoval = (
    assertionId: string,
    event: React.MouseEvent
  ) => {
    event.stopPropagation();
    const newRemoveSet = new Set(assertionsToRemove);
    if (newRemoveSet.has(assertionId)) {
      newRemoveSet.delete(assertionId);
    } else {
      newRemoveSet.add(assertionId);
    }
    setAssertionsToRemove(newRemoveSet);
  };

  const handleSuggestedSubmit = () => {
    let updatedAssertions = [...allAssertions];

    if (assertionsToRemove.size > 0) {
      updatedAssertions = updatedAssertions.map((a: any) => {
        if (
          assertionsToRemove.has(a.id) &&
          !selectedSuggestedAssertions.has(a.id)
        ) {
          return { ...a, enabled: false };
        }
        return a;
      });
    }

    selectedSuggestedAssertions.forEach((assertionId) => {
      const assertionItem = suggestedAssertionsList.find(
        (a) => a.id === assertionId
      );
      if (assertionItem) {
        updatedAssertions = updatedAssertions.map((a: any) =>
          a.id === assertionItem.assertion.id ? { ...a, enabled: true } : a
        );
      }
    });

    if (setAssertions) {
      setAssertions(updatedAssertions);
    }

    setSelectedSuggestedAssertions(new Set());
    setAssertionsToRemove(new Set());
    onClose();
  };

  const getAssertionTypeForOperator = (
    operator: string,
    isHeader = false
  ): string => {
    if (isHeader) {
      const headerOperatorTypeMap: Record<string, string> = {
        equals: 'header_equals',
        field_not_equals: 'header_equals',
        contains: 'header_contains',
        field_not_contains: 'header_contains',
        field_starts_with: 'header_contains',
        field_ends_with: 'header_contains',
        exists: 'header_present',
        field_not_present: 'header_present',
      };
      return headerOperatorTypeMap[operator] || 'header_equals';
    }

    const operatorTypeMap: Record<string, string> = {
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
      between: 'field_range',
      field_is_true: 'field_is_true',
      field_is_false: 'field_is_false',
      field_null: 'field_null',
      field_not_null: 'field_not_null',
      array_length: 'array_length',
      exists: 'field_present',
      field_not_present: 'field_not_present',
      field_has_property: 'field_present',
      date_greater_than: 'date_greater_than',
      date_less_than: 'date_less_than',
    };

    return operatorTypeMap[operator] || 'field_equals';
  };

  const handleManualSubmit = () => {
    const operatorsWithoutValue = [
      'field_null',
      'field_not_null',
      'field_is_true',
      'field_is_false',
      'exists',
      'field_not_present',
    ];

    if (!operatorsWithoutValue.includes(selectedOperator) && !manualValue) {
      return;
    }

    const isHeader = displayFieldPath.startsWith('headers.');

    const assertionType = getAssertionTypeForOperator(
      selectedOperator,
      isHeader
    );

    const operatorLabels: Record<string, string> = {
      equals: 'equals',
      field_not_equals: 'does not equal',
      field_greater_than: 'is greater than',
      field_less_than: 'is less than',
      contains: 'contains',
      field_not_contains: 'does not contain',
      array_length: 'has length',
      field_null: 'is null',
      field_not_null: 'is not null',
      field_is_true: 'is true',
      field_is_false: 'is false',
      exists: 'exists',
      field_not_present: 'does not exist',
      date_greater_than: 'is after',
      date_less_than: 'is before',
    };

    const operatorText = operatorLabels[selectedOperator] || selectedOperator;

    const normalizedFieldPath = isHeader
      ? displayFieldPath.replace(/^headers\./, '').toLowerCase()
      : displayFieldPath;

    const description = `${normalizedFieldPath} ${operatorText}${
      manualValue ? ` "${manualValue}"` : ''
    }`;

    const config: any = {
      id: `manual-${Date.now()}`,
      type: assertionType,
      displayType: assertionType,
      category: isHeader
        ? 'headers'
        : getCategoryForAssertionType(assertionType),
      description,
      operator: selectedOperator,
      expectedValue: manualValue,
      enabled: true,
      field: normalizedFieldPath,
    };

    if (onSelect) {
      onSelect(assertionType, config);
    }
  };

  const handleGeneralClick = (id: string) => {
    const assertion = generalAssertions.find((a) => a.id === id);
    if (!assertion?.needsInput) {
      if (onSelect) {
        onSelect(id, { isGeneral: true });
      }
    } else {
      setGeneralType(id);
      setGeneralValue('');
    }
  };

  const handleGeneralSubmit = () => {
    if (!generalValue) return;
    const config: any = {
      isGeneral: true,
      value: generalValue,
      category: getCategoryForAssertionType(generalType),
    };

    const assertion = generalAssertions.find((a) => a.id === generalType);
    if (assertion?.hasComparison) {
      config.comparison = generalComparison;
      if (generalComparison === 'less') {
        config.operator = 'less_than';
      } else if (generalComparison === 'more') {
        config.operator = 'greater_than';
      }

      if (generalType === 'response_time') {
        config.expectedTime = generalValue;
      } else if (generalType === 'payload_size') {
        config.expectedSize = generalValue;
      }
    } else if (generalType === 'status_equals') {
      config.operator = 'equals';
    }

    if (
      generalType === 'contains_static' ||
      generalType === 'contains_dynamic' ||
      generalType === 'contains_text'
    ) {
      config.scope = 'full';
    }

    if (onSelect) {
      onSelect(generalType, config);
    }
    setGeneralType('');
    setGeneralValue('');
    setGeneralComparison('less');
  };

  const staticVariables = variables.filter((v) => v.name.startsWith('S_'));
  const filteredDynamicVariables = dynamicVariables.filter((v) =>
    v.name.startsWith('D_')
  );
  const filteredExtractedVariables = extractedVariables.filter((v) =>
    v.name.startsWith('E_')
  );

  const displayedSuggestions = suggestedAssertionsList;

  const hasChanges =
    selectedSuggestedAssertions.size > 0 || assertionsToRemove.size > 0;
  const totalChanges =
    selectedSuggestedAssertions.size + assertionsToRemove.size;

  const initialEnabledCount = suggestedAssertionsList.filter(
    (a) => a.assertion.enabled
  ).length;

  const finalCount =
    initialEnabledCount +
    selectedSuggestedAssertions.size -
    assertionsToRemove.size;

  const totalAssertions = suggestedAssertionsList.length;

  const shouldDisableButton = finalCount === initialEnabledCount;

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setAssertionsToRemove(new Set());
      setSelectedSuggestedAssertions(new Set());
      setSelectedOperator('equals');
      setManualValue('');
      setLocalDateValue('');
      setGeneralType('');
      setGeneralValue('');
      setGeneralComparison('less');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className='fixed inset-0 bg-foreground/30 backdrop-blur-sm flex items-center justify-center z-50 p-4'
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className='bg-card rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col animate-fade-in'
      >
        {/* Header */}
        <div className='px-6 py-4 border-b border-border flex items-center justify-between flex-shrink-0'>
          <div className='flex-1'>
            <h2 className='text-lg font-semibold text-card-foreground'>
              Add Assertion
            </h2>
            <p className='text-xs text-muted-foreground mt-1 font-mono'>
              {displayFieldPath}
            </p>
          </div>
          <button
            onClick={onClose}
            className='p-1 text-muted-foreground hover:text-card-foreground rounded hover:bg-muted transition-colors ml-2'
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        {/* Tabs */}
        <div className='flex border-b border-gray-200 bg-gray-50'>
          <button
            onClick={() => setActiveTab('suggested')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${
              activeTab === 'suggested'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className='flex items-center justify-center gap-2'>
              <CheckCircle className='w-4 h-4' />
              Suggested ({displayedSuggestions.length})
            </div>
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${
              activeTab === 'manual'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className='flex items-center justify-center gap-2'>
              <Code2 className='w-4 h-4' />
              Manual
            </div>
          </button>
          <button
            onClick={() => setActiveTab('general')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${
              activeTab === 'general'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className='flex items-center justify-center gap-2'>
              <Activity className='w-4 h-4' />
              General
            </div>
          </button>
        </div>

        {/* Content */}
        <div className='flex-1 overflow-y-auto scrollbar-thin px-6 py-4'>
          {activeTab === 'general' && (
            <div className='space-y-2'>
              {!generalType ? (
                <div className='space-y-2'>
                  {generalAssertions.map((a) => {
                    const Icon = a.icon;
                    return (
                      <button
                        key={a.id}
                        onClick={() => handleGeneralClick(a.id)}
                        className='w-full flex items-start gap-4 p-4 rounded-lg border border-border hover:border-primary/30 hover:bg-accent transition-all text-left group'
                      >
                        <div className='w-10 h-10 rounded-lg bg-muted group-hover:bg-accent flex items-center justify-center flex-shrink-0 transition-colors'>
                          <Icon className='w-5 h-5 text-muted-foreground text-gray-900 transition-colors' />
                        </div>
                        <div className='flex-1 min-w-0'>
                          <div className='text-sm font-medium text-card-foreground text-gray-900'>
                            {a.label}
                          </div>
                          <div className='text-xs text-muted-foreground mt-1'>
                            {a.inputLabel || 'No input needed'}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <h3 className='text-sm font-semibold text-card-foreground'>
                        {
                          generalAssertions.find((a) => a.id === generalType)
                            ?.label
                        }
                      </h3>
                      {(generalType === 'contains_static' ||
                        generalType === 'contains_dynamic' ||
                        generalType === 'contains_extracted') && (
                        <div className='relative inline-flex items-center group/tooltip'>
                          <Info className='w-3.5 h-3.5 cursor-pointer' />

                          <div
                            className='
      absolute left-0 top-full mt-1 w-64 p-2
      border rounded text-xs shadow-lg z-10
      bg-white dark:bg-gray-900
      opacity-0 invisible
      group-hover/tooltip:opacity-100
      group-hover/tooltip:visible
      transition-opacity
      pointer-events-none
    '
                          >
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
                      onClick={() => {
                        setGeneralType('');
                        setGeneralValue('');
                      }}
                      className='text-xs text-gray-900 hover:underline'
                    >
                      ← Back
                    </button>
                  </div>
                  {generalAssertions.find((a) => a.id === generalType)
                    ?.hasComparison && (
                    <div>
                      <label className='block text-sm font-semibold text-card-foreground mb-2'>
                        Comparison
                      </label>
                      <div className='grid grid-cols-2 gap-2'>
                        {['less', 'more'].map((c) => (
                          <Button
                            key={c}
                            onClick={() => setGeneralComparison(c)}
                            variant={
                              generalComparison === c ? 'default' : 'outline'
                            }
                            className='px-4 py-2 text-sm font-medium'
                          >
                            {c === 'less' ? 'Less than' : 'More than'}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <label className='block text-sm font-semibold text-card-foreground mb-2'>
                      {
                        generalAssertions.find((a) => a.id === generalType)
                          ?.inputLabel
                      }
                    </label>
                    {generalType === 'contains_static' ? (
                      <select
                        value={generalValue}
                        onChange={(e) => setGeneralValue(e.target.value)}
                        className='w-full px-4 py-3 border border-input bg-card text-card-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent outline-none text-sm'
                        autoFocus
                      >
                        <option value=''>Select static variable...</option>
                        {staticVariables.map((variable) => (
                          <option
                            key={variable.name}
                            value={`{{${variable.name}}}`}
                          >
                            {variable.name} = {truncate(variable.value, 60)}
                          </option>
                        ))}
                      </select>
                    ) : generalType === 'contains_dynamic' ? (
                      <select
                        value={generalValue}
                        onChange={(e) => setGeneralValue(e.target.value)}
                        className='w-full px-4 py-3 border border-input bg-card text-card-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent outline-none text-sm'
                        autoFocus
                      >
                        <option value=''>Select dynamic variable...</option>
                        {filteredDynamicVariables.map((variable) => (
                          <option
                            key={variable.name}
                            value={`{{${variable.name}}}`}
                          >
                            {variable.name} = {truncate(variable.value, 60)}
                          </option>
                        ))}
                      </select>
                    ) : generalType === 'contains_extracted' ? (
                      <select
                        value={generalValue}
                        onChange={(e) => setGeneralValue(e.target.value)}
                        className='w-full px-4 py-3 border border-input bg-card text-card-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent outline-none text-sm'
                        autoFocus
                      >
                        <option value=''>Select extracted variable...</option>
                        {filteredExtractedVariables.length > 0 ? (
                          filteredExtractedVariables.map((variable) => (
                            <option
                              key={variable.name}
                              value={`{{${variable.name}}}`}
                            >
                              {variable.name} = {truncate(variable.value, 60)}
                            </option>
                          ))
                        ) : (
                          <option disabled>
                            No extracted variables available
                          </option>
                        )}
                      </select>
                    ) : generalAssertions.find((a) => a.id === generalType)
                        ?.inputType === 'select' ? (
                      <select
                        value={generalValue}
                        onChange={(e) => setGeneralValue(e.target.value)}
                        className='w-full px-4 py-3 border border-input bg-card text-card-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent outline-none text-sm'
                        autoFocus
                      >
                        <option value=''>Select value...</option>
                        {generalAssertions
                          .find((a) => a.id === generalType)
                          ?.options?.map((opt: any) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                      </select>
                    ) : (
                      <input
                        type={
                          generalAssertions.find((a) => a.id === generalType)
                            ?.inputType || 'text'
                        }
                        value={generalValue}
                        onChange={(e) => setGeneralValue(e.target.value)}
                        placeholder={`Enter ${
                          generalAssertions.find((a) => a.id === generalType)
                            ?.inputLabel
                        }`}
                        className='w-full px-4 py-3 border border-input bg-card text-card-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent outline-none text-sm'
                        autoFocus
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'suggested' && (
            <div className='space-y-2'>
              {displayedSuggestions.length === 0 ? (
                <div className='text-center py-8'>
                  <p className='text-muted-foreground text-sm'>
                    No suggestions available for this field
                  </p>
                </div>
              ) : (
                displayedSuggestions.map((assertionItem) => {
                  const Icon = assertionItem.icon;

                  const isAlreadyEnabled = assertionItem.assertion.enabled;
                  const isMarkedForRemoval = assertionsToRemove.has(
                    assertionItem.id
                  );
                  const isSelected = selectedSuggestedAssertions.has(
                    assertionItem.id
                  );

                  const isDisabled = isAlreadyEnabled && !isMarkedForRemoval;
                  const isVisuallySelected = isSelected || isDisabled;

                  return (
                    <div
                      key={assertionItem.id}
                      className={`w-full flex items-start gap-4 p-4 rounded-lg border transition-all group/assertion ${
                        isMarkedForRemoval
                          ? 'border-red-300 bg-red-50'
                          : isVisuallySelected
                          ? 'border-blue-400 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <button
                        onClick={() => handleSuggestedClick(assertionItem)}
                        className='flex items-start gap-4 flex-1 text-left min-w-0'
                      >
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            isMarkedForRemoval
                              ? 'bg-red-100'
                              : isVisuallySelected
                              ? 'bg-blue-100'
                              : 'bg-gray-100'
                          }`}
                        >
                          <Icon
                            className={`w-5 h-5 ${
                              isMarkedForRemoval
                                ? 'text-red-500'
                                : isVisuallySelected
                                ? 'text-blue-500'
                                : 'text-gray-600'
                            }`}
                          />
                        </div>
                        <div className='flex-1 min-w-0'>
                          <div
                            className={`text-sm font-medium ${
                              isMarkedForRemoval
                                ? 'text-red-700'
                                : isVisuallySelected
                                ? 'text-blue-700'
                                : 'text-gray-900'
                            }`}
                          >
                            {assertionItem.label}
                          </div>
                          <div className='text-xs text-gray-500 mt-1'>
                            {assertionItem.description}
                          </div>
                        </div>
                      </button>
                      {isAlreadyEnabled && (
                        <button
                          onClick={(e) =>
                            handleMarkForRemoval(assertionItem.id, e)
                          }
                          className={`p-1.5 rounded transition-all flex-shrink-0 ${
                            isMarkedForRemoval
                              ? 'bg-red-100 text-red-600 hover:bg-red-200'
                              : 'text-gray-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover/assertion:opacity-100'
                          }`}
                          title={
                            isMarkedForRemoval
                              ? 'Undo removal'
                              : 'Remove assertion'
                          }
                        >
                          <X className='w-4 h-4' />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === 'manual' && (
            <div className='space-y-6'>
              <div>
                <label className='block text-sm font-semibold text-card-foreground mb-3'>
                  Operator
                </label>
                <div className='grid grid-cols-3 gap-2'>
                  {operators.map((op) => (
                    <Button
                      key={op.id}
                      onClick={() => setSelectedOperator(op.id)}
                      title={op.description}
                      variant={
                        selectedOperator === op.id ? 'default' : 'outline'
                      }
                      className='px-3 py-2 text-sm font-medium'
                    >
                      {op.label}
                    </Button>
                  ))}
                </div>
              </div>

              {![
                'field_null',
                'field_not_null',
                'field_is_true',
                'field_is_false',
                'exists',
                'field_not_present',
              ].includes(selectedOperator) && (
                <div>
                  <label className='block text-sm font-semibold text-card-foreground mb-2'>
                    Expected Value
                  </label>
                  <input
                    type={valueType === 'date' ? 'datetime-local' : 'text'}
                    value={valueType === 'date' ? localDateValue : manualValue}
                    onChange={(e) => {
                      if (valueType === 'date') {
                        const local = e.target.value;
                        setLocalDateValue(local);

                        if (local) {
                          const iso = new Date(local).toISOString();
                          setManualValue(iso);
                        }
                      } else {
                        setManualValue(e.target.value);
                      }
                    }}
                    placeholder={
                      valueType === 'date'
                        ? 'Select date and time'
                        : 'Enter the expected value'
                    }
                    className='w-full px-4 py-3 border border-input bg-card text-card-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent outline-none text-sm'
                    autoFocus
                  />
                </div>
              )}

              <div className='bg-accent border border-primary/20 rounded-lg p-3'>
                <p className='text-sm text-card-foreground'>
                  <span className='font-mono text-gray-900'>
                    {displayFieldPath}
                  </span>
                  <span className='text-muted-foreground mx-2'>
                    {operators.find((o) => o.id === selectedOperator)?.label}
                  </span>
                  {![
                    'field_null',
                    'field_not_null',
                    'field_is_true',
                    'field_is_false',
                    'exists',
                    'field_not_present',
                  ].includes(selectedOperator) && (
                    <span className='font-mono text-gray-900'>
                      {manualValue || '...'}
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='px-6 py-4 border-t border-gray-200 flex items-center justify-between flex-shrink-0 bg-gray-50'>
          <button
            onClick={onClose}
            className='px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors'
          >
            Cancel
          </button>
          {activeTab === 'general' && !generalType && (
            <p className='flex-1 text-sm text-gray-500 text-center py-2'>
              Click on any assertion above to add it
            </p>
          )}
          {activeTab === 'general' && generalType && (
            <Button
              onClick={handleGeneralSubmit}
              disabled={!generalValue}
              className='px-4 py-2 text-sm font-medium text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
            >
              Save Assertion
            </Button>
          )}
          {activeTab === 'suggested' && (
            <Button
              onClick={handleSuggestedSubmit}
              disabled={shouldDisableButton}
              className='px-4 py-2 text-sm font-medium text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
            >
              Save Changes ({finalCount}/{totalAssertions})
            </Button>
          )}
          {activeTab === 'manual' && (
            <Button
              onClick={handleManualSubmit}
              disabled={
                ![
                  'field_null',
                  'field_not_null',
                  'field_is_true',
                  'field_is_false',
                  'exists',
                  'field_not_present',
                ].includes(selectedOperator) && !manualValue
              }
              className='px-4 py-2 text-sm font-medium text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
            >
              Save Assertion
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default AssertionModal;
