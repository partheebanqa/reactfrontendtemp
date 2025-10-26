'use client';

import { Trash2 } from 'lucide-react';
import type React from 'react';
import { useState, useRef, useEffect, useMemo } from 'react';

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
  onVariableSelect?: (variable: SelectedVariable | null) => void;
  onConfirmSubstitution?: (substitutions: PendingSubstitution[]) => void;
  mode?: 'json' | 'raw';
  variables?: Variable[];
  initialVariable?: SelectedVariable | null;
  readOnly?: boolean;
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
  initialVariable = null,
  readOnly = false,
}) => {
  const [hoveredLine, setHoveredLine] = useState<number | null>(null);
  const [dropdownLine, setDropdownLine] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVariable, setSelectedVariable] =
    useState<SelectedVariable | null>(initialVariable);
  const [pendingSubstitutions, setPendingSubstitutions] = useState<
    PendingSubstitution[]
  >([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  useEffect(() => {
    if (initialVariable) {
      setSelectedVariable(initialVariable);
    }
  }, [initialVariable]);

  const lines = value.split('\n');

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

  const handleSubstituteClick = (lineIndex: number) => {
    setDropdownLine(dropdownLine === lineIndex ? null : lineIndex);
    setSearchTerm('');
  };

  const handleVariableSelect = (variable: string, lineIndex: number) => {
    const path = extractPathFromLine(lineIndex);

    // Remove existing pending substitution for this line if any
    setPendingSubstitutions((prev) =>
      prev.filter((p) => p.lineIndex !== lineIndex)
    );

    // Add new pending substitution
    setPendingSubstitutions((prev) => [
      ...prev,
      { lineIndex, variableName: variable },
    ]);

    const selectedVar: SelectedVariable = { name: variable, path };
    setSelectedVariable(selectedVar);
    onVariableSelect?.(selectedVar);

    setDropdownLine(null);
  };

  console.log('selectedVariable:', selectedVariable);
  const handleClearPendingSubstitution = (lineIndex: number) => {
    setPendingSubstitutions((prev) =>
      prev.filter((p) => p.lineIndex !== lineIndex)
    );
  };

  const handleConfirmSubstitutions = () => {
    if (pendingSubstitutions.length > 0) {
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

  const handleClearSavedVariable = () => {
    setSelectedVariable(null);
    onVariableSelect?.(null);
  };

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
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

  return (
    <div ref={containerRef} className='relative w-full space-y-3'>
      {selectedVariable?.path && selectedVariable?.name && (
        <div className='bg-green-50 border border-green-200 rounded-md p-[7px] flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <span className='text-sm font-medium text-green-900'>
              Substituted Variables:
            </span>
            <span className='px-3 py-1 bg-green-500 text-white text-xs rounded font-mono font-medium'>
              {selectedVariable.path}: {selectedVariable.name}
            </span>
          </div>
          <button
            onClick={handleClearSavedVariable}
            className='p-1 bg-destructive/10 hover:bg-destructive/20 rounded transition-colors'
            title='Remove variable'
          >
            <Trash2 className='w-3.5 h-3.5 text-destructive' />
          </button>
        </div>
      )}

      <div className='relative flex border border-border rounded-md overflow-hidden bg-card focus-within:ring-2 focus-within:ring-ring focus-within:border-ring'>
        {/* Line numbers column */}
        <div
          className='flex flex-col bg-muted border-r border-border py-2 px-2 text-right select-none overflow-hidden'
          style={{
            minWidth: '2.5rem',
          }}
        >
          {lines.map((_, index) => (
            <div
              key={index}
              className={`h-6 text-[11px] font-mono leading-5 transition-colors ${
                hoveredLine === index
                  ? 'text-foreground bg-primary/10 rounded'
                  : 'text-muted-foreground'
              }`}
            >
              {index + 1}
            </div>
          ))}
        </div>

        {/* Textarea with transparent background */}
        <div className='relative flex-1'>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            onScroll={handleScroll}
            readOnly={readOnly}
            className='w-full h-64 p-2 pl-3 font-mono text-sm bg-transparent text-foreground focus:outline-none resize-none leading-6'
            style={{
              fontFamily:
                "'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace",
            }}
          />

          {/* Hover underline overlay */}
          <div className='absolute top-0 left-0 right-0 bottom-0 pointer-events-none pt-2'>
            {lines.map((line, index) => {
              const hasKey = /"[^"]+"\s*:/.test(line);

              return (
                <div
                  key={`underline-${index}`}
                  className={`h-6 transition-colors ${
                    hoveredLine === index && hasKey
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
              const pendingVar = getPendingSubstitution(index);
              const alreadySubstituted = getAlreadySubstitutedVariable(index);
              const currentPath = extractPathFromLine(index);
              const isSelectedVariableLine =
                selectedVariable && selectedVariable.path === currentPath;

              return (
                <div
                  key={index}
                  className='relative h-6 flex items-center pointer-events-auto'
                  onMouseEnter={() => setHoveredLine(index)}
                  onMouseLeave={() => setHoveredLine(null)}
                >
                  {hoveredLine === index && hasKey && (
                    <div className='pointer-events-auto ml-auto mr-1 flex items-center gap-1'>
                      {isSelectedVariableLine &&
                      !pendingVar &&
                      !alreadySubstituted ? (
                        <>
                          <span className='px-2 py-0.5 bg-green-500 text-white text-[11px] rounded font-mono whitespace-nowrap font-medium'>
                            {selectedVariable.name}
                          </span>
                          <button
                            onClick={handleClearSavedVariable}
                            className='p-0.5 bg-destructive/10 hover:bg-destructive/20 rounded transition-colors'
                            title='Remove variable'
                          >
                            <Trash2 className='w-3 h-3 text-destructive' />
                          </button>
                        </>
                      ) : !pendingVar && !alreadySubstituted ? (
                        <button
                          onClick={() => handleSubstituteClick(index)}
                          className='px-2 py-0.5 bg-[rgb(19,111,176)] hover:bg-[rgb(15,90,144)] text-white text-[11px] rounded transition-colors flex items-center justify-center whitespace-nowrap font-medium'
                          // title='Substitute variable'
                        >
                          Substitute Variable
                        </button>
                      ) : pendingVar ? (
                        <>
                          <span className='px-2 py-0.5 bg-green-500 text-white text-[11px] rounded font-mono whitespace-nowrap font-medium'>
                            {pendingVar}
                          </span>
                          <button
                            onClick={() =>
                              handleClearPendingSubstitution(index)
                            }
                            className='p-0.5 bg-destructive/10 hover:bg-destructive/20 rounded transition-colors'
                            title='Remove pending substitution'
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
                            onClick={() => handleRemoveSubstitution(index)}
                            className='p-0.5 bg-destructive/10 hover:bg-destructive/20 rounded transition-colors'
                            title='Remove substitution'
                          >
                            <Trash2 className='w-3 h-3 text-destructive' />
                          </button>
                        </>
                      ) : null}
                    </div>
                  )}

                  {dropdownLine === index && (
                    <div className='absolute right-0 top-full mt-1 w-72 bg-popover border border-border rounded-md shadow-lg z-50 text-sm pointer-events-auto'>
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
                      <div className='max-h-48 overflow-y-auto'>
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
    </div>
  );
};

export default JsonVariableSubstitution;
