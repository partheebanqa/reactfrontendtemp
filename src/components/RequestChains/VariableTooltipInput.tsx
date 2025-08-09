'use client';

import type React from 'react';
import { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { Variable } from '@/shared/types/requestChain.model';

interface VariableTooltipInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  variables: Variable[];
  multiline?: boolean;
  rows?: number;
}

export function VariableTooltipInput({
  value,
  onChange,
  placeholder,
  className,
  variables,
  multiline = false,
  rows = 1,
}: VariableTooltipInputProps) {
  const [hoveredVariable, setHoveredVariable] = useState<{
    name: string;
    value: string;
    position: { x: number; y: number };
  } | null>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // Find variable references in the text
  const findVariableReferences = (text: string) => {
    const regex = /\{\{([^}]+)\}\}/g;
    const matches = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      matches.push({
        name: match[1],
        start: match.index,
        end: match.index + match[0].length,
        fullMatch: match[0],
      });
    }
    return matches;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!inputRef.current) return;

    const rect = inputRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Get cursor position in text
    const input = inputRef.current;
    let textPosition = 0;

    if (input instanceof HTMLInputElement) {
      // For input elements, we need to estimate position
      const textWidth = input.scrollWidth;
      const inputWidth = input.clientWidth;
      const scrollLeft = input.scrollLeft;
      const relativeX = x + scrollLeft;
      const charWidth = textWidth / value.length;
      textPosition = Math.floor(relativeX / charWidth);
    } else if (input instanceof HTMLTextAreaElement) {
      // For textarea, we can use a more sophisticated approach
      const style = window.getComputedStyle(input);
      const fontSize = Number.parseFloat(style.fontSize);
      const lineHeight = Number.parseFloat(style.lineHeight) || fontSize * 1.2;
      const paddingLeft = Number.parseFloat(style.paddingLeft);
      const paddingTop = Number.parseFloat(style.paddingTop);

      const relativeX = x - paddingLeft;
      const relativeY = y - paddingTop;
      const lineIndex = Math.floor(relativeY / lineHeight);
      const lines = value.split('\n');

      let charIndex = 0;
      for (let i = 0; i < lineIndex && i < lines.length; i++) {
        charIndex += lines[i].length + 1; // +1 for newline
      }

      if (lineIndex < lines.length) {
        const charWidth = fontSize * 0.6; // Approximate character width
        const charInLine = Math.floor(relativeX / charWidth);
        charIndex += Math.min(charInLine, lines[lineIndex].length);
      }

      textPosition = charIndex;
    }

    // Find if cursor is over a variable reference
    const variableRefs = findVariableReferences(value);
    const hoveredRef = variableRefs.find(
      (ref) => textPosition >= ref.start && textPosition <= ref.end
    );

    if (hoveredRef) {
      const variable = variables.find((v) => v.name === hoveredRef.name);
      if (variable) {
        setHoveredVariable({
          name: hoveredRef.name,
          value: variable.value,
          position: { x: e.clientX, y: e.clientY },
        });
        return;
      }
    }

    setHoveredVariable(null);
  };

  const handleMouseLeave = () => {
    setHoveredVariable(null);
  };

  const InputComponent = multiline ? Textarea : Input;

  return (
    <TooltipProvider>
      <div className='relative'>
        <InputComponent
          ref={inputRef as any}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={className}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          rows={multiline ? rows : undefined}
        />

        {/* Custom tooltip for variable values */}
        {hoveredVariable && (
          <div
            className='fixed z-50 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg pointer-events-none'
            style={{
              left: hoveredVariable.position.x + 10,
              top: hoveredVariable.position.y - 40,
            }}
          >
            <div className='font-medium'>{hoveredVariable.name}</div>
            <div className='text-gray-300 font-mono text-xs'>
              {hoveredVariable.value}
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
