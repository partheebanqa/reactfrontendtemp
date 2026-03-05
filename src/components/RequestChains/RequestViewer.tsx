'use client';

import { useState, useMemo, useRef, useLayoutEffect, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { GitBranch } from 'lucide-react';

// ─── TYPES ────────────────────────────────────────────────────────────────────

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

interface MethodStyle {
  bg: string;
  text: string;
  border: string;
}

interface VarColor {
  stroke: string;
  fill: string;
  text: string;
  label: string;
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const METHOD_STYLES: Record<string, MethodStyle> = {
  GET: { bg: '#0f3028', text: '#34d399', border: '#065f46' },
  POST: { bg: '#0c1f3d', text: '#60a5fa', border: '#1e3a5f' },
  PUT: { bg: '#2d1f05', text: '#fbbf24', border: '#5c3e0a' },
  PATCH: { bg: '#1e0d3a', text: '#c084fc', border: '#44176e' },
  DELETE: { bg: '#2a0a0a', text: '#f87171', border: '#5c1a1a' },
};

const VAR_COLORS: Record<string, VarColor> = {
  E_: {
    stroke: '#f59e0b',
    fill: '#f59e0b1a',
    text: '#fbbf24',
    label: 'Extracted',
  },
  D_: {
    stroke: '#a855f7',
    fill: '#a855f71a',
    text: '#c084fc',
    label: 'Dynamic',
  },
  S_: {
    stroke: '#3b82f6',
    fill: '#3b82f61a',
    text: '#93c5fd',
    label: 'Static',
  },
};

const FIELD_ICONS: Record<string, string> = {
  authorization: '🔐',
  header: '📋',
  param: '🔗',
  body: '📄',
  url: '🌐',
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function getVarColor(name: string): VarColor {
  for (const [p, c] of Object.entries(VAR_COLORS)) {
    if (name?.startsWith(p)) return c;
  }
  return {
    stroke: '#6b7280',
    fill: '#6b72801a',
    text: '#9ca3af',
    label: 'Var',
  };
}

function extractUrlVars(url: string = ''): string[] {
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
      const extractVariables = (req.extractVariables ?? [])
        .map((ev) => ({
          name: ev.variableName ?? ev.name ?? '',
          path: ev.path ?? '',
          source: ev.source ?? 'response_body',
        }))
        .filter((ev) => !!ev.name);

      const variables = (req.variables ?? [])
        .map((v) => ({ field: v.field, key: v.key, variable: v.variable }))
        .filter((v) => v.field && v.key && v.variable);

      return {
        id: req.id,
        name: req.name ?? `Request ${i + 1}`,
        order: req.order ?? i + 1,
        method: (req.method ?? 'GET').toUpperCase(),
        url: req.url ?? '',
        extractVariables,
        variables,
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
      if (!(req.variables ?? []).some((v) => v.variable === vname)) {
        addUsage('url', vname, vname);
      }
    });
  });

  return vars;
}

// ─── SECTION LABEL ────────────────────────────────────────────────────────────

function SectionLabel({ color, label }: { color: string; label: string }) {
  return (
    <div
      className='flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-semibold'
      style={{ color }}
    >
      <span
        className='w-1.5 h-1.5 rounded-full inline-block'
        style={{ background: color }}
      />
      {label}
    </div>
  );
}

// ─── PIPELINE EDGES ───────────────────────────────────────────────────────────

interface PipelineEdgesProps {
  edges: EdgeData[];
  activeVar: string | null;
  removed: Record<string, boolean>;
  wrapSize: { w: number; h: number };
}

