'use client';

/**
 * AssertionModal — Redesigned for clarity, accessibility, and mobile-first UX.
 *
 * Tabs:
 *  • Suggested  → toggle-card select/deselect; no form inputs
 *  • Manual     → add custom assertions with type + value; inline edit/delete list
 *  • General    → global assertions (status, response-time, payload-size, contains);
 *                 inline edit/delete with current values shown
 *
 * Accent colour: #136fb0  (matches existing Extract buttons)
 */

import type React from 'react';
import { useState, useEffect, useRef } from 'react';
import {
  X,
  CheckCircle,
  Plus,
  Trash2,
  Pencil,
  Check,
  Info,
  ChevronDown,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { Assertion } from './ResponseViewer';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AssertionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: string, config?: any) => void;
  fieldPath: string;
  fieldValue: any;
  allAssertions: Assertion[];
  variables?: Array<{ name: string; value: string }>;
  dynamicVariables?: Array<{ name: string; value: string }>;
  setAssertions: (assertions: Assertion[]) => void;
  onRedirectToTab?: (tabName: string) => void;
  onSave?: () => Promise<void>;
}

type ModalTab = 'suggested' | 'manual' | 'general';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getValueType(value: any): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

function getSuggestedAssertions(
  path: string,
  value: any,
  allAssertions: Assertion[],
): Array<{ id: string; type: string; description: string; hint: string }> {
  const vType = getValueType(value);
  const base = [
    {
      id: `sug-exists-${path}`,
      type: 'field_exists',
      description: `"${path}" exists in the response`,
      hint: 'Checks that the field is present',
    },
    {
      id: `sug-notnull-${path}`,
      type: 'field_not_null',
      description: `"${path}" is not null`,
      hint: 'Ensures the field has a non-null value',
    },
  ];

  if (vType === 'string') {
    base.push(
      {
        id: `sug-eq-${path}`,
        type: 'field_equals',
        description: `"${path}" equals "${value}"`,
        hint: 'Strict equality check against current value',
      },
      {
        id: `sug-notempty-${path}`,
        type: 'field_not_empty',
        description: `"${path}" is not empty`,
        hint: 'Checks that the string is non-empty',
      },
    );
  }

  if (vType === 'number') {
    base.push(
      {
        id: `sug-eq-${path}`,
        type: 'field_equals',
        description: `"${path}" equals ${value}`,
        hint: 'Strict equality check against current value',
      },
      {
        id: `sug-pos-${path}`,
        type: 'field_greater_than',
        description: `"${path}" is greater than 0`,
        hint: 'Checks the number is positive',
      },
    );
  }

  if (vType === 'boolean') {
    base.push({
      id: `sug-bool-${path}`,
      type: 'field_equals',
      description: `"${path}" is ${value}`,
      hint: 'Checks the boolean equals its current value',
    });
  }

  if (vType === 'array') {
    base.push(
      {
        id: `sug-arr-notempty-${path}`,
        type: 'array_not_empty',
        description: `"${path}" array is not empty`,
        hint: 'Ensures the array has at least one element',
      },
      {
        id: `sug-arr-len-${path}`,
        type: 'array_length',
        description: `"${path}" array has ${(value as any[]).length} items`,
        hint: 'Checks current array length',
      },
    );
  }

  return base;
}

