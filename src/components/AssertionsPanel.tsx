import React, { useState } from 'react';
import { Plus, Trash2, ChevronDown } from 'lucide-react';
import { ResponseAssertions, BodyAssertion, AssertionOperator } from '../types';

interface AssertionsPanelProps {
  assertions: ResponseAssertions;
  onChange: (assertions: ResponseAssertions) => void;
  availablePaths?: string[];
}

const OPERATORS: { label: string; value: AssertionOperator }[] = [
  { label: 'Equals', value: 'equals' },
  { label: 'Not Equals', value: 'notEquals' },
  { label: 'Contains', value: 'contains' },
  { label: 'Not Contains', value: 'notContains' },
  { label: 'Exists', value: 'exists' },
  { label: 'Not Exists', value: 'notExists' },
  { label: 'Greater Than', value: 'greaterThan' },
  { label: 'Less Than', value: 'lessThan' },
  { label: 'Matches Regex', value: 'matches' }
];

const AssertionsPanel: React.FC<AssertionsPanelProps> = ({
  assertions,
  onChange,
  availablePaths = []
}) => {
  const [showPathSelector, setShowPathSelector] = useState(false);
  const [selectedAssertion, setSelectedAssertion] = useState<number | null>(null);

  const updateAssertions = (updates: Partial<ResponseAssertions>) => {
    onChange({ ...assertions, ...updates });
  };

  const addBodyAssertion = () => {
    const bodyAssertions = assertions.body || [];
    onChange({
      ...assertions,
      body: [
        ...bodyAssertions,
        { path: '', operator: 'equals', value: '' }
      ]
    });
  };

  const updateBodyAssertion = (index: number, updates: Partial<BodyAssertion>) => {
    const bodyAssertions = [...(assertions.body || [])];
    bodyAssertions[index] = { ...bodyAssertions[index], ...updates };
    onChange({ ...assertions, body: bodyAssertions });
  };

  const removeBodyAssertion = (index: number) => {
    const bodyAssertions = assertions.body?.filter((_, i) => i !== index) || [];
    onChange({ ...assertions, body: bodyAssertions });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Status Code</h3>
        <input
          type="number"
          value={assertions.status || ''}
          onChange={(e) => updateAssertions({ status: parseInt(e.target.value) || undefined })}
          className="w-full text-sm px-2 py-1.5 border border-gray-200 rounded text-black"
          placeholder="Expected status code (e.g., 200)"
        />
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium">Response Time (seconds)</h3>
        <input
          type="number"
          step="0.1"
          value={assertions.responseTime || ''}
          onChange={(e) => updateAssertions({ responseTime: parseFloat(e.target.value) || undefined })}
          className="w-full text-sm px-2 py-1.5 border border-gray-200 rounded text-black"
          placeholder="Maximum response time in seconds"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Headers</h3>
          <button
            onClick={() => updateAssertions({ headers: { ...assertions.headers, '': '' } })}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <Plus size={14} />
            Add Header
          </button>
        </div>
        <div className="space-y-2">
          {Object.entries(assertions.headers || {}).map(([key, value], index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="text"
                value={key}
                onChange={(e) => {
                  const newHeaders = { ...assertions.headers };
                  delete newHeaders[key];
                  newHeaders[e.target.value] = value;
                  updateAssertions({ headers: newHeaders });
                }}
                className="flex-1 text-sm px-2 py-1.5 border border-gray-200 rounded text-black"
                placeholder="Header name"
              />
              <input
                type="text"
                value={value}
                onChange={(e) => {
                  updateAssertions({
                    headers: { ...assertions.headers, [key]: e.target.value }
                  });
                }}
                className="flex-1 text-sm px-2 py-1.5 border border-gray-200 rounded text-black"
                placeholder="Expected value"
              />
              <button
                onClick={() => {
                  const newHeaders = { ...assertions.headers };
                  delete newHeaders[key];
                  updateAssertions({ headers: newHeaders });
                }}
                className="text-red-500 hover:text-red-600"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Body Assertions</h3>
          <button
            onClick={addBodyAssertion}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <Plus size={14} />
            Add Assertion
          </button>
        </div>
        <div className="space-y-2">
          {assertions.body?.map((assertion, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={assertion.path}
                  onClick={() => {
                    setSelectedAssertion(index);
                    setShowPathSelector(true);
                  }}
                  className="w-full text-sm px-2 py-1.5 border border-gray-200 rounded cursor-pointer"
                  placeholder="Select JSON path"
                  readOnly
                />
                {showPathSelector && selectedAssertion === index && availablePaths.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {availablePaths.map((path) => (
                      <button
                        key={path}
                        onClick={() => {
                          updateBodyAssertion(index, { path });
                          setShowPathSelector(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                      >
                        {path}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <select
                value={assertion.operator}
                onChange={(e) => updateBodyAssertion(index, { operator: e.target.value as AssertionOperator })}
                className="text-sm px-2 py-1.5 border border-gray-200 rounded bg-[var(--bg-primary)] text-[var(--text-primary)]"
              >
                {OPERATORS.map(op => (
                  <option key={op.value} value={op.value}>{op.label}</option>
                ))}
              </select>
              {assertion.operator !== 'exists' && assertion.operator !== 'notExists' && (
                <input
                  type="text"
                  value={assertion.value}
                  onChange={(e) => updateBodyAssertion(index, { value: e.target.value })}
                  className="flex-1 text-sm px-2 py-1.5 border border-gray-200 rounded text-black"
                  placeholder="Expected value"
                />
              )}
              <button
                onClick={() => removeBodyAssertion(index)}
                className="text-red-500 hover:text-red-600"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AssertionsPanel;