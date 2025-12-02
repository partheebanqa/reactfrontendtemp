'use client';

import { Trash2 } from 'lucide-react';
import type React from 'react';
import { useState, useRef, useEffect, useMemo } from 'react';

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

interface Variable {
  name: string;
  value: string;
}

interface SelectedVariable {
  name: string;
  path: string;
}

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
  variables?: Variable[];
  initialVariable?: SelectedVariable[];
  readOnly?: boolean;
  showSubstituteButton?: boolean;
}

export const JsonVariableSubstitution: React.FC<
  JsonVariableSubstitutionProps
> = ({
  value,
  onChange,
  onVariableSelect,
  onConfirmSubstitution,
  mode = 'json',
  variables = [],
  initialVariable = [],
  readOnly = false,
  showSubstituteButton = true,
}) => {
  const [deleteTargetPath, setDeleteTargetPath] = useState<string | null>(null);
  const [hoveredLine, setHoveredLine] = useState<number | null>(null);
  const [dropdownLine, setDropdownLine] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVariables, setSelectedVariables] =
    useState<SelectedVariable[]>(initialVariable);
  const [pendingSubstitutions, setPendingSubstitutions] = useState<
    PendingSubstitution[]
  >([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [dropdownAbove, setDropdownAbove] = useState<boolean>(false);
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const buttonRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

  const [confirmState, setConfirmState] = useState<
    | { open: true; kind: 'saved' | 'line'; path?: string; lineIndex?: number }
    | { open: false }
  >({ open: false });

  useEffect(() => {
    // Always sync with initialVariable, even if it's empty
    setSelectedVariables(initialVariable || []);
  }, [initialVariable]);

  const lines = value.split('\n');

  const textareaHeight = lines.length * 24;

  const filteredVariables = useMemo(() => {
    if (!searchTerm.trim()) return variables;
    const lower = searchTerm.toLowerCase();
    return variables.filter(
      (v) =>
        v.name.toLowerCase().includes(lower) ||
        v.value.toLowerCase().includes(lower)
    );
  }, [searchTerm, variables]);

  const extractPathFromLine = (lineIndex: number): string => {
    const line = lines[lineIndex];
    const keyMatch = line.match(/"([^"]+)"\s*:/);
    if (keyMatch) {
      return keyMatch[1];
    }
    return '';
  };

  const getAlreadySubstitutedVariable = (lineIndex: number): string | null => {
    const line = lines[lineIndex];
    const substitutionMatch = line.match(
      /\/\/\s*substituted with\s*{{\s*(\w+)\s*}}/
    );
    return substitutionMatch ? substitutionMatch[1] : null;
  };

  const getPendingSubstitution = (lineIndex: number): string | null => {
    const pending = pendingSubstitutions.find((p) => p.lineIndex === lineIndex);
    return pending ? pending.variableName : null;
  };

  const getSelectedVariableForLine = (lineIndex: number): string | null => {
    const path = extractPathFromLine(lineIndex);
    const found = selectedVariables?.find((v) => v.path === path);
    return found ? found.name : null;
  };

  const handleSubstituteClick = (lineIndex: number) => {
    if (dropdownLine === lineIndex) {
      setDropdownLine(null);
      setDropdownPosition(null);
      return;
    }

    const button = buttonRefs.current.get(lineIndex);
    if (button) {
      const rect = button.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;

      const dropdownHeight = 250;

      const shouldShowAbove =
        spaceBelow < dropdownHeight && spaceAbove > spaceBelow;
      setDropdownAbove(shouldShowAbove);

      const top = shouldShowAbove ? rect.top - dropdownHeight : rect.bottom + 4;

      setDropdownPosition({
        top,
        left: rect.right - 288,
      });
    }

    setDropdownLine(lineIndex);
    setSearchTerm('');
  };

  const handleVariableSelect = (variable: string, lineIndex: number) => {
    const path = extractPathFromLine(lineIndex);

    setSelectedVariables((prev) => {
      const filtered = prev.filter((v) => v.path !== path);
      const updated = [...filtered, { name: variable, path }];
      onVariableSelect?.(updated);
      return updated;
    });

    setDropdownLine(null);
  };

  const handleClearPendingSubstitution = (lineIndex: number) => {
    setPendingSubstitutions((prev) =>
      prev.filter((p) => p.lineIndex !== lineIndex)
    );
  };

  const handleConfirmSubstitutions = () => {
    if (pendingSubstitutions.length > 0) {
      pendingSubstitutions.forEach((sub) => {
        const path = extractPathFromLine(sub.lineIndex);
        setSelectedVariables((prev) => {
          const filtered = prev.filter((v) => v.path !== path);
          return [...filtered, { name: sub.variableName, path }];
        });
      });

      const updatedVars = pendingSubstitutions.map((sub) => ({
        name: sub.variableName,
        path: extractPathFromLine(sub.lineIndex),
      }));

      setSelectedVariables((prev) => {
        const allPaths = new Set(prev.map((v) => v.path));
        const newVars = updatedVars.filter((v) => !allPaths.has(v.path));
        const updated = [...prev, ...newVars];
        onVariableSelect?.(updated);
        return updated;
      });

      onConfirmSubstitution?.(pendingSubstitutions);
      setPendingSubstitutions([]);
    }
  };

  const handleCancelSubstitutions = () => {
    setPendingSubstitutions([]);
  };

  const handleRemoveSubstitution = (lineIndex: number) => {
    const line = lines[lineIndex];
    const updatedLine = line.replace(
      /\s*\/\/\s*substituted with\s*{{\s*\w+\s*}}/,
      ''
    );
    const updatedLines = [...lines];
    updatedLines[lineIndex] = updatedLine;
    onChange?.(updatedLines.join('\n'));
  };

  const handleClearSavedVariable = (path: string) => {
    setSelectedVariables((prev) => {
      const updated = prev.filter((v) => v.path !== path);
      onVariableSelect?.(updated);
      return updated;
    });
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setDropdownLine(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const confirmDeleteSaved = (path: string) =>
    setConfirmState({ open: true, kind: 'saved', path });

  const confirmDeleteLine = (lineIndex: number) =>
    setConfirmState({ open: true, kind: 'line', lineIndex });

  const performConfirmedDelete = () => {
    if (!confirmState.open) return;
    if (confirmState.kind === 'saved' && confirmState.path) {
      handleClearSavedVariable(confirmState.path);
    } else if (
      confirmState.kind === 'line' &&
      typeof confirmState.lineIndex === 'number'
    ) {
      handleRemoveSubstitution(confirmState.lineIndex);
    }
    setConfirmState({ open: false });
  };

  return (
    <div ref={containerRef} className='relative w-full space-y-3'>
      <div className='relative flex border border-border rounded-md overflow-hidden bg-card focus-within:ring-2 focus-within:ring-ring focus-within:border-ring'>
        {/* Line numbers column */}
        <div
          className='flex flex-col bg-muted border-r border-border py-2 px-2 text-right select-none'
          style={{ minWidth: '2.5rem' }}
        >
          {lines.map((_, index) => (
            <div
              key={index}
              className={`h-6 text-[11px] font-mono leading-6 transition-colors ${
                showSubstituteButton && hoveredLine === index
                  ? 'text-foreground bg-primary/10 rounded'
                  : 'text-muted-foreground'
              }`}
            >
              {index + 1}
            </div>
          ))}
        </div>

        {/* Textarea with auto-sizing */}
        <div className='relative flex-1'>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            readOnly={readOnly}
            className='w-full p-2 pl-3 pr-48 font-mono text-sm bg-transparent text-foreground focus:outline-none resize-none leading-6'
            style={{
              fontFamily:
                "'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace",
              height: `${textareaHeight + 16}px`,
              overflow: 'hidden',
            }}
          />

          {/* Hover underline overlay */}
          <div className='absolute top-0 left-0 right-0 bottom-0 pointer-events-none pt-2'>
            {lines.map((line, index) => {
              const hasKey = /"[^"]+"\s*:/.test(line);
              const selectedVar = getSelectedVariableForLine(index);
              const alreadySubstituted = getAlreadySubstitutedVariable(index);
              const hasVariable = selectedVar || alreadySubstituted;

              const shouldShowUnderline =
                showSubstituteButton &&
                (hoveredLine === index || hasVariable) &&
                hasKey;

              return (
                <div
                  key={`underline-${index}`}
                  className={`h-6 transition-colors ${
                    shouldShowUnderline
                      ? 'border-t border-b border-primary/40'
                      : ''
                  }`}
                />
              );
            })}
          </div>

          {/* Variable substitution overlay on the right */}
          <div className='absolute top-0 right-0 bottom-0 w-44 pointer-events-none pt-2'>
            {lines.map((line, index) => {
              const hasKey = /"[^"]+"\s*:/.test(line);
              const alreadySubstituted = getAlreadySubstitutedVariable(index);
              const selectedVar = getSelectedVariableForLine(index);

              return (
                <div
                  key={index}
                  className='relative h-6 flex items-center pointer-events-auto'
                  onMouseEnter={() =>
                    showSubstituteButton && setHoveredLine(index)
                  }
                  onMouseLeave={() =>
                    showSubstituteButton && setHoveredLine(null)
                  }
                >
                  {hasKey &&
                    showSubstituteButton &&
                    (selectedVar ||
                      alreadySubstituted ||
                      hoveredLine === index) && (
                      <div className='pointer-events-auto ml-auto mr-1 flex items-center gap-1'>
                        {selectedVar && !alreadySubstituted ? (
                          <>
                            <span
                              className='px-2 py-0.5 text-white text-[11px] rounded font-mono whitespace-nowrap font-medium'
                              style={{
                                backgroundColor:
                                  'rgb(19 111 176 / var(--tw-bg-opacity))',
                              }}
                            >
                              {selectedVar}
                            </span>
                            <button
                              onClick={() =>
                                confirmDeleteSaved(extractPathFromLine(index))
                              }
                              className='p-0.5 bg-destructive/10 hover:bg-destructive/20 rounded transition-colors'
                              title='Remove variable'
                            >
                              <Trash2 className='w-3 h-3 text-destructive' />
                            </button>
                          </>
                        ) : alreadySubstituted ? (
                          <>
                            <span className='px-2 py-0.5 bg-success text-success-foreground text-[11px] rounded font-mono whitespace-nowrap font-medium'>
                              {alreadySubstituted}
                            </span>
                            <button
                              onClick={() => confirmDeleteLine(index)}
                              className='p-0.5 bg-destructive/10 hover:bg-destructive/20 rounded transition-colors'
                              title='Remove substitution'
                            >
                              <Trash2 className='w-3 h-3 text-destructive' />
                            </button>
                          </>
                        ) : hoveredLine === index ? (
                          <button
                            ref={(el) => {
                              if (el) buttonRefs.current.set(index, el);
                              else buttonRefs.current.delete(index);
                            }}
                            onClick={() => handleSubstituteClick(index)}
                            className='px-2 py-0.5 bg-[rgb(19,111,176)] hover:bg-[rgb(15,90,144)] text-white text-[11px] rounded transition-colors flex items-center justify-center whitespace-nowrap font-medium'
                          >
                            Substitute Variable
                          </button>
                        ) : null}
                      </div>
                    )}

                  {showSubstituteButton &&
                    dropdownLine === index &&
                    dropdownPosition && (
                      <div
                        className='fixed w-72 bg-popover border border-border rounded-md shadow-lg text-sm pointer-events-auto'
                        style={{
                          top: `${dropdownPosition.top}px`,
                          left: `${dropdownPosition.left}px`,
                          zIndex: 9999,
                        }}
                      >
                        {/* Search bar */}
                        <div className='p-2 border-b border-border'>
                          <input
                            type='text'
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder='Search variables...'
                            className='w-full bg-background border border-input rounded px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring'
                            autoFocus
                          />
                        </div>

                        {/* List of variables */}
                        <div className='max-h-48 overflow-y-auto scrollbar-thin'>
                          {filteredVariables.length > 0 ? (
                            filteredVariables.map((v) => (
                              <div
                                key={v.name}
                                className='flex justify-between items-center px-3 py-2 hover:bg-accent cursor-pointer border-b border-border last:border-b-0'
                                onClick={() =>
                                  handleVariableSelect(v.name, index)
                                }
                              >
                                <span className='font-mono text-foreground text-xs font-medium'>
                                  {v.name}
                                </span>
                                <span className='text-muted-foreground text-xs truncate ml-2 max-w-[140px]'>
                                  {v.value}
                                </span>
                              </div>
                            ))
                          ) : (
                            <div className='px-3 py-2 text-muted-foreground text-xs text-center'>
                              No results found
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

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
    </div>
  );
};

export default JsonVariableSubstitution;
