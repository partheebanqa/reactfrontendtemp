'use client';

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
      {selectedVariable && (
        <div className='bg-green-50 border border-green-200 rounded-md p-3 flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <span className='text-sm font-medium text-green-900'>
              Variable Set:
            </span>
            <span className='px-3 py-1 bg-green-500 text-white text-xs rounded font-mono font-medium'>
              {selectedVariable.path}: {selectedVariable.name}
            </span>
          </div>
          <button
            onClick={handleClearSavedVariable}
            className='px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors'
            title='Remove variable'
          >
            ✕
          </button>
        </div>
      )}

      <div className='relative'>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          readOnly={readOnly}
          className='w-full h-64 p-4 font-mono text-sm border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none'
          style={{
            fontFamily:
              "'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace",
          }}
        />

        <div className='absolute top-0 right-0 bottom-0 w-48 pointer-events-none'>
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
                  <div className='pointer-events-auto ml-auto mr-2 flex items-center gap-1'>
                    {isSelectedVariableLine &&
                    !pendingVar &&
                    !alreadySubstituted ? (
                      <>
                        <span className='px-2 bg-yellow-500 text-yellow-900 text-xs rounded font-mono whitespace-nowrap'>
                          {selectedVariable.name}
                        </span>
                        <button
                          onClick={handleClearSavedVariable}
                          className='px-2 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors'
                          title='Remove variable'
                        >
                          ✕
                        </button>
                      </>
                    ) : !pendingVar && !alreadySubstituted ? (
                      <button
                        onClick={() => handleSubstituteClick(index)}
                        className='px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded whitespace-nowrap transition-colors'
                        title='Substitute variable'
                      >
                        Substitute Variable
                      </button>
                    ) : pendingVar ? (
                      <>
                        <span className='px-2 bg-yellow-500 text-yellow-900 text-xs rounded font-mono whitespace-nowrap'>
                          {pendingVar}
                        </span>
                        <button
                          onClick={() => handleClearPendingSubstitution(index)}
                          className='px-2 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors'
                          title='Remove pending substitution'
                        >
                          ✕
                        </button>
                      </>
                    ) : alreadySubstituted ? (
                      <>
                        <span className='px-2 bg-green-500 text-green-900 text-xs rounded font-mono whitespace-nowrap'>
                          {alreadySubstituted}
                        </span>
                        <button
                          onClick={() => handleRemoveSubstitution(index)}
                          className='px-2 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors'
                          title='Remove substitution'
                        >
                          ✕
                        </button>
                      </>
                    ) : null}
                  </div>
                )}

                {dropdownLine === index && (
                  <div className='absolute right-0 top-full mt-1 w-80 bg-white border border-gray-300 rounded shadow-lg z-50 text-sm pointer-events-auto'>
                    {/* Search bar */}
                    <div className='p-2 border-b border-gray-200'>
                      <input
                        type='text'
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder='Search variables...'
                        className='w-full bg-white border border-gray-300 rounded px-2 py-1 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500'
                        autoFocus
                      />
                    </div>

                    {/* List of variables */}
                    <div className='max-h-48 overflow-y-auto'>
                      {filteredVariables.length > 0 ? (
                        filteredVariables.map((v) => (
                          <div
                            key={v.name}
                            className='flex justify-between items-center px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 text-gray-800'
                            onClick={() => handleVariableSelect(v.name, index)}
                          >
                            <span className='font-mono text-gray-800 text-xs font-medium'>
                              {v.name}
                            </span>
                            <span className='text-gray-500 text-xs truncate ml-2 max-w-xs'>
                              {v.value}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className='px-3 py-2 text-gray-400 text-xs text-center'>
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

      {pendingSubstitutions.length > 0 && (
        <div className='mt-4 flex gap-2 justify-end'>
          <button
            onClick={handleCancelSubstitutions}
            className='px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm rounded transition-colors'
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmSubstitutions}
            className='px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors font-medium'
          >
            End ({pendingSubstitutions.length})
          </button>
        </div>
      )}
    </div>
  );
};

export default JsonVariableSubstitution;