function PipelineEdges({
  edges,
  activeVar,
  removed,
  wrapSize,
}: PipelineEdgesProps) {
  if (!edges.length) return null;

  const varNames = [...new Set(edges.map((e) => e.varName))];
  const trackSpacing = 30;
  const trackStart = wrapSize.w - 200;
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

      {/* Track columns */}
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
            opacity={isActive ? 0.3 : 0.1}
          />
        );
      })}

      {/* Track labels */}
      {varNames.map((name) => {
        const c = getVarColor(name);
        const x = varTrack[name];
        const isActive = activeVar === name;
        return (
          <text
            key={`label-${name}`}
            x={x}
            y={14}
            fontSize='8'
            fill={c.text}
            fontFamily='JetBrains Mono,monospace'
            fontWeight='700'
            textAnchor='middle'
            opacity={isActive ? 1 : 0.4}
          >
            {name}
          </text>
        );
      })}

      {/* Edges */}
      {edges.map((edge) => {
        const c = getVarColor(edge.varName);
        const isActive = activeVar === edge.varName;
        const isDimmed = activeVar && !isActive;
        if (isDimmed) return null;

        const isRemoved = removed[edge.subId];
        const tx = varTrack[edge.varName];
        const { x1, y1, x2, y2 } = edge;
        const r = 8;
        const hDir = tx > x1 ? 1 : -1;
        const vDir = y2 > y1 ? 1 : -1;

        let d: string;
        if (Math.abs(y2 - y1) < 4) {
          d = `M ${x1} ${y1} L ${tx} ${y1} L ${x2} ${y2}`;
        } else {
          d = [
            `M ${x1} ${y1}`,
            `L ${tx - hDir * r} ${y1}`,
            `Q ${tx} ${y1} ${tx} ${y1 + vDir * r}`,
            `L ${tx} ${y2 - vDir * r}`,
            `Q ${tx} ${y2} ${tx - hDir * r} ${y2}`,
            `L ${x2} ${y2}`,
          ].join(' ');
        }

        const strokeColor = isRemoved ? '#374151' : c.stroke;
        const opacity = isRemoved ? 0.25 : isActive ? 1 : 0.65;

        return (
          <g key={edge.id}>
            <path
              d={d}
              fill='none'
              stroke={strokeColor}
              strokeWidth={isActive ? 2.5 : 1.5}
              strokeDasharray={isRemoved ? '4 4' : isActive ? 'none' : '6 3'}
              markerEnd={isRemoved ? 'none' : `url(#cv-arr-${edge.varName})`}
              opacity={opacity}
              className={isActive && !isRemoved ? 'cv-flow-animated' : ''}
              style={{
                strokeDashoffset: 0,
                transition: 'stroke-width .2s, opacity .2s',
              }}
            />
            {isActive && !isRemoved && (
              <>
                <rect
                  x={(tx + x2) / 2 - 18}
                  y={y2 - 10}
                  width={36}
                  height={13}
                  rx={4}
                  fill={c.fill}
                  stroke={c.stroke}
                  strokeWidth={0.75}
                  opacity={0.9}
                />
                <text
                  x={(tx + x2) / 2}
                  y={y2}
                  fontSize='8'
                  fill={c.text}
                  fontFamily='JetBrains Mono,monospace'
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

// ─── EXPANDED DETAIL ──────────────────────────────────────────────────────────

interface ExpandedDetailProps {
  req: AdaptedRequest;
  usedVars: Record<string, VariableSubstitution[]>;
  removed: Record<string, boolean>;
  onRemove: (id: string) => void;
  onRestore: (id: string) => void;
  setActiveVar: (v: string | null) => void;
}

function ExpandedDetail({
  req,
  usedVars,
  removed,
  onRemove,
  onRestore,
  setActiveVar,
}: ExpandedDetailProps) {
  return (
    <div className='p-4 grid md:grid-cols-2 gap-4 text-xs cv-fadein'>
      {(req.extractVariables ?? []).length > 0 && (
        <div>
          <SectionLabel color='#f59e0b' label='Extracts from Response' />
          <div className='space-y-1.5 mt-2'>
            {(req.extractVariables ?? []).map((ev) => {
              const c = getVarColor(ev.name);
              return (
                <div
                  key={ev.name}
                  className='rounded-lg px-3 py-2 flex items-center justify-between'
                  style={{
                    background: c.fill,
                    border: `1px solid ${c.stroke}33`,
                  }}
                  onMouseEnter={() => setActiveVar(ev.name)}
                  onMouseLeave={() => setActiveVar(null)}
                >
                  <span style={{ color: c.text, fontWeight: 700 }}>
                    {ev.name}
                  </span>
                  <div className='text-right'>
                    <div style={{ color: '#6b7280' }}>
                      path: <span style={{ color: '#d1d5db' }}>{ev.path}</span>
                    </div>
                    <div style={{ color: '#4b5563' }}>src: {ev.source}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {Object.keys(usedVars).length > 0 && (
        <div>
          <SectionLabel color='#38bdf8' label='Consumes Variables' />
          <div className='space-y-1.5 mt-2'>
            {Object.entries(usedVars).map(([vname, usages]) =>
              usages.map((u, i) => {
                const c = getVarColor(vname);
                const subId = `${req.id}::${u.field}::${u.key}`;
                const isRemoved = removed[subId];
                return (
                  <div
                    key={`${vname}-${i}`}
                    className='rounded-lg px-3 py-2 flex items-center justify-between'
                    style={{
                      background: isRemoved ? '#37415111' : c.fill,
                      border: `1px solid ${isRemoved ? '#374151' : c.stroke + '33'}`,
                      opacity: isRemoved ? 0.55 : 1,
                    }}
                    onMouseEnter={() => setActiveVar(vname)}
                    onMouseLeave={() => setActiveVar(null)}
                  >
                    <div className='flex items-center gap-2'>
                      <span>{FIELD_ICONS[u.field] ?? '•'}</span>
                      <span style={{ color: '#6b7280' }}>{u.field}</span>
                      <span style={{ color: '#374151' }}>›</span>
                      <span style={{ color: '#9ca3af' }}>{u.key}</span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <span
                        style={{
                          color: isRemoved ? '#4b5563' : c.text,
                          fontWeight: 700,
                          textDecoration: isRemoved ? 'line-through' : 'none',
                        }}
                      >
                        {vname}
                      </span>
                      <button
                        onClick={() =>
                          isRemoved ? onRestore(subId) : onRemove(subId)
                        }
                        className='px-2 py-0.5 rounded text-[10px] transition-all'
                        style={
                          isRemoved
                            ? {
                                background: '#0f3028',
                                color: '#34d399',
                                border: '1px solid #065f46',
                              }
                            : {
                                background: '#2a0a0a',
                                color: '#f87171',
                                border: '1px solid #5c1a1a',
                              }
                        }
                      >
                        {isRemoved ? '↩ Restore' : '× Remove'}
                      </button>
                    </div>
                  </div>
                );
              }),
            )}
          </div>
        </div>
      )}

      <div className='md:col-span-2'>
        <SectionLabel color='#6b7280' label='URL' />
        <div
          className='mt-2 rounded-lg px-3 py-2.5 break-all leading-relaxed'
          style={{ background: '#0d1120', border: '1px solid #1e293b' }}
        >
          {req.url.split(/(\{\{[^}]+\}\})/).map((part, i) => {
            const m = part.match(/^\{\{(\w+)\}\}$/);
            if (m) {
              const c = getVarColor(m[1]);
              return (
                <span
                  key={i}
                  style={{
                    color: c.text,
                    fontWeight: 700,
                    background: c.fill,
                    padding: '1px 5px',
                    borderRadius: 4,
                    border: `1px solid ${c.stroke}44`,
                  }}
                >
                  {part}
                </span>
              );
            }
            return (
              <span key={i} style={{ color: '#4b5563' }}>
                {part}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── REQUEST NODE ─────────────────────────────────────────────────────────────

interface RequestNodeProps {
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
}: RequestNodeProps) {
  const ms = METHOD_STYLES[req.method] ?? METHOD_STYLES.GET;
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
          bg: '#0f3028',
          text: '#34d399',
          label: `✓ ${req.responseStatus ?? 200}`,
        }
      : req.runStatus === 'error'
        ? {
            bg: '#2a0a0a',
            text: '#f87171',
            label: `✗ ${req.responseStatus ?? 'ERR'}`,
          }
        : null;

  return (
    <div className='relative flex items-stretch'>
      {/* Spine */}
      <div
        className='flex flex-col items-center'
        style={{ width: 40, flexShrink: 0 }}
      >
        <div
          ref={nodeRef}
          className='w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-black z-10 border-2 shrink-0'
          style={{
            background: isHighlighted ? '#f59e0b1a' : '#0d1120',
            borderColor: isHighlighted ? '#f59e0b' : '#1e293b',
            color: isHighlighted ? '#f59e0b' : '#4b5563',
            transition: 'all .2s',
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
              background:
                'linear-gradient(to bottom, #1e293b 70%, transparent)',
              marginBottom: -2,
            }}
          />
        )}
      </div>

      {/* Card */}
      <div
        className='flex-1 mb-4 rounded-2xl border overflow-hidden'
        style={{
          background: isHighlighted ? '#0c1020' : '#0a0d1a',
          borderColor: isHighlighted ? '#f59e0b55' : '#1e293b',
          boxShadow: isHighlighted
            ? '0 0 0 1px #f59e0b22, 0 4px 24px #f59e0b0f'
            : '0 2px 12px rgba(0,0,0,0.5)',
          transition: 'all .2s',
        }}
      >
        {/* Header */}
        <div
          className='flex items-center gap-3 px-4 py-3 cursor-pointer select-none'
          onClick={onToggle}
        >
          <span
            className='text-[11px] font-black px-2.5 py-0.5 rounded-md shrink-0'
            style={{
              background: ms.bg,
              color: ms.text,
              border: `1px solid ${ms.border}`,
            }}
          >
            {req.method}
          </span>

          <div className='flex-1 min-w-0'>
            <div className='text-white font-semibold text-[13px] leading-tight truncate'>
              {req.name}
            </div>
            <div
              className='text-[11px] mt-0.5 truncate'
              style={{ color: '#374151' }}
            >
              {req.url.replace(/^https?:\/\/[^/]+/, '') || req.url}
            </div>
          </div>

          {statusBadge && (
            <span
              className='text-[11px] font-black px-2 py-0.5 rounded-md shrink-0'
              style={{
                background: statusBadge.bg,
                color: statusBadge.text,
                border: `1px solid ${statusBadge.text}33`,
              }}
            >
              {statusBadge.label}
              {req.duration ? ` · ${req.duration}ms` : ''}
            </span>
          )}

          {/* Variable pills */}
          <div
            className='flex flex-wrap gap-1 justify-end'
            style={{ maxWidth: 260 }}
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
                    color: isRemoved ? '#6b7280' : c.text,
                    borderColor: isRemoved ? '#37415155' : c.stroke + '55',
                    background: isRemoved ? '#37415111' : c.fill,
                    textDecoration: isRemoved ? 'line-through' : 'none',
                    opacity: isRemoved ? 0.6 : 1,
                  }}
                  title={
                    isRemoved
                      ? 'Removed — click to restore'
                      : 'Click to remove substitution'
                  }
                  onMouseEnter={() => setActiveVar(vname)}
                  onMouseLeave={() => setActiveVar(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    isRemoved ? onRestore(subId) : onRemove(subId);
                  }}
                >
                  → {vname} {isRemoved ? '↩' : '×'}
                </span>
              );
            })}
          </div>

          <div style={{ color: '#374151', fontSize: 11, flexShrink: 0 }}>
            {expanded ? '▲' : '▼'}
          </div>
        </div>

        {/* Expanded panel */}
        {expanded && (
          <div className='border-t' style={{ borderColor: '#1e293b' }}>
            <ExpandedDetail
              req={req}
              usedVars={usedVars}
              removed={removed}
              onRemove={onRemove}
              onRestore={onRestore}
              setActiveVar={setActiveVar}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── VARIABLE REGISTRY CARD ───────────────────────────────────────────────────

interface VariableCardProps {
  varData: VarData;
  isActive: boolean;
  onHover: () => void;
  onLeave: () => void;
}

function VariableCard({
  varData,
  isActive,
  onHover,
  onLeave,
}: VariableCardProps) {
  const c = getVarColor(varData.name);
  return (
    <div
      className='rounded-xl border p-3 cursor-default transition-all duration-200'
      style={{
        background: isActive ? c.fill : '#0a0d1a',
        borderColor: isActive ? c.stroke : '#1e293b',
        boxShadow: isActive ? `0 0 16px ${c.stroke}33` : 'none',
      }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      <div className='flex items-center justify-between mb-2'>
        <span className='font-bold text-sm' style={{ color: c.text }}>
          {varData.name}
        </span>
        <span
          className='text-[10px] font-bold px-2 py-0.5 rounded-full'
          style={{
            color: c.text,
            background: c.fill,
            border: `1px solid ${c.stroke}44`,
          }}
        >
          {c.label}
        </span>
      </div>

      {varData.extractedIn.length > 0 && (
        <div className='mb-2'>
          <div className='text-[10px] mb-1' style={{ color: '#4b5563' }}>
            Extracted in:
          </div>
          {varData.extractedIn.map((e, i) => (
            <div key={i} className='flex items-center gap-1.5 text-xs mb-0.5'>
              <span
                className='w-4 h-4 rounded flex items-center justify-center text-[9px] font-black'
                style={{
                  background: '#f59e0b1a',
                  color: '#f59e0b',
                  border: '1px solid #f59e0b44',
                }}
              >
                {e.order}
              </span>
              <span className='truncate' style={{ color: '#d1d5db' }}>
                {e.requestName}
              </span>
            </div>
          ))}
        </div>
      )}

      {varData.usedIn.length > 0 && (
        <div>
          <div className='text-[10px] mb-1' style={{ color: '#4b5563' }}>
            Used in:
          </div>
          <div className='space-y-0.5'>
            {varData.usedIn.map((u, i) => (
              <div
                key={i}
                className='flex items-center justify-between text-[11px]'
                style={{ opacity: u.removed ? 0.4 : 1 }}
              >
                <div className='flex items-center gap-1.5'>
                  <span
                    className='w-4 h-4 rounded flex items-center justify-center text-[9px] font-black'
                    style={{
                      background: '#38bdf81a',
                      color: '#38bdf8',
                      border: '1px solid #38bdf844',
                    }}
                  >
                    {u.order}
                  </span>
                  <span
                    className='truncate'
                    style={{ color: '#9ca3af', maxWidth: 80 }}
                  >
                    {u.requestName}
                  </span>
                </div>
                <span style={{ color: '#4b5563' }}>
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

// ─── FLOW VIEW ────────────────────────────────────────────────────────────────

interface FlowViewProps {
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
}: FlowViewProps) {
  const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [edges, setEdges] = useState<EdgeData[]>([]);
  const [wrapSize, setWrapSize] = useState({ w: 0, h: 0 });

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

  return (
    <div className='grid xl:grid-cols-[1fr_300px] gap-6 items-start'>
      {/* Pipeline */}
      <div>
        <div className='flex flex-wrap gap-2 mb-5 items-center'>
          {Object.entries(VAR_COLORS).map(([p, c]) => (
            <span
              key={p}
              className='cv-vpill'
              style={{
                color: c.text,
                borderColor: c.stroke + '55',
                background: c.fill,
              }}
            >
              {p}* {c.label}
            </span>
          ))}
          <span className='text-gray-700 text-xs ml-1'>
            · hover variable to trace · click → badge to remove
          </span>
        </div>

        <div ref={wrapRef} className='relative'>
          <PipelineEdges
            edges={edges}
            activeVar={activeVar}
            removed={removed}
            wrapSize={wrapSize}
          />
          <div className='flex flex-col' style={{ paddingRight: 220 }}>
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

      {/* Variable Registry */}
      <aside className='xl:sticky xl:top-16 max-h-[calc(100vh-80px)] flex flex-col gap-3'>
        <div className='text-[10px] text-gray-600 uppercase tracking-widest font-semibold'>
          Variable Registry
        </div>
        <div className='overflow-y-auto cv-scrollbar space-y-2 flex-1 pr-0.5'>
          {sortedVars.length === 0 && (
            <div className='text-center py-8 text-gray-700 text-xs'>
              No variables detected yet.
              <br />
              Add extractVariables to your requests.
            </div>
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
        <div
          className='text-[10px] text-gray-600 p-2.5 rounded-lg border border-white/[0.04]'
          style={{ background: 'rgba(255,255,255,0.015)' }}
        >
          💡 Hover a variable to highlight its data flow across the pipeline
        </div>
      </aside>
    </div>
  );
}

// ─── TABLE VIEW ───────────────────────────────────────────────────────────────

interface TableViewProps {
  requests: AdaptedRequest[];
  sortedVars: VarData[];
  removed: Record<string, boolean>;
  onRemove: (id: string) => void;
  onRestore: (id: string) => void;
}

function TableView({
  requests,
  sortedVars,
  removed,
  onRemove,
  onRestore,
}: TableViewProps) {
  const [filterVar, setFilterVar] = useState<string | null>(null);

  const allUsageRows = useMemo(() => {
    return requests.flatMap((req) => {
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
    });
  }, [requests]);

  const filteredRows = useMemo(
    () =>
      allUsageRows.filter(
        ({ usage }) => !filterVar || usage.variable === filterVar,
      ),
    [allUsageRows, filterVar],
  );

  return (
    <div className='space-y-8'>
      {/* Variable Overview */}
      <div>
        <div className='text-[10px] text-gray-600 uppercase tracking-widest mb-3'>
          Variable Overview
        </div>
        <div className='overflow-x-auto cv-scrollbar rounded-xl border border-white/[0.06]'>
          <table className='w-full text-xs'>
            <thead>
              <tr
                className='border-b border-white/[0.06]'
                style={{ background: 'rgba(255,255,255,0.02)' }}
              >
                {[
                  'Variable',
                  'Type',
                  'Extracted In',
                  'Path',
                  'Usages',
                  'Filter',
                ].map((h) => (
                  <th
                    key={h}
                    className='text-left p-3 text-gray-500 font-semibold'
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedVars.length === 0 && (
                <tr>
                  <td colSpan={6} className='p-6 text-center text-gray-700'>
                    No variables found
                  </td>
                </tr>
              )}
              {sortedVars.map((v) => {
                const c = getVarColor(v.name);
                return (
                  <tr
                    key={v.name}
                    className='border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors'
                    style={
                      filterVar === v.name ? { background: '#f59e0b08' } : {}
                    }
                  >
                    <td className='p-3 font-bold' style={{ color: c.text }}>
                      {v.name}
                    </td>
                    <td className='p-3'>
                      <span
                        className='px-2 py-0.5 rounded-full text-[10px] font-bold'
                        style={{
                          color: c.text,
                          background: c.fill,
                          border: `1px solid ${c.stroke}44`,
                        }}
                      >
                        {c.label}
                      </span>
                    </td>
                    <td className='p-3 text-gray-300'>
                      {v.extractedIn
                        .map((e) => `#${e.order} ${e.requestName}`)
                        .join(', ') || <span className='text-gray-700'>—</span>}
                    </td>
                    <td className='p-3 text-gray-500'>
                      {v.extractedIn.map((e) => e.path).join(', ') || (
                        <span className='text-gray-700'>—</span>
                      )}
                    </td>
                    <td className='p-3 text-gray-400'>{v.usedIn.length}</td>
                    <td className='p-3'>
                      <button
                        onClick={() =>
                          setFilterVar(filterVar === v.name ? null : v.name)
                        }
                        className='px-2 py-0.5 rounded text-[10px] transition-all'
                        style={
                          filterVar === v.name
                            ? {
                                background: '#f59e0b',
                                color: '#000',
                                fontWeight: 700,
                              }
                            : {
                                background: 'rgba(255,255,255,0.05)',
                                color: '#6b7280',
                              }
                        }
                      >
                        {filterVar === v.name ? 'Clear' : 'Filter'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* All Substitutions */}
      <div>
        <div className='text-[10px] text-gray-600 uppercase tracking-widest mb-3'>
          All Substitutions{' '}
          {filterVar && (
            <span style={{ color: '#f59e0b' }}>· filtered: {filterVar}</span>
          )}
        </div>
        <div className='overflow-x-auto cv-scrollbar rounded-xl border border-white/[0.06]'>
          <table className='w-full text-xs'>
            <thead>
              <tr
                className='border-b border-white/[0.06]'
                style={{ background: 'rgba(255,255,255,0.02)' }}
              >
                {[
                  '#',
                  'Request',
                  'Variable',
                  'Location',
                  'Key',
                  'Status',
                  'Action',
                ].map((h) => (
                  <th
                    key={h}
                    className='text-left p-3 text-gray-500 font-semibold'
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={7} className='p-6 text-center text-gray-700'>
                    No substitutions found
                  </td>
                </tr>
              )}
              {filteredRows.map(({ req, usage }) => {
                const c = getVarColor(usage.variable);
                const isRemoved = removed[usage.subId];
                return (
                  <tr
                    key={usage.subId}
                    className='border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors'
                    style={{ opacity: isRemoved ? 0.5 : 1 }}
                  >
                    <td className='p-3 text-gray-600'>{req.order}</td>
                    <td className='p-3 text-gray-200 font-medium'>
                      {req.name}
                    </td>
                    <td
                      className='p-3 font-bold'
                      style={{
                        color: isRemoved ? '#6b7280' : c.text,
                        textDecoration: isRemoved ? 'line-through' : 'none',
                      }}
                    >
                      {usage.variable}
                    </td>
                    <td className='p-3 text-gray-400'>
                      {FIELD_ICONS[usage.field] ?? ''} {usage.field}
                    </td>
                    <td className='p-3 text-gray-500'>{usage.key}</td>
                    <td className='p-3'>
                      {isRemoved ? (
                        <span
                          className='px-2 py-0.5 rounded-full text-[10px] font-bold'
                          style={{ background: '#2a0a0a', color: '#f87171' }}
                        >
                          Removed
                        </span>
                      ) : (
                        <span
                          className='px-2 py-0.5 rounded-full text-[10px] font-bold'
                          style={{ background: '#0f3028', color: '#34d399' }}
                        >
                          Active
                        </span>
                      )}
                    </td>
                    <td className='p-3'>
                      <button
                        onClick={() =>
                          isRemoved
                            ? onRestore(usage.subId)
                            : onRemove(usage.subId)
                        }
                        className='px-3 py-1 rounded text-[10px] transition-all'
                        style={
                          isRemoved
                            ? {
                                background: '#0f3028',
                                color: '#34d399',
                                border: '1px solid #065f46',
                              }
                            : {
                                background: '#2a0a0a',
                                color: '#f87171',
                                border: '1px solid #5c1a1a',
                              }
                        }
                      >
                        {isRemoved ? '↩ Restore' : '× Remove'}
                      </button>
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

// ─── MODAL ────────────────────────────────────────────────────────────────────

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
          maxWidth: '92vw',
          maxHeight: '92vh',
          width: '92vw',
          display: 'flex',
          flexDirection: 'column',
          background: '#070914',
          border: '1px solid #1e293b',
          color: '#e2e8f0',
          fontFamily: "'JetBrains Mono', monospace",
          padding: 0,
          overflow: 'hidden',
          gap: 0,
        }}
      >
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Syne:wght@600;800&display=swap');
          .cv-vpill {
            display: inline-flex;
            align-items: center;
            gap: 3px;
            padding: 1px 8px;
            border-radius: 99px;
            font-size: 10px;
            font-weight: 700;
            border: 1px solid;
            cursor: pointer;
            transition: all .15s;
            white-space: nowrap;
          }
          .cv-vpill:hover { filter: brightness(1.25); transform: scale(1.04); }
          @keyframes cv-flowAnim { to { stroke-dashoffset: -24; } }
          .cv-flow-animated { animation: cv-flowAnim 1s linear infinite; }
          @keyframes cv-fadeUp { from { opacity:0; transform:translateY(5px); } to { opacity:1; transform:translateY(0); } }
          .cv-fadein { animation: cv-fadeUp .2s ease; }
          .cv-scrollbar::-webkit-scrollbar { width: 3px; height: 3px; }
          .cv-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .cv-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 2px; }
        `}</style>

        {/* Topbar */}
        <div
          className='flex items-center justify-between px-5 py-3 border-b shrink-0'
          style={{ borderColor: '#1e293b' }}
        >
          <div className='flex items-center gap-3'>
            <div
              className='w-7 h-7 rounded-lg flex items-center justify-center text-black font-black text-xs'
              style={{ background: 'linear-gradient(135deg,#f59e0b,#ef4444)' }}
            >
              ⬡
            </div>
            <div>
              <span className='text-white font-semibold text-sm'>
                {chainName ?? 'Chain Viewer'}
              </span>
              <span className='text-gray-700 text-xs ml-2'>
                · {requests.length} requests · {sortedVars.length} variables
                {stats.total > 0 && ` · ${stats.success}/${stats.total} passed`}
              </span>
            </div>
          </div>

          <div className='flex gap-1.5'>
            {(['flow', 'table'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setViewMode(v)}
                className='text-xs px-4 py-1 rounded-md transition-all'
                style={
                  viewMode === v
                    ? { background: '#f59e0b', color: '#000', fontWeight: 700 }
                    : { background: 'rgba(255,255,255,0.05)', color: '#6b7280' }
                }
              >
                {v === 'flow' ? '⬡ Flow' : '≡ Table'}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div
          className='flex-1 overflow-auto px-5 py-4 cv-scrollbar'
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

// ─── TRIGGER BUTTON ───────────────────────────────────────────────────────────

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
