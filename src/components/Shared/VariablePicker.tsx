'use client';
import { useState, useMemo } from 'react';

type VariableType = 'static' | 'dynamic' | 'extracted';

interface VariableItem {
  name: string;
  value: string;
  type?: VariableType;
}

interface VariablePickerProps {
  staticVariables?: VariableItem[];
  dynamicVariables?: VariableItem[];
  extractedVariables?: VariableItem[];
  onSelect: (variableName: string) => void;
  bindingLabel?: string;
}

const TYPE_COLORS: Record<
  VariableType,
  { bg: string; border: string; text: string }
> = {
  static: {
    bg: 'rgba(14,165,233,0.15)',
    border: 'rgba(14,165,233,0.3)',
    text: '#7dd3fc',
  },
  dynamic: {
    bg: 'rgba(139,92,246,0.18)',
    border: 'rgba(139,92,246,0.35)',
    text: '#c4b5fd',
  },
  extracted: {
    bg: 'rgba(245,158,11,0.15)',
    border: 'rgba(245,158,11,0.3)',
    text: '#fcd34d',
  },
};

export default function VariablePicker({
  staticVariables = [],
  dynamicVariables = [],
  extractedVariables = [],
  onSelect,
  bindingLabel,
}: VariablePickerProps) {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | VariableType>('all');

  const allVariables: (VariableItem & { type: VariableType })[] = useMemo(
    () => [
      ...staticVariables.map((v) => ({ ...v, type: 'static' as VariableType })),
      ...dynamicVariables.map((v) => ({
        ...v,
        type: 'dynamic' as VariableType,
      })),
      ...extractedVariables.map((v) => ({
        ...v,
        type: 'extracted' as VariableType,
      })),
    ],
    [staticVariables, dynamicVariables, extractedVariables],
  );

  const filtered = useMemo(() => {
    return allVariables.filter((v) => {
      const matchesSearch =
        !search.trim() ||
        v.name.toLowerCase().includes(search.toLowerCase()) ||
        String(v.value ?? '')
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesTab = activeTab === 'all' || v.type === activeTab;

      return matchesSearch && matchesTab;
    });
  }, [allVariables, search, activeTab]);

  return (
    <div
      style={{
        background: '#0f1117',
        border: '1px solid #2d3a52',
        borderRadius: 10,
        padding: 12,
        width: 290,
      }}
    >
      {/* Binding label */}
      {bindingLabel && (
        <div style={{ fontSize: 11, color: '#475569', marginBottom: 8 }}>
          Binding:{' '}
          <span style={{ color: '#c4b5fd', fontFamily: 'monospace' }}>
            "{bindingLabel}"
          </span>
        </div>
      )}

      {/* Search */}
      <input
        autoFocus
        placeholder='Search variables...'
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: '100%',
          background: '#0a0c13',
          border: '1px solid #1e2433',
          borderRadius: 6,
          color: '#e2e8f0',
          padding: '6px 10px',
          fontSize: 12,
          outline: 'none',
          marginBottom: 8,
          boxSizing: 'border-box',
        }}
      />

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
        {(['all', 'static', 'dynamic', 'extracted'] as const).map((tab) => (
          <button
            key={tab}
            type='button'
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '3px 8px',
              borderRadius: 20,
              fontSize: 10,
              cursor: 'pointer',
              border: '1px solid',
              fontFamily: 'inherit',
              background: activeTab === tab ? '#1e293b' : 'transparent',
              borderColor: activeTab === tab ? '#334155' : 'transparent',
              color: activeTab === tab ? '#e2e8f0' : '#64748b',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Variable list */}
      <div style={{ maxHeight: 200, overflowY: 'auto' }}>
        {filtered.length === 0 ? (
          <div
            style={{
              color: '#334155',
              fontSize: 12,
              padding: '8px 0',
              textAlign: 'center',
            }}
          >
            No variables found
          </div>
        ) : (
          filtered.map((v) => {
            const colors = TYPE_COLORS[v.type];
            return (
              <div
                key={`${v.type}-${v.name}`}
                onClick={() => onSelect(v.name)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 10px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  marginBottom: 2,
                  transition: 'background 0.12s',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = '#1e293b')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = 'transparent')
                }
              >
                {/* Name + value */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 12,
                      color: '#e2e8f0',
                      fontFamily: 'monospace',
                      fontWeight: 500,
                    }}
                  >
                    {v.name}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: '#475569',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {String(v.value ?? '').slice(0, 30)}
                    {String(v.value ?? '').length > 30 ? '…' : ''}
                  </div>
                </div>

                {/* Type badge */}
                <span
                  style={{
                    fontSize: 9,
                    padding: '2px 6px',
                    borderRadius: 4,
                    background: colors.bg,
                    color: colors.text,
                    border: `1px solid ${colors.border}`,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontWeight: 500,
                    flexShrink: 0,
                  }}
                >
                  {v.type}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
