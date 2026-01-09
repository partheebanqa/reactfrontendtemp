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
import {
  getArrayAssertionConfig,
  getCategoryForAssertionType,
} from '@/lib/assertion-utils';

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
  const [pendingAssertions, setPendingAssertions] = useState<any[]>([]);
  const [selectedGeneralAssertions, setSelectedGeneralAssertions] = useState<
    Map<string, { value: string; comparison?: string }>
  >(new Map());

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
    }

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
      inputType: 'text',
      inputLabel: 'Variable name',
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

    return operatorTypeMap[operator] || 'field_equals';
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

  const handleGeneralSubmit = () => {
    if (!generalValue) return;

    const newMap = new Map(selectedGeneralAssertions);
    newMap.set(generalType, {
      value: generalValue,
      comparison: generalComparison,
    });
    setSelectedGeneralAssertions(newMap);
  };

  const handleFinalSave = () => {
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

    selectedGeneralAssertions.forEach((data, generalType) => {
      const assertion = generalAssertions.find((a) => a.id === generalType);

      const config: any = {
        id: `general-${Date.now()}-${generalType}`,
        type: generalType,
        displayType: generalType,
        category: getCategoryForAssertionType(generalType),
        isGeneral: true,
        value: data.value,
        enabled: true,
        source: 'general',
      };

      if (assertion?.hasComparison) {
        config.comparison = data.comparison;
        config.operator =
          data.comparison === 'less' ? 'less_than' : 'greater_than';

        if (generalType === 'response_time') {
          config.expectedTime = data.value;
          config.description = `Response time ${
            data.comparison === 'less' ? '<' : '>'
          } ${data.value}ms`;
        } else if (generalType === 'payload_size') {
          config.expectedSize = data.value;
          config.description = `Payload size ${
            data.comparison === 'less' ? '<' : '>'
          } ${data.value}KB`;
        }
      } else if (generalType === 'status_equals') {
        config.operator = 'equals';
        config.description = `Status code equals ${data.value}`;
      } else if (generalType === 'contains_text') {
        config.description = `Contains text "${data.value}"`;
      } else if (generalType === 'contains_static') {
        config.description = `Contains static variable ${data.value}`;
      } else if (generalType === 'contains_dynamic') {
        config.description = `Contains dynamic variable ${data.value}`;
      } else if (generalType === 'contains_extracted') {
        config.description = `Contains extracted variable ${data.value}`;
      }

      if (
        generalType === 'contains_static' ||
        generalType === 'contains_dynamic' ||
        generalType === 'contains_text'
      ) {
        config.scope = 'full';
      }

      updatedAssertions.push(config);
    });

    updatedAssertions = [...updatedAssertions, ...pendingAssertions];

    if (setAssertions) {
      setAssertions(updatedAssertions);
    }

    setSelectedSuggestedAssertions(new Set());
    setAssertionsToRemove(new Set());
    setPendingAssertions([]);
    setSelectedGeneralAssertions(new Map());
    onClose();
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
    selectedSuggestedAssertions.size > 0 ||
    assertionsToRemove.size > 0 ||
    pendingAssertions.length > 0 ||
    selectedGeneralAssertions.size > 0;

  const initialEnabledCount = suggestedAssertionsList.filter(
    (a) => a.assertion.enabled
  ).length;

  const finalCount =
    initialEnabledCount +
    selectedSuggestedAssertions.size -
    assertionsToRemove.size +
    pendingAssertions.length +
    selectedGeneralAssertions.size;

  const totalAssertions = suggestedAssertionsList.length;

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
      setPendingAssertions([]);
      setSelectedGeneralAssertions(new Map());
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
                    const isSelected = selectedGeneralAssertions.has(a.id);
                    const savedData = selectedGeneralAssertions.get(a.id);

                    // Check if this assertion type already exists in allAssertions
                    const alreadyExists = allAssertions.some(
                      (assertion) =>
                        assertion.type === a.id && assertion.enabled
                    );

                    return (
                      <button
                        key={a.id}
                        onClick={() => handleGeneralClick(a.id)}
                        className={`w-full flex items-start gap-4 p-4 rounded-lg border transition-all text-left group relative ${
                          isSelected
                            ? 'border-blue-400 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                        }`}
                      >
                        {alreadyExists && (
                          <div className='absolute top-2 right-2'>
                            <div
                              className='w-2 h-2 bg-blue-500 rounded-full'
                              title='Already added'
                            />
                          </div>
                        )}
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-blue-100'
                              : 'bg-gray-100 group-hover:bg-blue-100'
                          }`}
                        >
                          <Icon
                            className={`w-5 h-5 transition-colors ${
                              isSelected
                                ? 'text-blue-600'
                                : 'text-gray-600 group-hover:text-blue-600'
                            }`}
                          />
                        </div>
                        <div className='flex-1 min-w-0'>
                          <div
                            className={`text-sm font-medium ${
                              isSelected
                                ? 'text-blue-900'
                                : 'text-gray-900 group-hover:text-blue-900'
                            }`}
                          >
                            {a.label}
                          </div>
                          <div className='text-xs text-gray-500 mt-1'>
                            {a.inputLabel || 'No input needed'}
                          </div>
                          {isSelected && savedData?.value && (
                            <div className='text-xs text-blue-600 font-medium mt-1'>
                              {savedData.comparison === 'less'
                                ? '< '
                                : savedData.comparison === 'more'
                                ? '> '
                                : ''}
                              {savedData.value}
                              {a.id === 'response_time'
                                ? 'ms'
                                : a.id === 'payload_size'
                                ? 'KB'
                                : ''}
                            </div>
                          )}
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
                        if (generalValue) {
                          handleGeneralSubmit();
                        }
                        setGeneralType('');
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
                            onClick={() => {
                              setGeneralComparison(c);
                              if (generalValue) {
                                const newMap = new Map(
                                  selectedGeneralAssertions
                                );
                                newMap.set(generalType, {
                                  value: generalValue,
                                  comparison: c,
                                });
                                setSelectedGeneralAssertions(newMap);
                              }
                            }}
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
                        onChange={(e) => {
                          const value = e.target.value;
                          setGeneralValue(value);
                          if (value) {
                            const newMap = new Map(selectedGeneralAssertions);
                            newMap.set(generalType, {
                              value,
                              comparison: generalComparison,
                            });
                            setSelectedGeneralAssertions(newMap);
                          }
                        }}
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
                        onChange={(e) => {
                          const value = e.target.value;
                          setGeneralValue(value);
                          if (value) {
                            const newMap = new Map(selectedGeneralAssertions);
                            newMap.set(generalType, {
                              value,
                              comparison: generalComparison,
                            });
                            setSelectedGeneralAssertions(newMap);
                          }
                        }}
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
                        onChange={(e) => {
                          const value = e.target.value;
                          setGeneralValue(value);
                          if (value) {
                            const newMap = new Map(selectedGeneralAssertions);
                            newMap.set(generalType, {
                              value,
                              comparison: generalComparison,
                            });
                            setSelectedGeneralAssertions(newMap);
                          }
                        }}
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
                        onChange={(e) => {
                          const value = e.target.value;
                          setGeneralValue(value);
                          if (value) {
                            const newMap = new Map(selectedGeneralAssertions);
                            newMap.set(generalType, {
                              value,
                              comparison: generalComparison,
                            });
                            setSelectedGeneralAssertions(newMap);
                          }
                        }}
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
                        onChange={(e) => {
                          const value = e.target.value;
                          setGeneralValue(value);
                          if (value) {
                            const newMap = new Map(selectedGeneralAssertions);
                            newMap.set(generalType, {
                              value,
                              comparison: generalComparison,
                            });
                            setSelectedGeneralAssertions(newMap);
                          }
                        }}
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
                      onClick={() => {
                        setSelectedOperator(op.id);
                        if (
                          [
                            'field_null',
                            'field_not_null',
                            'field_is_true',
                            'field_is_false',
                            'exists',
                            'field_not_present',
                          ].includes(op.id)
                        ) {
                          const isHeader =
                            displayFieldPath.startsWith('headers.');
                          const assertionType = getAssertionTypeForOperator(
                            op.id,
                            isHeader
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
                          setPendingAssertions([...pendingAssertions, config]);
                        }
                      }}
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
                      let value = e.target.value;

                      if (valueType === 'date') {
                        const local = value;
                        setLocalDateValue(local);

                        if (local) {
                          const iso = new Date(local).toISOString();
                          setManualValue(iso);
                          value = iso;
                        }
                      } else {
                        setManualValue(value);
                      }

                      if (value) {
                        const isHeader =
                          displayFieldPath.startsWith('headers.');
                        const normalizedFieldPath = isHeader
                          ? displayFieldPath
                              .replace(/^headers\./, '')
                              .toLowerCase()
                          : displayFieldPath;

                        let config: any;

                        // Special handling for arrays
                        if (isArray) {
                          config = {
                            id: `manual-${Date.now()}-${selectedOperator}`,
                            ...getArrayAssertionConfig(
                              selectedOperator,
                              value,
                              normalizedFieldPath
                            ),
                            source: 'manual',
                          };
                        } else {
                          // Existing logic for non-array types
                          const assertionType = getAssertionTypeForOperator(
                            selectedOperator,
                            isHeader
                          );

                          config = {
                            id: `manual-${Date.now()}-${selectedOperator}`,
                            type: assertionType,
                            displayType: assertionType,
                            category: isHeader
                              ? 'headers'
                              : getCategoryForAssertionType(assertionType),
                            field: normalizedFieldPath,
                            value: value,
                            enabled: true,
                            source: 'manual',
                            operator: selectedOperator,
                          };

                          // Add specific handling for different operator types
                          if (
                            selectedOperator === 'contains' ||
                            selectedOperator === 'field_not_contains'
                          ) {
                            config.expectedValue = value;
                            config.description = `${normalizedFieldPath} ${
                              selectedOperator === 'contains'
                                ? 'contains'
                                : 'does not contain'
                            } "${value}"`;
                          } else if (
                            [
                              'field_greater_than',
                              'field_less_than',
                              'field_greater_equal',
                              'field_less_equal',
                            ].includes(selectedOperator)
                          ) {
                            config.expectedValue = parseFloat(value);
                            const opSymbol =
                              selectedOperator === 'field_greater_than'
                                ? '>'
                                : selectedOperator === 'field_less_than'
                                ? '<'
                                : selectedOperator === 'field_greater_equal'
                                ? '≥'
                                : '≤';
                            config.description = `${normalizedFieldPath} ${opSymbol} ${value}`;
                          } else if (
                            ['date_greater_than', 'date_less_than'].includes(
                              selectedOperator
                            )
                          ) {
                            config.expectedValue = value;
                            config.description = `${normalizedFieldPath} ${
                              selectedOperator === 'date_greater_than'
                                ? 'after'
                                : 'before'
                            } ${value}`;
                          } else {
                            config.expectedValue = value;
                            config.description = `${normalizedFieldPath} ${
                              operators.find((o) => o.id === selectedOperator)
                                ?.label || '='
                            } ${value}`;
                          }
                        }

                        // Update pending assertions
                        const existingIndex = pendingAssertions.findIndex(
                          (a) =>
                            a.field === normalizedFieldPath &&
                            a.type === config.type
                        );

                        if (existingIndex >= 0) {
                          const updated = [...pendingAssertions];
                          updated[existingIndex] = config;
                          setPendingAssertions(updated);
                        } else {
                          setPendingAssertions([...pendingAssertions, config]);
                        }
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
        <div className='px-6 py-4 border-t border-border flex items-center justify-between flex-shrink-0'>
          <button
            onClick={onClose}
            className='px-4 py-2 text-muted-foreground hover:bg-muted rounded-lg text-sm font-medium transition-colors'
          >
            Cancel
          </button>
          <Button
            onClick={handleFinalSave}
            disabled={!hasChanges}
            className='px-6 py-2 text-sm font-medium text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
          >
            Save All Changes
          </Button>
        </div>
      </div>
    </div>
  );
}

export default AssertionModal;
