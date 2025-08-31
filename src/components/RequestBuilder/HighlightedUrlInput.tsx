import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDataManagement } from "@/hooks/useDataManagement";
import { Variable } from "@/shared/types/datamanagement";
import { createEditor, Descendant, Node, Text, BaseEditor } from 'slate';
import { Slate, Editable, withReact, ReactEditor } from 'slate-react';
import { withHistory } from 'slate-history';
import { jsx } from 'slate-hyperscript';

// Define custom types for Slate
type CustomText = {
    text: string;
    variable?: boolean;
    variableName?: string;
};

type CustomElement = {
    type: 'paragraph' | 'variable';
    children: CustomText[];
};

declare module 'slate' {
    interface CustomTypes {
        Editor: BaseEditor & ReactEditor;
        Element: CustomElement;
        Text: CustomText;
    }
}

// Custom decorator function to identify variables
const withVariables = (editor: ReactEditor) => {
    const { isInline, isVoid } = editor;

    editor.isInline = element => {
        return element.type === 'variable' ? true : isInline(element);
    };

    editor.isVoid = element => {
        return element.type === 'variable' ? true : isVoid(element);
    };

    return editor;
};

interface HighlightedUrlInputProps {
    setUrl: (url: string) => void;
    url: string;
    method?: string;
    setMethod?: (method: string) => void;
    placeholder?: string;
    className?: string;
}

export default function HighlightedUrlInput({
    setUrl,
    url,
    method = "GET",
    setMethod,
    placeholder = "https://api.example.com/v1/endpoint",
    className = ""
}: HighlightedUrlInputProps) {
    const { variables, activeEnvironment } = useDataManagement();
    const [envVars, setEnvVars] = useState<Record<string, string>>({});
    const [showingMethodDropdown, setShowingMethodDropdown] = useState(false);

    // Create a Slate editor
    const editor = useMemo(() => withVariables(withHistory(withReact(createEditor()))), []);

    // Convert string URL to Slate value
    const [slateValue, setSlateValue] = useState<Descendant[]>([
        {
            type: 'paragraph',
            children: [{ text: url || '' }]
        }
    ]);

    const httpMethods = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];

    // Process variables when they change or active environment changes
    useEffect(() => {
        const processedVars: Record<string, string> = {};

        // Add basic variables if we have an active environment
        if (activeEnvironment) {
            processedVars.baseUrl = activeEnvironment.baseUrl;
        }

        // Add all other variables
        variables.forEach((variable: Variable) => {
            processedVars[variable.name] = variable.currentValue;
        });

        setEnvVars(processedVars);
    }, [variables, activeEnvironment]);

    // Update Slate value when URL changes externally
// Improve the URL update logic
useEffect(() => {
  // Only update if the URL actually changed and editor is not focused
  if (!ReactEditor.isFocused(editor)) {
    const currentValue = Node.string(slateValue[0] || { children: [{ text: '' }] });
    if (currentValue !== (url || '')) {
      parseUrlToSlateValue(url || '');
    }
  }
}, [url, editor]); // Remove slateValue from dependencies

    // Parse URL string into Slate nodes with variable identification
   // Improve variable regex to handle edge cases
