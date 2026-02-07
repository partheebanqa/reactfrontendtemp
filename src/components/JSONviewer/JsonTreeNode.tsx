import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChevronRight, ChevronDown, Copy, Check } from "lucide-react";
import { useState, memo } from "react";

interface JsonTreeNodeProps {
  nodeKey: string;
  value: any;
  path: string;
  depth: number;
  isExpanded: boolean;
  onToggle: (path: string) => void;
  searchTerm?: string;
  searchMode?: "value" | "path";
  isSearchMatch?: boolean;
  showTypes?: boolean;
}

function JsonTreeNodeComponent({
  nodeKey,
  value,
  path,
  depth,
  isExpanded,
  onToggle,
  searchTerm,
  searchMode,
  isSearchMatch,
  showTypes = false,
}: JsonTreeNodeProps) {
  const [copied, setCopied] = useState<"value" | "path" | null>(null);

  const isObject = value !== null && typeof value === "object" && !Array.isArray(value);
  const isArray = Array.isArray(value);
  const isExpandable = isObject || isArray;

  const getValueType = (val: any): string => {
    if (val === null) return "null";
    if (Array.isArray(val)) return "array";
    if (typeof val === "object") return "object";
    return typeof val;
  };

  const getTypeColor = (type: string): string => {
    switch (type) {
      case "string":
        return "bg-green-500/10 text-green-700 dark:text-green-400";
      case "number":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
      case "boolean":
        return "bg-purple-500/10 text-purple-700 dark:text-purple-400";
      case "null":
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400";
      case "array":
        return "bg-orange-500/10 text-orange-700 dark:text-orange-400";
      case "object":
        return "bg-pink-500/10 text-pink-700 dark:text-pink-400";
      default:
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400";
    }
  };

  const formatValue = (val: any): string => {
    if (val === null) return "null";
    if (typeof val === "string") return `"${val}"`;
    if (typeof val === "boolean") return val.toString();
    if (typeof val === "number") return val.toString();
    return "";
  };

  const getTypeLabel = (val: any): string => {
    const type = getValueType(val);
    if (type === "array") return `Array[${val.length}]`;
    if (type === "object") return `Object{${Object.keys(val).length}}`;
    return type;
  };

  const copyToClipboard = (text: string, type: "value" | "path") => {
    let textToCopy = text;
    
    if (type === "value" && typeof value === "string") {
      textToCopy = value;
    }
    
    navigator.clipboard.writeText(textToCopy);
    setCopied(type);
    setTimeout(() => setCopied(null), 1500);
  };

  const highlightText = (text: string) => {
    if (!searchTerm || searchMode !== "value") return text;
    const regex = new RegExp(`(${searchTerm})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-300 dark:bg-yellow-600 rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const valueType = getValueType(value);
  const valuePreview = formatValue(value);

  return (
    <div
      className={`group ${isSearchMatch ? "bg-yellow-100 dark:bg-yellow-900/20" : ""}`}
      data-testid={`tree-node-${path}`}
    >
      <div
        className="flex items-center h-8 hover-elevate rounded-sm"
        style={{ paddingLeft: `${depth * 24 + 4}px` }}
      >
        {isExpandable ? (
          <button
            onClick={() => onToggle(path)}
            className="w-4 h-4 flex items-center justify-center flex-shrink-0 mr-2"
            data-testid={`button-toggle-${path}`}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
        ) : (
          <div className="w-4 h-4 mr-2" />
        )}

        <span className="font-mono text-sm font-medium mr-2 text-purple-600 dark:text-purple-400">
          {highlightText(nodeKey)}
        </span>
        <span className="text-muted-foreground mr-2">:</span>

        {!isExpandable && (
          <span className={`font-mono text-sm mr-2 truncate max-w-md ${
            valueType === 'string' ? 'text-green-600 dark:text-green-400' :
            valueType === 'number' ? 'text-blue-600 dark:text-blue-400' :
            valueType === 'boolean' ? 'text-orange-600 dark:text-orange-400' :
            valueType === 'null' ? 'text-gray-500 dark:text-gray-400' :
            'text-muted-foreground'
          }`}>
            {highlightText(valuePreview)}
          </span>
        )}

        {showTypes && (
          <Badge className={`text-xs px-2 py-0.5 ${getTypeColor(valueType)}`}>
            {getTypeLabel(value)}
          </Badge>
        )}
        
        {isExpandable && !isExpanded && (
          <span className="font-mono text-sm text-muted-foreground">
            {isArray ? `[${value.length}]` : `{${Object.keys(value).length}}`}
          </span>
        )}

        <div className="ml-auto flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => copyToClipboard(path, "path")}
                data-testid={`button-copy-path-${path}`}
              >
                {copied === "path" ? (
                  <Check className="w-3 h-3 text-green-600" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Copy path</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() =>
                  copyToClipboard(
                    isExpandable ? JSON.stringify(value, null, 2) : valuePreview,
                    "value"
                  )
                }
                data-testid={`button-copy-value-${path}`}
              >
                {copied === "value" ? (
                  <Check className="w-3 h-3 text-green-600" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Copy value</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}

export const JsonTreeNode = memo(JsonTreeNodeComponent);
