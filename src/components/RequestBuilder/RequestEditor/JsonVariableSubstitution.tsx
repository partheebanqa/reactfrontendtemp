'use client';

import { Trash2 } from 'lucide-react';
import type React from 'react';
import { useState, useRef, useEffect, useMemo } from 'react';
import VariablePicker from '@/components/Shared/VariablePicker';

import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { SelectedVariable, Variable } from '@/shared/types/request';

// ─── Types ────────────────────────────────────────────────────────────
interface PendingSubstitution {
  lineIndex: number;
  variableName: string;
}

interface JsonVariableSubstitutionProps {
  value: string;
  onChange?: (value: string) => void;
  onVariableSelect?: (variables: SelectedVariable[]) => void;
  onConfirmSubstitution?: (substitutions: PendingSubstitution[]) => void;
  mode?: 'json' | 'raw';
  staticVariables?: Variable[];
  dynamicVariables?: Variable[];
  initialVariable?: SelectedVariable[];
  readOnly?: boolean;
  showSubstituteButton?: boolean;
}

const LINE_H = 24;

// ─── Syntax-colorised line renderer ──────────────────────────────────
// NOTE: Token colors are kept as inline styles because they are
// design-specific hex values not available as standard Tailwind utilities.
function TokenizedLine({ raw }: { raw: string }) {
  const kvStr = raw.match(
    /^(\s*)("(?:[^"\\]|\\.)*")(\s*:\s*)("(?:[^"\\]|\\.)*")(,?\s*)$/,
  );
  const kvNum = raw.match(
    /^(\s*)("(?:[^"\\]|\\.)*")(\s*:\s*)(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)(,?\s*)$/,
  );
  const kvBool = raw.match(
    /^(\s*)("(?:[^"\\]|\\.)*")(\s*:\s*)(true|false|null)(,?\s*)$/,
  );
  const kvObj = raw.match(/^(\s*)("(?:[^"\\]|\\.)*")(\s*:\s*)(\[|\{)(,?\s*)$/);

  const TC = {
    key: '#9cdcfe',
    strVal: '#ce9178',
    numVal: '#b5cea8',
    boolNull: '#569cd6',
    punct: '#808080',
    braces: '#ffd700',
  };

  const render = (parts: { t: string; c: string }[]) => (
    <span>
      {parts.map((p, i) => (
        <span key={i} style={{ color: p.c }}>
          {p.t}
        </span>
      ))}
    </span>
  );

  if (kvStr)
    return render([
      { t: kvStr[1], c: TC.punct },
      { t: kvStr[2], c: TC.key },
      { t: kvStr[3], c: TC.punct },
      { t: kvStr[4], c: TC.strVal },
      { t: kvStr[5], c: TC.punct },
    ]);
  if (kvNum)
    return render([
      { t: kvNum[1], c: TC.punct },
      { t: kvNum[2], c: TC.key },
      { t: kvNum[3], c: TC.punct },
      { t: kvNum[4], c: TC.numVal },
      { t: kvNum[5], c: TC.punct },
    ]);
  if (kvBool)
    return render([
      { t: kvBool[1], c: TC.punct },
      { t: kvBool[2], c: TC.key },
      { t: kvBool[3], c: TC.punct },
      { t: kvBool[4], c: TC.boolNull },
      { t: kvBool[5], c: TC.punct },
    ]);
  if (kvObj)
    return render([
      { t: kvObj[1], c: TC.punct },
      { t: kvObj[2], c: TC.key },
      { t: kvObj[3], c: TC.punct },
      { t: kvObj[4], c: TC.braces },
      { t: kvObj[5], c: TC.punct },
    ]);

  // structural lines — colour braces only
  const colored = raw
    .replace(/[{}\[\]]/g, (m) => `<BRACE>${m}</BRACE>`)
    .replace(/,\s*$/, (m) => `<PUNCT>${m}</PUNCT>`);
  const parts: { t: string; c: string }[] = [];
  const re = /<(BRACE|PUNCT)>(.*?)<\/\1>/g;
  let last = 0,
    m: RegExpExecArray | null;
  while ((m = re.exec(colored)) !== null) {
    if (m.index > last)
      parts.push({ t: colored.slice(last, m.index), c: TC.punct });
    parts.push({ t: m[2], c: m[1] === 'BRACE' ? TC.braces : TC.punct });
    last = m.index + m[0].length;
  }
  if (last < colored.length)
    parts.push({ t: colored.slice(last), c: TC.punct });
  if (parts.length === 0)
    return <span style={{ color: TC.punct }}>{raw || ' '}</span>;
  return render(parts);
}

