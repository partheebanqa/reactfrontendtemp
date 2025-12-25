import { Button } from '@/components/ui/button';
import {
  Activity,
  CheckCircle,
  Clock,
  Code,
  Code2,
  HardDrive,
  Hash,
  List,
  Type,
  X,
  XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';

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
  // Add these new state variables after the existing useState declarations (around line 28)
  const [dynamicVariableScope, setDynamicVariableScope] = useState<
    'full' | 'field'
  >('field');
  const [staticVariableScope, setStaticVariableScope] = useState<
    'full' | 'field'
  >('field');
  const [generalComparison, setGeneralComparison] = useState<string>('less');
  const [selectedSuggestedAssertions, setSelectedSuggestedAssertions] =
    useState<Set<string>>(new Set());
  const [assertionsToRemove, setAssertionsToRemove] = useState<Set<string>>(
    new Set()
  );

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

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setAssertionsToRemove(new Set());
      setSelectedSuggestedAssertions(new Set());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const suggestedAssertions = allAssertions
    .filter((assertion) => {
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
      id: 'response-time',
      label: 'Response Time',
      icon: Clock,
      needsInput: true,
      inputType: 'number',
      inputLabel: 'Time in milliseconds',
      hasComparison: true,
      showForTypes: ['all'],
    },
    {
      id: 'payload-size',
      label: 'Payload Size',
      icon: HardDrive,
      needsInput: true,
      inputType: 'number',
      inputLabel: 'Size in KB',
      hasComparison: true,
      showForTypes: ['all'],
    },
    {
      id: 'status-code',
      label: 'Status Code',
      icon: Hash,
      needsInput: true,
      inputType: 'number',
      inputLabel: 'Status code (e.g., 200, 404, 500)',
      showForTypes: ['all'],
    },
    {
      id: 'contains-text',
      label: 'Contains Text',
      icon: Code,
      needsInput: true,
      inputType: 'text',
      inputLabel: 'Text value',
      contentType: 'string',
      showForTypes: ['string'],
    },
    {
      id: 'contains-number',
      label: 'Contains Number',
      icon: Hash,
      needsInput: true,
      inputType: 'number',
      inputLabel: 'Number value',
      contentType: 'number',
      showForTypes: ['number'],
    },
    {
      id: 'contains-boolean',
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
      id: 'contains-static',
      label: 'Contains Static Variable',
      icon: Code,
      needsInput: true,
      inputType: 'select',
      inputLabel: 'Select static variable',
      hasScope: true,
      showForTypes: ['all'],
    },
    {
      id: 'contains-dynamic',
      label: 'Contains Dynamic Variable',
      icon: Code,
      needsInput: true,
      inputType: 'select',
      inputLabel: 'Select dynamic variable',
      hasScope: true,
      showForTypes: ['all'],
    },
    {
      id: 'contains-extracted',
      label: 'Contains Extracted Variable',
      icon: Code,
      needsInput: true,
      inputType: 'text',
      inputLabel: 'Variable name',
      showForTypes: ['all'],
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
        { id: 'array-length', label: 'length', description: 'Array length' },
        { id: 'equals', label: '=', description: 'Equals' },
        { id: 'not-equals', label: '≠', description: 'Not equals' },
      ];
    }

    switch (type) {
      case 'string':
        return [
          { id: 'equals', label: '=', description: 'Equals' },
          { id: 'not-equals', label: '≠', description: 'Not equals' },
          { id: 'contains', label: 'contains', description: 'Contains' },
          {
            id: 'not-contains',
            label: 'not contains',
            description: 'Does not contain',
          },
          {
            id: 'starts-with',
            label: 'starts with',
            description: 'Starts with',
          },
          { id: 'ends-with', label: 'ends with', description: 'Ends with' },
        ];

      case 'number':
        return [
          { id: 'equals', label: '=', description: 'Equals' },
          { id: 'not-equals', label: '≠', description: 'Not equals' },
          { id: 'greater-than', label: '>', description: 'Greater than' },
          { id: 'less-than', label: '<', description: 'Less than' },
          {
            id: 'greater-equal',
            label: '≥',
            description: 'Greater than or equal',
          },
          { id: 'less-equal', label: '≤', description: 'Less than or equal' },
          {
            id: 'between',
            label: 'between',
            description: 'Between (inclusive)',
          },
        ];

      case 'boolean':
        return [
          { id: 'equals', label: '=', description: 'Equals' },
          { id: 'not-equals', label: '≠', description: 'Not equals' },
          { id: 'is-true', label: 'is true', description: 'Is true' },
          { id: 'is-false', label: 'is false', description: 'Is false' },
        ];

      case 'null':
        return [
          { id: 'is-null', label: 'is null', description: 'Is null' },
          { id: 'not-null', label: 'not null', description: 'Is not null' },
        ];

      case 'object':
        return [
          { id: 'exists', label: 'exists', description: 'Field exists' },
          {
            id: 'not-exists',
            label: 'not exists',
            description: 'Field does not exist',
          },
          {
            id: 'has-property',
            label: 'has property',
            description: 'Has property',
          },
          { id: 'equals', label: '=', description: 'Equals' },
          { id: 'not-equals', label: '≠', description: 'Not equals' },
        ];

      default:
        return [
          { id: 'equals', label: '=', description: 'Equals' },
          { id: 'not-equals', label: '≠', description: 'Not equals' },
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

    // If already enabled and not marked for removal, do nothing
    if (isAlreadyEnabled && !isMarkedForRemoval) {
      return;
    }

    // If marked for removal, remove it from the removal set (restore it)
    if (isMarkedForRemoval) {
      const newRemoveSet = new Set(assertionsToRemove);
      newRemoveSet.delete(assertionItem.id);
      setAssertionsToRemove(newRemoveSet);
      return;
    }

    // Toggle selection for non-enabled assertions
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
    // Process both removals and additions
    let updatedAssertions = [...allAssertions];

    // First, process removals (but skip if assertion is in selectedSuggestedAssertions)
    if (assertionsToRemove.size > 0) {
      updatedAssertions = updatedAssertions.map((a: any) => {
        // If in removal set but also in selected set, keep it enabled
        if (
          assertionsToRemove.has(a.id) &&
          !selectedSuggestedAssertions.has(a.id)
        ) {
          return { ...a, enabled: false };
        }
        return a;
      });
    }

    // Then, process additions
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

    // Set the updated assertions
    setAssertions(updatedAssertions);

    setSelectedSuggestedAssertions(new Set());
    setAssertionsToRemove(new Set());
    onClose();
  };

  const handleManualSubmit = () => {
    const operatorsWithoutValue = [
      'is-null',
      'not-null',
      'is-true',
      'is-false',
      'exists',
      'not-exists',
    ];

    if (!operatorsWithoutValue.includes(selectedOperator) && !manualValue) {
      return;
    }

    const config: any = {
      operator: selectedOperator,
      value: manualValue,
    };
    onSelect('manual', config);
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
      if (generalType === 'response-time') {
        config.expectedTime = generalValue;
      } else if (generalType === 'payload-size') {
        config.expectedSize = generalValue;
      }
    }

    if (generalType === 'contains-static') {
      config.scope = staticVariableScope;
      if (staticVariableScope === 'field') {
        config.field = fieldPath;
      }
    } else if (generalType === 'contains-dynamic') {
      config.scope = dynamicVariableScope;
      if (dynamicVariableScope === 'field') {
        config.field = fieldPath;
      }
    }

    onSelect(generalType, config);
    setGeneralType('');
    setGeneralValue('');
    setGeneralComparison('less');
    setDynamicVariableScope('field');
    setStaticVariableScope('field');
  };

  const staticVariables = variables.filter((v) => v.name.startsWith('S_'));
  const filteredDynamicVariables = dynamicVariables.filter((v) =>
    v.name.startsWith('D_')
  );

  const hasChanges =
    selectedSuggestedAssertions.size > 0 || assertionsToRemove.size > 0;
  const totalChanges =
    selectedSuggestedAssertions.size + assertionsToRemove.size;

  // Calculate initial enabled assertions count for this field
  const initialEnabledCount = suggestedAssertions.filter(
    (a) => a.assertion.enabled
  ).length;

  // Calculate final count after changes
  const finalCount =
    initialEnabledCount +
    selectedSuggestedAssertions.size -
    assertionsToRemove.size;

  // Total available assertions
  const totalAssertions = suggestedAssertions.length;

  // Button should be disabled only if final count equals initial count (no net change)
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
              Suggested ({suggestedAssertions.length})
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
                    <h3 className='text-sm font-semibold text-gray-900'>
                      {
                        generalAssertions.find((a) => a.id === generalType)
                          ?.label
                      }
                    </h3>
                    <button
                      onClick={() => {
                        setGeneralType('');
                        setGeneralValue('');
                      }}
                      className='text-xs text-blue-600 hover:underline'
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
                    {generalType === 'contains-static' ? (
                      <div className='space-y-4'>
                        {/* Scope Selection */}
                        <div>
                          <label className='block text-sm font-semibold text-gray-900 mb-2'>
                            Search Scope
                          </label>
                          <div className='grid grid-cols-2 gap-2'>
                            <Button
                              onClick={() => setStaticVariableScope('full')}
                              className={`px-4 py-2 text-sm rounded-lg border font-medium transition-all ${
                                staticVariableScope === 'full'
                                  ? 'border-blue-600 text-white'
                                  : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300'
                              }`}
                            >
                              Full Response
                            </Button>
                            <Button
                              onClick={() => setStaticVariableScope('field')}
                              className={`px-4 py-2 text-sm rounded-lg border font-medium transition-all ${
                                staticVariableScope === 'field'
                                  ? 'border-blue-600 text-white'
                                  : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300'
                              }`}
                            >
                              Current Field
                            </Button>
                          </div>
                          {staticVariableScope === 'field' && (
                            <p className='text-xs text-gray-500 mt-2'>
                              Will search in:{' '}
                              <span className='font-mono'>{fieldPath}</span>
                            </p>
                          )}
                        </div>

                        {/* Variable Selection */}
                        <div>
                          <label className='block text-sm font-semibold text-gray-900 mb-2'>
                            Select Static Variable
                          </label>
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
                                {variable.name} = {variable.value}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ) : generalType === 'contains-dynamic' ? (
                      <div className='space-y-4'>
                        {/* Scope Selection */}
                        <div>
                          <label className='block text-sm font-semibold text-gray-900 mb-2'>
                            Search Scope
                          </label>
                          <div className='grid grid-cols-2 gap-2'>
                            <Button
                              onClick={() => setDynamicVariableScope('full')}
                              className={`px-4 py-2 text-sm rounded-lg border font-medium transition-all ${
                                dynamicVariableScope === 'full'
                                  ? 'border-blue-600 text-white'
                                  : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300'
                              }`}
                            >
                              Full Response
                            </Button>
                            <Button
                              onClick={() => setDynamicVariableScope('field')}
                              className={`px-4 py-2 text-sm rounded-lg border font-medium transition-all ${
                                dynamicVariableScope === 'field'
                                  ? 'border-blue-600 text-white'
                                  : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300'
                              }`}
                            >
                              Current Field
                            </Button>
                          </div>
                          {dynamicVariableScope === 'field' && (
                            <p className='text-xs text-gray-500 mt-2'>
                              Will search in:{' '}
                              <span className='font-mono'>{fieldPath}</span>
                            </p>
                          )}
                        </div>

                        {/* Variable Selection */}
                        <div>
                          <label className='block text-sm font-semibold text-gray-900 mb-2'>
                            Select Dynamic Variable
                          </label>
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
                                {variable.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
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
              {suggestedAssertions.length === 0 ? (
                <div className='text-center py-8 text-gray-500'>
                  <p className='mb-2'>No suggested assertions for this field</p>
                  <p className='text-sm'>
                    Try the Manual or General tabs to create custom assertions
                  </p>
                </div>
              ) : (
                suggestedAssertions.map((assertionItem) => {
                  const Icon = assertionItem.icon;
                  const isAlreadyEnabled = assertionItem.assertion.enabled;
                  const isMarkedForRemoval = assertionsToRemove.has(
                    assertionItem.id
                  );
                  const isSelected = selectedSuggestedAssertions.has(
                    assertionItem.id
                  );

                  // Determine if this item should show as "active/enabled" in UI
                  // It's active if: (already enabled AND not marked for removal) OR selected
                  const isActiveInUI =
                    (isAlreadyEnabled && !isMarkedForRemoval) || isSelected;

                  return (
                    <div
                      key={assertionItem.id}
                      onClick={() => handleSuggestedClick(assertionItem)}
                      className={`w-full flex items-start gap-4 p-4 rounded-lg border transition-all text-left group ${
                        isActiveInUI
                          ? 'border-blue-500 bg-blue-100 dark:bg-blue-900/40 cursor-pointer'
                          : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                          isActiveInUI
                            ? 'bg-blue-200 dark:bg-blue-800'
                            : 'bg-gray-100 dark:bg-gray-800 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30'
                        }`}
                      >
                        {isActiveInUI ? (
                          <CheckCircle className='w-5 h-5 text-blue-600' />
                        ) : (
                          <Icon
                            className={`w-5 h-5 transition-colors text-gray-600 dark:text-gray-400 group-hover:text-blue-600`}
                          />
                        )}
                      </div>
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center justify-between'>
                          <div
                            className={`text-sm font-medium ${
                              isActiveInUI
                                ? 'text-blue-900 dark:text-blue-200'
                                : 'text-gray-900 dark:text-gray-100 group-hover:text-blue-900 dark:group-hover:text-blue-300'
                            }`}
                          >
                            {assertionItem.label}
                            {isAlreadyEnabled &&
                              !isMarkedForRemoval &&
                              !isSelected && (
                                <span className='ml-2 text-xs px-2 py-0.5 bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded-full'>
                                  Added
                                </span>
                              )}
                          </div>
                          {isAlreadyEnabled && !isMarkedForRemoval && (
                            <button
                              onClick={(e) =>
                                handleMarkForRemoval(assertionItem.id, e)
                              }
                              className='p-1 rounded-full transition-colors text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30'
                            >
                              <X className='w-4 h-4' />
                            </button>
                          )}
                        </div>
                        <div className='text-xs text-gray-500 mt-1'>
                          {assertionItem.description}
                        </div>
                      </div>
                    </div>
                  );
                })
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
                'is-null',
                'not-null',
                'is-true',
                'is-false',
                'exists',
                'not-exists',
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
                    'is-null',
                    'not-null',
                    'is-true',
                    'is-false',
                    'exists',
                    'not-exists',
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
              Save Changes
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
