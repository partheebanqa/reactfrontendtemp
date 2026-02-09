import { JsonTreeNode } from "./JsonTreeNode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronDown, ChevronRight, Search, X, ChevronUp } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";

interface JsonTreeViewProps {
  data: any;
}

export function JsonTreeView({ data }: JsonTreeViewProps) {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [searchMode, setSearchMode] = useState<"value" | "path">("value");
  const [showTypes, setShowTypes] = useState(false);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  const togglePath = useCallback((path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  const expandAll = () => {
    const allPaths = new Set<string>();
    const traverse = (obj: any, currentPath: string) => {
      allPaths.add(currentPath);
      if (obj !== null && typeof obj === "object") {
        Object.keys(obj).forEach((key) => {
          const newPath = Array.isArray(obj)
            ? `${currentPath}[${key}]`
            : `${currentPath}.${key}`;
          traverse(obj[key], newPath);
        });
      }
    };
    traverse(data, "$");
    setExpandedPaths(allPaths);
  };

  const collapseAll = () => {
    setExpandedPaths(new Set(["$"]));
  };

  // Precompute value index once when data changes
  const valueIndex = useMemo(() => {
    const index = new Map<string, string>();
    
    const traverse = (obj: any, currentPath: string) => {
      // Store stringified value for this path
      const valueStr = typeof obj === 'object' && obj !== null 
        ? JSON.stringify(obj) 
        : String(obj);
      index.set(currentPath, valueStr.toLowerCase());

      if (obj !== null && typeof obj === "object") {
        Object.keys(obj).forEach((key) => {
          const newPath = Array.isArray(obj)
            ? `${currentPath}[${key}]`
            : `${currentPath}.${key}`;
          traverse(obj[key], newPath);
        });
      }
    };

    traverse(data, "$");
    return index;
  }, [data]);

  // Fast search using precomputed index
  const searchMatches = useMemo(() => {
    if (!searchTerm) return { matches: [], matchMap: new Map() };
    
    const matches: string[] = [];
    const matchMap = new Map<string, number>();
    const lowerSearchTerm = searchTerm.toLowerCase();

    valueIndex.forEach((value, path) => {
      // Skip root path as it's not rendered in the flattened list
      if (path === '$') return;
      
      let isMatch = false;
      
      if (searchMode === "path") {
        isMatch = path.toLowerCase().includes(lowerSearchTerm);
      } else {
        isMatch = value.includes(lowerSearchTerm);
      }
      
      if (isMatch) {
        matchMap.set(path, matches.length);
        matches.push(path);
      }
    });

    return { matches, matchMap };
  }, [valueIndex, searchTerm, searchMode]);

  const renderTree = (obj: any, currentPath: string = "$", depth: number = 0): JSX.Element[] => {
    if (obj === null || typeof obj !== "object") {
      return [];
    }

    const nodes: JSX.Element[] = [];
    const entries = Array.isArray(obj)
      ? obj.map((_, idx) => [idx.toString(), obj[idx]])
      : Object.entries(obj);

    entries.forEach(([key, value]) => {
      const nodePath = Array.isArray(obj) ? `${currentPath}[${key}]` : `${currentPath}.${key}`;
      const isExpanded = expandedPaths.has(nodePath);
      const matchIndex = searchMatches.matchMap.get(nodePath);
      const isSearchMatch = matchIndex !== undefined;
      const isCurrentMatch = matchIndex === currentMatchIndex;

      nodes.push(
        <JsonTreeNode
          key={nodePath}
          nodeKey={key}
          value={value}
          path={nodePath}
          depth={depth}
          isExpanded={isExpanded}
          onToggle={togglePath}
          searchTerm={searchTerm}
          searchMode={searchMode}
          isSearchMatch={isCurrentMatch}
          showTypes={showTypes}
        />
      );

      if (isExpanded && value !== null && typeof value === "object") {
        nodes.push(...renderTree(value, nodePath, depth + 1));
      }
    });

    return nodes;
  };

  const resultCount = searchMatches.matches.length;

  const goToNextMatch = () => {
    if (searchMatches.matches.length === 0) return;
    const nextIndex = (currentMatchIndex + 1) % searchMatches.matches.length;
    setCurrentMatchIndex(nextIndex);
    scrollToMatch(searchMatches.matches[nextIndex]);
  };

  const goToPreviousMatch = () => {
    if (searchMatches.matches.length === 0) return;
    const prevIndex = currentMatchIndex === 0 ? searchMatches.matches.length - 1 : currentMatchIndex - 1;
    setCurrentMatchIndex(prevIndex);
    scrollToMatch(searchMatches.matches[prevIndex]);
  };

  // Expand all ancestors of a path
  const expandAncestors = (path: string) => {
    const parts = path.split(/[\.\[]/).filter(p => p && p !== '$');
    const ancestors: string[] = ['$'];
    
    let currentPath = '$';
    for (const part of parts) {
      const cleanPart = part.replace(/\]$/, '');
      if (part.includes(']')) {
        currentPath += `[${cleanPart}]`;
      } else {
        currentPath += `.${cleanPart}`;
      }
      ancestors.push(currentPath);
    }
    
    setExpandedPaths(prev => {
      const next = new Set(prev);
      ancestors.forEach(ancestor => next.add(ancestor));
      return next;
    });
  };

  const scrollToMatch = (path: string) => {
    // First expand ancestors
    expandAncestors(path);
    
    // Wait for the next render cycle when expansion is complete
    setTimeout(() => {
      const element = document.querySelector(`[data-testid="tree-node-${path}"]`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
  };

  // Reset match index when search term changes
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentMatchIndex(0);
  };

  // Scroll to first match when search results change
  useEffect(() => {
    setCurrentMatchIndex(0);
    if (searchMatches.matches.length > 0) {
      scrollToMatch(searchMatches.matches[0]);
    }
  }, [searchMatches.matches]);

  // Expand all nodes by default when data changes
  useEffect(() => {
    if (data) {
      const allPaths = new Set<string>();
      const traverse = (obj: any, currentPath: string) => {
        allPaths.add(currentPath);
        if (obj !== null && typeof obj === "object") {
          Object.keys(obj).forEach((key) => {
            const newPath = Array.isArray(obj)
              ? `${currentPath}[${key}]`
              : `${currentPath}.${key}`;
            traverse(obj[key], newPath);
          });
        }
      };
      traverse(data, "$");
      setExpandedPaths(allPaths);
    }
  }, [data]);

  if (!data || typeof data !== "object") {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <ChevronRight className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No JSON Parsed</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Paste JSON in the left panel and click "Parse JSON" to begin
        </p>
        <Button variant="secondary" onClick={() => {}}>
          Load Sample JSON
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Tree View
          </h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Switch
                id="show-types"
                checked={showTypes}
                onCheckedChange={setShowTypes}
                data-testid="switch-show-types"
              />
              <Label htmlFor="show-types" className="text-sm cursor-pointer">
                Show Types
              </Label>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={expandAll}
              data-testid="button-expand-all"
            >
              <ChevronDown className="w-4 h-4 mr-2" />
              Expand All
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={collapseAll}
              data-testid="button-collapse-all"
            >
              <ChevronRight className="w-4 h-4 mr-2" />
              Collapse All
            </Button>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={`Search by ${searchMode}...`}
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9 pr-9"
              data-testid="input-search"
            />
            {searchTerm && (
              <button
                onClick={() => handleSearchChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                data-testid="button-clear-search"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
          {searchTerm && resultCount > 0 && (
            <div className="flex gap-1">
              <Button
                variant="secondary"
                size="icon"
                onClick={goToPreviousMatch}
                data-testid="button-previous-match"
              >
                <ChevronUp className="w-4 h-4" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                onClick={goToNextMatch}
                data-testid="button-next-match"
              >
                <ChevronDown className="w-4 h-4" />
              </Button>
            </div>
          )}
          <Select value={searchMode} onValueChange={(v: any) => setSearchMode(v)}>
            <SelectTrigger className="w-32" data-testid="select-search-mode">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="value">Value</SelectItem>
              <SelectItem value="path">Path</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {searchTerm && (
          <p className="text-xs text-muted-foreground mt-2">
            {resultCount > 0 ? (
              <>
                {currentMatchIndex + 1} of {resultCount} {resultCount === 1 ? "result" : "results"}
              </>
            ) : (
              "No results found"
            )}
          </p>
        )}
      </div>

      <div className="flex-1 overflow-auto" data-testid="tree-container">
        {renderTree(data)}
      </div>
    </div>
  );
}
