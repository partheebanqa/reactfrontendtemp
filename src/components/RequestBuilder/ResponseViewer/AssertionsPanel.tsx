'use client';

import { Activity, Shield, Trash2 } from 'lucide-react';
import type { Assertion } from './ResponseViewer';

export function AssertionsPanel({
  assertions,
  onRemoveAssertion,
}: {
  assertions: Assertion[];
  onRemoveAssertion: (id: number) => void;
}) {
  const getAssertionLabel = (assertion: Assertion): string => {
    const typeToUse = assertion.displayType || assertion.type;

    if (assertion.isGeneral) {
      switch (typeToUse) {
        case 'response_time':
          return `Response Time ${assertion.comparison || 'less'} than ${
            assertion.expectedTime
          }ms`;
        case 'payload_size':
          return `Payload Size ${assertion.comparison || 'less'} than ${
            assertion.expectedSize
          }KB`;
        case 'status_equals':
          return `Status Code: ${assertion.value}`;
        case 'contains_text':
          return `Contains Text: "${assertion.value}"`;
        case 'contains_number':
          return `Contains Number: ${assertion.value}`;
        case 'contains_boolean':
          return `Contains Boolean: ${assertion.value}`;
        case 'contains_static':
          return `Contains Static: ${assertion.value}`;
        case 'contains_dynamic':
          return `Contains Dynamic: ${assertion.value}`;
        case 'contains_extracted':
          return `Contains Extracted: ${assertion.value}`;
        default:
          return typeToUse;
      }
    }

    switch (typeToUse) {
      case 'exists':
        return 'Field exists';
      case 'field_not_present':
        return 'Field not present';
      case 'data-type':
        return `Type is ${assertion.expectedType}`;
      case 'field_not_null':
        return 'Not null';
      case 'is-array':
        return 'Is array';
      case 'manual':
        return `${getOperatorLabel(assertion.operator!)} ${assertion.value}`;
      default:
        return typeToUse;
    }
  };

  const getOperatorLabel = (op: string): string => {
    const operators: { [key: string]: string } = {
      equals: '=',
      field_not_equals: '≠',
      field_greater_than: '>',
      field_less_than: '<',
      contains: 'contains',
      field_not_contains: 'not contains',
      array_length: 'length',
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
                      assertion.type === 'manual'
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 hover:border-indigo-300'
                        : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 hover:border-blue-300';
                    const textColor =
                      assertion.type === 'manual'
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