function isSuggestedActive(
  sugId: string,
  sugType: string,
  path: string,
  allAssertions: Assertion[],
): boolean {
  return allAssertions.some(
    (a) =>
      a.enabled &&
      (a.id === sugId ||
        (a.type === sugType && (a.field === path || a.path === path))),
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: string }) {
  const colours: Record<string, string> = {
    string:
      'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    number:
      'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    boolean:
      'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
    array: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    object: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
    null: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
  };
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide ${colours[type] ?? colours.null}`}
    >
      {type}
    </span>
  );
}

function TogglePill({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type='button'
          role='switch'
          aria-checked={checked}
          aria-label={label}
          onClick={onChange}
          className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent
            transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#136fb0]
            ${checked ? 'bg-[#136fb0]' : 'bg-[#b0bec5] dark:bg-gray-600'}`}
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow
              transition duration-200 ease-in-out ${checked ? 'translate-x-4' : 'translate-x-0'}`}
          />
        </button>
      </TooltipTrigger>
      <TooltipContent side='top'>
        {checked ? 'Disable assertion' : 'Enable assertion'}
      </TooltipContent>
    </Tooltip>
  );
}

// ─── Suggested Tab ────────────────────────────────────────────────────────────

function SuggestedTab({
  fieldPath,
  fieldValue,
  allAssertions,
  onToggle,
}: {
  fieldPath: string;
  fieldValue: any;
  allAssertions: Assertion[];
  onToggle: (
    sug: { id: string; type: string; description: string },
    active: boolean,
  ) => void;
}) {
  const suggestions = getSuggestedAssertions(
    fieldPath,
    fieldValue,
    allAssertions,
  );

  if (suggestions.length === 0) {
    return (
      <EmptyState
        icon='🔍'
        title='No suggestions available'
        body='No auto-suggestions could be generated for this field type.'
      />
    );
  }

  return (
    <div className='space-y-2'>
      <p className='text-xs text-gray-500 dark:text-gray-400 mb-3 flex items-start gap-1.5'>
        <Info className='w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-[#136fb0]' />
        Toggle assertions on or off. Active ones will be saved when you close.
      </p>

      {suggestions.map((sug) => {
        const active = isSuggestedActive(
          sug.id,
          sug.type,
          fieldPath,
          allAssertions,
        );
        return (
          <div
            key={sug.id}
            className={`flex items-center justify-between gap-3 p-3 rounded-lg border transition-all overflow-hidden
              ${
                active
                  ? 'border-[#136fb0] bg-blue-50 dark:bg-blue-950/30'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
          >
            <div className='flex-1 min-w-0'>
              <p className='text-sm font-medium text-gray-800 dark:text-gray-200 leading-snug truncate'>
                {sug.description}
              </p>
              <p className='text-xs text-gray-500 dark:text-gray-400 mt-0.5'>
                {sug.hint}
              </p>
            </div>
            <TogglePill
              checked={active}
              onChange={() => onToggle(sug, active)}
              label={sug.description}
            />
          </div>
        );
      })}
    </div>
  );
}

// ─── Manual Tab ───────────────────────────────────────────────────────────────

type ManualOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'greater_than'
  | 'less_than'
  | 'array_length';

const MANUAL_OPERATORS: Array<{
  value: ManualOperator;
  label: string;
  forTypes: string[];
}> = [
  {
    value: 'equals',
    label: 'equals',
    forTypes: ['string', 'number', 'boolean', 'null'],
  },
  {
    value: 'not_equals',
    label: 'does not equal',
    forTypes: ['string', 'number', 'boolean'],
  },
  { value: 'contains', label: 'contains', forTypes: ['string'] },
  { value: 'not_contains', label: 'does not contain', forTypes: ['string'] },
  { value: 'greater_than', label: 'is greater than', forTypes: ['number'] },
  { value: 'less_than', label: 'is less than', forTypes: ['number'] },
  { value: 'array_length', label: 'has length', forTypes: ['array'] },
];

interface ManualAssertion {
  id: string;
  operator: ManualOperator;
  expectedValue: string;
  description: string;
}