const parseUrlToSlateValue = useCallback((urlString: string) => {
  const varRegex = /\{\{([^{}]+)\}\}/g; // Ensure at least one character inside
  const nodes: Descendant[] = [];
  const paragraph: CustomElement = { type: 'paragraph', children: [] };

  let lastIndex = 0;
  let match;

  while ((match = varRegex.exec(urlString)) !== null) {
    // Add text before variable
    if (match.index > lastIndex) {
      paragraph.children.push({
        text: urlString.substring(lastIndex, match.index)
      });
    }

    // Add variable - trim whitespace from variable name
    paragraph.children.push({
      text: match[0],
      variable: true,
      variableName: match[1].trim()
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < urlString.length) {
    paragraph.children.push({
      text: urlString.substring(lastIndex)
    });
  }

  // Ensure we always have at least one text node
  if (paragraph.children.length === 0) {
    paragraph.children.push({ text: '' });
  }

  setSlateValue([paragraph]);
}, []);


    // Handle slate value change and update URL string
    const handleSlateChange = (newValue: Descendant[]) => {
        setSlateValue(newValue);
        // Convert slate value to string
        const newUrlString = Node.string(newValue[0]);
        setUrl(newUrlString);
    };

    // Custom rendering for Slate nodes
    const renderLeaf = useCallback(({ attributes, children, leaf }: any) => {
        // If this is a variable node
        if (leaf.variable) {
            const variableName = leaf.text.replace(/[{}]/g, '');
            const value = envVars[variableName.trim()] || 'undefined';
            const displayValue = value === 'undefined' ? 'Variable not found' : value;

            return (
                <span
                    {...attributes}
                    className="relative group"
                >
                    <span className="bg-blue-100 text-blue-800 font-semibold px-0.5">
                        {children}
                    </span>
                    <span className="absolute bottom-full left-0 mb-1 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 z-20 whitespace-nowrap max-w-xs overflow-hidden text-ellipsis shadow-lg">
                        {activeEnvironment ? <span className="text-blue-300">{activeEnvironment.name}:</span> : ''}
                        {' '}{displayValue}
                    </span>
                </span>
            );
        }

        return <span {...attributes}>{children}</span>;
    }, [envVars, activeEnvironment]);

    // Close method dropdown when clicking outside
    useEffect(() => {
        const handleOutsideClick = () => {
            if (showingMethodDropdown) {
                setShowingMethodDropdown(false);
            }
        };

        document.addEventListener('click', handleOutsideClick);
        return () => {
            document.removeEventListener('click', handleOutsideClick);
        };
    }, [showingMethodDropdown]);

    // Define decorate function for variable recognition
    const decorate = useCallback(([node, path]: any) => {
        const ranges: any[] = [];

        if (!Text.isText(node)) {
            return ranges;
        }

        const text = node.text;
        const varRegex = /{{([^{}]*)}}/g;
        let match;

        while ((match = varRegex.exec(text)) !== null) {
            ranges.push({
                anchor: { path, offset: match.index },
                focus: { path, offset: match.index + match[0].length },
                variable: true,
                variableName: match[1]
            });
        }

        return ranges;
    }, []);

    return (
        <div className={`flex w-full ${className}`}>
            {/* Method selector dropdown - Postman style */}
            <div className="relative">
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowingMethodDropdown(!showingMethodDropdown);
                    }}
                    className={`
                        flex items-center justify-center font-medium text-sm
                        min-w-[80px] h-full rounded-l border 
                        ${method === "GET" ? "bg-blue-50 text-blue-700 border-blue-300" :
                            method === "POST" ? "bg-green-50 text-green-700 border-green-300" :
                                method === "PUT" ? "bg-orange-50 text-orange-700 border-orange-300" :
                                    method === "DELETE" ? "bg-red-50 text-red-700 border-red-300" :
                                        "bg-gray-50 text-gray-700 border-gray-300"}
                    `}
                >
                    {method}
                    <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                </button>
                {showingMethodDropdown && (
                    <div className="absolute top-full left-0 mt-1 w-24 bg-white shadow-lg rounded-md border border-gray-200 z-30">
                        {httpMethods.map(httpMethod => (
                            <button
                                key={httpMethod}
                                className={`
                                    block w-full text-left px-3 py-2 text-sm
                                    ${httpMethod === method ? "bg-gray-100" : "hover:bg-gray-50"}
                                    ${httpMethod === "GET" ? "text-blue-700" :
                                        httpMethod === "POST" ? "text-green-700" :
                                            httpMethod === "PUT" ? "text-orange-700" :
                                                httpMethod === "DELETE" ? "text-red-700" : ""}
                                `}
                                onClick={() => {
                                    if (setMethod) setMethod(httpMethod);
                                    setShowingMethodDropdown(false);
                                }}
                            >
                                {httpMethod}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* URL input using Slate.js */}
            <div className="relative flex-1 font-mono text-sm border border-l-0 border-gray-300 rounded-r bg-white">
                <Slate
                    editor={editor}
                    initialValue={slateValue}
                    onChange={handleSlateChange}
                >
                    <Editable
                        className="px-3 py-2 min-h-[40px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder={placeholder}
                        spellCheck={false}
                        autoCorrect="off"
                        decorate={decorate}
                        renderLeaf={renderLeaf}
                    />
                </Slate>
            </div>

            {/* URL preview indicator - optional, shows in Postman sometimes */}
            {activeEnvironment && (
                <div className="ml-2 flex items-center">
                    <span className="text-xs text-gray-500 px-2 py-1 rounded bg-gray-100">
                        {activeEnvironment.name}
                    </span>
                </div>
            )}
        </div>
    );
}
