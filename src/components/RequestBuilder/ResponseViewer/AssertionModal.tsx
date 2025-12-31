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

function AssertionModal({
  fieldPath,
  fieldValue,
  isOpen,
  onSelect,
  onClose,
  allAssertions = [],
  variables = [],
  dynamicVariables = [],
  setAssertions,
}: {
  fieldPath: string;
  fieldValue: any;
  isOpen: boolean;
  onSelect: (assertionType: string, config?: any) => void;
  onClose: () => void;
  allAssertions?: any[];
  variables?: Array<{ name: string; value: string }>;
  dynamicVariables?: Array<{ name: string; value: string }>;
  setAssertions: (assertions: any[]) => void;
}) {
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

  const truncate = (text: string, max = 50) =>
    text.length > max ? text.slice(0, max) + '…' : text;

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
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const normalizeHeaderName = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/^headers\./, '')
      .trim();
  };

  const suggestedAssertions = allAssertions
    .filter((assertion) => {
      const isHeaderField = fieldPath.startsWith('headers.');

      if (isHeaderField) {
        const headerName = normalizeHeaderName(fieldPath);

        if (
          assertion.category === 'HeaderGuard™' ||
          assertion.category === 'HeaderGuard'
        ) {
          const assertionField = normalizeHeaderName(assertion.field || '');

          const matches = assertionField === headerName;

          return matches;
        }

        if (assertion.category === 'headers') {
          const assertionField = normalizeHeaderName(assertion.field || '');

          const matches = assertionField === headerName;

          return matches;
        }

        return false;
      }

      return assertion.category === 'body' && assertion.field === fieldPath;
    })
    .map((assertion) => {
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
      contentType: 'string',
      showForTypes: ['string'],
    },
    {
      id: 'contains_number',
      label: 'Contains Number',
      icon: Hash,
      needsInput: true,
      inputType: 'number',
      inputLabel: 'Number value',
      contentType: 'number',
      showForTypes: ['number'],
    },
    {
      id: 'contains_boolean',
      label: 'Contains Boolean',
      icon: CheckCircle,
      needsInput: true,
      inputType: 'select',
      inputLabel: 'Boolean value',
      contentType: 'boolean',
      options: [
        { value: 'true', label: 'true' },
        { value: 'false', label: 'false' },
      ],
      showForTypes: ['boolean'],
    },
    {
      id: 'contains_static',
      label: 'Contains Static Variable',
      icon: Code,
      needsInput: true,
      inputType: 'select',
      inputLabel: 'Select static variable',
      showForTypes: ['all'],
      tooltip:
        'Static variables are predefined values that remain constant throughout test execution',
    },
    {
      id: 'contains_dynamic',
      label: 'Contains Dynamic Variable',
      icon: Code,
      needsInput: true,
      inputType: 'select',
      inputLabel: 'Select dynamic variable',
      showForTypes: ['all'],
      tooltip:
        'Dynamic variables are values that change during test execution, such as timestamps or random data',
    },
    {
      id: 'contains_extracted',
      label: 'Contains Extracted Variable',
      icon: Code,
      needsInput: true,
      inputType: 'text',
      inputLabel: 'Variable name',
      showForTypes: ['all'],
      tooltip:
        'Extracted variables are values captured from previous request responses for use in assertions',
    },
  ];

  const getValueType = (value: any): string => {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value;
  };

  const valueType = getValueType(fieldValue);
  const isArray = Array.isArray(fieldValue);

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
          { id: 'equals', label: '=', description: 'Equals' },
          { id: 'field_not_equals', label: '≠', description: 'Not equals' },
          { id: 'contains', label: 'contains', description: 'Contains' },
          {
            id: 'field_not_contains',
            label: 'not contains',
            description: 'Does not contain',
          },
          {
            id: 'field_starts_with',
            label: 'starts with',
            description: 'Starts with',
          },
          {
            id: 'field_ends_with',
            label: 'ends with',
            description: 'Ends with',
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
          {
            id: 'between',
            label: 'between',
            description: 'Between (inclusive)',
          },
        ];

      case 'boolean':
        return [
          { id: 'equals', label: '=', description: 'Equals' },
          { id: 'field_not_equals', label: '≠', description: 'Not equals' },
          { id: 'field_is_true', label: 'is true', description: 'Is true' },
          { id: 'field_is_false', label: 'is false', description: 'Is false' },
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
          {
            id: 'field_has_property',
            label: 'has property',
            description: 'Has property',
          },
          { id: 'equals', label: '=', description: 'Equals' },
          { id: 'field_not_equals', label: '≠', description: 'Not equals' },
        ];

      default:
        return [
          { id: 'equals', label: '=', description: 'Equals' },
          { id: 'field_not_equals', label: '≠', description: 'Not equals' },
        ];
    }
  };

  const generalAssertions = allGeneralAssertions.filter((assertion) => {
    if (assertion.showForTypes.includes('all')) {
      return true;
    }
    return assertion.showForTypes.includes(valueType);
  });

  const operators = getOperatorsForType(valueType, isArray);

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
      const assertionItem = suggestedAssertions.find(
        (a) => a.id === assertionId
      );
      if (assertionItem) {
        updatedAssertions = updatedAssertions.map((a: any) =>
          a.id === assertionItem.assertion.id ? { ...a, enabled: true } : a
        );
      }
    });

    setAssertions(updatedAssertions);

    setSelectedSuggestedAssertions(new Set());
    setAssertionsToRemove(new Set());
    onClose();
  };

  const getAssertionTypeForOperator = (
    operator: string,
    isHeader: boolean = false
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

    const isHeader = fieldPath.startsWith('headers.');

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
    };

    const operatorText = operatorLabels[selectedOperator] || selectedOperator;

    const normalizedFieldPath = isHeader
      ? fieldPath.replace(/^headers\./, '').toLowerCase()
      : fieldPath;
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

    onSelect(assertionType, config);
  };

  const handleGeneralClick = (id: string) => {
    const assertion = generalAssertions.find((a) => a.id === id);
    if (!assertion?.needsInput) {
      onSelect(id, { isGeneral: true });
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
    };

    const assertion = generalAssertions.find((a) => a.id === generalType);
    if (assertion?.hasComparison) {
      config.comparison = generalComparison;
      if (generalType === 'response_time') {
        config.expectedTime = generalValue;
      } else if (generalType === 'payload_size') {
        config.expectedSize = generalValue;
      }
    }

    if (
      generalType === 'contains_static' ||
      generalType === 'contains_dynamic'
    ) {
      config.scope = 'full';
    }

    onSelect(generalType, config);
    setGeneralType('');
    setGeneralValue('');
    setGeneralComparison('less');
  };

  const staticVariables = variables.filter((v) => v.name.startsWith('S_'));
  const filteredDynamicVariables = dynamicVariables.filter((v) =>
    v.name.startsWith('D_')
  );

  const displayedSuggestions = suggestedAssertions;

  const hasChanges =
    selectedSuggestedAssertions.size > 0 || assertionsToRemove.size > 0;
  const totalChanges =
    selectedSuggestedAssertions.size + assertionsToRemove.size;

  const initialEnabledCount = suggestedAssertions.filter(
    (a) => a.assertion.enabled
  ).length;

  const finalCount =
    initialEnabledCount +
    selectedSuggestedAssertions.size -
    assertionsToRemove.size;

  const totalAssertions = suggestedAssertions.length;

  const shouldDisableButton = finalCount === initialEnabledCount;

  return (
    <div
      className='fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4'
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className='bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col'
      >
        <div className='px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0'>
          <div className='flex-1'>
            <h2 className='text-lg font-semibold text-gray-900'>
              Add Assertion
            </h2>
            <p className='text-xs text-gray-500 mt-1 font-mono'>{fieldPath}</p>
          </div>
          <button
            onClick={onClose}
            className='p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100 transition-colors ml-2'
          >
            <X className='w-5 h-5' />
          </button>
        </div>

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
                        className='w-full flex items-start gap-4 p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-left group'
                      >
                        <div className='w-10 h-10 rounded-lg bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center flex-shrink-0 transition-colors'>
                          <Icon className='w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-colors' />
                        </div>
                        <div className='flex-1 min-w-0'>
                          <div className='text-sm font-medium text-gray-900 group-hover:text-blue-900'>
                            {a.label}
                          </div>
                          <div className='text-xs text-gray-500 mt-1'>
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
                      <label className='block text-sm font-semibold text-gray-900 mb-2'>
                        Comparison
                      </label>
                      <div className='grid grid-cols-2 gap-2'>
                        {['less', 'more'].map((c) => (
                          <Button
                            key={c}
                            onClick={() => setGeneralComparison(c)}
                            className={`px-4 py-2 text-sm rounded-lg border font-medium transition-all ${
                              generalComparison === c
                                ? ' border-blue-600 text-white'
                                : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300'
                            }`}
                          >
                            {c === 'less' ? 'Less than' : 'More than'}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <label className='block text-sm font-semibold text-gray-900 mb-2'>
                      {
                        generalAssertions.find((a) => a.id === generalType)
                          ?.inputLabel
                      }
                    </label>
                    {generalType === 'contains_static' ? (
                      <select
                        value={generalValue}
                        onChange={(e) => setGeneralValue(e.target.value)}
                        className='w-full px-4 py-3 border border-gray-300 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm'
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
                        className='w-full px-4 py-3 border border-gray-300 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm'
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
                    ) : generalAssertions.find((a) => a.id === generalType)
                        ?.inputType === 'select' ? (
                      <select
                        value={generalValue}
                        onChange={(e) => setGeneralValue(e.target.value)}
                        className='w-full px-4 py-3 border border-gray-300 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm'
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
                        className='w-full px-4 py-3 border border-gray-300 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm'
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
              {displayedSuggestions.length > 0 ? (
                displayedSuggestions.map((assertion: any) => {
                  const Icon = assertion.icon || CheckCircle;
                  const isEnabled = assertion.assertion?.enabled || false;
                  const isMarkedForRemoval = assertionsToRemove.has(
                    assertion.id
                  );
                  const isSelected = selectedSuggestedAssertions.has(
                    assertion.id
                  );
                  const isDisabled = isEnabled && !isMarkedForRemoval;

                  return (
                    <button
                      key={assertion.id}
                      onClick={() => handleSuggestedClick(assertion)}
                      disabled={isDisabled}
                      className={`w-full flex items-start gap-4 p-4 rounded-lg border transition-all text-left ${
                        isDisabled
                          ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                          : isMarkedForRemoval
                          ? 'border-red-300 bg-red-50'
                          : isSelected
                          ? 'border-blue-300 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                          isDisabled
                            ? 'bg-gray-100'
                            : isMarkedForRemoval
                            ? 'bg-red-100'
                            : isSelected
                            ? 'bg-blue-100'
                            : 'bg-gray-100 group-hover:bg-blue-100'
                        }`}
                      >
                        <Icon
                          className={`w-5 h-5 transition-colors ${
                            isDisabled
                              ? 'text-gray-400'
                              : isMarkedForRemoval
                              ? 'text-red-600'
                              : isSelected
                              ? 'text-blue-600'
                              : 'text-gray-600'
                          }`}
                        />
                      </div>
                      <div className='flex-1 min-w-0'>
                        <div className='text-sm font-medium text-gray-900'>
                          {assertion.label}
                        </div>
                        <div className='text-xs text-gray-500 mt-1'>
                          {assertion.description}
                        </div>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className='text-center py-8 text-gray-500'>
                  <p className='text-sm'>
                    No suggestions available for this field
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'manual' && (
            <div className='space-y-6'>
              <div>
                <label className='block text-sm font-semibold text-gray-900 mb-3'>
                  Operator
                </label>
                <div className='grid grid-cols-3 gap-2'>
                  {operators.map((op) => (
                    <Button
                      key={op.id}
                      onClick={() => setSelectedOperator(op.id)}
                      title={op.description}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                        selectedOperator === op.id
                          ? ' text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'
                      }`}
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
                  <label className='block text-sm font-semibold text-gray-900 mb-2'>
                    Expected Value
                  </label>
                  <input
                    type='text'
                    value={manualValue}
                    onChange={(e) => setManualValue(e.target.value)}
                    placeholder='Enter the expected value'
                    className='w-full px-4 py-3 border border-gray-300 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm'
                    autoFocus
                  />
                </div>
              )}

              <div className='bg-blue-50 border border-blue-200 rounded-lg p-3'>
                <p className='text-sm text-gray-700'>
                  <span className='font-mono text-blue-700'>{fieldPath}</span>
                  <span className='text-gray-600 mx-2'>
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
                    <span className='font-mono text-blue-700'>
                      {manualValue || '...'}
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}
        </div>

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
              disabled={!manualValue}
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