function ManualTab({
  fieldPath,
  fieldValue,
  allAssertions,
  setAssertions,
}: {
  fieldPath: string;
  fieldValue: any;
  allAssertions: Assertion[];
  setAssertions: (a: Assertion[]) => void;
}) {
  const vType = getValueType(fieldValue);
  const availableOps = MANUAL_OPERATORS.filter((o) =>
    o.forTypes.includes(vType),
  );

  const [operator, setOperator] = useState<ManualOperator>(
    availableOps[0]?.value ?? 'equals',
  );
  const [expectedValue, setExpectedValue] = useState('');
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editOp, setEditOp] = useState<ManualOperator>('equals');
  const [editVal, setEditVal] = useState('');

  const fieldAssertions = allAssertions.filter(
    (a) =>
      a.category === 'manual' ||
      (a.field === fieldPath && a.id?.toString().startsWith('manual-')),
  );

  const handleAdd = () => {
    if (!expectedValue.trim()) {
      setError('Please enter an expected value.');
      return;
    }
    setError('');
    const op = MANUAL_OPERATORS.find((o) => o.value === operator);
    const desc = `"${fieldPath}" ${op?.label ?? operator} "${expectedValue}"`;
    const newAssertion: Assertion = {
      id: `manual-${Date.now()}`,
      type: operator,
      displayType: operator,
      category: 'manual',
      description: desc,
      field: fieldPath,
      path: fieldPath,
      value: fieldValue,
      expectedValue,
      enabled: true,
      operator,
    };
    setAssertions([...allAssertions, newAssertion]);
    setExpectedValue('');
  };

  const handleDelete = (id: string | number) => {
    setAssertions(allAssertions.filter((a) => a.id !== id));
  };

  const startEdit = (a: Assertion) => {
    setEditingId(String(a.id));
    setEditOp((a.operator as ManualOperator) ?? 'equals');
    setEditVal(String(a.expectedValue ?? a.value ?? ''));
  };

  const saveEdit = (id: string | number) => {
    const op = MANUAL_OPERATORS.find((o) => o.value === editOp);
    const desc = `"${fieldPath}" ${op?.label ?? editOp} "${editVal}"`;
    setAssertions(
      allAssertions.map((a) =>
        a.id === id
          ? {
              ...a,
              operator: editOp,
              expectedValue: editVal,
              description: desc,
            }
          : a,
      ),
    );
    setEditingId(null);
  };

  return (
    <div className='space-y-4'>
      {/* Add form */}
      <div className='rounded-lg border border-dashed border-[#136fb0]/50 bg-blue-50/50 dark:bg-blue-950/20 p-3 space-y-3'>
        <p className='text-xs font-semibold text-[#136fb0] uppercase tracking-wider'>
          New Assertion
        </p>

        <div className='flex flex-col sm:flex-row gap-2 min-w-0'>
          <div className='relative flex-shrink-0 sm:w-44'>
            <select
              value={operator}
              onChange={(e) => setOperator(e.target.value as ManualOperator)}
              className='w-full appearance-none bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700
                rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-200
                focus:outline-none focus:ring-2 focus:ring-[#136fb0] pr-8'
            >
              {availableOps.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <ChevronDown className='pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
          </div>

          <input
            type={vType === 'number' ? 'number' : 'text'}
            value={expectedValue}
            onChange={(e) => {
              setExpectedValue(e.target.value);
              if (error) setError('');
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder='Expected value…'
            className='flex-1 min-w-0 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700
  rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-200
  focus:outline-none focus:ring-2 focus:ring-[#136fb0] placeholder-gray-400'
          />

          <button
            type='button'
            onClick={handleAdd}
            className='flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-[#136fb0] hover:bg-[#0f5d97] text-white
  rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#136fb0] focus:ring-offset-1'
          >
            <Plus className='w-4 h-4' />
            <span className='whitespace-nowrap'>Add</span>
          </button>
        </div>

        {error && <p className='text-xs text-red-500'>{error}</p>}
      </div>

      {/* Existing manual assertions */}
      {fieldAssertions.length === 0 ? (
        <p className='text-sm text-center text-gray-400 dark:text-gray-500 py-4'>
          No manual assertions yet — add one above.
        </p>
      ) : (
        <div className='space-y-2'>
          <p className='text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
            Added ({fieldAssertions.length})
          </p>
          {fieldAssertions.map((a) => {
            const isEditing = editingId === String(a.id);
            return (
              <div
                key={a.id}
                className='border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-white dark:bg-gray-900'
              >
                {isEditing ? (
                  <div className='flex flex-col sm:flex-row gap-2'>
                    <div className='relative flex-shrink-0 sm:w-44'>
                      <select
                        value={editOp}
                        onChange={(e) =>
                          setEditOp(e.target.value as ManualOperator)
                        }
                        className='w-full appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700
                          rounded-lg px-3 py-1.5 text-sm text-gray-800 dark:text-gray-200
                          focus:outline-none focus:ring-2 focus:ring-[#136fb0] pr-8'
                      >
                        {availableOps.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className='pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
                    </div>
                    <input
                      type='text'
                      value={editVal}
                      onChange={(e) => setEditVal(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && saveEdit(a.id)}
                      className='flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700
                        rounded-lg px-3 py-1.5 text-sm text-gray-800 dark:text-gray-200
                        focus:outline-none focus:ring-2 focus:ring-[#136fb0]'
                    />
                    <div className='flex gap-1'>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type='button'
                            onClick={() => saveEdit(a.id)}
                            className='p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors'
                          >
                            <Check className='w-4 h-4' />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side='top'>Save</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type='button'
                            onClick={() => setEditingId(null)}
                            className='p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors'
                          >
                            <X className='w-4 h-4' />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side='top'>Cancel</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                ) : (
                  <div className='flex items-center justify-between gap-2'>
                    <p className='text-sm text-gray-700 dark:text-gray-300 leading-snug flex-1 min-w-0'>
                      {a.description}
                    </p>
                    <div className='flex gap-1 flex-shrink-0'>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type='button'
                            onClick={() => startEdit(a)}
                            className='p-1.5 text-gray-400 hover:text-[#136fb0] hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors'
                          >
                            <Pencil className='w-3.5 h-3.5' />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side='top'>
                          Edit assertion
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type='button'
                            onClick={() => handleDelete(a.id)}
                            className='p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors'
                          >
                            <Trash2 className='w-3.5 h-3.5' />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side='top'>
                          Delete assertion
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── General Tab ──────────────────────────────────────────────────────────────

type GeneralType =
  | 'status_equals'
  | 'response_time'
  | 'payload_size'
  | 'contains_text';

const GENERAL_TEMPLATES: Array<{
  type: GeneralType;
  label: string;
  hint: string;
  defaultValue: string;
  unit?: string;
  hasComparison?: boolean;
}> = [
  {
    type: 'status_equals',
    label: 'Status code equals',
    hint: 'e.g. 200, 201, 404',
    defaultValue: '200',
  },
  {
    type: 'response_time',
    label: 'Response time',
    hint: 'Milliseconds',
    defaultValue: '500',
    unit: 'ms',
    hasComparison: true,
  },
  {
    type: 'payload_size',
    label: 'Payload size',
    hint: 'Kilobytes',
    defaultValue: '100',
    unit: 'KB',
    hasComparison: true,
  },
  {
    type: 'contains_text',
    label: 'Response body contains',
    hint: 'Any text string',
    defaultValue: '',
  },
];

function GeneralTab({
  allAssertions,
  setAssertions,
}: {
  allAssertions: Assertion[];
  setAssertions: (a: Assertion[]) => void;
}) {
  const generalAssertions = allAssertions.filter(
    (a) =>
      a.isGeneral ||
      [
        'status_equals',
        'response_time',
        'payload_size',
        'contains_text',
        'contains',
      ].includes(a.type),
  );

  const [addingType, setAddingType] = useState<GeneralType | null>(null);
  const [addValue, setAddValue] = useState('');
  const [addComparison, setAddComparison] = useState<'less' | 'greater'>(
    'less',
  );
  const [addError, setAddError] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editComparison, setEditComparison] = useState<'less' | 'greater'>(
    'less',
  );

  const startAdd = (type: GeneralType) => {
    setAddingType(type);
    const tpl = GENERAL_TEMPLATES.find((t) => t.type === type);
    setAddValue(tpl?.defaultValue ?? '');
    setAddComparison('less');
    setAddError('');
  };

  const confirmAdd = () => {
    if (!addValue.trim()) {
      setAddError('Please enter a value.');
      return;
    }
    setAddError('');
    let description = '';
    if (addingType === 'status_equals') {
      description = `Response status should be ${addValue}`;
    } else if (addingType === 'response_time') {
      description = `Response time should be ${addComparison === 'less' ? 'less than' : 'more than'} ${addValue}ms`;
    } else if (addingType === 'payload_size') {
      description = `Payload size should be ${addComparison === 'less' ? 'less than' : 'more than'} ${addValue}KB`;
    } else if (addingType === 'contains_text') {
      description = `Response body should contain: "${addValue}"`;
    }

    const newA: Assertion = {
      id: `general-${Date.now()}`,
      type: addingType!,
      displayType: addingType!,
      category: 'general',
      description,
      isGeneral: true,
      enabled: true,
      value: addValue,
      expectedValue: addValue,
      comparison: addComparison,
    };

    setAssertions([...allAssertions, newA]);
    setAddingType(null);
    setAddValue('');
  };

  const handleDelete = (id: string | number) => {
    setAssertions(allAssertions.filter((a) => a.id !== id));
  };

  const startEdit = (a: Assertion) => {
    setEditingId(String(a.id));
    setEditValue(String(a.expectedValue ?? a.value ?? ''));
    setEditComparison((a.comparison as 'less' | 'greater') ?? 'less');
  };

  const saveEdit = (a: Assertion) => {
    let description = a.description;
    if (a.type === 'status_equals') {
      description = `Response status should be ${editValue}`;
    } else if (a.type === 'response_time') {
      description = `Response time should be ${editComparison === 'less' ? 'less than' : 'more than'} ${editValue}ms`;
    } else if (a.type === 'payload_size') {
      description = `Payload size should be ${editComparison === 'less' ? 'less than' : 'more than'} ${editValue}KB`;
    } else if (a.type === 'contains_text' || a.type === 'contains') {
      description = `Response body should contain: "${editValue}"`;
    }
    setAssertions(
      allAssertions.map((x) =>
        x.id === a.id
          ? {
              ...x,
              expectedValue: editValue,
              value: editValue,
              comparison: editComparison,
              description,
            }
          : x,
      ),
    );
    setEditingId(null);
  };

  const hasComparison = (type: string) =>
    type === 'response_time' || type === 'payload_size';

  return (
    <div className='space-y-4'>
      {/* Quick-add chips */}
      <div>
        <p className='text-xs text-gray-500 dark:text-gray-400 mb-2 flex items-start gap-1.5'>
          <Info className='w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-[#136fb0]' />
          Global assertions that apply to the entire response, not a specific
          field.
        </p>
        <div className='flex flex-wrap gap-2'>
          {GENERAL_TEMPLATES.map((tpl) => (
            <button
              key={tpl.type}
              type='button'
              onClick={() => startAdd(tpl.type)}
              disabled={addingType === tpl.type}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full border text-sm font-medium transition-colors
                ${
                  addingType === tpl.type
                    ? 'border-[#136fb0] bg-[#136fb0] text-white'
                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-[#136fb0] hover:text-[#136fb0] dark:hover:text-[#136fb0]'
                }`}
            >
              <Plus className='w-3.5 h-3.5' />
              {tpl.label}
            </button>
          ))}
        </div>
      </div>

      {/* Inline add form */}
      {addingType &&
        (() => {
          const tpl = GENERAL_TEMPLATES.find((t) => t.type === addingType)!;
          return (
            <div className='rounded-lg border border-dashed border-[#136fb0]/50 bg-blue-50/50 dark:bg-blue-950/20 p-3 space-y-2'>
              <p className='text-xs font-semibold text-[#136fb0]'>
                {tpl.label}
              </p>
              <div className='flex flex-col sm:flex-row gap-2'>
                {tpl.hasComparison && (
                  <div className='relative flex-shrink-0 sm:w-36'>
                    <select
                      value={addComparison}
                      onChange={(e) =>
                        setAddComparison(e.target.value as 'less' | 'greater')
                      }
                      className='w-full appearance-none bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700
                      rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-200
                      focus:outline-none focus:ring-2 focus:ring-[#136fb0] pr-8'
                    >
                      <option value='less'>less than</option>
                      <option value='greater'>greater than</option>
                    </select>
                    <ChevronDown className='pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
                  </div>
                )}
                <div className='relative flex-1'>
                  <input
                    type='text'
                    value={addValue}
                    onChange={(e) => {
                      setAddValue(e.target.value);
                      setAddError('');
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && confirmAdd()}
                    placeholder={tpl.hint}
                    className='w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700
                    rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-gray-200
                    focus:outline-none focus:ring-2 focus:ring-[#136fb0] placeholder-gray-400'
                  />
                  {tpl.unit && (
                    <span className='absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400'>
                      {tpl.unit}
                    </span>
                  )}
                </div>
                <div className='flex gap-1'>
                  <button
                    type='button'
                    onClick={confirmAdd}
                    className='px-3 py-2 bg-[#136fb0] hover:bg-[#0f5d97] text-white rounded-lg text-sm font-medium transition-colors'
                  >
                    Add
                  </button>
                  <button
                    type='button'
                    onClick={() => setAddingType(null)}
                    className='px-3 py-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-sm transition-colors'
                  >
                    Cancel
                  </button>
                </div>
              </div>
              {addError && <p className='text-xs text-red-500'>{addError}</p>}
            </div>
          );
        })()}

      {/* List */}
      {generalAssertions.length === 0 ? (
        <p className='text-sm text-center text-gray-400 dark:text-gray-500 py-4'>
          No general assertions yet — add one above.
        </p>
      ) : (
        <div className='space-y-2'>
          <p className='text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
            Active ({generalAssertions.length})
          </p>
          {generalAssertions.map((a) => {
            const isEditing = editingId === String(a.id);
            return (
              <div
                key={a.id}
                className='border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-white dark:bg-gray-900'
              >
                {isEditing ? (
                  <div className='flex flex-col sm:flex-row gap-2'>
                    {hasComparison(a.type) && (
                      <div className='relative flex-shrink-0 sm:w-36'>
                        <select
                          value={editComparison}
                          onChange={(e) =>
                            setEditComparison(
                              e.target.value as 'less' | 'greater',
                            )
                          }
                          className='w-full appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700
                            rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#136fb0] pr-8
                            text-gray-800 dark:text-gray-200'
                        >
                          <option value='less'>less than</option>
                          <option value='greater'>greater than</option>
                        </select>
                        <ChevronDown className='pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
                      </div>
                    )}
                    <input
                      type='text'
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && saveEdit(a)}
                      className='flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700
                        rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#136fb0]
                        text-gray-800 dark:text-gray-200'
                    />
                    <div className='flex gap-1'>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type='button'
                            onClick={() => saveEdit(a)}
                            className='p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg'
                          >
                            <Check className='w-4 h-4' />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side='top'>Save</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type='button'
                            onClick={() => setEditingId(null)}
                            className='p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg'
                          >
                            <X className='w-4 h-4' />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side='top'>Cancel</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                ) : (
                  <div className='flex items-center justify-between gap-2'>
                    <p className='text-sm text-gray-700 dark:text-gray-300 flex-1 min-w-0 leading-snug'>
                      {a.description}
                    </p>
                    <div className='flex gap-1 flex-shrink-0'>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type='button'
                            onClick={() => startEdit(a)}
                            className='p-1.5 text-gray-400 hover:text-[#136fb0] hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors'
                          >
                            <Pencil className='w-3.5 h-3.5' />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side='top'>
                          Edit assertion
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type='button'
                            onClick={() => handleDelete(a.id)}
                            className='p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors'
                          >
                            <Trash2 className='w-3.5 h-3.5' />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side='top'>
                          Delete assertion
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({
  icon,
  title,
  body,
}: {
  icon: string;
  title: string;
  body: string;
}) {
  return (
    <div className='text-center py-10'>
      <span className='text-4xl'>{icon}</span>
      <p className='mt-3 text-sm font-semibold text-gray-700 dark:text-gray-300'>
        {title}
      </p>
      <p className='mt-1 text-xs text-gray-400 dark:text-gray-500 max-w-xs mx-auto'>
        {body}
      </p>
    </div>
  );
}

// ─── Count badge ──────────────────────────────────────────────────────────────

function CountBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span
      className='ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full
      bg-[#136fb0] text-white text-[10px] font-bold leading-none'
    >
      {count}
    </span>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

const AssertionModal: React.FC<AssertionModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  fieldPath,
  fieldValue,
  allAssertions,
  variables = [],
  dynamicVariables = [],
  setAssertions,
  onRedirectToTab,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<ModalTab>('suggested');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab('suggested');
      setSaved(false);
    }
  }, [isOpen, fieldPath]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const vType = getValueType(fieldValue);
  const valuePreview =
    typeof fieldValue === 'object' && fieldValue !== null
      ? JSON.stringify(fieldValue).slice(0, 60) +
        (JSON.stringify(fieldValue).length > 60 ? '…' : '')
      : String(fieldValue ?? 'null').slice(0, 60);

  const suggestedActive = getSuggestedAssertions(
    fieldPath,
    fieldValue,
    allAssertions,
  ).filter((s) =>
    isSuggestedActive(s.id, s.type, fieldPath, allAssertions),
  ).length;

  const manualCount = allAssertions.filter(
    (a) =>
      a.category === 'manual' ||
      (a.field === fieldPath && String(a.id).startsWith('manual-')),
  ).length;

  const generalCount = allAssertions.filter(
    (a) =>
      a.isGeneral ||
      [
        'status_equals',
        'response_time',
        'payload_size',
        'contains_text',
        'contains',
      ].includes(a.type),
  ).length;

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave?.();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const totalSelected = allAssertions.filter((a) => a.enabled).length;

  const TABS: Array<{ id: ModalTab; label: string; count: number }> = [
    { id: 'suggested', label: 'Suggested', count: suggestedActive },
    { id: 'manual', label: 'Manual', count: manualCount },
    { id: 'general', label: 'General', count: generalCount },
  ];

  return (
    <TooltipProvider delayDuration={400}>
      <div
        ref={overlayRef}
        className='fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-[2px] p-0 sm:p-4'
        onClick={(e) => {
          if (e.target === overlayRef.current) onClose();
        }}
        aria-modal='true'
        role='dialog'
        aria-label='Add Assertions'
      >
        <div
          className='
            w-full sm:max-w-lg
            bg-white dark:bg-gray-950
            rounded-t-2xl sm:rounded-2xl
            shadow-2xl
            flex flex-col
            max-h-[92dvh] sm:max-h-[85vh]
            overflow-hidden
            border border-gray-200 dark:border-gray-800
          '
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Header ── */}
          <div className='flex-shrink-0 border-b border-gray-100 dark:border-gray-800'>
            {/* Drag handle (mobile) */}
            <div className='flex justify-center pt-3 pb-1 sm:hidden'>
              <div className='w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-700' />
            </div>

            <div className='flex items-start justify-between px-4 pt-2 sm:pt-4 pb-2 gap-2'>
              <div className='min-w-0 flex-1'>
                <h2 className='text-base font-semibold text-gray-900 dark:text-gray-100 leading-tight'>
                  Add Assertions
                </h2>

                <div className='flex items-center gap-1.5 mt-1 flex-wrap'>
                  <span
                    className='text-xs font-mono text-[#136fb0] font-medium truncate max-w-[160px]'
                    title={fieldPath}
                  >
                    {fieldPath}
                  </span>
                  <TypeBadge type={vType} />
                  <span
                    className='text-xs text-gray-400 font-mono truncate max-w-[120px]'
                    title={valuePreview}
                  >
                    {valuePreview}
                  </span>
                </div>
              </div>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type='button'
                    onClick={onClose}
                    className='flex-shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#136fb0]'
                    aria-label='Close'
                  >
                    <X className='w-4 h-4' />
                  </button>
                </TooltipTrigger>
                <TooltipContent side='left'>Close</TooltipContent>
              </Tooltip>
            </div>

            {/* ── Tab bar ── */}
            <div className='flex px-4'>
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type='button'
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      borderBottom: isActive
                        ? '2px solid #136fb0'
                        : '2px solid transparent',
                      color: isActive ? '#136fb0' : undefined,
                    }}
                    className={`flex items-center gap-0.5 px-3 py-2 text-sm font-medium transition-colors outline-none
                      ${!isActive ? 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300' : ''}`}
                  >
                    {tab.label}
                    <CountBadge count={tab.count} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Body ── */}
          <div className='flex-1 overflow-y-auto overflow-x-hidden p-4 scrollbar-thin'>
            {activeTab === 'suggested' && (
              <SuggestedTab
                fieldPath={fieldPath}
                fieldValue={fieldValue}
                allAssertions={allAssertions}
                onToggle={(sug, active) => {
                  if (active) {
                    setAssertions(
                      allAssertions.map((a) =>
                        a.id === sug.id ||
                        (a.type === sug.type &&
                          (a.field === fieldPath || a.path === fieldPath))
                          ? { ...a, enabled: false }
                          : a,
                      ),
                    );
                  } else {
                    const existing = allAssertions.find(
                      (a) =>
                        a.id === sug.id ||
                        (a.type === sug.type &&
                          (a.field === fieldPath || a.path === fieldPath)),
                    );
                    if (existing) {
                      setAssertions(
                        allAssertions.map((a) =>
                          a.id === existing.id ? { ...a, enabled: true } : a,
                        ),
                      );
                    } else {
                      setAssertions([
                        ...allAssertions,
                        {
                          id: sug.id,
                          type: sug.type,
                          displayType: sug.type,
                          category: 'suggested',
                          description: sug.description,
                          field: fieldPath,
                          path: fieldPath,
                          value: fieldValue,
                          expectedValue: fieldValue,
                          enabled: true,
                        },
                      ]);
                    }
                  }
                }}
              />
            )}

            {activeTab === 'manual' && (
              <ManualTab
                fieldPath={fieldPath}
                fieldValue={fieldValue}
                allAssertions={allAssertions}
                setAssertions={setAssertions}
              />
            )}

            {activeTab === 'general' && (
              <GeneralTab
                allAssertions={allAssertions}
                setAssertions={setAssertions}
              />
            )}
          </div>

          {/* ── Footer ── */}
          <div className='flex-shrink-0 border-t border-gray-100 dark:border-gray-800 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3'>
            <div className='flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400'>
              {totalSelected > 0 ? (
                <>
                  <CheckCircle className='w-3.5 h-3.5 text-green-500 flex-shrink-0' />
                  <span>
                    <span className='font-semibold text-gray-700 dark:text-gray-300'>
                      {totalSelected}
                    </span>{' '}
                    assertion{totalSelected !== 1 ? 's' : ''} active
                  </span>
                </>
              ) : (
                <span>No assertions selected yet</span>
              )}
            </div>

            <div className='flex gap-2 w-full sm:w-auto'>
              <button
                type='button'
                onClick={onClose}
                className='flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400
                  border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800
                  transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#136fb0]'
              >
                Close
              </button>

              {onSave && (
                <button
                  type='button'
                  onClick={handleSave}
                  disabled={saving}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium
                    rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#136fb0] focus-visible:ring-offset-1
                    ${
                      saved
                        ? 'bg-green-500 text-white'
                        : 'bg-[#136fb0] hover:bg-[#0f5d97] text-white disabled:opacity-60 disabled:cursor-not-allowed'
                    }`}
                >
                  {saved ? (
                    <>
                      <CheckCircle className='w-4 h-4' />
                      Saved!
                    </>
                  ) : saving ? (
                    <>
                      <span className='w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin' />
                      Saving…
                    </>
                  ) : (
                    'Save Assertions'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default AssertionModal;
