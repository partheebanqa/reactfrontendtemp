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

const useRequest = () => ({
  responseData: {
    status: 200,
    statusText: 'OK',
    headers: {
      'content-type': 'application/json',
      'cache-control': 'no-cache',
    },
    body: {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      age: 30,
      active: true,
      tags: ['user', 'admin'],
      address: {
        street: '123 Main St',
        city: 'New York',
        zip: '10001',
      },
    },
    metrics: {
      responseTime: 245,
    },
  },
});

interface Assertion {
  id: number;
  type: string;
  path: string;
  value: any;
  operator?: string;
  expectedType?: string;
  originalText?: string;
  isGeneral?: boolean;
  expectedTime?: number;
  expectedSize?: number;
  comparison?: 'less' | 'more';
}

function AssertionModal({ fieldPath, fieldValue, isOpen, onSelect, onClose }) {
  const [activeTab, setActiveTab] = useState('suggested');
  const [selectedOperator, setSelectedOperator] = useState('equals');
  const [manualValue, setManualValue] = useState('');
  const [nlpInput, setNlpInput] = useState('');
  const [nlpParsed, setNlpParsed] = useState(null);
  const [generalType, setGeneralType] = useState('');
  const [generalValue, setGeneralValue] = useState('');
  const [generalComparison, setGeneralComparison] = useState('less');

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getValueType = (val) => {
    if (val === null) return 'null';
    if (Array.isArray(val)) return 'array';
    return typeof val;
  };

  const valueType = getValueType(fieldValue);
  const isArray = Array.isArray(fieldValue);

  const suggestedAssertions = [
    {
      id: 'exists',
      label: 'Field Exists',
      icon: CheckCircle,
      description: 'Assert field exists',
    },
    {
      id: 'not-exists',
      label: 'Field Not Present',
      icon: XCircle,
      description: 'Assert field does not exist',
    },
    {
      id: 'data-type',
      label: 'Check Data Type',
      icon: Type,
      description: `Type: ${valueType}`,
    },
    {
      id: 'not-null',
      label: 'Not Null',
      icon: CheckCircle,
      description: 'Assert not null',
    },
    ...(isArray
      ? [
          {
            id: 'is-array',
            label: 'Is Array',
            icon: List,
            description: 'Assert is array',
          },
        ]
      : []),
  ];

  const operators = [
    { id: 'equals', label: '=' },
    { id: 'not-equals', label: '≠' },
    { id: 'greater-than', label: '>' },
    { id: 'less-than', label: '<' },
    { id: 'contains', label: 'contains' },
    { id: 'not-contains', label: 'not contains' },
    ...(isArray ? [{ id: 'array-length', label: 'length' }] : []),
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

  const handleSuggestedClick = (id) => {
    const config = id === 'data-type' ? { expectedType: valueType } : {};
    onSelect(id, config);
  };

  const handleManualSubmit = () => {
    if (!manualValue) return;
    onSelect('manual', { operator: selectedOperator, value: manualValue });
  };

  const handleNLPSubmit = () => {
    if (!nlpParsed?.parsed || !nlpParsed?.value) return;
    onSelect('nlp', {
      operator: nlpParsed.operator,
      value: nlpParsed.value,
      originalText: nlpInput,
    });
  };

  const handleGeneralClick = (id) => {
    const assertion = generalAssertions.find((a) => a.id === id);
    if (!assertion?.needsInput) {
      onSelect(id, { type: id, isGeneral: true });
    } else {
      setGeneralType(id);
    }
  };

  const handleGeneralSubmit = () => {
    if (!generalType) return;
    const assertion = generalAssertions.find((a) => a.id === generalType);
    if (!assertion || (assertion.needsInput && !generalValue)) return;

    const config = { type: generalType, isGeneral: true };
    if (generalType === 'response-time') {
      config.expectedTime = parseInt(generalValue, 10);
      config.comparison = generalComparison;
    } else if (generalType === 'payload-size') {
      config.expectedSize = parseFloat(generalValue);
      config.comparison = generalComparison;
    } else if (generalType.startsWith('contains-')) {
      config.value = generalValue;
    }

    onSelect(generalType, config);
    setGeneralType('');
    setGeneralValue('');
  };

  return (
    <div
      className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className='bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-gray-200 dark:border-gray-700'
      >
        <div className='p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between'>
          <div>
            <h2 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
              Add Assertion
            </h2>
            <p className='text-xs text-gray-500 mt-1 font-mono'>
              {fieldPath || 'General'}
            </p>
          </div>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-gray-600'
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        <div className='flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'>
          {['suggested', 'manual', 'nlp', 'general'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-3 py-3 text-sm font-medium ${
                activeTab === tab
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-white dark:bg-gray-900'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              <div className='flex items-center justify-center gap-2'>
                {tab === 'suggested' && <CheckCircle className='w-4 h-4' />}
                {tab === 'manual' && <Code2 className='w-4 h-4' />}
                {tab === 'nlp' && <Wand2 className='w-4 h-4' />}
                {tab === 'general' && <Shield className='w-4 h-4' />}
                <span className='capitalize'>
                  {tab === 'nlp' ? 'Plain English' : tab}
                </span>
              </div>
            </button>
          ))}
        </div>

        <div className='flex-1 overflow-y-auto p-6'>
          {activeTab === 'suggested' && (
            <div className='space-y-2'>
              {suggestedAssertions.map((a) => {
                const Icon = a.icon;
                return (
                  <button
                    key={a.id}
                    onClick={() => handleSuggestedClick(a.id)}
                    className='w-full flex gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-left group'
                  >
                    <div className='w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 group-hover:bg-blue-100 flex items-center justify-center'>
                      <Icon className='w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-blue-600' />
                    </div>
                    <div className='flex-1'>
                      <div className='text-sm font-medium text-gray-900 dark:text-gray-100'>
                        {a.label}
                      </div>
                      <div className='text-xs text-gray-500 mt-1'>
                        {a.description}
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
                      className={`px-3 py-2 rounded-lg text-sm font-medium border ${
                        selectedOperator === op.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {op.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className='block text-sm font-semibold mb-2'>
                  Expected Value
                </label>
                <input
                  type='text'
                  value={manualValue}
                  onChange={(e) => setManualValue(e.target.value)}
                  placeholder='Enter value'
                  className='w-full px-4 py-3 border rounded-lg'
                />
              </div>
            </div>
          )}

          {activeTab === 'general' && (
            <div className='space-y-4'>
              {!generalType ? (
                <div className='grid grid-cols-2 gap-3'>
                  {generalAssertions.map((a) => {
                    const Icon = a.icon;
                    return (
                      <button
                        key={a.id}
                        onClick={() => handleGeneralClick(a.id)}
                        className='flex gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:bg-blue-50 text-left group'
                      >
                        <div className='w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 group-hover:bg-blue-100 flex items-center justify-center'>
                          <Icon className='w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-blue-600' />
                        </div>
                        <div className='flex-1'>
                          <div className='text-sm font-medium text-gray-900 dark:text-gray-100'>
                            {a.label}
                          </div>
                          <div className='text-xs text-gray-500'>
                            {a.inputLabel || 'No input needed'}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className='space-y-4'>
                  <div className='flex justify-between'>
                    <h3 className='text-sm font-semibold'>
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
                      <label className='block text-sm font-medium mb-2'>
                        Comparison
                      </label>
                      <div className='flex gap-2'>
                        {['less', 'more'].map((c) => (
                          <button
                            key={c}
                            onClick={() => setGeneralComparison(c)}
                            className={`flex-1 px-4 py-2 text-sm rounded-lg border ${
                              generalComparison === c
                                ? 'bg-blue-50 border-blue-500 text-blue-700'
                                : 'bg-white border-gray-300'
                            }`}
                          >
                            {c === 'less' ? 'Less than' : 'More than'}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <label className='block text-sm font-medium mb-2'>
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
                      className='w-full px-3 py-2 border rounded-lg'
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className='p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex gap-2'>
          <button
            onClick={onClose}
            className='flex-1 px-4 py-2 text-sm font-medium bg-white border rounded-lg'
          >
            Cancel
          </button>
          {activeTab === 'manual' && (
            <button
              onClick={handleManualSubmit}
              disabled={!manualValue}
              className='flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg disabled:opacity-50'
            >
              Add
            </button>
          )}
          {activeTab === 'general' && generalType && (
            <button
              onClick={handleGeneralSubmit}
              disabled={
                generalAssertions.find((a) => a.id === generalType)
                  ?.needsInput && !generalValue
              }
              className='flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg disabled:opacity-50'
            >
              Add
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function AssertionsPanel({ assertions, onRemoveAssertion }) {
  const fieldAssertions = assertions.filter((a) => !a.isGeneral);
  const generalAssertions = assertions.filter((a) => a.isGeneral);

  const getLabel = (a) => {
    switch (a.type) {
      case 'exists':
        return 'Field exists';
      case 'not-exists':
        return 'Field not present';
      case 'data-type':
        return `Type is ${a.expectedType}`;
      case 'not-null':
        return 'Not null';
      case 'is-array':
        return 'Is array';
      case 'response-time':
        return `Response time ${a.comparison === 'less' ? '<' : '>'} ${
          a.expectedTime
        }ms`;
      case 'payload-size':
        return `Payload size ${a.comparison === 'less' ? '<' : '>'} ${
          a.expectedSize
        }KB`;
      case 'status-success':
        return 'Status is 2xx';
      case 'contains-static':
        return `Contains: "${a.value}"`;
      case 'contains-dynamic':
        return `Contains dynamic: ${a.value}`;
      case 'contains-extracted':
        return `Contains extracted: ${a.value}`;
      case 'manual':
        return `${a.operator} ${a.value}`;
      case 'nlp':
        return a.originalText;
      default:
        return a.type;
    }
  };

  return (
    <div className='flex flex-col h-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700'>
      <div className='p-4 border-b border-gray-200 dark:border-gray-700'>
        <h2 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
          Active Assertions
        </h2>
        <p className='text-sm text-gray-500 mt-1'>
          {assertions.length} assertion{assertions.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className='flex-1 overflow-y-auto p-4'>
        {assertions.length === 0 ? (
          <div className='flex flex-col items-center justify-center h-full text-center'>
            <div className='w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4'>
              <Shield className='w-8 h-8 text-gray-400' />
            </div>
            <p className='text-sm font-medium text-gray-900 dark:text-gray-100 mb-1'>
              No assertions yet
            </p>
            <p className='text-xs text-gray-500'>
              Hover over fields to add assertions
            </p>
          </div>
        ) : (
          <div className='space-y-4'>
            {generalAssertions.length > 0 && (
              <div>
                <div className='flex items-center gap-2 mb-2'>
                  <Activity className='w-4 h-4 text-gray-500' />
                  <h3 className='text-xs font-semibold text-gray-600 uppercase'>
                    General
                  </h3>
                </div>
                <div className='space-y-2'>
                  {generalAssertions.map((a) => (
                    <div
                      key={a.id}
                      className='group bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 hover:border-amber-300'
                    >
                      <div className='flex justify-between gap-2'>
                        <div className='text-sm font-medium text-gray-900 dark:text-gray-100'>
                          {getLabel(a)}
                        </div>
                        <button
                          onClick={() => onRemoveAssertion(a.id)}
                          className='opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600'
                        >
                          <Trash2 className='w-4 h-4' />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {fieldAssertions.length > 0 && (
              <div>
                <div className='flex items-center gap-2 mb-2'>
                  <Shield className='w-4 h-4 text-gray-500' />
                  <h3 className='text-xs font-semibold text-gray-600 uppercase'>
                    Field Assertions
                  </h3>
                </div>
                <div className='space-y-2'>
                  {fieldAssertions.map((a) => (
                    <div
                      key={a.id}
                      className='group bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 hover:border-blue-300'
                    >
                      <div className='flex justify-between gap-2'>
                        <div className='flex-1'>
                          <div className='text-xs font-mono text-blue-600 dark:text-blue-400 mb-1 truncate'>
                            {a.path}
                          </div>
                          <div className='text-sm font-medium text-gray-900 dark:text-gray-100'>
                            {getLabel(a)}
                          </div>
                        </div>
                        <button
                          onClick={() => onRemoveAssertion(a.id)}
                          className='opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600'
                        >
                          <Trash2 className='w-4 h-4' />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {assertions.length > 0 && (
        <div className='p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'>
          <button className='w-full px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700'>
            Run All Assertions ({assertions.length})
          </button>
        </div>
      )}
    </div>
  );
}

const ResponseViewer = () => {
  const { responseData } = useRequest();
  const [expandedNodes, setExpandedNodes] = useState(new Set(['root']));
  const [hoveredField, setHoveredField] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [activeField, setActiveField] = useState({ path: '', value: null });
  const [assertions, setAssertions] = useState([]);
  const [idCounter, setIdCounter] = useState(1);

  const parseJson = (obj, parent = 'root', level = 0) => {
    const nodes = [];
    if (obj === null)
      return [
        {
          key: 'null',
          value: null,
          path: parent,
          type: 'null',
          level,
          parentPath: '',
        },
      ];

    const process = (entries) => {
      entries.forEach(([key, val], i) => {
        const path = parent === 'root' ? key : `${parent}.${key}`;
        const type =
          val === null
            ? 'null'
            : Array.isArray(val)
            ? 'array'
            : typeof val === 'object'
            ? 'object'
            : typeof val;
        nodes.push({ key, value: val, path, type, level, parentPath: parent });
        if (typeof val === 'object' && val !== null) {
          nodes.push(...parseJson(val, path, level + 1));
        }
      });
    };

    if (Array.isArray(obj)) {
      obj.forEach((item, i) => {
        const path = parent === 'root' ? `[${i}]` : `${parent}[${i}]`;
        const type =
          item === null
            ? 'null'
            : Array.isArray(item)
            ? 'array'
            : typeof item === 'object'
            ? 'object'
            : typeof item;
        nodes.push({
          key: `[${i}]`,
          value: item,
          path,
          type,
          level,
          parentPath: parent,
        });
        if (typeof item === 'object' && item !== null) {
          nodes.push(...parseJson(item, path, level + 1));
        }
      });
    } else {
      process(Object.entries(obj));
    }
    return nodes;
  };

  const nodes = useMemo(
    () => (responseData?.body ? parseJson(responseData.body) : []),
    [responseData]
  );

  const handleAddClick = (path, value, e) => {
    e.stopPropagation();
    setActiveField({ path, value });
    setShowModal(true);
    setHoveredField(path);
  };

  const handleSelect = (type, config) => {
    const newAssertion = {
      id: idCounter,
      type,
      path: activeField.path,
      value: activeField.value,
      ...config,
    };
    setAssertions((prev) => [...prev, newAssertion]);
    setIdCounter((prev) => prev + 1);
    setShowModal(false);
    setHoveredField(null);
  };

  const renderNode = (node, idx) => {
    const isExpanded = expandedNodes.has(node.path);
    const hasChildren = node.type === 'object' || node.type === 'array';
    const isHovered = hoveredField === node.path;

    const visible = node.level === 0 || expandedNodes.has(node.parentPath);
    if (!visible) return null;

    return (
      <div
        key={node.path}
        className='group hover:bg-gray-50 dark:hover:bg-gray-800 relative'
        onMouseEnter={() => setHoveredField(node.path)}
        onMouseLeave={() => !showModal && setHoveredField(null)}
      >
        <div className='flex items-center py-1 pr-2 font-mono text-sm border-l-2 border-transparent hover:border-blue-500'>
          <div
            className='flex items-center flex-1'
            style={{ marginLeft: `${48 + node.level * 20}px` }}
          >
            {hasChildren && (
              <button
                onClick={() =>
                  setExpandedNodes((prev) => {
                    const next = new Set(prev);
                    next.has(node.path)
                      ? next.delete(node.path)
                      : next.add(node.path);
                    return next;
                  })
                }
                className='p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded mr-1'
              >
                {isExpanded ? (
                  <ChevronDown className='w-3 h-3' />
                ) : (
                  <ChevronRight className='w-3 h-3' />
                )}
              </button>
            )}
            {!hasChildren && <div className='w-5' />}
            <span className='text-blue-600 dark:text-blue-400 font-medium mr-2'>
              {node.key}:
            </span>
            {hasChildren ? (
              <span className='text-gray-600'>
                {node.type === 'array'
                  ? `[${Array.isArray(node.value) ? node.value.length : 0}]`
                  : `{${Object.keys(node.value || {}).length}}`}
              </span>
            ) : (
              <span
                className={
                  node.type === 'string'
                    ? 'text-green-600'
                    : node.type === 'number'
                    ? 'text-purple-600'
                    : node.type === 'boolean'
                    ? 'text-orange-600'
                    : 'text-gray-600'
                }
              >
                {node.type === 'string'
                  ? `"${node.value}"`
                  : String(node.value)}
              </span>
            )}
          </div>
          {isHovered && (
            <button
              onClick={(e) => handleAddClick(node.path, node.value, e)}
              className='px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200'
            >
              + Assert
            </button>
          )}
        </div>
      </div>
    );
  };

  if (!responseData) {
    return (
      <div className='flex h-screen items-center justify-center bg-white dark:bg-gray-900'>
        <div className='text-center'>
          <p className='text-gray-600 dark:text-gray-400 mb-4'>
            No response yet
          </p>
          <p className='text-sm text-gray-500'>
            Send a request to see the response
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='flex h-screen bg-gray-50 dark:bg-gray-950'>
      <div className='flex-1 flex flex-col bg-white dark:bg-gray-900 overflow-hidden'>
        <div className='p-4 border-b border-gray-200 dark:border-gray-700'>
          <div className='flex items-center space-x-4 text-sm'>
            <div className='flex items-center gap-1'>
              <CheckCircle className='h-4 w-4 text-green-600' />
              <span className='font-medium text-green-600'>
                {responseData.status} {responseData.statusText}
              </span>
            </div>
            <div className='flex items-center gap-1'>
              <Clock className='h-4 w-4 text-gray-600' />
              <span className='font-medium'>
                {responseData.metrics?.responseTime}ms
              </span>
            </div>
          </div>
        </div>
        <div className='flex-1 overflow-auto p-4'>
          <div className='bg-white dark:bg-gray-900 border rounded-lg overflow-hidden'>
            {nodes.map((n, i) => renderNode(n, i))}
          </div>
        </div>
      </div>
      <div className='w-80'>
        <AssertionsPanel
          assertions={assertions}
          onRemoveAssertion={(id) =>
            setAssertions((prev) => prev.filter((a) => a.id !== id))
          }
        />
      </div>
      <AssertionModal
        fieldPath={activeField.path}
        fieldValue={activeField.value}
        isOpen={showModal}
        onSelect={handleSelect}
        onClose={() => {
          setShowModal(false);
          setHoveredField(null);
        }}
      />
    </div>
  );
};

export default ResponseViewer;
