'use client';

import type React from 'react';

import { useState, useMemo, useEffect } from 'react';
import {
  Copy,
  Download,
  Search,
  X,
  CheckCircle,
  Clock,
  HardDrive,
  ChevronDown,
  ChevronRight,
  Code,
  Hash,
  Cookie,
  Trash2,
  Shield,
  Type,
  List,
  XCircle,
  Wand2,
  Code2,
  Activity,
} from 'lucide-react';
import { useRequest } from '@/hooks/useRequest';

interface JsonNode {
  key: string;
  value: any;
  path: string;
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
  level: number;
  parentPath: string;
  childCount?: number;
}

interface Assertion {
  id: number;
  type: string;
  path: string;
  value: any;
  operator?: string;
  expectedType?: string;
  originalText?: string;
  isGeneral?: boolean;
  expectedTime?: string;
  expectedSize?: string;
  comparison?: string;
}

function AssertionModal({
  fieldPath,
  fieldValue,
  isOpen,
  onSelect,
  onClose,
}: {
  fieldPath: string;
  fieldValue: any;
  isOpen: boolean;
  onSelect: (assertionType: string, config?: any) => void;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<
    'suggested' | 'manual' | 'nlp' | 'general'
  >('suggested');
  const [selectedOperator, setSelectedOperator] = useState<string>('equals');
  const [manualValue, setManualValue] = useState('');
  const [nlpInput, setNlpInput] = useState('');
  const [nlpParsed, setNlpParsed] = useState<any>(null);
  const [generalType, setGeneralType] = useState<string>('');
  const [generalValue, setGeneralValue] = useState<string>('');
  const [generalComparison, setGeneralComparison] = useState<string>('less');

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

  if (!isOpen) return null;

  const getValueType = (value: any): string => {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value;
  };

  const valueType = getValueType(fieldValue);
  const isArray = Array.isArray(fieldValue);

  const suggestedAssertions = [
    {
      id: 'exists',
      label: 'Field Exists',
      icon: CheckCircle,
      description: 'Assert that this field exists in response',
    },
    {
      id: 'not-exists',
      label: 'Field Not Present',
      icon: XCircle,
      description: 'Assert that this field does not exist',
    },
    {
      id: 'data-type',
      label: 'Check Data Type',
      icon: Type,
      description: `Assert field is of type: ${valueType}`,
    },
    {
      id: 'not-null',
      label: 'Not Null',
      icon: CheckCircle,
      description: 'Assert field value is not null',
    },
    ...(isArray
      ? [
          {
            id: 'is-array',
            label: 'Is Array',
            icon: List,
            description: 'Assert field is an array',
          },
        ]
      : []),
  ];

  const generalAssertions = [
    {
      id: 'response-time',
      label: 'Response Time',
      icon: Clock,
      needsInput: true,
      inputType: 'number',
      inputLabel: 'Time in milliseconds',
      hasComparison: true,
    },
    {
      id: 'payload-size',
      label: 'Payload Size',
      icon: HardDrive,
      needsInput: true,
      inputType: 'number',
      inputLabel: 'Size in KB',
      hasComparison: true,
    },
    {
      id: 'status-success',
      label: 'Status Success',
      icon: CheckCircle,
      needsInput: false,
    },
    {
      id: 'contains-static',
      label: 'Contains Static',
      icon: Code,
      needsInput: true,
      inputType: 'text',
      inputLabel: 'Static value',
    },
    {
      id: 'contains-dynamic',
      label: 'Contains Dynamic',
      icon: Code,
      needsInput: true,
      inputType: 'text',
      inputLabel: 'Variable name',
    },
    {
      id: 'contains-extracted',
      label: 'Contains Extracted',
      icon: Code,
      needsInput: true,
      inputType: 'text',
      inputLabel: 'Variable name',
    },
  ];

  const operators = [
    { id: 'equals', label: '=', description: 'Equals' },
    { id: 'not-equals', label: '≠', description: 'Not equals' },
    { id: 'greater-than', label: '>', description: 'Greater than' },
    { id: 'less-than', label: '<', description: 'Less than' },
    { id: 'contains', label: 'contains', description: 'Contains' },
    {
      id: 'not-contains',
      label: 'not contains',
      description: 'Does not contain',
    },
    ...(isArray
      ? [{ id: 'array-length', label: 'length', description: 'Array length' }]
      : []),
  ];

  const handleSuggestedClick = (id: string) => {
    const config: any = {};
    if (id === 'data-type') {
      config.expectedType = valueType;
    }
    onSelect(id, config);
  };

  const handleManualSubmit = () => {
    if (!manualValue) return;
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

    onSelect(generalType, config);
    setGeneralType('');
    setGeneralValue('');
    setGeneralComparison('less');
  };

  const parseNLPAssertion = (text: string) => {
    const lowerText = text.toLowerCase();

    const patterns = [
      {
        regex: /(\w+)\s*(?:is|should be)?\s*([<>≤≥=!]*)\s*(.+?)(?:\s|$)/i,
        groups: { field: 1, op: 2, value: 3 },
      },
      {
        regex: /([<>])\s*(\d+)\s*(kb|ms|k|bytes)?/i,
        groups: { op: 1, value: 2, unit: 3 },
      },
      {
        regex: /(contains|includes|has)\s+(.+?)(?:\s|$)/i,
        groups: { op: 1, value: 2 },
      },
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern.regex);
      if (match) {
        let operator = 'equals';
        const value = match[3] || match[2];

        if (match[2] === '<' || lowerText.includes('less'))
          operator = 'less-than';
        else if (
          match[2] === '>' ||
          lowerText.includes('greater') ||
          lowerText.includes('more')
        )
          operator = 'greater-than';
        else if (
          lowerText.includes('contains') ||
          lowerText.includes('includes')
        )
          operator = 'contains';
        else if (lowerText.includes('not') && lowerText.includes('contains'))
          operator = 'not-contains';

        return {
          parsed: true,
          text: `${fieldPath} ${
            operators.find((o) => o.id === operator)?.label || '='
          } ${value}`,
          operator,
          value,
        };
      }
    }

    return { parsed: false, text: '', operator: 'equals', value: '' };
  };

  const handleNLPChange = (text: string) => {
    setNlpInput(text);
    if (text.trim()) {
      setNlpParsed(parseNLPAssertion(text));
    } else {
      setNlpParsed(null);
    }
  };

  const handleNLPSubmit = () => {
    if (!nlpParsed || !nlpParsed.parsed || !nlpParsed.value) return;
    const config: any = {
      operator: nlpParsed.operator,
      value: nlpParsed.value,
      originalText: nlpInput,
    };
    onSelect('nlp', config);
  };

  return (
    <div
      className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className='bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-200 dark:border-gray-700'
      >
        <div className='p-4 border-b border-gray-200 dark:border-gray-700 flex items-start justify-between'>
          <div className='flex-1'>
            <h2 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
              Add Assertion
            </h2>
            <p className='text-xs text-gray-500 mt-1 font-mono'>{fieldPath}</p>
          </div>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-gray-600 transition-colors ml-2'
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        <div className='flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'>
          <button
            onClick={() => setActiveTab('general')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${
              activeTab === 'general'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-white dark:bg-gray-900'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <div className='flex items-center justify-center gap-2'>
              <Activity className='w-4 h-4' />
              General
            </div>
          </button>
          <button
            onClick={() => setActiveTab('suggested')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${
              activeTab === 'suggested'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-white dark:bg-gray-900'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <div className='flex items-center justify-center gap-2'>
              <CheckCircle className='w-4 h-4' />
              Suggested
            </div>
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${
              activeTab === 'manual'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-white dark:bg-gray-900'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <div className='flex items-center justify-center gap-2'>
              <Code2 className='w-4 h-4' />
              Manual
            </div>
          </button>
          <button
            onClick={() => setActiveTab('nlp')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${
              activeTab === 'nlp'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-white dark:bg-gray-900'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <div className='flex items-center justify-center gap-2'>
              <Wand2 className='w-4 h-4' />
              Plain English
            </div>
          </button>
        </div>

        <div className='flex-1 overflow-y-auto p-6'>
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
                        className='w-full flex items-start gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left group'
                      >
                        <div className='w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 flex items-center justify-center flex-shrink-0 transition-colors'>
                          <Icon className='w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 transition-colors' />
                        </div>
                        <div className='flex-1 min-w-0'>
                          <div className='text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-900 dark:group-hover:text-blue-300'>
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
                    <h3 className='text-sm font-semibold text-gray-900 dark:text-gray-100'>
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
                      <label className='block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2'>
                        Comparison
                      </label>
                      <div className='grid grid-cols-2 gap-2'>
                        {['less', 'more'].map((c) => (
                          <button
                            key={c}
                            onClick={() => setGeneralComparison(c)}
                            className={`px-4 py-2 text-sm rounded-lg border font-medium transition-all ${
                              generalComparison === c
                                ? 'bg-blue-600 border-blue-600 text-white'
                                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-blue-300'
                            }`}
                          >
                            {c === 'less' ? 'Less than' : 'More than'}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <label className='block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2'>
                      {
                        generalAssertions.find((a) => a.id === generalType)
                          ?.inputLabel
                      }
                    </label>
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
                      className='w-full px-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm'
                      autoFocus
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'suggested' && (
            <div className='space-y-2'>
              {suggestedAssertions.map((assertion) => {
                const Icon = assertion.icon;
                return (
                  <button
                    key={assertion.id}
                    onClick={() => handleSuggestedClick(assertion.id)}
                    className='w-full flex items-start gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left group'
                  >
                    <div className='w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 flex items-center justify-center flex-shrink-0 transition-colors'>
                      <Icon className='w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 transition-colors' />
                    </div>
                    <div className='flex-1 min-w-0'>
                      <div className='text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-900 dark:group-hover:text-blue-300'>
                        {assertion.label}
                      </div>
                      <div className='text-xs text-gray-500 mt-1'>
                        {assertion.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {activeTab === 'manual' && (
            <div className='space-y-6'>
              <div>
                <label className='block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3'>
                  Operator
                </label>
                <div className='grid grid-cols-3 gap-2'>
                  {operators.map((op) => (
                    <button
                      key={op.id}
                      onClick={() => setSelectedOperator(op.id)}
                      title={op.description}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                        selectedOperator === op.id
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-blue-300'
                      }`}
                    >
                      {op.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className='block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2'>
                  Expected Value
                </label>
                <input
                  type='text'
                  value={manualValue}
                  onChange={(e) => setManualValue(e.target.value)}
                  placeholder='Enter the expected value'
                  className='w-full px-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm'
                  autoFocus
                />
              </div>

              <div className='bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3'>
                <p className='text-sm text-gray-700 dark:text-gray-300'>
                  <span className='font-mono text-blue-700 dark:text-blue-400'>
                    {fieldPath}
                  </span>
                  <span className='text-gray-600 dark:text-gray-400 mx-2'>
                    {operators.find((o) => o.id === selectedOperator)?.label}
                  </span>
                  <span className='font-mono text-blue-700 dark:text-blue-400'>
                    {manualValue || '...'}
                  </span>
                </p>
              </div>
            </div>
          )}

          {activeTab === 'nlp' && (
            <div className='space-y-4'>
              <div>
                <label className='block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2'>
                  Describe your assertion in plain English
                </label>
                <textarea
                  value={nlpInput}
                  onChange={(e) => handleNLPChange(e.target.value)}
                  placeholder='e.g., response time is less than 500ms&#10;or email field contains @example.com&#10;or payload size greater than 200kb'
                  className='w-full px-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm resize-none h-24'
                  autoFocus
                />
              </div>

              {nlpParsed && nlpParsed.parsed && (
                <div className='bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4'>
                  <div className='text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide mb-2'>
                    Parsed Assertion
                  </div>
                  <div className='bg-white dark:bg-gray-900 rounded px-3 py-2 font-mono text-sm text-gray-700 dark:text-gray-300 border border-green-200 dark:border-green-800'>
                    {nlpParsed.text}
                  </div>
                </div>
              )}

              {nlpInput && !nlpParsed?.parsed && (
                <div className='bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4'>
                  <div className='text-sm text-yellow-800 dark:text-yellow-300'>
                    Could not parse your assertion. Try using keywords like
                    "less than", "greater than", "contains", or specific
                    operators like "&lt;", "&gt;".
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className='p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex gap-2'>
          <button
            onClick={onClose}
            className='flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors'
          >
            Cancel
          </button>
          {activeTab === 'general' && !generalType && (
            <p className='flex-1 text-sm text-gray-500 text-center py-2'>
              Click on any assertion above to add it
            </p>
          )}
          {activeTab === 'general' && generalType && (
            <button
              onClick={handleGeneralSubmit}
              disabled={!generalValue}
              className='flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
            >
              Add Assertion
            </button>
          )}
          {activeTab === 'suggested' && (
            <p className='flex-1 text-sm text-gray-500 text-center py-2'>
              Click on any assertion above to add it
            </p>
          )}
          {activeTab === 'manual' && (
            <button
              onClick={handleManualSubmit}
              disabled={!manualValue}
              className='flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
            >
              Add Assertion
            </button>
          )}
          {activeTab === 'nlp' && (
            <button
              onClick={handleNLPSubmit}
              disabled={!nlpParsed?.parsed || !nlpParsed?.value}
              className='flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
            >
              Add Assertion
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function AssertionsPanel({
  assertions,
  onRemoveAssertion,
}: {
  assertions: Assertion[];
  onRemoveAssertion: (id: number) => void;
}) {
  const getAssertionLabel = (assertion: Assertion): string => {
    if (assertion.isGeneral) {
      switch (assertion.type) {
        case 'response-time':
          return `Response Time ${assertion.comparison || 'less'} than ${
            assertion.expectedTime
          }ms`;
        case 'payload-size':
          return `Payload Size ${assertion.comparison || 'less'} than ${
            assertion.expectedSize
          }KB`;
        case 'status-success':
          return 'Status Success (2xx)';
        case 'contains-static':
          return `Contains Static: ${assertion.value}`;
        case 'contains-dynamic':
          return `Contains Dynamic: ${assertion.value}`;
        case 'contains-extracted':
          return `Contains Extracted: ${assertion.value}`;
        default:
          return assertion.type;
      }
    }

    switch (assertion.type) {
      case 'exists':
        return 'Field exists';
      case 'not-exists':
        return 'Field not present';
      case 'data-type':
        return `Type is ${assertion.expectedType}`;
      case 'not-null':
        return 'Not null';
      case 'is-array':
        return 'Is array';
      case 'manual':
        return `${getOperatorLabel(assertion.operator!)} ${assertion.value}`;
      case 'nlp':
        return assertion.originalText!;
      default:
        return assertion.type;
    }
  };

  const getOperatorLabel = (op: string): string => {
    const operators: { [key: string]: string } = {
      equals: '=',
      'not-equals': '≠',
      'greater-than': '>',
      'less-than': '<',
      contains: 'contains',
      'not-contains': 'not contains',
      'array-length': 'length',
    };
    return operators[op] || op;
  };

  const generalAssertions = assertions.filter((a) => a.isGeneral);
  const fieldAssertions = assertions.filter((a) => !a.isGeneral);

  return (
    <div className='flex flex-col h-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700'>
      <div className='p-4 border-b border-gray-200 dark:border-gray-700'>
        <h2 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
          Active Assertions
        </h2>
        <p className='text-sm text-gray-500 mt-1'>
          {assertions.length} assertion{assertions.length !== 1 ? 's' : ''}{' '}
          configured
        </p>
      </div>

      <div className='flex-1 overflow-y-auto'>
        {assertions.length === 0 ? (
          <div className='flex flex-col items-center justify-center h-full p-8 text-center'>
            <div className='w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4'>
              <Shield className='w-8 h-8 text-gray-400' />
            </div>
            <p className='text-sm font-medium text-gray-900 dark:text-gray-100 mb-1'>
              No assertions yet
            </p>
            <p className='text-xs text-gray-500'>
              Hover over any field in the response to add assertions
            </p>
          </div>
        ) : (
          <div className='p-4 space-y-4'>
            {generalAssertions.length > 0 && (
              <div>
                <div className='flex items-center gap-2 mb-2'>
                  <Activity className='w-4 h-4 text-gray-500' />
                  <h3 className='text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase'>
                    General
                  </h3>
                </div>
                <div className='space-y-2'>
                  {generalAssertions.map((assertion) => (
                    <div
                      key={assertion.id}
                      className='group bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 hover:border-amber-300 transition-colors'
                    >
                      <div className='flex items-start justify-between gap-2'>
                        <div className='flex-1 min-w-0'>
                          <div className='text-sm font-medium text-gray-900 dark:text-gray-100'>
                            {getAssertionLabel(assertion)}
                          </div>
                        </div>
                        <button
                          onClick={() => onRemoveAssertion(assertion.id)}
                          className='opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 transition-all flex-shrink-0'
                          title='Remove assertion'
                        >
                          <Trash2 className='w-4 h-4' />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Field assertions section */}
            {fieldAssertions.length > 0 && (
              <div>
                {generalAssertions.length > 0 && (
                  <div className='flex items-center gap-2 mb-2'>
                    <Shield className='w-4 h-4 text-gray-500' />
                    <h3 className='text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase'>
                      Field Assertions
                    </h3>
                  </div>
                )}
                <div className='space-y-2'>
                  {fieldAssertions.map((assertion) => {
                    const bgColor =
                      assertion.type === 'nlp'
                        ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 hover:border-purple-300'
                        : assertion.type === 'manual'
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 hover:border-indigo-300'
                        : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 hover:border-blue-300';
                    const textColor =
                      assertion.type === 'nlp'
                        ? 'text-purple-600 dark:text-purple-400'
                        : assertion.type === 'manual'
                        ? 'text-indigo-600 dark:text-indigo-400'
                        : 'text-blue-600 dark:text-blue-400';

                    return (
                      <div
                        key={assertion.id}
                        className={`group ${bgColor} border rounded-lg p-3 transition-colors`}
                      >
                        <div className='flex items-start justify-between gap-2'>
                          <div className='flex-1 min-w-0'>
                            <div
                              className={`text-xs font-mono ${textColor} mb-1 truncate`}
                            >
                              {assertion.path}
                            </div>
                            <div className='text-sm font-medium text-gray-900 dark:text-gray-100'>
                              {getAssertionLabel(assertion)}
                            </div>
                          </div>
                          <button
                            onClick={() => onRemoveAssertion(assertion.id)}
                            className='opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 transition-all flex-shrink-0'
                            title='Remove assertion'
                          >
                            <Trash2 className='w-4 h-4' />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {assertions.length > 0 && (
        <div className='p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'>
          <button className='w-full px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors'>
            Run All Assertions ({assertions.length})
          </button>
        </div>
      )}
    </div>
  );
}

const ResponseViewer = () => {
  const { responseData } = useRequest();

  const [activeTab, setActiveTab] = useState<
    | 'body'
    | 'headers'
    | 'cookies'
    | 'test-results'
    | 'schema'
    | 'actual-request'
  >('body');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(
    new Set(['root'])
  );
  const [copiedItem, setCopiedItem] = useState<string>('');
  const [hoveredField, setHoveredField] = useState<string | null>(null);
  const [showAssertionModal, setShowAssertionModal] = useState(false);
  const [activeFieldPath, setActiveFieldPath] = useState<string>('');
  const [activeFieldValue, setActiveFieldValue] = useState<any>(null);
  const [assertions, setAssertions] = useState<Assertion[]>([]);
  const [assertionIdCounter, setAssertionIdCounter] = useState(1);

  useEffect(() => {
    if (responseData?.body) {
      const allPaths = new Set<string>();
      const collectPaths = (obj: any, path = 'root') => {
        allPaths.add(path);
        if (obj && typeof obj === 'object') {
          if (Array.isArray(obj)) {
            obj.forEach((_, idx) => {
              const newPath = path === 'root' ? `[${idx}]` : `${path}[${idx}]`;
              collectPaths(obj[idx], newPath);
            });
          } else {
            Object.keys(obj).forEach((key) => {
              const newPath = path === 'root' ? key : `${path}.${key}`;
              collectPaths(obj[key], newPath);
            });
          }
        }
      };
      collectPaths(responseData.body);
      setExpandedNodes(allPaths);
    }
  }, [responseData?.body]);

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300)
      return 'text-green-600 dark:text-green-400';
    if (status >= 300 && status < 400)
      return 'text-yellow-600 dark:text-yellow-400';
    if (status >= 400 && status < 500)
      return 'text-orange-600 dark:text-orange-400';
    if (status >= 500) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const kb = bytes / k;
    return Number.parseFloat(kb.toFixed(2)) + ' KB';
  };

  const calculateResponseSize = (data: any): string => {
    try {
      const size = new Blob([JSON.stringify(data)]).size;
      return formatBytes(size);
    } catch {
      return formatBytes(0);
    }
  };

  const handleCopy = (text: string, itemId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(itemId);
    setTimeout(() => setCopiedItem(''), 2000);
  };

  const downloadResponse = () => {
    if (!responseData) return;
    const blob = new Blob([JSON.stringify(responseData.body, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'response.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getChildCount = (obj: any): number => {
    if (Array.isArray(obj)) return obj.length;
    if (obj && typeof obj === 'object') return Object.keys(obj).length;
    return 0;
  };

  const parseJsonToNodes = (
    obj: any,
    parentPath = 'root',
    level = 0
  ): JsonNode[] => {
    const nodes: JsonNode[] = [];
    if (obj === null) {
      return [
        {
          key: 'null',
          value: null,
          path: parentPath,
          type: 'null',
          level,
          parentPath: '',
        },
      ];
    }
    if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        const currentPath =
          parentPath === 'root' ? `[${index}]` : `${parentPath}[${index}]`;
        const itemType = Array.isArray(item)
          ? 'array'
          : item === null
          ? 'null'
          : typeof item === 'object'
          ? 'object'
          : typeof item;
        nodes.push({
          key: `[${index}]`,
          value: item,
          path: currentPath,
          type: itemType as JsonNode['type'],
          level,
          parentPath,
          childCount: getChildCount(item),
        });
        if (typeof item === 'object' && item !== null) {
          nodes.push(...parseJsonToNodes(item, currentPath, level + 1));
        }
      });
    } else if (typeof obj === 'object') {
      Object.entries(obj).forEach(([key, value]) => {
        const currentPath =
          parentPath === 'root' ? key : `${parentPath}.${key}`;
        const valueType = Array.isArray(value)
          ? 'array'
          : value === null
          ? 'null'
          : typeof value === 'object'
          ? 'object'
          : typeof value;
        nodes.push({
          key,
          value,
          path: currentPath,
          type: valueType as JsonNode['type'],
          level,
          parentPath,
          childCount: getChildCount(value),
        });
        if (typeof value === 'object' && value !== null) {
          nodes.push(...parseJsonToNodes(value, currentPath, level + 1));
        }
      });
    }

    return nodes;
  };

  const toggleNode = (path: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedNodes(newExpanded);
  };

  const handleAddAssertionClick = (
    fieldPath: string,
    value: any,
    event: React.MouseEvent
  ) => {
    event.stopPropagation();
    setActiveFieldPath(fieldPath);
    setActiveFieldValue(value);
    setShowAssertionModal(true);
    setHoveredField(fieldPath);
  };

  const handleModalClose = () => {
    setShowAssertionModal(false);
    setHoveredField(null);
    setActiveFieldPath('');
    setActiveFieldValue(null);
  };

  const handleAssertionSelect = (assertionType: string, config?: any) => {
    const newAssertion: Assertion = {
      id: assertionIdCounter,
      type: assertionType,
      path: activeFieldPath,
      value: activeFieldValue,
      ...config,
    };
    setAssertions([...assertions, newAssertion]);
    setAssertionIdCounter(assertionIdCounter + 1);
    handleModalClose();
  };

  const handleRemoveAssertion = (id: number) => {
    setAssertions(assertions.filter((a) => a.id !== id));
  };

  const parseRequestFromCurl = () => {
    if (responseData?.actualRequest) {
      return responseData.actualRequest;
    }

    if (!responseData?.requestCurl) return null;

    const curlCommand = responseData.requestCurl;
    const methodMatch = curlCommand.match(/-X '(\w+)'/);
    const urlMatch = curlCommand.match(/'(https?:\/\/[^']+)'/);
    const bodyMatch = curlCommand.match(/-d '({[^']+})'/);

    const headerMatches = curlCommand.matchAll(/-H '([^:]+):\s*([^']+)'/g);
    const headers: Record<string, string> = {};
    for (const match of headerMatches) {
      headers[match[1]] = match[2];
    }

    return {
      method: methodMatch?.[1] || 'GET',
      url: urlMatch?.[1] || '',
      headers,
      body: bodyMatch?.[1] ? JSON.parse(bodyMatch[1]) : null,
    };
  };

  const renderJsonValue = (node: JsonNode, index: number) => {
    const isExpanded = expandedNodes.has(node.path);
    const hasChildren = node.type === 'object' || node.type === 'array';
    const isHovered = hoveredField === node.path;

    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const matchesKey = node.key.toLowerCase().includes(searchLower);
      const matchesValue =
        !hasChildren && String(node.value).toLowerCase().includes(searchLower);
      const matchesPath = node.path.toLowerCase().includes(searchLower);

      if (!matchesKey && !matchesValue && !matchesPath) {
        return null;
      }
    }

    return (
      <div
        key={node.path}
        className='group hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors relative'
        onMouseEnter={() => setHoveredField(node.path)}
        onMouseLeave={() => !showAssertionModal && setHoveredField(null)}
      >
        <div className='flex items-center py-1 pr-2 font-mono text-sm border-l-2 border-transparent hover:border-blue-500'>
          <span className='text-gray-400 dark:text-gray-600 select-none text-xs w-12 text-center flex-shrink-0 absolute left-0'>
            {index + 1}
          </span>
          <div
            className='flex items-center flex-1 min-w-0'
            style={{ marginLeft: `${48 + node.level * 20}px` }}
          >
            {hasChildren && (
              <button
                onClick={() => toggleNode(node.path)}
                className='p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded mr-1 flex-shrink-0'
                aria-label={isExpanded ? 'Collapse' : 'Expand'}
              >
                {isExpanded ? (
                  <ChevronDown className='w-3 h-3 text-gray-600 dark:text-gray-400' />
                ) : (
                  <ChevronRight className='w-3 h-3 text-gray-600 dark:text-gray-400' />
                )}
              </button>
            )}
            {!hasChildren && <div className='w-5' />}
            <span className='text-blue-600 dark:text-blue-400 font-medium mr-2 text-sm flex-shrink-0'>
              {node.key}:
            </span>

            {hasChildren ? (
              <span className='text-gray-600 dark:text-gray-400 text-sm'>
                {node.type === 'array'
                  ? `[${Array.isArray(node.value) ? node.value.length : 0}]`
                  : `{${Object.keys(node.value || {}).length}}`}
              </span>
            ) : (
              <span
                className={`text-sm font-mono truncate ${
                  node.type === 'string'
                    ? 'text-green-600 dark:text-green-400'
                    : node.type === 'number'
                    ? 'text-purple-600 dark:text-purple-400'
                    : node.type === 'boolean'
                    ? 'text-orange-600 dark:text-orange-400'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                {node.type === 'string'
                  ? `"${node.value}"`
                  : String(node.value)}
              </span>
            )}
          </div>
          <div className='flex items-center space-x-1 flex-shrink-0 ml-2'>
            {!hasChildren && (
              <button
                onClick={() =>
                  handleCopy(String(node.value), `copy-${node.path}`)
                }
                className='p-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 rounded opacity-0 group-hover:opacity-100 transition-opacity'
                title='Copy value'
              >
                {copiedItem === `copy-${node.path}` ? (
                  <CheckCircle className='w-3 h-3 text-green-600' />
                ) : (
                  <Copy className='w-3 h-3' />
                )}
              </button>
            )}
            {isHovered && (
              <button
                onClick={(e) =>
                  handleAddAssertionClick(node.path, node.value, e)
                }
                className='px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded border border-blue-200 dark:border-blue-800 transition-colors'
              >
                + Assert
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const jsonNodes = useMemo(() => {
    if (!responseData?.body) return [];
    return parseJsonToNodes(responseData.body);
  }, [responseData?.body]);

  const renderJsonTree = () => {
    try {
      const nodesToShow = new Set<string>();
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        jsonNodes.forEach((node) => {
          const matchesKey = node.key.toLowerCase().includes(searchLower);
          const hasChildren = node.type === 'object' || node.type === 'array';
          const matchesValue =
            !hasChildren &&
            String(node.value).toLowerCase().includes(searchLower);
          const matchesPath = node.path.toLowerCase().includes(searchLower);

          if (matchesKey || matchesValue || matchesPath) {
            nodesToShow.add(node.path);
            let parentPath = node.parentPath;
            while (parentPath && parentPath !== 'root') {
              nodesToShow.add(parentPath);
              const parentNode = jsonNodes.find((n) => n.path === parentPath);
              if (parentNode) {
                parentPath = parentNode.parentPath;
              } else {
                break;
              }
            }
          }
        });
      }

      const visibleNodes = jsonNodes.filter((node) => {
        if (node.level === 0) return true;
        if (searchQuery) {
          return (
            nodesToShow.has(node.path) &&
            (node.parentPath === 'root' ||
              nodesToShow.has(node.parentPath) ||
              expandedNodes.has(node.parentPath))
          );
        }
        return expandedNodes.has(node.parentPath);
      });

      const totalRows = jsonNodes.filter((n) => n.level === 0).length;

      return (
        <div className='bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden'>
          <div className='bg-gray-50 dark:bg-gray-800 px-3 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between'>
            <span className='text-xs font-medium text-gray-600 dark:text-gray-400'>
              {totalRows} {totalRows === 1 ? 'row' : 'rows'}
            </span>
            <div className='flex items-center gap-2'>
              <button
                onClick={() => {
                  const allPaths = new Set<string>();
                  const collectPaths = (obj: any, path = 'root') => {
                    allPaths.add(path);
                    if (obj && typeof obj === 'object') {
                      if (Array.isArray(obj)) {
                        obj.forEach((_, idx) => {
                          const newPath =
                            path === 'root' ? `[${idx}]` : `${path}[${idx}]`;
                          collectPaths(obj[idx], newPath);
                        });
                      } else {
                        Object.keys(obj).forEach((key) => {
                          const newPath =
                            path === 'root' ? key : `${path}.${key}`;
                          collectPaths(obj[key], newPath);
                        });
                      }
                    }
                  };
                  collectPaths(responseData?.body);
                  setExpandedNodes(allPaths);
                }}
                className='text-xs text-blue-600 dark:text-blue-400 hover:underline'
              >
                Expand All
              </button>
              <button
                onClick={() => setExpandedNodes(new Set())}
                className='text-xs text-blue-600 dark:text-blue-400 hover:underline'
              >
                Collapse All
              </button>
            </div>
          </div>

          <div className='max-h-[600px] overflow-y-auto scrollbar-thin'>
            {visibleNodes.map((node, index) => renderJsonValue(node, index))}
          </div>
        </div>
      );
    } catch (error) {
      console.error('JSON parsing error:', error);
      return (
        <div className='p-2 bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700'>
          <p className='text-gray-600 dark:text-gray-400 text-sm'>
            Unable to parse response
          </p>
        </div>
      );
    }
  };

  const renderHeadersTab = () => (
    <div className='space-y-2'>
      {Object.entries(responseData?.headers || {}).map(([key, value]) => (
        <div
          key={key}
          className='group flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 bg-white dark:bg-gray-900'
        >
          <div className='flex-1 min-w-0 mr-4'>
            <div className='flex items-center space-x-2'>
              <Hash className='w-4 h-4 text-gray-600 dark:text-gray-400 flex-shrink-0' />
              <span className='font-medium text-gray-900 dark:text-gray-100 text-sm'>
                {key}
              </span>
            </div>
            <p className='text-sm text-gray-600 dark:text-gray-400 font-mono mt-1 break-all'>
              {value}
            </p>
          </div>
          <div className='flex items-center space-x-2 flex-shrink-0'>
            <button
              onClick={() => handleCopy(value as string, `header-${key}`)}
              className='p-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 rounded'
              title='Copy value'
            >
              {copiedItem === `header-${key}` ? (
                <CheckCircle className='w-4 h-4 text-green-600' />
              ) : (
                <Copy className='w-4 h-4' />
              )}
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  const StatusSummary = () => {
    if (!responseData) return null;

    return (
      <div className='flex items-center space-x-4 text-sm'>
        <div className='flex items-center space-x-1'>
          <CheckCircle
            className={`h-4 w-4 ${getStatusColor(responseData.status)}`}
          />
          <span
            className={`font-medium ${getStatusColor(responseData.status)}`}
          >
            {responseData.status} {responseData.statusText || ''}
          </span>
        </div>
        <div className='flex items-center space-x-1'>
          <Clock className='h-4 w-4 text-gray-600 dark:text-gray-400' />
          <span className='font-medium text-gray-900 dark:text-gray-100'>
            {responseData.metrics?.responseTime || 0}ms
          </span>
        </div>
        <div className='flex items-center space-x-1'>
          <HardDrive className='h-4 w-4 text-gray-600 dark:text-gray-400' />
          <span className='font-medium text-gray-900 dark:text-gray-100'>
            {calculateResponseSize(responseData.body)}
          </span>
        </div>
      </div>
    );
  };

  const tabs = [
    {
      id: 'body',
      label: 'Body',
    },
    {
      id: 'headers',
      label: 'Headers',
    },
    { id: 'cookies', label: 'Cookies' },
    {
      id: 'test-results',
      label: 'Test Results',
      hasIndicator:
        !!responseData?.assertionLogs && responseData.assertionLogs.length > 0,
    },
    {
      id: 'schema',
      label: 'Schema',
      hasIndicator: !!responseData?.schemaValidation,
    },
    {
      id: 'actual-request',
      label: 'Actual Request',
      hasIndicator: !!responseData?.requestCurl,
    },
  ];

  const requestDetails = parseRequestFromCurl();

  if (!responseData) {
    return (
      <div className='flex-1 flex items-center justify-center bg-white dark:bg-gray-900 p-2'>
        <div className='text-center'>
          <p className='text-gray-600 dark:text-gray-400 mb-4'>
            No response yet
          </p>
          <p className='text-sm text-gray-500'>
            Send a request to see the response here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='flex h-screen bg-gray-50 dark:bg-gray-950'>
      <div className='flex-1 flex flex-col bg-white dark:bg-gray-900 min-h-0 overflow-hidden'>
        <div className='bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex-shrink-0'>
          <div className='flex items-center justify-between border-b border-gray-200 dark:border-gray-700'>
            <nav className='flex space-x-6 px-4 whitespace-nowrap overflow-x-auto scrollbar-thin no-scrollbar'>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.hasIndicator && (
                    <span className='w-1.5 h-1.5 bg-blue-500 rounded-full' />
                  )}
                </button>
              ))}
            </nav>

            <div className='px-4'>
              <StatusSummary />
            </div>
          </div>

          <div className='flex items-center justify-between px-4 py-1'>
            <div className='flex items-center space-x-4'>
              <button className='flex items-center space-x-2 text-sm font-medium text-blue-600'>
                <CheckCircle className='w-4 h-4' />
                <span>Pretty</span>
              </button>
              <button className='flex items-center space-x-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'>
                <Code className='w-4 h-4' />
                <span>Raw</span>
              </button>
            </div>

            <div className='flex items-center space-x-2'>
              <button
                onClick={() => setShowSearch(!showSearch)}
                className='p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
                title='Search in response'
              >
                <Search className='h-4 w-4' />
              </button>
              <button
                onClick={() =>
                  handleCopy(
                    JSON.stringify(responseData.body, null, 2),
                    'full-response'
                  )
                }
                className='p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
                title='Copy response'
              >
                {copiedItem === 'full-response' ? (
                  <CheckCircle className='h-4 w-4 text-green-600' />
                ) : (
                  <Copy className='h-4 w-4' />
                )}
              </button>
              <button
                onClick={downloadResponse}
                className='p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
                title='Download response'
              >
                <Download className='h-4 w-4' />
              </button>
            </div>
          </div>

          {showSearch && (
            <div className='px-4 py-2 border-b border-gray-200 dark:border-gray-700'>
              <div className='flex items-center space-x-2'>
                <div className='flex-1 relative'>
                  <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-600 dark:text-gray-400' />
                  <input
                    type='text'
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder='Search in response...'
                    className='w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm'
                    autoFocus
                  />
                </div>
                <button
                  onClick={() => {
                    setShowSearch(false);
                    setSearchQuery('');
                  }}
                  className='p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
                >
                  <X className='h-4 w-4' />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className='flex-1 overflow-auto p-4 scrollbar-thin'>
          {activeTab === 'body' && <div>{renderJsonTree()}</div>}
          {activeTab === 'headers' && renderHeadersTab()}
          {activeTab === 'cookies' && (
            <div className='text-center py-8 text-gray-600 dark:text-gray-400'>
              <Cookie className='w-12 h-12 text-gray-400 mx-auto mb-3' />
              <p>No cookies found in response</p>
            </div>
          )}

          {activeTab === 'test-results' && responseData.assertionLogs && (
            <div className='space-y-2'>
              {responseData.assertionLogs.map((assertion) => (
                <div
                  key={assertion.id}
                  className={`border rounded-lg p-3 ${
                    assertion.status === 'passed'
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                      : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                  }`}
                >
                  <div className='flex items-center space-x-2'>
                    {assertion.status === 'passed' ? (
                      <CheckCircle className='h-5 w-5 text-green-600 dark:text-green-400' />
                    ) : (
                      <X className='h-5 w-5 text-red-600 dark:text-red-400' />
                    )}
                    <h4 className='font-medium text-gray-900 dark:text-gray-100'>
                      {assertion.description}
                    </h4>
                  </div>
                  {assertion.errorMessage && (
                    <p className='mt-2 text-sm text-red-600 dark:text-red-400'>
                      {assertion.errorMessage}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'schema' && (
            <div className='p-4 overflow-auto scrollbar-thin h-full'>
              {responseData.schemaValidation ? (
                <div className='space-y-4'>
                  <div
                    className={`border rounded-lg p-4 ${
                      responseData.schemaValidation.passed
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                        : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    }`}
                  >
                    <div className='flex items-center space-x-2'>
                      {responseData.schemaValidation.passed ? (
                        <CheckCircle className='h-5 w-5 text-green-600 flex-shrink-0' />
                      ) : (
                        <X className='h-5 w-5 text-red-600 flex-shrink-0' />
                      )}
                      <div>
                        <h3
                          className={`font-medium ${
                            responseData.schemaValidation.passed
                              ? 'text-green-800 dark:text-green-300'
                              : 'text-red-800 dark:text-red-300'
                          }`}
                        >
                          Schema Validation{' '}
                          {responseData.schemaValidation.passed
                            ? 'Passed'
                            : 'Failed'}
                        </h3>
                        <p className='text-sm text-gray-600 dark:text-gray-400 mt-1'>
                          Schema: {responseData.schemaValidation.name}
                        </p>
                      </div>
                    </div>
                  </div>

                  {!responseData.schemaValidation.passed &&
                    responseData.schemaValidation.results?.length > 0 && (
                      <div className='border rounded-lg p-4 bg-white dark:bg-gray-900'>
                        <h4 className='font-medium text-sm mb-3 text-red-700 dark:text-red-400'>
                          Validation Errors:
                        </h4>
                        <ul className='space-y-2 text-sm'>
                          {responseData.schemaValidation.results.map(
                            (issue: any, idx: number) => (
                              <li
                                key={idx}
                                className='flex flex-col border-l-2 border-red-400 pl-2'
                              >
                                <span className='font-medium text-gray-800 dark:text-gray-200'>
                                  {issue.field}
                                </span>
                                <span className='text-gray-600 dark:text-gray-400'>
                                  {issue.description}
                                </span>
                                {issue.value !== undefined &&
                                  issue.value !== null && (
                                    <span className='text-xs text-gray-400'>
                                      Value: {String(issue.value)}
                                    </span>
                                  )}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                </div>
              ) : (
                <div className='text-center py-8'>
                  <div className='text-gray-500 dark:text-gray-400 mb-2'>
                    No schema validation results
                  </div>
                  <div className='text-sm text-gray-400'>
                    Schema validation will appear here when available
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'actual-request' && requestDetails && (
            <div className='space-y-4'>
              <div className='bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4'>
                <h3 className='text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3'>
                  Request URL:
                </h3>
                <div className='flex items-center space-x-3'>
                  <span className='px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded font-semibold text-sm'>
                    {requestDetails.method}
                  </span>
                  <span className='text-sm text-gray-900 dark:text-gray-100 font-mono flex-1 truncate'>
                    {requestDetails.url}
                  </span>
                  <button
                    onClick={() =>
                      handleCopy(requestDetails.url, 'request-url')
                    }
                    className='p-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 rounded'
                    title='Copy URL'
                  >
                    {copiedItem === 'request-url' ? (
                      <CheckCircle className='w-4 h-4 text-green-600' />
                    ) : (
                      <Copy className='w-4 h-4' />
                    )}
                  </button>
                </div>
              </div>

              <div className='bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4'>
                <h3 className='text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3'>
                  Headers:
                </h3>
                <div className='overflow-x-auto scrollbar-thin'>
                  <table className='w-full text-sm'>
                    <thead>
                      <tr className='border-b border-gray-200 dark:border-gray-700'>
                        <th className='text-left py-2 px-3 text-gray-600 dark:text-gray-400 font-semibold'>
                          Name
                        </th>
                        <th className='text-left py-2 px-3 text-gray-600 dark:text-gray-400 font-semibold'>
                          Value
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(requestDetails.headers).map(
                        ([name, value]) => (
                          <tr
                            key={name}
                            className='border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors'
                          >
                            <td className='py-2 px-3 text-gray-900 dark:text-gray-100 font-medium'>
                              {name}
                            </td>
                            <td className='py-2 px-3 text-gray-600 dark:text-gray-400 font-mono'>
                              {String(value)}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {requestDetails.body && (
                <div className='bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4'>
                  <div className='flex items-center justify-between mb-3'>
                    <h3 className='text-sm font-semibold text-gray-900 dark:text-gray-100'>
                      Body:
                    </h3>
                    <span className='text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded'>
                      Body Type: application/json
                    </span>
                  </div>
                  <div className='bg-gray-100 dark:bg-gray-800 rounded-lg p-3 relative'>
                    <button
                      onClick={() =>
                        handleCopy(
                          JSON.stringify(requestDetails.body, null, 2),
                          'request-body'
                        )
                      }
                      className='absolute top-2 right-2 p-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 rounded'
                      title='Copy body'
                    >
                      {copiedItem === 'request-body' ? (
                        <CheckCircle className='w-4 h-4 text-green-600' />
                      ) : (
                        <Copy className='w-4 h-4' />
                      )}
                    </button>
                    <pre className='text-sm text-gray-900 dark:text-gray-100 font-mono overflow-x-auto scrollbar-thin'>
                      {JSON.stringify(requestDetails.body, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className='w-80 flex-shrink-0'>
        <AssertionsPanel
          assertions={assertions}
          onRemoveAssertion={handleRemoveAssertion}
        />
      </div>

      <AssertionModal
        fieldPath={activeFieldPath}
        fieldValue={activeFieldValue}
        isOpen={showAssertionModal}
        onSelect={handleAssertionSelect}
        onClose={handleModalClose}
      />
    </div>
  );
};

export default ResponseViewer;
