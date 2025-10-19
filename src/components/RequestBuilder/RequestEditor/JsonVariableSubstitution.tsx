'use client';

import type React from 'react';
import { useState, useRef } from 'react';
import { Controlled as CodeMirror } from 'react-codemirror2';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/material.css';
import 'codemirror/mode/javascript/javascript';

interface JsonVariableSubstitutionProps {
  value: string;
  onChange: (value: string) => void;
  mode?: 'json' | 'raw';
}

export const JsonVariableSubstitution: React.FC<
  JsonVariableSubstitutionProps
> = ({ value, onChange, mode = 'json' }) => {
  const [hoveredLine, setHoveredLine] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const codeMirrorRef = useRef<any>(null);

  const lines = value.split('\n');

  const extractPathFromLine = (lineIndex: number): string => {
    const line = lines[lineIndex];
    // Match quoted keys like "email", "password", etc.
    const keyMatch = line.match(/"([^"]+)"\s*:/);
    if (keyMatch) {
      return keyMatch[1];
    }
    return '';
  };

  const handleSubstituteClick = (lineIndex: number) => {
    const path = extractPathFromLine(lineIndex);
    if (path) {
      console.log(`Variable path: {{${path}}}`);
    }
  };

  return (
    <div ref={containerRef} className='relative w-full'>
      <div className='relative'>
        <CodeMirror
          ref={codeMirrorRef}
          value={value}
          options={{
            mode:
              mode === 'json'
                ? { name: 'javascript', json: true }
                : 'javascript',
            theme: 'material',
            lineNumbers: true,
            lineWrapping: true,
          }}
          onBeforeChange={(editor, data, newValue) => {
            onChange(newValue);
          }}
        />

        <div className='absolute top-0 right-0 bottom-0 w-40 pointer-events-none'>
          {lines.map((line, index) => {
            const hasKey = /"[^"]+"\s*:/.test(line);
            return (
              <div
                key={index}
                className='relative h-6 flex items-center pointer-events-auto'
                onMouseEnter={() => setHoveredLine(index)}
                onMouseLeave={() => setHoveredLine(null)}
              >
                {hoveredLine === index && hasKey && (
                  <button
                    onClick={() => handleSubstituteClick(index)}
                    className='pointer-events-auto ml-auto mr-2 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded whitespace-nowrap transition-colors'
                    title='Log variable path to console'
                  >
                    Substitute Variable
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default JsonVariableSubstitution;
