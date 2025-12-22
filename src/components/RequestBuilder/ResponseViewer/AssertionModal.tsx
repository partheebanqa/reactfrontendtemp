import {
  Activity,
  CheckCircle,
  Clock,
  Code,
  Code2,
  HardDrive,
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
}: {
  fieldPath: string;
  fieldValue: any;
  isOpen: boolean;
  onSelect: (assertionType: string, config?: any) => void;
  onClose: () => void;
  allAssertions?: any[];
}) {
  const [activeTab, setActiveTab] = useState<
    'suggested' | 'manual' | 'general'
  >('suggested');
  const [selectedOperator, setSelectedOperator] = useState<string>('equals');
  const [manualValue, setManualValue] = useState('');
  const [generalType, setGeneralType] = useState<string>('');
  const [generalValue, setGeneralValue] = useState<string>('');
  const [generalComparison, setGeneralComparison] = useState<string>('less');

  console.log('selectedOperator123:', selectedOperator);
  console.log('manualValue123:', manualValue);

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

  // Filter assertions from assertionManager that match this specific field
  const suggestedAssertions = allAssertions
    .filter((assertion) => {
      // Only show body category assertions that match the current field path
      return assertion.category === 'body' && assertion.field === fieldPath;
    })
    .map((assertion) => {
      // Map assertion types to display format
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
        assertion, // Keep original assertion for selection
      };
    });

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

  const getValueType = (value: any): string => {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value;
  };

  const valueType = getValueType(fieldValue);
  const isArray = Array.isArray(fieldValue);

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

  const handleSuggestedClick = (assertionItem: any) => {
    // Pass the entire assertion object back
    onSelect('suggested', { assertion: assertionItem.assertion });
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
            onClick={() => setActiveTab('suggested')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${
              activeTab === 'suggested'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-white dark:bg-gray-900'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
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
                  return (
                    <button
                      key={assertionItem.id}
                      onClick={() => handleSuggestedClick(assertionItem)}
                      className='w-full flex items-start gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left group'
                    >
                      <div className='w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 flex items-center justify-center flex-shrink-0 transition-colors'>
                        <Icon className='w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 transition-colors' />
                      </div>
                      <div className='flex-1 min-w-0'>
                        <div className='text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-900 dark:group-hover:text-blue-300'>
                          {assertionItem.label}
                        </div>
                        <div className='text-xs text-gray-500 mt-1'>
                          {assertionItem.description}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
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
        </div>
      </div>
    </div>
  );
}

export default AssertionModal;
