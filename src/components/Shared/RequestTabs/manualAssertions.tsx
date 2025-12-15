import React, { useState } from 'react';
import { Plus, X, AlertCircle } from 'lucide-react';

interface ManualAssertionBuilderProps {
  onAdd: (assertion: any) => void;
  responseData: any;
  onClose: () => void;
}

const ManualAssertionBuilder: React.FC<ManualAssertionBuilderProps> = ({
  onAdd,
  responseData,
  onClose,
}) => {
  const [assertion, setAssertion] = useState({
    field: '',
    operator: 'equals',
    expectedValue: '',
    category: 'custom',
    description: '',
  });

  const [fieldSuggestions, setFieldSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Extract all possible fields from response data
  const extractFields = (obj: any, prefix = ''): string[] => {
    const fields: string[] = [];

    if (!obj || typeof obj !== 'object') return fields;

    for (const key in obj) {
      const path = prefix ? `${prefix}.${key}` : key;
      fields.push(path);

      if (
        typeof obj[key] === 'object' &&
        obj[key] !== null &&
        !Array.isArray(obj[key])
      ) {
        fields.push(...extractFields(obj[key], path));
      }
    }

    return fields;
  };

  const availableFields = responseData
    ? extractFields(responseData.data || responseData.body)
    : [];

  const operators = [
    { value: 'equals', label: 'Equals (==)' },
    { value: 'not_equals', label: 'Not Equals (!=)' },
    { value: 'contains', label: 'Contains' },
    { value: 'not_contains', label: 'Does Not Contain' },
    { value: 'greater_than', label: 'Greater Than (>)' },
    { value: 'greater_than_or_equal', label: 'Greater Than or Equal (>=)' },
    { value: 'less_than', label: 'Less Than (<)' },
    { value: 'less_than_or_equal', label: 'Less Than or Equal (<=)' },
    { value: 'between', label: 'Between (Range)' },
    { value: 'matches_regex', label: 'Matches Regex' },
    { value: 'is_null', label: 'Is Null' },
    { value: 'is_not_null', label: 'Is Not Null' },
    { value: 'is_empty', label: 'Is Empty' },
    { value: 'is_not_empty', label: 'Is Not Empty' },
  ];

  const categories = [
    { value: 'custom', label: 'Custom' },
    { value: 'status', label: 'Status' },
    { value: 'headers', label: 'Headers' },
    { value: 'body', label: 'Body' },
    { value: 'performance', label: 'Performance' },
    { value: 'security', label: 'Security' },
  ];

  const handleFieldChange = (value: string) => {
    setAssertion({ ...assertion, field: value });

    if (value.length > 0) {
      const filtered = availableFields.filter((field) =>
        field.toLowerCase().includes(value.toLowerCase())
      );
      setFieldSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (field: string) => {
    setAssertion({ ...assertion, field });
    setShowSuggestions(false);
  };

  const handleAdd = () => {
    if (!assertion.field || !assertion.operator) {
      alert('Please fill in required fields');
      return;
    }

    onAdd({
      id: `manual-${Date.now()}`,
      category: assertion.category,
      type: 'custom',
      description:
        assertion.description ||
        `${assertion.field} ${assertion.operator} ${assertion.expectedValue}`,
      field: assertion.field,
      operator: assertion.operator,
      expectedValue: assertion.expectedValue,
      enabled: true,
      priority: 'Medium',
      impact: 'User-defined validation',
      group: 'custom',
    });
  };

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto'>
        <div className='sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between'>
          <h3 className='text-xl font-semibold text-gray-900 dark:text-white'>
            Add Manual Assertion
          </h3>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors'
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        <div className='p-6 space-y-6'>
          {/* Info Banner */}
          <div className='bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-start gap-3'>
            <AlertCircle className='w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5' />
            <div className='text-sm text-blue-800 dark:text-blue-200'>
              <p className='font-medium mb-1'>
                Create custom assertions for your API responses
              </p>
              <p className='text-blue-700 dark:text-blue-300'>
                Define validation rules to ensure your API behaves as expected.
              </p>
            </div>
          </div>

          {/* Category Selection */}
          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
              Category
            </label>
            <select
              value={assertion.category}
              onChange={(e) =>
                setAssertion({ ...assertion, category: e.target.value })
              }
              className='w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Field Selection with Autocomplete */}
          <div className='relative'>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
              Field Path <span className='text-red-500'>*</span>
            </label>
            <input
              type='text'
              value={assertion.field}
              onChange={(e) => handleFieldChange(e.target.value)}
              placeholder='e.g., data.user.id or status'
              className='w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            />

            {/* Suggestions Dropdown */}
            {showSuggestions && fieldSuggestions.length > 0 && (
              <div className='absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-48 overflow-y-auto'>
                {fieldSuggestions.slice(0, 10).map((field, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectSuggestion(field)}
                    className='w-full text-left px-3 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-sm text-gray-700 dark:text-gray-300'
                  >
                    {field}
                  </button>
                ))}
              </div>
            )}

            <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
              Use dot notation for nested fields (e.g., user.profile.name)
            </p>
          </div>

          {/* Operator Selection */}
          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
              Operator <span className='text-red-500'>*</span>
            </label>
            <select
              value={assertion.operator}
              onChange={(e) =>
                setAssertion({ ...assertion, operator: e.target.value })
              }
              className='w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            >
              {operators.map((op) => (
                <option key={op.value} value={op.value}>
                  {op.label}
                </option>
              ))}
            </select>
          </div>

          {/* Expected Value */}
          {!['is_null', 'is_not_null', 'is_empty', 'is_not_empty'].includes(
            assertion.operator
          ) && (
            <div>
              <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                Expected Value
              </label>
              {assertion.operator === 'between' ? (
                <div className='grid grid-cols-2 gap-3'>
                  <input
                    type='text'
                    placeholder='Min value'
                    onChange={(e) => {
                      const [_, max] = assertion.expectedValue?.split(',') || [
                        '',
                        '',
                      ];
                      setAssertion({
                        ...assertion,
                        expectedValue: `${e.target.value},${max}`,
                      });
                    }}
                    className='border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  />
                  <input
                    type='text'
                    placeholder='Max value'
                    onChange={(e) => {
                      const [min] = assertion.expectedValue?.split(',') || [''];
                      setAssertion({
                        ...assertion,
                        expectedValue: `${min},${e.target.value}`,
                      });
                    }}
                    className='border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  />
                </div>
              ) : (
                <input
                  type='text'
                  value={assertion.expectedValue}
                  onChange={(e) =>
                    setAssertion({
                      ...assertion,
                      expectedValue: e.target.value,
                    })
                  }
                  placeholder='Enter expected value'
                  className='w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                />
              )}
            </div>
          )}

          {/* Description */}
          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
              Description (Optional)
            </label>
            <textarea
              value={assertion.description}
              onChange={(e) =>
                setAssertion({ ...assertion, description: e.target.value })
              }
              placeholder='Describe what this assertion validates...'
              rows={3}
              className='w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            />
          </div>

          {/* Preview */}
          <div className='bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700'>
            <h4 className='text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
              Preview
            </h4>
            <div className='text-sm text-gray-600 dark:text-gray-400 space-y-1'>
              <p>
                <span className='font-medium'>Field:</span>{' '}
                {assertion.field || '(not set)'}
              </p>
              <p>
                <span className='font-medium'>Operator:</span>{' '}
                {operators.find((o) => o.value === assertion.operator)?.label}
              </p>
              <p>
                <span className='font-medium'>Expected:</span>{' '}
                {assertion.expectedValue || '(not set)'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className='sticky bottom-0 bg-gray-50 dark:bg-gray-900 px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3'>
          <button
            onClick={onClose}
            className='px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors'
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            className='px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center gap-2 transition-colors'
          >
            <Plus className='w-4 h-4' />
            Add Assertion
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManualAssertionBuilder;