// ─── JSON validation ──────────────────────────────────────────────────
function validateJson(text: string): {
  valid: boolean;
  errorLine: number | null;
  errorMsg: string | null;
} {
  try {
    JSON.parse(text);
    return { valid: true, errorLine: null, errorMsg: null };
  } catch (e: any) {
    let line: number | null = null;
    const lineMatch = e.message?.match(/line\s+(\d+)/i);
    const posMatch = e.message?.match(/position\s+(\d+)/i);
    if (lineMatch) {
      line = parseInt(lineMatch[1], 10) - 1;
    } else if (posMatch) {
      const pos = parseInt(posMatch[1], 10);
      line = text.substring(0, pos).split('\n').length - 1;
    } else {
      const rawLines = text.split('\n');
      let acc = '';
      for (let i = 0; i < rawLines.length; i++) {
        acc += rawLines[i] + '\n';
        try {
          JSON.parse(acc + '}');
        } catch {
          line = i;
          break;
        }
      }
    }
    return {
      valid: false,
      errorLine: line,
      errorMsg: e.message ?? 'Invalid JSON',
    };
  }
}

// ─── Component ────────────────────────────────────────────────────────
export const JsonVariableSubstitution: React.FC<
  JsonVariableSubstitutionProps
> = ({
  value,
  onChange,
  onVariableSelect,
  onConfirmSubstitution,
  mode = 'json',
  staticVariables = [],
  dynamicVariables = [],
  initialVariable = [],
  readOnly = false,
  showSubstituteButton = true,
}) => {
    const [hoveredLine, setHoveredLine] = useState<number | null>(null);
    const [dropdownLine, setDropdownLine] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedVariables, setSelectedVariables] =
      useState<SelectedVariable[]>(initialVariable);
    const [pendingSubstitutions, setPendingSubstitutions] = useState<
      PendingSubstitution[]
    >([]);
    const [editorFocused, setEditorFocused] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState<{
      top: number;
      left: number;
    } | null>(null);
    const [confirmState, setConfirmState] = useState<
      | {
        open: true;
        kind: 'saved' | 'line';
        path?: string;
        lineIndex?: number;
      }
      | { open: false }
    >({ open: false });

    const containerRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const buttonRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

    useEffect(() => {
      setSelectedVariables(initialVariable || []);
    }, [initialVariable]);

    useEffect(() => {
      const handler = (e: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(e.target as Node)
        ) {
          setDropdownLine(null);
          setDropdownPosition(null);
        }
      };
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }, []);

    const syncScroll = () => {
      if (overlayRef.current && textareaRef.current) {
        overlayRef.current.scrollTop = textareaRef.current.scrollTop;
        overlayRef.current.scrollLeft = textareaRef.current.scrollLeft;
      }
    };

    const lines = value.split('\n');

    const {
      valid: isValidJson,
      errorLine,
      errorMsg,
    } = useMemo(() => validateJson(value), [value]);

    const allVariables = useMemo(
      () => [
        ...staticVariables.map((v) => ({ ...v, type: 'static' as const })),
        ...dynamicVariables.map((v) => ({ ...v, type: 'dynamic' as const })),
      ],
      [staticVariables, dynamicVariables],
    );

    const filteredVariables = useMemo(() => {
      if (!searchTerm.trim()) return allVariables;
      const lower = searchTerm.toLowerCase();
      return allVariables.filter(
        (v) =>
          v.name.toLowerCase().includes(lower) ||
          v.value.toLowerCase().includes(lower),
      );
    }, [searchTerm, allVariables]);

    // ── Helpers ─────────────────────────────────────────────────────
    const extractPathFromLine = (lineIndex: number): string => {
      const m = lines[lineIndex]?.match(/"([^"]+)"\s*:/);
      return m?.[1] ?? '';
    };

    const getAlreadySubstitutedVariable = (lineIndex: number): string | null => {
      const m = lines[lineIndex]?.match(
        /\/\/\s*substituted with\s*{{\s*(\w+)\s*}}/,
      );
      return m?.[1] ?? null;
    };

    const getSelectedVariableForLine = (lineIndex: number): string | null => {
      const path = extractPathFromLine(lineIndex);
      return selectedVariables?.find((v) => v.path === path)?.name ?? null;
    };

    const hasKey = (line: string) => /"[^"]+"\s*:/.test(line);

    // ── Variable actions ─────────────────────────────────────────────
    const handleSubstituteClick = (lineIndex: number) => {
      if (dropdownLine === lineIndex) {
        setDropdownLine(null);
        setDropdownPosition(null);
        return;
      }
      const button = buttonRefs.current.get(lineIndex);
      if (button) {
        const rect = button.getBoundingClientRect();
        const dropdownHeight = 260;
        const spaceBelow = window.innerHeight - rect.bottom;
        const shouldShowAbove =
          spaceBelow < dropdownHeight && rect.top > spaceBelow;
        const top = shouldShowAbove ? rect.top - dropdownHeight : rect.bottom + 4;
        setDropdownPosition({ top, left: rect.right - 288 });
      }
      setDropdownLine(lineIndex);
      setSearchTerm('');
    };

    const handleVariableSelect = (variable: string, lineIndex: number) => {
      const path = extractPathFromLine(lineIndex);
      setSelectedVariables((prev) => {
        const updated = [
          ...prev.filter((v) => v.path !== path),
          { name: variable, path },
        ];
        onVariableSelect?.(updated);
        return updated;
      });
      setDropdownLine(null);
      setDropdownPosition(null);
    };

    const handleClearSavedVariable = (path: string) => {
      setSelectedVariables((prev) => {
        const updated = prev.filter((v) => v.path !== path);
        onVariableSelect?.(updated);
        return updated;
      });
    };

    const handleRemoveSubstitution = (lineIndex: number) => {
      const updatedLines = [...lines];
      updatedLines[lineIndex] = lines[lineIndex].replace(
        /\s*\/\/\s*substituted with\s*{{\s*\w+\s*}}/,
        '',
      );
      onChange?.(updatedLines.join('\n'));
    };

    const confirmDeleteSaved = (path: string) =>
      setConfirmState({ open: true, kind: 'saved', path });
    const confirmDeleteLine = (lineIndex: number) =>
      setConfirmState({ open: true, kind: 'line', lineIndex });

    const performConfirmedDelete = () => {
      if (!confirmState.open) return;
      if (confirmState.kind === 'saved' && confirmState.path)
        handleClearSavedVariable(confirmState.path);
      if (confirmState.kind === 'line' && confirmState.lineIndex != null)
        handleRemoveSubstitution(confirmState.lineIndex);
      setConfirmState({ open: false });
    };

    const syncCursorLine = () => {
      const ta = textareaRef.current;
      if (!ta) return;
      const n = ta.value.substring(0, ta.selectionStart).split('\n').length - 1;
      setHoveredLine(n);
    };

    // ── Render ───────────────────────────────────────────────────────
    return (
      <div ref={containerRef} className='relative w-full'>
        {/* ── Column headers ── */}
        <div
          className={[
            'grid bg-[#252526] border-b border-[#3c3c3c]',
            showSubstituteButton ? 'grid-cols-[70%_30%]' : 'grid-cols-1',
          ].join(' ')}
        >
          <div
            className={[
              'flex items-center gap-2 px-3 py-[3px]',
              showSubstituteButton ? 'border-r border-[#3c3c3c]' : '',
            ].join(' ')}
          >
            <span className='text-[10px] text-cyan-400 uppercase tracking-[0.08em]'>
              Editor
            </span>

            {mode === 'json' ||
              (mode === 'raw' && (
                <div
                  className={[
                    'flex items-center gap-[5px] px-2 py-0.5 rounded border transition-all duration-200',
                    isValidJson
                      ? 'bg-green-500/[0.08] border-green-500/25'
                      : 'bg-red-500/[0.08] border-red-500/25',
                  ].join(' ')}
                >
                  <span
                    className={[
                      'w-[7px] h-[7px] rounded-full shrink-0 transition-all duration-200',
                      isValidJson
                        ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]'
                        : 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]',
                    ].join(' ')}
                  />
                  <span
                    className={[
                      'text-[10px] font-semibold tracking-wide',
                      isValidJson ? 'text-green-400' : 'text-red-400',
                    ].join(' ')}
                  >
                    {isValidJson ? 'Valid JSON' : 'Invalid JSON'}
                  </span>
                </div>
              ))}
          </div>

          {showSubstituteButton && (
            <div className='px-[10px] py-[3px] text-[10px] text-cyan-400 uppercase tracking-[0.08em]'>
              Substitute
            </div>
          )}
        </div>

        {/* ── Column headers ── */}

        {/* ── Split panes ── */}
        <div className='flex relative'>
          {/* ══ LEFT — editor ════════════════════════════════════════ */}
          <div
            className={[
              'flex relative bg-[#1e1e1e]',
              showSubstituteButton
                ? 'w-[70%] border-r border-[#3c3c3c]'
                : 'w-full',
            ].join(' ')}
            style={{ minHeight: `${lines.length * LINE_H + 20}px` }}
          >
            {/* Line number gutter */}
            <div className='w-[42px] shrink-0 bg-[#1e1e1e] border-r border-[#2b2b2b] pt-[10px] select-none relative z-[2]'>
              {lines.map((_, i) => {
                const isErr = !isValidJson && errorLine === i;
                const isHov = hoveredLine === i;
                return (
                  <div
                    key={i}
                    className={[
                      'relative text-right pr-2 text-[11px] transition-colors duration-100',
                      isErr
                        ? 'text-red-400 bg-red-500/[0.12]'
                        : isHov
                          ? 'text-[#c6c6c6]'
                          : 'text-[#858585]',
                    ].join(' ')}
                    style={{ height: `${LINE_H}px`, lineHeight: `${LINE_H}px` }}
                  >
                    {isErr && (
                      <span className='absolute left-1 top-1/2 -translate-y-1/2 text-[10px]'>
                        ⚠
                      </span>
                    )}
                    {i + 1}
                  </div>
                );
              })}
            </div>

            {/* Row highlight layer — sits behind textarea */}
            <div className='absolute left-[42px] right-0 top-[10px] pointer-events-none z-0'>
              {lines.map((_, i) => {
                const isErr = !isValidJson && errorLine === i;
                const isHov = hoveredLine === i;
                return (
                  <div
                    key={i}
                    className={[
                      'transition-all duration-100 border-l-2',
                      isErr
                        ? 'bg-red-500/10 border-l-red-500'
                        : isHov
                          ? 'bg-white/[0.04] border-l-[#3794ff]'
                          : 'border-l-transparent',
                    ].join(' ')}
                    style={{ height: `${LINE_H}px` }}
                  />
                );
              })}
            </div>

            {/* Syntax-coloured overlay — visible when editor NOT focused */}
            <div
              ref={overlayRef}
              onClick={() => {
                textareaRef.current?.focus();
                setEditorFocused(true);
              }}
              className={[
                'absolute left-[42px] right-0 top-0 bottom-0 pt-[10px] pl-3 pr-2 overflow-y-auto overflow-x-hidden cursor-text transition-opacity',
                editorFocused
                  ? 'z-0 opacity-0 pointer-events-none'
                  : 'z-[2] opacity-100 pointer-events-auto',
              ].join(' ')}
            >
              {lines.map((line, i) => {
                const isErr = !isValidJson && errorLine === i;
                return (
                  <div
                    key={i}
                    className={[
                      'relative whitespace-pre',
                      isErr ? 'underline decoration-wavy decoration-red-500' : '',
                    ].join(' ')}
                    style={{
                      height: `${LINE_H}px`,
                      lineHeight: `${LINE_H}px`,
                      fontFamily:
                        "'Monaco','Menlo','Consolas','source-code-pro',monospace",
                      fontSize: '13px',
                      textDecorationSkipInk: 'none',
                    }}
                    onMouseEnter={() => showSubstituteButton && setHoveredLine(i)}
                    onMouseLeave={() =>
                      showSubstituteButton && setHoveredLine(null)
                    }
                  >
                    <TokenizedLine raw={line} />
                    {isErr && errorMsg && hoveredLine === i && (
                      <span className='absolute left-0 top-full z-10 pointer-events-none max-w-[400px] overflow-hidden text-ellipsis whitespace-nowrap px-2 py-0.5 rounded-b text-[10px] text-red-300 bg-[#3b1111] border border-red-500/40'>
                        {errorMsg}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Actual editable textarea */}
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange?.(e.target.value)}
              onFocus={() => setEditorFocused(true)}
              onBlur={() => setEditorFocused(false)}
              onClick={syncCursorLine}
              onKeyUp={syncCursorLine}
              onScroll={syncScroll}
              readOnly={readOnly}
              spellCheck={false}
              className={[
                'flex-1 pt-[10px] pl-3 pr-2 bg-transparent border-none outline-none resize-none overflow-hidden',
                editorFocused
                  ? 'relative z-[2] text-[#d4d4d4]'
                  : 'relative z-[1] text-transparent',
              ].join(' ')}
              style={{
                fontSize: '13px',
                lineHeight: `${LINE_H}px`,
                fontFamily:
                  "'Monaco','Menlo','Consolas','source-code-pro',monospace",
                caretColor: '#aeafad',
                minHeight: `${lines.length * LINE_H + 20}px`,
              }}
            />
          </div>

          {/* ══ RIGHT 30% — substitute panel ═════════════════════════ */}
          {showSubstituteButton && (
            <div
              className='w-[30%] bg-[#252526]'
              style={{ minHeight: `${lines.length * LINE_H + 20}px` }}
            >
              <div className='pt-[10px]'>
                {lines.map((line, i) => {
                  if (!hasKey(line)) {
                    return <div key={i} style={{ height: `${LINE_H}px` }} />;
                  }

                  const alreadySubstituted = getAlreadySubstitutedVariable(i);
                  const selectedVar = getSelectedVariableForLine(i);
                  const varInfo = selectedVar
                    ? allVariables.find((v) => v.name === selectedVar)
                    : null;
                  const isHov = hoveredLine === i;
                  const isErrRow = !isValidJson && errorLine === i;
                  const isOpen = dropdownLine === i;

                  return (
                    <div
                      key={i}
                      onMouseEnter={() => setHoveredLine(i)}
                      onMouseLeave={() => {
                        if (!isOpen) setHoveredLine(null);
                      }}
                      className={[
                        'flex items-center justify-end pr-2 gap-1 border-b border-white/[0.025] transition-all duration-100 relative border-l-2',
                        isErrRow
                          ? 'border-l-red-500 bg-red-500/[0.07]'
                          : isHov
                            ? 'border-l-[#3794ff] bg-[rgba(55,148,255,0.10)]'
                            : 'border-l-transparent',
                      ].join(' ')}
                      style={{ height: `${LINE_H}px` }}
                    >
                      {/* Already-substituted-in-text badge */}
                      {/* Selected (saved) variable badge */}
                      {selectedVar && !alreadySubstituted && (
                        <>
                          <span
                            className={[
                              'text-[9px] px-[6px] py-0.5 rounded border uppercase tracking-[0.05em] font-medium whitespace-nowrap',
                              varInfo?.type === 'dynamic'
                                ? 'bg-[rgba(139,92,246,0.18)] border-[rgba(139,92,246,0.35)] text-[#c4b5fd]'
                                : 'bg-[rgba(14,165,233,0.15)] border-[rgba(14,165,233,0.3)] text-[#7dd3fc]',
                            ].join(' ')}
                          >
                            {selectedVar}
                          </span>
                          {isHov && (
                            <button
                              onClick={() =>
                                confirmDeleteSaved(extractPathFromLine(i))
                              }
                              className='p-0.5 hover:bg-red-500/20 rounded transition-colors'
                              title='Remove variable'
                            >
                              <Trash2 className='w-3 h-3 text-red-400' />
                            </button>
                          )}
                        </>
                      )}
                      {/* Substitute Variable trigger button */}
                      {!selectedVar && !alreadySubstituted && isHov && (
                        <Button
                          ref={(el) => {
                            if (el) buttonRefs.current.set(i, el);
                            else buttonRefs.current.delete(i);
                          }}
                          onClick={() => handleSubstituteClick(i)}
                          size='sm'
                          className='bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-[10px] whitespace-nowrap h-5 px-[9px] py-0.5'
                        >
                          Substitute Variable
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── Floating variable picker dropdown ── */}
        {showSubstituteButton && dropdownLine !== null && dropdownPosition && (
          <div
            className='fixed z-[9999]'
            style={{
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
            }}
          >
            <VariablePicker
              staticVariables={staticVariables.map((v) => ({
                name: v.name,
                value: String((v as any).value ?? (v as any).initialValue ?? ''),
              }))}
              dynamicVariables={dynamicVariables.map((v) => ({
                name: v.name,
                value: String((v as any).value ?? (v as any).initialValue ?? ''),
              }))}
              bindingLabel={extractPathFromLine(dropdownLine)}
              onSelect={(variableName) =>
                handleVariableSelect(variableName, dropdownLine)
              }
            />
          </div>
        )}

        {/* ── Delete confirmation dialog ── */}
        {showSubstituteButton && (
          <AlertDialog
            open={confirmState.open}
            onOpenChange={(open) => {
              if (!open) setConfirmState({ open: false });
            }}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {confirmState.open && confirmState.kind === 'saved'
                    ? 'Remove substituted variable?'
                    : 'Remove substitution from this line?'}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {confirmState.open &&
                    confirmState.kind === 'saved' &&
                    confirmState.path
                    ? `This will remove the variable mapping for "${confirmState.path}". This action cannot be undone.`
                    : 'This will remove the in-line substitution comment. This action cannot be undone.'}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <Button onClick={performConfirmedDelete}>Delete</Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        <style>{`
          @keyframes jvs-slideDown {
            from { opacity: 0; transform: translateY(-4px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    );
  };

export default JsonVariableSubstitution;
