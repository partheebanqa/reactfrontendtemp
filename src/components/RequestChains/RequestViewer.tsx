'use client';

import { useState, useMemo, useRef, useLayoutEffect, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { GitBranch, Trash2, ChevronDown, ChevronUp, X } from 'lucide-react';

interface ExtractVariable {
  name?: string;
  variableName?: string;
  path?: string;
  source?: string;
}

interface VariableSubstitution {
  field: string;
  key: string;
  variable: string;
}

interface RawRequest {
  id: string;
  name?: string;
  order?: number;
  method?: string;
  url?: string;
  extractVariables?: ExtractVariable[];
  variables?: VariableSubstitution[];
  headers?: unknown[];
  params?: unknown[];
  body?: string;
}

interface ExecutionLog {
  requestId: string;
  status?: string;
  duration?: number;
  response?: { status?: number };
}

interface AdaptedRequest {
  id: string;
  name: string;
  order: number;
  method: string;
  url: string;
  extractVariables: { name: string; path: string; source: string }[];
  variables: VariableSubstitution[];
  headers: unknown[];
  params: unknown[];
  body: string;
  runStatus?: string;
  responseStatus?: number;
  duration?: number;
}

interface VarUsage {
  requestId: string;
  requestName: string;
  order: number;
  field: string;
  key: string;
  subId: string;
  removed: boolean;
}

interface VarExtraction {
  requestId: string;
  requestName: string;
  order: number;
  path: string;
  source: string;
}

interface VarData {
  name: string;
  extractedIn: VarExtraction[];
  usedIn: VarUsage[];
}

interface VarMap {
  [name: string]: VarData;
}

interface EdgeData {
  id: string;
  varName: string;
  fromOrder: number;
  toOrder: number;
  removed: boolean;
  subId: string;
  field: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

function getMethodStyle(method: string) {
  switch (method) {
    case 'GET':
      return { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' };
    case 'POST':
      return { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' };
    case 'PUT':
      return { bg: '#fffbeb', text: '#d97706', border: '#fde68a' };
    case 'PATCH':
      return { bg: '#faf5ff', text: '#7c3aed', border: '#e9d5ff' };
    case 'DELETE':
      return { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' };
    default:
      return { bg: '#f9fafb', text: '#374151', border: '#e5e7eb' };
  }
}

interface VarColor {
  stroke: string;
  fill: string;
  text: string;
  label: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

function getVarColor(name: string): VarColor {
  if (name?.startsWith('E_'))
    return {
      stroke: '#f59e0b',
      fill: 'rgba(245,158,11,0.08)',
      text: '#92400e',
      label: 'Extracted',
      badgeBg: '#fffbeb',
      badgeText: '#b45309',
      badgeBorder: '#fde68a',
    };
  if (name?.startsWith('D_'))
    return {
      stroke: '#8b5cf6',
      fill: 'rgba(139,92,246,0.08)',
      text: '#5b21b6',
      label: 'Dynamic',
      badgeBg: '#faf5ff',
      badgeText: '#6d28d9',
      badgeBorder: '#e9d5ff',
    };
  if (name?.startsWith('S_'))
    return {
      stroke: '#0ea5e9',
      fill: 'rgba(14,165,233,0.08)',
      text: '#0c4a6e',
      label: 'Static',
      badgeBg: '#f0f9ff',
      badgeText: '#0369a1',
      badgeBorder: '#bae6fd',
    };
  return {
    stroke: '#6b7280',
    fill: 'rgba(107,114,128,0.06)',
    text: '#374151',
    label: 'Var',
    badgeBg: '#f9fafb',
    badgeText: '#374151',
    badgeBorder: '#e5e7eb',
  };
}

const FIELD_ICONS: Record<string, string> = {
  authorization: '🔐',
  header: '📋',
  param: '🔗',
  body: '📄',
  url: '🌐',
};

function extractUrlVars(url = '') {
  return [...url.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]);
}

function adaptRequests(
  chainRequests: RawRequest[] = [],
  executionLogs: ExecutionLog[] = [],
): AdaptedRequest[] {
  return chainRequests
    .filter(Boolean)
    .map((req, i) => {
      const log = executionLogs.find((l) => l.requestId === req.id);
      return {
        id: req.id,
        name: req.name ?? `Request ${i + 1}`,
        order: req.order ?? i + 1,
        method: (req.method ?? 'GET').toUpperCase(),
        url: req.url ?? '',
        extractVariables: (req.extractVariables ?? [])
          .map((ev) => ({
            name: ev.variableName ?? ev.name ?? '',
            path: ev.path ?? '',
            source: ev.source ?? 'response_body',
          }))
          .filter((ev) => !!ev.name),
        variables: (req.variables ?? [])
          .map((v) => ({ field: v.field, key: v.key, variable: v.variable }))
          .filter((v) => v.field && v.key && v.variable),
        headers: req.headers ?? [],
        params: req.params ?? [],
        body: req.body ?? '',
        runStatus: log?.status,
        responseStatus: log?.response?.status,
        duration: log?.duration,
      };
    })
    .sort((a, b) => a.order - b.order);
}

function buildVarMap(
  requests: AdaptedRequest[],
  removed: Record<string, boolean>,
): VarMap {
  const vars: VarMap = {};
  requests.forEach((req) => {
    (req.extractVariables ?? []).forEach((ev) => {
      if (!vars[ev.name])
        vars[ev.name] = { name: ev.name, extractedIn: [], usedIn: [] };
      vars[ev.name].extractedIn.push({
        requestId: req.id,
        requestName: req.name,
        order: req.order,
        path: ev.path,
        source: ev.source,
      });
    });
  });
  requests.forEach((req) => {
    const seen = new Set<string>();
    const addUsage = (field: string, key: string, variable: string) => {
      const subId = `${req.id}::${field}::${key}`;
      if (seen.has(subId)) return;
      seen.add(subId);
      if (!vars[variable])
        vars[variable] = { name: variable, extractedIn: [], usedIn: [] };
      vars[variable].usedIn.push({
        requestId: req.id,
        requestName: req.name,
        order: req.order,
        field,
        key,
        subId,
        removed: !!removed[subId],
      });
    };
    (req.variables ?? []).forEach((v) => addUsage(v.field, v.key, v.variable));
    extractUrlVars(req.url).forEach((vname) => {
      if (!(req.variables ?? []).some((v) => v.variable === vname))
        addUsage('url', vname, vname);
    });
  });
  return vars;
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className='text-base sm:text-lg font-medium text-gray-900 mb-3'>
      {children}
    </h3>
  );
}

function FieldLabel({
  children,
  color,
}: {
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <div className='flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5'>
      {color && (
        <span
          className='w-2 h-2 rounded-full shrink-0'
          style={{ background: color }}
        />
      )}
      {children}
    </div>
  );
}

function VarBadge({ name }: { name: string }) {
  const c = getVarColor(name);
  return (
    <span
      className='text-xs font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap'
      style={{
        color: c.badgeText,
        background: c.badgeBg,
        borderColor: c.badgeBorder,
      }}
    >
      {c.label}
    </span>
  );
}

function VarCode({
  name,
  removed: isRemoved,
}: {
  name: string;
  removed?: boolean;
}) {
  const c = getVarColor(name);
  return (
    <code
      className='text-sm font-mono font-semibold break-all'
      style={{
        color: isRemoved ? '#9ca3af' : c.text,
        textDecoration: isRemoved ? 'line-through' : 'none',
      }}
    >
      {`{{${name}}}`}
    </code>
  );
}

function ActionButton({
  isRemoved,
  onRemove,
  onRestore,
}: {
  isRemoved: boolean;
  onRemove: () => void;
  onRestore: () => void;
}) {
  return (
    <button
      onClick={isRemoved ? onRestore : onRemove}
      className='flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors border whitespace-nowrap shrink-0'
      style={
        isRemoved
          ? { background: '#f0fdf4', color: '#16a34a', borderColor: '#bbf7d0' }
          : { background: '#fef2f2', color: '#dc2626', borderColor: '#fecaca' }
      }
    >
      {isRemoved ? (
        <>↩ Restore</>
      ) : (
        <>
          <Trash2 className='w-3 h-3' /> Remove
        </>
      )}
    </button>
  );
}

function PipelineEdges({
  edges,
  activeVar,
  removed,
  wrapSize,
}: {
  edges: EdgeData[];
  activeVar: string | null;
  removed: Record<string, boolean>;
  wrapSize: { w: number; h: number };
}) {
  if (!edges.length) return null;
  const varNames = [...new Set(edges.map((e) => e.varName))];
  const trackSpacing = 28;
  const trackStart = wrapSize.w - 180;
  const varTrack: Record<string, number> = {};
  varNames.forEach((n, i) => {
    varTrack[n] = trackStart + i * trackSpacing;
  });
  const svgH = Math.max(wrapSize.h + 40, 200);

  return (
    <svg
      className='absolute inset-0 pointer-events-none overflow-visible'
      style={{ width: '100%', height: svgH, zIndex: 0 }}
    >
      <defs>
        {varNames.map((name) => {
          const c = getVarColor(name);
          return (
            <marker
              key={name}
              id={`cv-arr-${name}`}
              markerWidth='7'
              markerHeight='7'
              refX='5'
              refY='3'
              orient='auto'
            >
              <path d='M0,0.5 L0,5.5 L6.5,3 z' fill={c.stroke} />
            </marker>
          );
        })}
      </defs>
      {varNames.map((name) => {
        const c = getVarColor(name);
        const x = varTrack[name];
        const isActive = activeVar === name;
        if (!isActive && activeVar) return null;
        return (
          <line
            key={`track-${name}`}
            x1={x}
            y1={20}
            x2={x}
            y2={svgH - 20}
            stroke={c.stroke}
            strokeWidth={1}
            strokeDasharray='2 6'
            opacity={isActive ? 0.35 : 0}
          />
        );
      })}
      {varNames.map((name) => {
        const c = getVarColor(name);
        const x = varTrack[name];
        const isActive = activeVar === name;
        return (
          <text
            key={`lbl-${name}`}
            x={x}
            y={14}
            fontSize='7'
            fill={c.stroke}
            fontFamily='ui-monospace,monospace'
            fontWeight='700'
            textAnchor='middle'
            opacity={isActive ? 0.9 : 0}
          >
            {name}
          </text>
        );
      })}
      {edges.map((edge) => {
        const c = getVarColor(edge.varName);
        const isActive = activeVar === edge.varName;
        if (activeVar && !isActive) return null;
        const isRemoved = removed[edge.subId];
        const tx = varTrack[edge.varName];
        const { x1, y1, x2, y2 } = edge;
        const r = 8;
        const hDir = tx > x1 ? 1 : -1;
        const vDir = y2 > y1 ? 1 : -1;
        const d =
          Math.abs(y2 - y1) < 4
            ? `M ${x1} ${y1} L ${tx} ${y1} L ${x2} ${y2}`
            : [
                `M ${x1} ${y1}`,
                `L ${tx - hDir * r} ${y1}`,
                `Q ${tx} ${y1} ${tx} ${y1 + vDir * r}`,
                `L ${tx} ${y2 - vDir * r}`,
                `Q ${tx} ${y2} ${tx - hDir * r} ${y2}`,
                `L ${x2} ${y2}`,
              ].join(' ');
        return (
          <g key={edge.id}>
            <path
              d={d}
              fill='none'
              stroke={isRemoved ? '#d1d5db' : c.stroke}
              strokeWidth={isActive ? 2 : 1.5}
              strokeDasharray={isRemoved ? '4 4' : isActive ? 'none' : '6 3'}
              markerEnd={isRemoved ? 'none' : `url(#cv-arr-${edge.varName})`}
              opacity={isRemoved ? 0.25 : isActive ? 1 : 0.55}
              className={isActive && !isRemoved ? 'cv-flow-animated' : ''}
              style={{
                strokeDashoffset: 0,
                transition: 'stroke-width .2s, opacity .2s',
              }}
            />
            {isActive && !isRemoved && (
              <>
                <rect
                  x={(tx + x2) / 2 - 22}
                  y={y2 - 11}
                  width={44}
                  height={14}
                  rx={3}
                  fill='white'
                  stroke={c.stroke}
                  strokeWidth={1}
                  opacity={0.96}
                />
                <text
                  x={(tx + x2) / 2}
                  y={y2}
                  fontSize='8'
                  fill={c.text}
                  fontFamily='ui-monospace,monospace'
                  fontWeight='700'
                  textAnchor='middle'
                  dominantBaseline='middle'
                >
                  {FIELD_ICONS[edge.field] ?? ''} {edge.field}
                </text>
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function ExpandedDetail({
  req,
  usedVars,
  removed,
  onRemove,
  onRestore,
  setActiveVar,
}: {
  req: AdaptedRequest;
  usedVars: Record<string, VariableSubstitution[]>;
  removed: Record<string, boolean>;
  onRemove: (id: string) => void;
  onRestore: (id: string) => void;
  setActiveVar: (v: string | null) => void;
}) {
  return (
    <div className='p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 bg-gray-50 border-t border-gray-200 cv-fadein'>
      {(req.extractVariables ?? []).length > 0 && (
        <div>
          <FieldLabel color='#f59e0b'>Extracts from Response</FieldLabel>
          <div className='space-y-1.5'>
            {(req.extractVariables ?? []).map((ev) => {
              const c = getVarColor(ev.name);
              return (
                <div
                  key={ev.name}
                  className='rounded-lg px-3 py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 border cursor-default'
                  style={{ background: c.fill, borderColor: c.stroke + '40' }}
                  onMouseEnter={() => setActiveVar(ev.name)}
                  onMouseLeave={() => setActiveVar(null)}
                >
                  <VarCode name={ev.name} />
                  <div className='text-xs text-gray-500 sm:text-right'>
                    <div>
                      path:{' '}
                      <span className='font-mono text-gray-700'>{ev.path}</span>
                    </div>
                    <div className='text-gray-400'>src: {ev.source}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {Object.keys(usedVars).length > 0 && (
        <div>
          <FieldLabel color='#2563eb'>Consumes Variables</FieldLabel>
          <div className='space-y-1.5'>
            {Object.entries(usedVars).map(([vname, usages]) =>
              usages.map((u, i) => {
                const subId = `${req.id}::${u.field}::${u.key}`;
                const isRemoved = removed[subId];
                const c = getVarColor(vname);
                return (
                  <div
                    key={`${vname}-${i}`}
                    className='rounded-lg px-3 py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border'
                    style={{
                      background: isRemoved ? '#f9fafb' : c.fill,
                      borderColor: isRemoved ? '#e5e7eb' : c.stroke + '40',
                      opacity: isRemoved ? 0.65 : 1,
                    }}
                    onMouseEnter={() => setActiveVar(vname)}
                    onMouseLeave={() => setActiveVar(null)}
                  >
                    <div className='flex items-center gap-2 text-sm text-gray-500 min-w-0'>
                      <span className='shrink-0'>
                        {FIELD_ICONS[u.field] ?? '•'}
                      </span>
                      <span className='shrink-0'>{u.field}</span>
                      <span className='text-gray-300 shrink-0'>›</span>
                      <span className='font-mono text-gray-600 text-xs truncate'>
                        {u.key}
                      </span>
                    </div>
                    <div className='flex items-center gap-2 shrink-0'>
                      <VarCode name={vname} removed={isRemoved} />
                      <ActionButton
                        isRemoved={isRemoved}
                        onRemove={() => onRemove(subId)}
                        onRestore={() => onRestore(subId)}
                      />
                    </div>
                  </div>
                );
              }),
            )}
          </div>
        </div>
      )}
      <div className='col-span-1 sm:col-span-2'>
        <FieldLabel>URL</FieldLabel>
        <div className='w-full px-3 py-2 border border-gray-300 rounded-lg bg-white font-mono text-xs sm:text-sm text-gray-500 break-all leading-relaxed'>
          {req.url.split(/(\{\{[^}]+\}\})/).map((part, i) => {
            const m = part.match(/^\{\{(\w+)\}\}$/);
            if (m) {
              const c = getVarColor(m[1]);
              return (
                <span
                  key={i}
                  className='inline-flex items-center px-1.5 py-0.5 rounded mx-0.5 font-semibold text-xs'
                  style={{
                    color: c.text,
                    background: c.fill,
                    border: `1px solid ${c.stroke}40`,
                  }}
                >
                  {part}
                </span>
              );
            }
            return <span key={i}>{part}</span>;
          })}
        </div>
      </div>
    </div>
  );
}

function RequestNode({
  req,
  isLast,
  nodeRef,
  activeVar,
  setActiveVar,
  expanded,
  onToggle,
  removed,
  onRemove,
  onRestore,
}: {
  req: AdaptedRequest;
  idx: number;
  isLast: boolean;
  nodeRef: (el: HTMLDivElement | null) => void;
  activeVar: string | null;
  setActiveVar: (v: string | null) => void;
  expanded: boolean;
  onToggle: () => void;
  removed: Record<string, boolean>;
  onRemove: (id: string) => void;
  onRestore: (id: string) => void;
}) {
  const ms = getMethodStyle(req.method);
  const extracted = req.extractVariables ?? [];
  const usedVars = useMemo(() => {
    const map: Record<string, VariableSubstitution[]> = {};
    (req.variables ?? []).forEach((v) => {
      if (!map[v.variable]) map[v.variable] = [];
      map[v.variable].push(v);
    });
    extractUrlVars(req.url).forEach((vname) => {
      if (!(req.variables ?? []).some((v) => v.variable === vname)) {
        if (!map[vname]) map[vname] = [];
        map[vname].push({ field: 'url', key: vname, variable: vname });
      }
    });
    return map;
  }, [req]);

  const isHighlighted =
    !!activeVar &&
    (extracted.some((e) => e.name === activeVar) ||
      Object.keys(usedVars).includes(activeVar));
  const statusBadge =
    req.runStatus === 'success'
      ? {
          bg: '#f0fdf4',
          text: '#16a34a',
          border: '#bbf7d0',
          label: `✓ ${req.responseStatus ?? 200}`,
        }
      : req.runStatus === 'error'
        ? {
            bg: '#fef2f2',
            text: '#dc2626',
            border: '#fecaca',
            label: `✗ ${req.responseStatus ?? 'ERR'}`,
          }
        : null;

  return (
    <div className='relative flex items-stretch'>
      <div
        className='flex flex-col items-center'
        style={{ width: 36, flexShrink: 0 }}
      >
        <div
          ref={nodeRef}
          className='w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold z-10 border-2 shrink-0 transition-all duration-200'
          style={{
            background: isHighlighted ? '#fffbeb' : 'white',
            borderColor: isHighlighted ? '#f59e0b' : '#e5e7eb',
            color: isHighlighted ? '#b45309' : '#9ca3af',
            marginTop: 14,
          }}
        >
          {req.order}
        </div>
        {!isLast && (
          <div
            style={{
              width: 2,
              flexGrow: 1,
              minHeight: 16,
              background: 'linear-gradient(to bottom,#e5e7eb 70%,transparent)',
              marginBottom: -2,
            }}
          />
        )}
      </div>

      <div
        className='flex-1 mb-3 rounded-xl border overflow-hidden transition-all duration-200 min-w-0'
        style={{
          background: 'white',
          borderColor: isHighlighted ? '#fcd34d' : '#e5e7eb',
          boxShadow: isHighlighted
            ? '0 0 0 2px #fde68a55,0 2px 8px rgba(0,0,0,0.06)'
            : '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <div
          className='flex items-start sm:items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 cursor-pointer select-none hover:bg-gray-50 transition-colors'
          onClick={onToggle}
        >
          <span
            className='text-xs font-bold px-2 py-0.5 rounded-md shrink-0 border mt-0.5 sm:mt-0'
            style={{
              background: ms.bg,
              color: ms.text,
              borderColor: ms.border,
            }}
          >
            {req.method}
          </span>
          <div className='flex-1 min-w-0'>
            <div className='text-sm font-semibold text-gray-900 leading-tight truncate'>
              {req.name}
            </div>
            <div className='text-xs mt-0.5 text-gray-400 font-mono break-all line-clamp-1 hidden sm:block'>
              {req.url.replace(/^https?:\/\/[^/]+/, '') || req.url}
            </div>
            <div className='text-xs mt-0.5 text-gray-400 font-mono truncate sm:hidden'>
              {req.url.replace(/^https?:\/\/[^/]+/, '').substring(0, 40) ||
                req.url.substring(0, 40)}
            </div>
          </div>
          {statusBadge && (
            <span
              className='text-xs font-bold px-2 py-0.5 rounded-md shrink-0 border hidden sm:inline-flex'
              style={{
                background: statusBadge.bg,
                color: statusBadge.text,
                borderColor: statusBadge.border,
              }}
            >
              {statusBadge.label}
              {req.duration ? ` · ${req.duration}ms` : ''}
            </span>
          )}
          <div
            className='hidden sm:flex flex-wrap gap-1 justify-end'
            style={{ maxWidth: 240 }}
          >
            {extracted.map((ev) => {
              const c = getVarColor(ev.name);
              return (
                <span
                  key={ev.name}
                  className='cv-vpill'
                  style={{
                    color: c.text,
                    borderColor: c.stroke + '55',
                    background: c.fill,
                  }}
                  onMouseEnter={() => setActiveVar(ev.name)}
                  onMouseLeave={() => setActiveVar(null)}
                >
                  ↓ {ev.name}
                </span>
              );
            })}
            {Object.entries(usedVars).map(([vname, usages]) => {
              const c = getVarColor(vname);
              const subId = `${req.id}::${usages[0].field}::${usages[0].key}`;
              const isRemoved = removed[subId];
              return (
                <span
                  key={vname}
                  className='cv-vpill'
                  style={{
                    color: isRemoved ? '#9ca3af' : c.text,
                    borderColor: isRemoved ? '#e5e7eb' : c.stroke + '55',
                    background: isRemoved ? '#f9fafb' : c.fill,
                    textDecoration: isRemoved ? 'line-through' : 'none',
                    opacity: isRemoved ? 0.7 : 1,
                  }}
                  onMouseEnter={() => setActiveVar(vname)}
                  onMouseLeave={() => setActiveVar(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    isRemoved
                      ? onRestore(
                          `${req.id}::${usages[0].field}::${usages[0].key}`,
                        )
                      : onRemove(
                          `${req.id}::${usages[0].field}::${usages[0].key}`,
                        );
                  }}
                >
                  → {vname} {isRemoved ? '↩' : '×'}
                </span>
              );
            })}
          </div>
          <span className='text-gray-400 shrink-0'>
            {expanded ? (
              <ChevronUp className='w-4 h-4 text-[rgb(19_111_176)]' />
            ) : (
              <ChevronDown className='w-4 h-4 text-[rgb(19_111_176)]' />
            )}
          </span>
        </div>

        {(extracted.length > 0 || Object.keys(usedVars).length > 0) && (
          <div className='flex sm:hidden flex-wrap gap-1 px-3 pb-2'>
            {extracted.map((ev) => {
              const c = getVarColor(ev.name);
              return (
                <span
                  key={ev.name}
                  className='cv-vpill'
                  style={{
                    color: c.text,
                    borderColor: c.stroke + '55',
                    background: c.fill,
                  }}
                >
                  ↓ {ev.name}
                </span>
              );
            })}
            {Object.entries(usedVars).map(([vname, usages]) => {
              const c = getVarColor(vname);
              const subId = `${req.id}::${usages[0].field}::${usages[0].key}`;
              const isRemoved = removed[subId];
              return (
                <span
                  key={vname}
                  className='cv-vpill'
                  style={{
                    color: isRemoved ? '#9ca3af' : c.text,
                    borderColor: isRemoved ? '#e5e7eb' : c.stroke + '55',
                    background: isRemoved ? '#f9fafb' : c.fill,
                    opacity: isRemoved ? 0.7 : 1,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    isRemoved ? onRestore(subId) : onRemove(subId);
                  }}
                >
                  → {vname}
                </span>
              );
            })}
            {statusBadge && (
              <span
                className='cv-vpill'
                style={{
                  background: statusBadge.bg,
                  color: statusBadge.text,
                  borderColor: statusBadge.border,
                }}
              >
                {statusBadge.label}
              </span>
            )}
          </div>
        )}

        {expanded && (
          <ExpandedDetail
            req={req}
            usedVars={usedVars}
            removed={removed}
            onRemove={onRemove}
            onRestore={onRestore}
            setActiveVar={setActiveVar}
          />
        )}
      </div>
    </div>
  );
}

function VariableCard({
  varData,
  isActive,
  onHover,
  onLeave,
}: {
  varData: VarData;
  isActive: boolean;
  onHover: () => void;
  onLeave: () => void;
}) {
  const c = getVarColor(varData.name);
  return (
    <div
      className='rounded-xl border p-3 cursor-default transition-all duration-200'
      style={{
        background: isActive ? c.fill : 'white',
        borderColor: isActive ? c.stroke : '#e5e7eb',
        boxShadow: isActive
          ? `0 0 0 1px ${c.stroke}33,0 2px 8px rgba(0,0,0,0.06)`
          : '0 1px 2px rgba(0,0,0,0.04)',
      }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      <div className='flex items-center justify-between gap-2 mb-2'>
        <VarCode name={varData.name} />
        <VarBadge name={varData.name} />
      </div>
      {varData.extractedIn.length > 0 && (
        <div className='mb-2'>
          <p className='text-xs font-medium text-gray-500 mb-1'>
            Extracted in:
          </p>
          {varData.extractedIn.map((e, i) => (
            <div key={i} className='flex items-center gap-1.5 text-xs mb-0.5'>
              <span
                className='w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0'
                style={{
                  background: '#fffbeb',
                  color: '#b45309',
                  border: '1px solid #fde68a',
                }}
              >
                {e.order}
              </span>
              <span className='truncate text-gray-600'>{e.requestName}</span>
            </div>
          ))}
        </div>
      )}
      {varData.usedIn.length > 0 && (
        <div>
          <p className='text-xs font-medium text-gray-500 mb-1'>Used in:</p>
          <div className='space-y-0.5'>
            {varData.usedIn.map((u, i) => (
              <div
                key={i}
                className='flex items-center justify-between gap-2'
                style={{ opacity: u.removed ? 0.45 : 1 }}
              >
                <div className='flex items-center gap-1.5 min-w-0'>
                  <span
                    className='w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0'
                    style={{
                      background: '#eff6ff',
                      color: '#2563eb',
                      border: '1px solid #bfdbfe',
                    }}
                  >
                    {u.order}
                  </span>
                  <span className='text-xs text-gray-500 truncate'>
                    {u.requestName}
                  </span>
                </div>
                <span className='text-xs text-gray-400 shrink-0'>
                  {FIELD_ICONS[u.field] ?? ''} {u.field}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FlowView({
  requests,
  allVars,
  sortedVars,
  activeVar,
  setActiveVar,
  expandedReq,
  setExpandedReq,
  removed,
  onRemove,
  onRestore,
}: {
  requests: AdaptedRequest[];
  allVars: VarMap;
  sortedVars: VarData[];
  activeVar: string | null;
  setActiveVar: (v: string | null) => void;
  expandedReq: string | null;
  setExpandedReq: (id: string | null) => void;
  removed: Record<string, boolean>;
  onRemove: (id: string) => void;
  onRestore: (id: string) => void;
}) {
  const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [edges, setEdges] = useState<EdgeData[]>([]);
  const [wrapSize, setWrapSize] = useState({ w: 0, h: 0 });
  const [showRegistry, setShowRegistry] = useState(false);

  const computeEdges = useCallback(() => {
    if (!wrapRef.current) return;
    const wrapRect = wrapRef.current.getBoundingClientRect();
    setWrapSize({ w: wrapRect.width, h: wrapRect.height });
    const newEdges: EdgeData[] = [];
    Object.values(allVars).forEach((varData) => {
      varData.extractedIn.forEach((ext) => {
        varData.usedIn.forEach((use) => {
          if (use.order <= ext.order) return;
          const srcEl = nodeRefs.current[ext.requestId];
          const dstEl = nodeRefs.current[use.requestId];
          if (!srcEl || !dstEl) return;
          const srcR = srcEl.getBoundingClientRect();
          const dstR = dstEl.getBoundingClientRect();
          newEdges.push({
            id: `${ext.requestId}::${use.requestId}::${varData.name}::${use.field}`,
            varName: varData.name,
            fromOrder: ext.order,
            toOrder: use.order,
            removed: use.removed,
            subId: use.subId,
            field: use.field,
            x1: srcR.right - wrapRect.left,
            y1: srcR.top - wrapRect.top + srcR.height / 2,
            x2: dstR.right - wrapRect.left,
            y2: dstR.top - wrapRect.top + dstR.height / 2,
          });
        });
      });
    });
    setEdges(newEdges);
  }, [allVars]);

  useLayoutEffect(() => {
    const timer = setTimeout(computeEdges, 50);
    const ro = new ResizeObserver(computeEdges);
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => {
      clearTimeout(timer);
      ro.disconnect();
    };
  }, [computeEdges, expandedReq]);

  const varPrefixes = [
    { sample: 'E_x', prefix: 'E_' },
    { sample: 'D_x', prefix: 'D_' },
    { sample: 'S_x', prefix: 'S_' },
  ];

  return (
    <div className='flex flex-col xl:grid xl:grid-cols-[1fr_272px] gap-4 xl:gap-6 items-start'>
      <div className='w-full min-w-0'>
        <div className='flex flex-wrap gap-2 mb-4 items-center p-3 bg-white border border-gray-200 rounded-lg'>
          <span className='text-sm font-semibold text-gray-900 shrink-0'>
            Variable Types:
          </span>
          <div className='flex flex-wrap gap-1.5'>
            {varPrefixes.map(({ prefix, sample }) => {
              const c = getVarColor(sample);
              return (
                <span
                  key={prefix}
                  className='cv-vpill'
                  style={{
                    color: c.text,
                    borderColor: c.stroke + '55',
                    background: c.fill,
                  }}
                >
                  {prefix}* {c.label}
                </span>
              );
            })}
          </div>
          <span className='text-xs text-gray-400 w-full sm:w-auto sm:ml-1'>
            · hover to trace · click pill to remove
          </span>
        </div>

        {sortedVars.length > 0 && (
          <div className='xl:hidden mb-3'>
            <button
              onClick={() => setShowRegistry((p) => !p)}
              className='w-full flex items-center justify-between px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors'
            >
              <span>Variable Registry ({sortedVars.length})</span>
              {showRegistry ? (
                <ChevronUp className='w-4 h-4 text-[rgb(19_111_176)]' />
              ) : (
                <ChevronDown className='w-4 h-4 text-[rgb(19_111_176)]' />
              )}
            </button>
            {showRegistry && (
              <div className='mt-2 space-y-2'>
                {sortedVars.map((v) => (
                  <VariableCard
                    key={v.name}
                    varData={v}
                    isActive={activeVar === v.name}
                    onHover={() => setActiveVar(v.name)}
                    onLeave={() => setActiveVar(null)}
                  />
                ))}
                <div className='text-xs text-blue-700 p-2.5 rounded-lg border border-blue-200 bg-blue-50'>
                  💡 Hover a variable to highlight its data flow across the
                  pipeline
                </div>
              </div>
            )}
          </div>
        )}

        <div ref={wrapRef} className='relative'>
          <PipelineEdges
            edges={edges}
            activeVar={activeVar}
            removed={removed}
            wrapSize={wrapSize}
          />
          <div className='flex flex-col sm:pr-[200px]'>
            {requests.map((req, idx) => (
              <RequestNode
                key={req.id}
                req={req}
                idx={idx}
                isLast={idx === requests.length - 1}
                nodeRef={(el) => {
                  nodeRefs.current[req.id] = el;
                }}
                activeVar={activeVar}
                setActiveVar={setActiveVar}
                expanded={expandedReq === req.id}
                onToggle={() =>
                  setExpandedReq(expandedReq === req.id ? null : req.id)
                }
                removed={removed}
                onRemove={onRemove}
                onRestore={onRestore}
              />
            ))}
          </div>
        </div>
      </div>

      <aside className='hidden xl:flex xl:sticky xl:top-4 max-h-[calc(100vh-120px)] flex-col gap-3 w-full'>
        <h3 className='text-base font-medium text-gray-900'>
          Variable Registry
        </h3>
        <div className='overflow-y-auto cv-scrollbar space-y-2 flex-1 pr-0.5'>
          {sortedVars.length === 0 && (
            <p className='text-center py-8 text-sm text-gray-400'>
              No variables detected yet.
              <br />
              Add extractVariables to your requests.
            </p>
          )}
          {sortedVars.map((v) => (
            <VariableCard
              key={v.name}
              varData={v}
              isActive={activeVar === v.name}
              onHover={() => setActiveVar(v.name)}
              onLeave={() => setActiveVar(null)}
            />
          ))}
        </div>
        <div className='text-xs text-blue-700 p-2.5 rounded-lg border border-blue-200 bg-blue-50'>
          💡 Hover a variable to highlight its data flow across the pipeline
        </div>
      </aside>
    </div>
  );
}

function TableView({
  requests,
  sortedVars,
  removed,
  onRemove,
  onRestore,
}: {
  requests: AdaptedRequest[];
  sortedVars: VarData[];
  removed: Record<string, boolean>;
  onRemove: (id: string) => void;
  onRestore: (id: string) => void;
}) {
  const [filterVar, setFilterVar] = useState<string | null>(null);

  const allUsageRows = useMemo(
    () =>
      requests.flatMap((req) => {
        const urlVars = extractUrlVars(req.url);
        const usages: {
          field: string;
          key: string;
          variable: string;
          subId: string;
        }[] = [
          ...(req.variables ?? []).map((v) => ({
            ...v,
            subId: `${req.id}::${v.field}::${v.key}`,
          })),
          ...urlVars
            .filter(
              (vname) =>
                !(req.variables ?? []).some(
                  (v) => v.variable === vname && v.field === 'url',
                ),
            )
            .map((vname) => ({
              field: 'url',
              key: vname,
              variable: vname,
              subId: `${req.id}::url::${vname}`,
            })),
        ];
        return usages.map((u) => ({ req, usage: u }));
      }),
    [requests],
  );

  const filteredRows = useMemo(
    () =>
      allUsageRows.filter(
        ({ usage }) => !filterVar || usage.variable === filterVar,
      ),
    [allUsageRows, filterVar],
  );

  const thCls =
    'text-left px-3 py-2.5 text-xs font-medium text-gray-500 border-b border-gray-200 whitespace-nowrap';
  const tdCls = 'px-3 py-2.5 align-middle';

  return (
    <div className='space-y-6 sm:space-y-8'>
      <div>
        <SectionHeading>Variable Overview</SectionHeading>
        <div className='sm:hidden space-y-2'>
          {sortedVars.length === 0 && (
            <p className='text-center py-8 text-sm text-gray-400'>
              No variables found
            </p>
          )}
          {sortedVars.map((v) => (
            <div
              key={v.name}
              className='bg-white border border-gray-200 rounded-xl p-3 space-y-2'
            >
              <div className='flex items-center justify-between gap-2'>
                <VarCode name={v.name} />
                <VarBadge name={v.name} />
              </div>
              {v.extractedIn.length > 0 && (
                <div className='text-xs text-gray-500'>
                  <span className='font-medium'>Extracted in: </span>
                  {v.extractedIn
                    .map((e) => `#${e.order} ${e.requestName}`)
                    .join(', ')}
                </div>
              )}
              <div className='flex items-center justify-between'>
                <span className='text-xs text-gray-400'>
                  {v.usedIn.length} usages
                </span>
                <button
                  onClick={() =>
                    setFilterVar(filterVar === v.name ? null : v.name)
                  }
                  className='text-xs font-medium px-2.5 py-1 rounded-lg transition-colors border'
                  style={
                    filterVar === v.name
                      ? {
                          background: '#136fb0',
                          color: 'white',
                          borderColor: '#136fb0',
                        }
                      : {
                          background: 'white',
                          color: '#136fb0',
                          borderColor: '#bfdbfe',
                        }
                  }
                >
                  {filterVar === v.name ? 'Clear' : 'Filter'}
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className='hidden sm:block overflow-x-auto cv-scrollbar rounded-xl border border-gray-200'>
          <table className='w-full bg-white'>
            <thead className='bg-gray-50'>
              <tr>
                {[
                  'Variable',
                  'Type',
                  'Extracted In',
                  'Path',
                  'Usages',
                  'Filter',
                ].map((h) => (
                  <th key={h} className={thCls}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-100'>
              {sortedVars.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className='px-3 py-8 text-center text-sm text-gray-400'
                  >
                    No variables found
                  </td>
                </tr>
              )}
              {sortedVars.map((v) => (
                <tr
                  key={v.name}
                  className='hover:bg-gray-50 transition-colors'
                  style={filterVar === v.name ? { background: '#fffbeb' } : {}}
                >
                  <td className={tdCls}>
                    <VarCode name={v.name} />
                  </td>
                  <td className={tdCls}>
                    <VarBadge name={v.name} />
                  </td>
                  <td className={`${tdCls} text-sm text-gray-600`}>
                    {v.extractedIn
                      .map((e) => `#${e.order} ${e.requestName}`)
                      .join(', ') || <span className='text-gray-300'>—</span>}
                  </td>
                  <td className={`${tdCls} text-xs font-mono text-gray-400`}>
                    {v.extractedIn.map((e) => e.path).join(', ') || (
                      <span className='text-gray-300'>—</span>
                    )}
                  </td>
                  <td className={`${tdCls} text-sm text-gray-500`}>
                    {v.usedIn.length}
                  </td>
                  <td className={tdCls}>
                    <button
                      onClick={() =>
                        setFilterVar(filterVar === v.name ? null : v.name)
                      }
                      className='text-xs font-medium px-3 py-1 rounded-lg transition-colors border'
                      style={
                        filterVar === v.name
                          ? {
                              background: '#136fb0',
                              color: 'white',
                              borderColor: '#136fb0',
                            }
                          : {
                              background: 'white',
                              color: '#136fb0',
                              borderColor: '#bfdbfe',
                            }
                      }
                    >
                      {filterVar === v.name ? 'Clear' : 'Filter'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <div className='flex flex-wrap items-center gap-2 mb-3'>
          <SectionHeading>All Substitutions</SectionHeading>
          {filterVar && (
            <span className='text-sm font-normal text-[#136fb0] -mt-3'>
              · filtered: {filterVar}
            </span>
          )}
        </div>
        <div className='sm:hidden space-y-2'>
          {filteredRows.length === 0 && (
            <p className='text-center py-8 text-sm text-gray-400'>
              No substitutions found
            </p>
          )}
          {filteredRows.map(({ req, usage }) => {
            const isRemoved = removed[usage.subId];
            return (
              <div
                key={usage.subId}
                className='bg-white border border-gray-200 rounded-xl p-3 space-y-2'
                style={{ opacity: isRemoved ? 0.65 : 1 }}
              >
                <div className='flex items-center justify-between gap-2'>
                  <div className='flex items-center gap-2 min-w-0'>
                    <span className='w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 bg-gray-100 text-gray-500'>
                      {req.order}
                    </span>
                    <span className='text-sm font-medium text-gray-700 truncate'>
                      {req.name}
                    </span>
                  </div>
                  {isRemoved ? (
                    <span className='text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 shrink-0'>
                      Removed
                    </span>
                  ) : (
                    <span className='text-xs font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-200 shrink-0'>
                      Active
                    </span>
                  )}
                </div>
                <div className='flex items-center justify-between gap-2'>
                  <div className='min-w-0'>
                    <VarCode name={usage.variable} removed={isRemoved} />
                    <div className='text-xs text-gray-400 mt-0.5'>
                      {FIELD_ICONS[usage.field] ?? ''} {usage.field} ›{' '}
                      <span className='font-mono'>{usage.key}</span>
                    </div>
                  </div>
                  <ActionButton
                    isRemoved={isRemoved}
                    onRemove={() => onRemove(usage.subId)}
                    onRestore={() => onRestore(usage.subId)}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className='hidden sm:block overflow-x-auto cv-scrollbar rounded-xl border border-gray-200'>
          <table className='w-full bg-white'>
            <thead className='bg-gray-50'>
              <tr>
                {[
                  '#',
                  'Request',
                  'Variable',
                  'Location',
                  'Key',
                  'Status',
                  'Action',
                ].map((h) => (
                  <th key={h} className={thCls}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-100'>
              {filteredRows.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className='px-3 py-8 text-center text-sm text-gray-400'
                  >
                    No substitutions found
                  </td>
                </tr>
              )}
              {filteredRows.map(({ req, usage }) => {
                const isRemoved = removed[usage.subId];
                return (
                  <tr
                    key={usage.subId}
                    className='hover:bg-gray-50 transition-colors'
                    style={{ opacity: isRemoved ? 0.6 : 1 }}
                  >
                    <td className={`${tdCls} text-sm text-gray-400`}>
                      {req.order}
                    </td>
                    <td
                      className={`${tdCls} text-sm font-medium text-gray-700 whitespace-nowrap`}
                    >
                      {req.name}
                    </td>
                    <td className={tdCls}>
                      <VarCode name={usage.variable} removed={isRemoved} />
                    </td>
                    <td
                      className={`${tdCls} text-sm text-gray-500 whitespace-nowrap`}
                    >
                      {FIELD_ICONS[usage.field] ?? ''} {usage.field}
                    </td>
                    <td className={`${tdCls} text-xs font-mono text-gray-400`}>
                      {usage.key}
                    </td>
                    <td className={tdCls}>
                      {isRemoved ? (
                        <span className='inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-200'>
                          Removed
                        </span>
                      ) : (
                        <span className='inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-600 border border-green-200'>
                          Active
                        </span>
                      )}
                    </td>
                    <td className={tdCls}>
                      <ActionButton
                        isRemoved={isRemoved}
                        onRemove={() => onRemove(usage.subId)}
                        onRestore={() => onRestore(usage.subId)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export interface ChainViewerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requests: RawRequest[];
  executionLogs?: ExecutionLog[];
  chainName?: string;
}

export function ChainViewerModal({
  open,
  onOpenChange,
  requests: rawRequests = [],
  executionLogs = [],
  chainName,
}: ChainViewerModalProps) {
  const [removed, setRemoved] = useState<Record<string, boolean>>({});
  const [activeVar, setActiveVar] = useState<string | null>(null);
  const [expandedReq, setExpandedReq] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'flow' | 'table'>('flow');

  const requests = useMemo(
    () => adaptRequests(rawRequests, executionLogs),
    [rawRequests, executionLogs],
  );
  const allVars = useMemo(
    () => buildVarMap(requests, removed),
    [requests, removed],
  );
  const sortedVars = useMemo(
    () =>
      Object.values(allVars).sort((a, b) => {
        const ord = ['E_', 'D_', 'S_'];
        const rank = (n: string) => ord.findIndex((p) => n.startsWith(p));
        return rank(a.name) - rank(b.name) || a.name.localeCompare(b.name);
      }),
    [allVars],
  );

  const removeSubstitution = useCallback(
    (id: string) => setRemoved((p) => ({ ...p, [id]: true })),
    [],
  );
  const restoreSubstitution = useCallback(
    (id: string) =>
      setRemoved((p) => {
        const n = { ...p };
        delete n[id];
        return n;
      }),
    [],
  );
  const stats = useMemo(
    () => ({
      success: executionLogs.filter((l) => l.status === 'success').length,
      total: executionLogs.length,
    }),
    [executionLogs],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        style={{
          maxWidth: '96vw',
          maxHeight: '94vh',
          width: '96vw',
          display: 'flex',
          flexDirection: 'column',
          background: 'white',
          border: '1px solid #e5e7eb',
          color: '#111827',
          fontFamily: 'inherit',
          padding: 0,
          overflow: 'hidden',
          gap: 0,
          borderRadius: 12,
          boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
        }}
      >
        <style>{`
          /* ── FIX: hide shadcn's auto-injected close button ── */
         [role="dialog"] > button[aria-label="Close"],
         [role="dialog"] > button.absolute { display: none !important; }
          .cv-vpill { display:inline-flex; align-items:center; gap:3px; padding:2px 8px; border-radius:99px; font-size:11px; font-weight:600; border:1px solid; cursor:pointer; transition:all .15s; white-space:nowrap; }
          .cv-vpill:hover { filter:brightness(0.93); transform:scale(1.02); }
          @keyframes cv-flowAnim { to { stroke-dashoffset:-24; } }
          .cv-flow-animated { animation:cv-flowAnim 1s linear infinite; }
          @keyframes cv-fadeUp { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:translateY(0); } }
          .cv-fadein { animation:cv-fadeUp .2s ease; }
          .cv-scrollbar::-webkit-scrollbar { width:4px; height:4px; }
          .cv-scrollbar::-webkit-scrollbar-track { background:transparent; }
          .cv-scrollbar::-webkit-scrollbar-thumb { background:#e5e7eb; border-radius:2px; }
        `}</style>

        <div className='flex items-center gap-3 px-3 sm:px-5 py-3 border-b border-gray-200 bg-white shrink-0'>
          <div className='flex items-center gap-2 sm:gap-3 min-w-0 flex-1'>
            <div
              className='w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs text-white shrink-0'
              style={{ background: 'linear-gradient(135deg,#136fb0,#0ea5e9)' }}
            >
              ⬡
            </div>
            <div className='min-w-0'>
              <span className='text-sm font-semibold text-gray-900 truncate block'>
                {chainName ?? 'Chain Viewer'}
              </span>
              <span className='text-xs text-gray-400 hidden sm:inline'>
                {requests.length} requests · {sortedVars.length} variables
                {stats.total > 0 && ` · ${stats.success}/${stats.total} passed`}
              </span>
            </div>
          </div>

          <div className='flex items-center gap-2 shrink-0'>
            <div className='flex gap-1'>
              {(['flow', 'table'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setViewMode(v)}
                  className='text-xs sm:text-sm px-3 sm:px-4 py-1.5 rounded-lg font-medium transition-all border'
                  style={
                    viewMode === v
                      ? {
                          background: '#136fb0',
                          color: 'white',
                          borderColor: '#136fb0',
                        }
                      : {
                          background: 'white',
                          color: '#6b7280',
                          borderColor: '#e5e7eb',
                        }
                  }
                >
                  {v === 'flow' ? '⬡ Flow' : '≡ Table'}
                </button>
              ))}
            </div>

            <button
              onClick={() => onOpenChange(false)}
              aria-label='Close dialog'
              className='w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors shrink-0'
            >
              <X className='w-4 h-4' />
            </button>
          </div>
        </div>

        <div className='flex sm:hidden items-center gap-2 px-3 py-1.5 text-xs text-gray-400 bg-white border-b border-gray-100'>
          {requests.length} req · {sortedVars.length} vars
          {stats.total > 0 && ` · ${stats.success}/${stats.total} passed`}
        </div>

        <div
          className='flex-1 overflow-auto px-3 sm:px-5 py-3 sm:py-4 cv-scrollbar bg-gray-50'
          style={{ minHeight: 0 }}
        >
          {viewMode === 'flow' ? (
            <FlowView
              requests={requests}
              allVars={allVars}
              sortedVars={sortedVars}
              activeVar={activeVar}
              setActiveVar={setActiveVar}
              expandedReq={expandedReq}
              setExpandedReq={setExpandedReq}
              removed={removed}
              onRemove={removeSubstitution}
              onRestore={restoreSubstitution}
            />
          ) : (
            <TableView
              requests={requests}
              sortedVars={sortedVars}
              removed={removed}
              onRemove={removeSubstitution}
              onRestore={restoreSubstitution}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export interface ChainViewerButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export function ChainViewerButton({
  onClick,
  disabled,
}: ChainViewerButtonProps) {
  return (
    <Button
      variant='outline'
      onClick={onClick}
      disabled={disabled}
      className='gap-2 bg-transparent'
    >
      <GitBranch className='w-4 h-4' />
      Chain Viewer
    </Button>
  );
}
