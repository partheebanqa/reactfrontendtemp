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
} from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import {
  getArrayAssertionConfig,
  getCategoryForAssertionType,
} from '@/lib/assertion-utils';

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
  onRedirectToTab,
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
  onRedirectToTab?: (tabName: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<
    'suggested' | 'manual' | 'general'
  >('suggested');
  const [selectedOperator, setSelectedOperator] = useState<string>('');
  const [manualValue, setManualValue] = useState('');
  const [localDateValue, setLocalDateValue] = useState('');
  const [generalType, setGeneralType] = useState<string>('');
  const [generalValue, setGeneralValue] = useState<string>('');
  const [generalComparison, setGeneralComparison] = useState<string>('less');
  const [selectedSuggestedAssertions, setSelectedSuggestedAssertions] =
    useState<Set<string>>(new Set());
  const [assertionsToRemove, setAssertionsToRemove] = useState<Set<string>>(
    new Set()
  );

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

  const hasChanges =
    selectedSuggestedAssertions.size > 0 ||
    assertionsToRemove.size > 0 ||
    pendingAssertions.length > 0 ||
    selectedGeneralAssertions.size > 0;

  const normalizeHeaderName = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/^headers\./, '')
      .trim();
  };

  const handleRemovePendingAssertion = (id: string) => {
    setPendingAssertions(pendingAssertions.filter((a) => a.id !== id));
  };

  const suggestedAssertions = useMemo(() => {
    return allAssertions
      .filter((assertion) => {
        const isHeaderField = fieldPath.startsWith('headers.');

        if (isHeaderField) {
          const headerName = normalizeHeaderName(fieldPath);

          if (
            assertion.category === 'HeaderGuard™' ||
            assertion.category === 'HeaderGuard'
          ) {
            const assertionField = normalizeHeaderName(assertion.field || '');
            return assertionField === headerName;
          }

          if (assertion.category === 'headers') {
            const assertionField = normalizeHeaderName(assertion.field || '');
            return assertionField === headerName;
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
  }, [allAssertions, fieldPath]);

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
    if (isDateValue(value)) return 'date';
    return typeof value;
  };
  const valueType = getValueType(fieldValue);
  const isArray = Array.isArray(fieldValue);

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
          id: 'field_less_equal',
          label: 'length ≤',
          description: 'Array length is less then or equal',
        },
        {
          id: 'field_greater_equal',
          label: 'length ≥',
          description: 'Array length at least',
          disabled: true,
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

  const generalAssertions = allGeneralAssertions.filter((assertion) => {
    if (assertion.showForTypes.includes('all')) {
      return true;
    }
    return assertion.showForTypes.includes(valueType);
  });

  const operators = useMemo(
    () => getOperatorsForType(valueType, isArray),
    [valueType, isArray]
  );

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

  const handleAddToList = () => {
    if (
      activeTab === 'manual' &&
      manualValue &&
      ![
        'field_null',
        'field_not_null',
        'field_is_true',
        'field_is_false',
        'exists',
        'field_not_present',
      ].includes(selectedOperator)
    ) {
      let config: any;

      if (isArray) {
        try {
          config = {
            id: `manual-${Date.now()}-${selectedOperator}`,
            ...getArrayAssertionConfig(
              selectedOperator,
              manualValue,
              fieldPath
            ),
            source: 'manual',
          };
        } catch (error) {
          console.error('Error creating array assertion:', error);
          return;
        }
      } else {
        config = {
          id: `manual-${Date.now()}-${selectedOperator}`,
          type: selectedOperator,
          displayType: selectedOperator,
          category: getCategoryForAssertionType(selectedOperator),
          field: fieldPath,
          value: manualValue,
          enabled: true,
          source: 'manual',
        };

        if (selectedOperator === 'array_length') {
          config.expectedLength = Number.parseInt(manualValue);
          config.description = `${fieldPath} array length = ${manualValue}`;
        } else if (
          selectedOperator === 'contains' ||
          selectedOperator === 'field_not_contains'
        ) {
          config.expectedValue = manualValue;
          config.operator = selectedOperator;
          config.description = `${fieldPath} ${
            selectedOperator === 'contains' ? 'contains' : 'does not contain'
          } "${manualValue}"`;
        } else if (
          [
            'field_greater_than',
            'field_less_than',
            'field_greater_equal',
            'field_less_equal',
          ].includes(selectedOperator)
        ) {
          config.expectedValue = Number.parseFloat(manualValue);
          config.operator = selectedOperator;
          const opSymbol =
            selectedOperator === 'field_greater_than'
              ? '>'
              : selectedOperator === 'field_less_than'
              ? '<'
              : selectedOperator === 'field_greater_equal'
              ? '≥'
              : '≤';
          config.description = `${fieldPath} ${opSymbol} ${manualValue}`;
        } else if (
          ['date_greater_than', 'date_less_than'].includes(selectedOperator)
        ) {
          config.expectedValue = manualValue;
          config.operator = selectedOperator;
          config.description = `${fieldPath} ${
            selectedOperator === 'date_greater_than' ? 'after' : 'before'
          } ${manualValue}`;
        } else {
          config.expectedValue = manualValue;
          config.operator =
            selectedOperator === 'equals' ? 'equals' : selectedOperator;
          config.description = `${fieldPath} ${
            operators.find((o) => o.id === selectedOperator)?.label || '='
          } ${manualValue}`;
        }
      }

      if (config) {
        setPendingAssertions([...pendingAssertions, config]);
        setManualValue('');
        setLocalDateValue('');
      }
      return;
    }

    if (activeTab === 'general' && generalType && generalValue) {
      const newMap = new Map(selectedGeneralAssertions);
      newMap.set(generalType, {
        value: generalValue,
        comparison: generalComparison,
      });
      setSelectedGeneralAssertions(newMap);

      setGeneralType('');
      setGeneralValue('');
      setGeneralComparison('less');
      return;
    }

    if (activeTab === 'suggested' && hasChanges) {
      handleFinalSave();
    }
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
      const assertionItem = suggestedAssertions.find(
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

    setAssertions(updatedAssertions);

    setSelectedSuggestedAssertions(new Set());
    setAssertionsToRemove(new Set());
    setPendingAssertions([]);
    setSelectedGeneralAssertions(new Map());
  };

  const handleCloseWithSave = () => {
    const hasUnsubmittedManualAssertion =
      activeTab === 'manual' &&
      manualValue &&
      ![
        'field_null',
        'field_not_null',
        'field_is_true',
        'field_is_false',
        'exists',
        'field_not_present',
      ].includes(selectedOperator);

    const hasUnsubmittedGeneralAssertion =
      activeTab === 'general' && generalType && generalValue;

    if (
      hasUnsubmittedManualAssertion ||
      hasUnsubmittedGeneralAssertion ||
      hasChanges
    ) {
      if (hasUnsubmittedManualAssertion) {
        let config: any;

        if (isArray) {
          try {
            config = {
              id: `manual-${Date.now()}-${selectedOperator}`,
              ...getArrayAssertionConfig(
                selectedOperator,
                manualValue,
                fieldPath
              ),
              source: 'manual',
            };
          } catch (error) {
            console.error('Error creating array assertion:', error);
          }
        } else {
          config = {
            id: `manual-${Date.now()}-${selectedOperator}`,
            type: selectedOperator,
            displayType: selectedOperator,
            category: getCategoryForAssertionType(selectedOperator),
            field: fieldPath,
            value: manualValue,
            enabled: true,
            source: 'manual',
          };

          if (selectedOperator === 'array_length') {
            config.expectedLength = Number.parseInt(manualValue);
            config.description = `${fieldPath} array length = ${manualValue}`;
          } else if (
            selectedOperator === 'contains' ||
            selectedOperator === 'field_not_contains'
          ) {
            config.expectedValue = manualValue;
            config.operator = selectedOperator;
            config.description = `${fieldPath} ${
              selectedOperator === 'contains' ? 'contains' : 'does not contain'
            } "${manualValue}"`;
          } else if (
            [
              'field_greater_than',
              'field_less_than',
              'field_greater_equal',
              'field_less_equal',
            ].includes(selectedOperator)
          ) {
            config.expectedValue = Number.parseFloat(manualValue);
            config.operator = selectedOperator;
            const opSymbol =
              selectedOperator === 'field_greater_than'
                ? '>'
                : selectedOperator === 'field_less_than'
                ? '<'
                : selectedOperator === 'field_greater_equal'
                ? '≥'
                : '≤';
            config.description = `${fieldPath} ${opSymbol} ${manualValue}`;
          } else if (
            ['date_greater_than', 'date_less_than'].includes(selectedOperator)
          ) {
            config.expectedValue = manualValue;
            config.operator = selectedOperator;
            config.description = `${fieldPath} ${
              selectedOperator === 'date_greater_than' ? 'after' : 'before'
            } ${manualValue}`;
          } else {
            config.expectedValue = manualValue;
            config.operator =
              selectedOperator === 'equals' ? 'equals' : selectedOperator;
            config.description = `${fieldPath} ${
              operators.find((o) => o.id === selectedOperator)?.label || '='
            } ${manualValue}`;
          }
        }

        if (config) {
          setPendingAssertions([...pendingAssertions, config]);
        }
      }

      if (hasUnsubmittedGeneralAssertion) {
        const newMap = new Map(selectedGeneralAssertions);
        newMap.set(generalType, {
          value: generalValue,
          comparison: generalComparison,
        });
        setSelectedGeneralAssertions(newMap);
      }

      setTimeout(() => {
        handleFinalSave();
        onClose();
        if (onRedirectToTab) {
          onRedirectToTab('post-response');
        }
      }, 0);
    } else {
      onClose();
      if (onRedirectToTab) {
        onRedirectToTab('post-response');
      }
    }
  };

  const staticVariables = variables.filter((v) => v.name.startsWith('S_'));
  const filteredDynamicVariables = dynamicVariables.filter((v) =>
    v.name.startsWith('D_')
  );

  const displayedSuggestions = suggestedAssertions;

  const initialEnabledCount = suggestedAssertions.filter(
    (a) => a.assertion.enabled
  ).length;

  const finalCount =
    initialEnabledCount +
    selectedSuggestedAssertions.size -
    assertionsToRemove.size +
    pendingAssertions.length +
    selectedGeneralAssertions.size;

  const totalAssertions = suggestedAssertions.length + pendingAssertions.length;

  const canAddToList = () => {
    if (activeTab === 'manual') {
      return (
        manualValue &&
        ![
          'field_null',
          'field_not_null',
          'field_is_true',
          'field_is_false',
          'exists',
          'field_not_present',
        ].includes(selectedOperator)
      );
    }
    if (activeTab === 'general') {
      return generalType && generalValue;
    }
    return hasChanges;
  };

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

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (hasChanges) {
          handleCloseWithSave();
        } else {
          onClose();
          if (onRedirectToTab) {
            onRedirectToTab('post-response');
          }
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, hasChanges]);

  useEffect(() => {
    if (isOpen && operators.length > 0 && !selectedOperator) {
      setSelectedOperator(operators[0].id);
    }
  }, [isOpen, operators, selectedOperator]);

  if (!isOpen) return null;

  return (
    <div
      className='fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4'
      onClick={handleCloseWithSave}
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
            onClick={handleCloseWithSave}
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

        <div className='flex flex-col flex-1 overflow-hidden'>
          <div className='flex-1 overflow-y-auto scrollbar-thin px-6 py-4'>
            {activeTab === 'general' && (
              <div className='space-y-2'>
                {!generalType ? (
                  <div className='space-y-2'>
                    {generalAssertions.map((a) => {
                      const Icon = a.icon;
                      const isSelected = selectedGeneralAssertions.has(a.id);
                      const savedData = selectedGeneralAssertions.get(a.id);

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
                            <div className='flex items-center gap-2'>
                              <div
                                className={`text-sm font-medium ${
                                  isSelected
                                    ? 'text-blue-900'
                                    : 'text-gray-900 group-hover:text-blue-900'
                                }`}
                              >
                                {a.label}
                              </div>
                              {alreadyExists && (
                                <div className='flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium'>
                                  <CheckCircle className='w-3 h-3' />
                                  <span>Added</span>
                                </div>
                              )}
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
                        onClick={() => {
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
                        <label className='block text-sm font-semibold text-gray-900 mb-2'>
                          Comparison
                        </label>
                        <div className='grid grid-cols-2 gap-2'>
                          {['less', 'more'].map((c) => (
                            <Button
                              key={c}
                              onClick={() => {
                                setGeneralComparison(c);
                              }}
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
                  displayedSuggestions.map((assertionItem: any) => {
                    const Icon = assertionItem.icon || CheckCircle;
                    const isAlreadyEnabled =
                      assertionItem.assertion?.enabled || false;
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
                        className={`w-full flex items-start gap-4 p-4 rounded-lg border transition-all group/assertion relative ${
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
                            className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                              isMarkedForRemoval
                                ? 'bg-red-100'
                                : isVisuallySelected
                                ? 'bg-blue-100'
                                : 'bg-gray-100'
                            }`}
                          >
                            <Icon
                              className={`w-5 h-5 transition-colors ${
                                isMarkedForRemoval
                                  ? 'text-red-600'
                                  : isVisuallySelected
                                  ? 'text-blue-600'
                                  : 'text-gray-600'
                              }`}
                            />
                          </div>

                          <div className='flex-1 min-w-0'>
                            <div className='flex items-center gap-2'>
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
                              {isAlreadyEnabled && !isMarkedForRemoval && (
                                <div className='flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium'>
                                  <CheckCircle className='w-3 h-3' />
                                  <span>Added</span>
                                </div>
                              )}
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
                        onClick={() => {
                          if (op.disabled) return;
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
                            const config: any = {
                              id: `manual-${Date.now()}-${op.id}`,
                              type: op.id,
                              displayType: op.id,
                              category: getCategoryForAssertionType(op.id),
                              field: fieldPath,
                              enabled: true,
                              source: 'manual',
                              description: `${fieldPath} ${op.description}`,
                            };
                            setPendingAssertions([
                              ...pendingAssertions,
                              config,
                            ]);
                          }
                        }}
                        title={op.disabled ? 'Coming soon' : op.description}
                        disabled={op.disabled}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                          selectedOperator === op.id
                            ? ' text-white border-blue-600'
                            : op.disabled
                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-50'
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
                      type={valueType === 'date' ? 'datetime-local' : 'text'}
                      value={
                        valueType === 'date' ? localDateValue : manualValue
                      }
                      onChange={(e) => {
                        const value = e.target.value;

                        if (valueType === 'date') {
                          setLocalDateValue(value);
                          if (value) {
                            setManualValue(new Date(value).toISOString());
                          }
                        } else {
                          setManualValue(value);
                        }
                      }}
                      placeholder={
                        valueType === 'date' ? '' : 'Enter the expected value'
                      }
                      className='w-full px-4 py-3 border border-gray-300 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm'
                    />

                    {valueType === 'date' && (
                      <p className='mt-1 text-xs text-gray-500'>
                        Format:{' '}
                        <span className='font-medium'>DD-MM-YYYY HH:mm</span>{' '}
                        (24 hrs) Example:{' '}
                        <span className='font-medium'>10-01-2026 20:44</span>
                      </p>
                    )}
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
            {(pendingAssertions.length > 0 ||
              selectedSuggestedAssertions.size > 0 ||
              selectedGeneralAssertions.size > 0) && (
              <div className='border-t border-gray-200 mt-4 pt-4'>
                <h3 className='text-sm font-semibold text-gray-900 mb-3'>
                  Added Assertions (
                  {pendingAssertions.length +
                    selectedSuggestedAssertions.size +
                    selectedGeneralAssertions.size}
                  )
                </h3>
                <div className='space-y-2 max-h-48 overflow-y-auto scrollbar-thin pr-2'>
                  {Array.from(selectedSuggestedAssertions).map(
                    (assertionId) => {
                      const assertionItem = suggestedAssertions.find(
                        (a) => a.id === assertionId
                      );
                      if (!assertionItem) return null;

                      return (
                        <div
                          key={assertionId}
                          className='flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg'
                        >
                          <div className='flex-1 min-w-0'>
                            <p className='text-sm font-medium text-blue-900'>
                              {assertionItem.label}
                            </p>
                            <p className='text-xs text-blue-600 mt-0.5'>
                              Suggested assertion
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              const newSelected = new Set(
                                selectedSuggestedAssertions
                              );
                              newSelected.delete(assertionId);
                              setSelectedSuggestedAssertions(newSelected);
                            }}
                            className='p-1.5 text-blue-600 hover:text-red-600 hover:bg-red-50 rounded transition-all'
                            title='Remove'
                          >
                            <Trash2 className='w-4 h-4' />
                          </button>
                        </div>
                      );
                    }
                  )}

                  {Array.from(selectedGeneralAssertions.entries()).map(
                    ([generalType, data]) => {
                      const assertion = generalAssertions.find(
                        (a) => a.id === generalType
                      );
                      if (!assertion) return null;

                      let displayValue = data.value;
                      if (assertion.hasComparison) {
                        displayValue = `${
                          data.comparison === 'less' ? '< ' : '> '
                        }${data.value}${
                          generalType === 'response_time'
                            ? 'ms'
                            : generalType === 'payload_size'
                            ? 'KB'
                            : ''
                        }`;
                      }

                      return (
                        <div
                          key={generalType}
                          className='flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-lg'
                        >
                          <div className='flex-1 min-w-0'>
                            <p className='text-sm font-medium text-purple-900'>
                              {assertion.label}: {displayValue}
                            </p>
                            <p className='text-xs text-purple-600 mt-0.5'>
                              General assertion
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              const newMap = new Map(selectedGeneralAssertions);
                              newMap.delete(generalType);
                              setSelectedGeneralAssertions(newMap);
                            }}
                            className='p-1.5 text-purple-600 hover:text-red-600 hover:bg-red-50 rounded transition-all'
                            title='Remove'
                          >
                            <Trash2 className='w-4 h-4' />
                          </button>
                        </div>
                      );
                    }
                  )}

                  {pendingAssertions.map((assertion) => (
                    <div
                      key={assertion.id}
                      className='flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg'
                    >
                      <div className='flex-1 min-w-0'>
                        <p className='text-sm font-medium text-green-900'>
                          {assertion.description || assertion.type}
                        </p>
                        <p className='text-xs text-green-600 mt-0.5'>
                          Manual assertion
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          handleRemovePendingAssertion(assertion.id)
                        }
                        className='p-1.5 text-green-600 hover:text-red-600 hover:bg-red-50 rounded transition-all'
                        title='Remove'
                      >
                        <Trash2 className='w-4 h-4' />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className='px-6 py-4 border-t border-gray-200 flex items-center justify-between flex-shrink-0 bg-gray-50'>
          <button
            onClick={onClose}
            className='px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors'
          >
            Cancel
          </button>
          <Button
            onClick={handleAddToList}
            disabled={!canAddToList()}
            className='px-6 py-2 text-sm font-medium text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
          >
            Add Assertion
          </Button>
        </div>
      </div>
    </div>
  );
}

export default AssertionModal;
