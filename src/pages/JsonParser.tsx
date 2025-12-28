import React, { useState, useRef, FC } from 'react';
import {
  Code,
  Copy,
  Check,
  Download,
  Upload,
  FileText,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  Search,
  Filter,
  Zap,
  Globe,
  Terminal,
  AlertCircle,
  CheckCircle,
  Info,
  RefreshCw,
  Trash2,
  GitCompare,
  Plus,
  Minus,
  Edit3,
  ArrowRight,
} from 'lucide-react';

interface JsonDifference {
  type: 'added' | 'removed' | 'modified' | 'type-changed';
  path: string;
  leftValue?: any;
  rightValue?: any;
  message: string;
}

const JsonParser: FC = () => {
  const [inputText, setInputText] = useState('');
  const [parsedJson, setParsedJson] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [inputMethod, setInputMethod] = useState<
    'manual' | 'file' | 'curl' | 'url' | 'compare'
  >('manual');
  const [isExpanded, setIsExpanded] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPath, setFilterPath] = useState('');
  const [curlCommand, setCurlCommand] = useState('');
  const [jsonUrl, setJsonUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationInfo, setValidationInfo] = useState<{
    isValid: boolean;
    size: number;
    depth: number;
    keys: number;
    type: string;
  } | null>(null);

  // Comparison state
  const [leftJson, setLeftJson] = useState('');
  const [rightJson, setRightJson] = useState('');
  const [parsedLeftJson, setParsedLeftJson] = useState<any>(null);
  const [parsedRightJson, setParsedRightJson] = useState<any>(null);
  const [leftError, setLeftError] = useState<string>('');
  const [rightError, setRightError] = useState<string>('');
  const [differences, setDifferences] = useState<JsonDifference[]>([]);
  const [comparisonResult, setComparisonResult] = useState<{
    identical: boolean;
    totalDifferences: number;
    added: number;
    removed: number;
    modified: number;
    typeChanged: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const leftFileInputRef = useRef<HTMLInputElement>(null);
  const rightFileInputRef = useRef<HTMLInputElement>(null);

  const parseJson = (text: string) => {
    try {
      setError('');
      const trimmed = text.trim();

      if (!trimmed) {
        setParsedJson(null);
        setValidationInfo(null);
        return;
      }

      const parsed = JSON.parse(trimmed);
      setParsedJson(parsed);

      // Calculate validation info
      const info = {
        isValid: true,
        size: new Blob([trimmed]).size,
        depth: calculateDepth(parsed),
        keys: countKeys(parsed),
        type: Array.isArray(parsed)
          ? 'Array'
          : typeof parsed === 'object'
          ? 'Object'
          : typeof parsed,
      };
      setValidationInfo(info);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid JSON format');
      setParsedJson(null);
      setValidationInfo(null);
    }
  };

  const parseComparisonJson = (text: string, side: 'left' | 'right') => {
    try {
      const trimmed = text.trim();

      if (side === 'left') {
        setLeftError('');
        if (!trimmed) {
          setParsedLeftJson(null);
          return;
        }
        const parsed = JSON.parse(trimmed);
        setParsedLeftJson(parsed);
      } else {
        setRightError('');
        if (!trimmed) {
          setParsedRightJson(null);
          return;
        }
        const parsed = JSON.parse(trimmed);
        setParsedRightJson(parsed);
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Invalid JSON format';
      if (side === 'left') {
        setLeftError(errorMsg);
        setParsedLeftJson(null);
      } else {
        setRightError(errorMsg);
        setParsedRightJson(null);
      }
    }
  };

  const handleJsonParse = (parsedJson, text) => {
    console.log('handleJsonParse ~ parsedJson,text:', parsedJson, text);
  };

  const compareJsonObjects = (
    left: any,
    right: any,
    path: string = ''
  ): JsonDifference[] => {
    const diffs: JsonDifference[] = [];

    // Handle null/undefined cases
    if (left === null && right === null) return diffs;
    if (left === undefined && right === undefined) return diffs;

    if (left === null || left === undefined) {
      diffs.push({
        type: 'added',
        path: path || 'root',
        rightValue: right,
        message: `Value added at ${path || 'root'}`,
      });
      return diffs;
    }

    if (right === null || right === undefined) {
      diffs.push({
        type: 'removed',
        path: path || 'root',
        leftValue: left,
        message: `Value removed from ${path || 'root'}`,
      });
      return diffs;
    }

    // Type comparison
    const leftType = Array.isArray(left) ? 'array' : typeof left;
    const rightType = Array.isArray(right) ? 'array' : typeof right;

    if (leftType !== rightType) {
      diffs.push({
        type: 'type-changed',
        path: path || 'root',
        leftValue: left,
        rightValue: right,
        message: `Type changed from ${leftType} to ${rightType} at ${
          path || 'root'
        }`,
      });
      return diffs;
    }

    // Primitive value comparison
    if (leftType !== 'object' && leftType !== 'array') {
      if (left !== right) {
        diffs.push({
          type: 'modified',
          path: path || 'root',
          leftValue: left,
          rightValue: right,
          message: `Value changed at ${path || 'root'}`,
        });
      }
      return diffs;
    }

    // Array comparison
    if (Array.isArray(left) && Array.isArray(right)) {
      const maxLength = Math.max(left.length, right.length);

      for (let i = 0; i < maxLength; i++) {
        const currentPath = path ? `${path}[${i}]` : `[${i}]`;

        if (i >= left.length) {
          diffs.push({
            type: 'added',
            path: currentPath,
            rightValue: right[i],
            message: `Array item added at ${currentPath}`,
          });
        } else if (i >= right.length) {
          diffs.push({
            type: 'removed',
            path: currentPath,
            leftValue: left[i],
            message: `Array item removed from ${currentPath}`,
          });
        } else {
          diffs.push(...compareJsonObjects(left[i], right[i], currentPath));
        }
      }
      return diffs;
    }

    // Object comparison
    if (typeof left === 'object' && typeof right === 'object') {
      const allKeys = new Set([...Object.keys(left), ...Object.keys(right)]);

      for (const key of allKeys) {
        const currentPath = path ? `${path}.${key}` : key;

        if (!(key in left)) {
          diffs.push({
            type: 'added',
            path: currentPath,
            rightValue: right[key],
            message: `Property "${key}" added at ${currentPath}`,
          });
        } else if (!(key in right)) {
          diffs.push({
            type: 'removed',
            path: currentPath,
            leftValue: left[key],
            message: `Property "${key}" removed from ${currentPath}`,
          });
        } else {
          diffs.push(...compareJsonObjects(left[key], right[key], currentPath));
        }
      }
    }

    return diffs;
  };

  const performComparison = () => {
    if (!parsedLeftJson || !parsedRightJson) {
      setDifferences([]);
      setComparisonResult(null);
      return;
    }

    const diffs = compareJsonObjects(parsedLeftJson, parsedRightJson);
    setDifferences(diffs);

    const result = {
      identical: diffs.length === 0,
      totalDifferences: diffs.length,
      added: diffs.filter((d) => d.type === 'added').length,
      removed: diffs.filter((d) => d.type === 'removed').length,
      modified: diffs.filter((d) => d.type === 'modified').length,
      typeChanged: diffs.filter((d) => d.type === 'type-changed').length,
    };

    setComparisonResult(result);
  };

  // Auto-compare when both JSONs are parsed
  React.useEffect(() => {
    if (inputMethod === 'compare') {
      performComparison();
    }
  }, [parsedLeftJson, parsedRightJson, inputMethod]);

  const calculateDepth = (obj: any, depth = 0): number => {
    if (typeof obj !== 'object' || obj === null) return depth;
    if (Array.isArray(obj)) {
      return Math.max(
        depth,
        ...obj.map((item) => calculateDepth(item, depth + 1))
      );
    }
    return Math.max(
      depth,
      ...Object.values(obj).map((value) => calculateDepth(value, depth + 1))
    );
  };

  const countKeys = (obj: any): number => {
    if (typeof obj !== 'object' || obj === null) return 0;
    if (Array.isArray(obj)) {
      return obj.reduce((sum, item) => sum + countKeys(item), 0);
    }
    return (
      Object.keys(obj).length +
      Object.values(obj).reduce((sum, value) => sum + countKeys(value), 0)
    );
  };

  const handleInputChange = (value: string) => {
    setInputText(value);
    parseJson(value);
  };

  const handleComparisonInputChange = (
    value: string,
    side: 'left' | 'right'
  ) => {
    if (side === 'left') {
      setLeftJson(value);
      parseComparisonJson(value, 'left');
    } else {
      setRightJson(value);
      parseComparisonJson(value, 'right');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setInputText(content);
      parseJson(content);
    };
    reader.readAsText(file);
  };

  const handleComparisonFileUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    side: 'left' | 'right'
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      handleComparisonInputChange(content, side);
    };
    reader.readAsText(file);
  };

  const extractJsonFromCurl = (curl: string): string => {
    // Extract JSON from curl command
    const dataMatch =
      curl.match(/(?:-d|--data|--data-raw)\s+['"](.+?)['"]/) ||
      curl.match(/(?:-d|--data|--data-raw)\s+(.+?)(?:\s|$)/);

    if (dataMatch) {
      let data = dataMatch[1];
      // Remove escaped quotes
      data = data.replace(/\\"/g, '"');
      return data;
    }

    return curl;
  };

  const handleCurlParse = () => {
    if (!curlCommand.trim()) {
      setError('Please enter a cURL command');
      return;
    }

    try {
      const jsonData = extractJsonFromCurl(curlCommand);
      setInputText(jsonData);
      parseJson(jsonData);
    } catch (err) {
      setError('Could not extract JSON from cURL command');
    }
  };

  const handleUrlFetch = async () => {
    if (!jsonUrl.trim()) {
      setError('Please enter a valid URL');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(jsonUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const text = await response.text();
      setInputText(text);
      parseJson(text);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch JSON from URL'
      );
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!parsedJson) return;

    try {
      await navigator.clipboard.writeText(JSON.stringify(parsedJson, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const downloadJson = () => {
    if (!parsedJson) return;

    const blob = new Blob([JSON.stringify(parsedJson, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'parsed-data.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadComparisonReport = () => {
    if (!comparisonResult || !differences) return;

    const report = {
      summary: comparisonResult,
      differences: differences,
      timestamp: new Date().toISOString(),
      leftJson: parsedLeftJson,
      rightJson: parsedRightJson,
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'json-comparison-report.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const clearAll = () => {
    setInputText('');
    setParsedJson(null);
    setError('');
    setValidationInfo(null);
    setCurlCommand('');
    setJsonUrl('');
    setSearchTerm('');
    setFilterPath('');

    // Clear comparison data
    setLeftJson('');
    setRightJson('');
    setParsedLeftJson(null);
    setParsedRightJson(null);
    setLeftError('');
    setRightError('');
    setDifferences([]);
    setComparisonResult(null);
  };

  const formatJson = (
    json: any,
    searchTerm: string = '',
    path: string = ''
  ): string => {
    // Handle cases where JSON.stringify might return undefined
    const formatted = JSON.stringify(json, null, 2);

    // If JSON.stringify returns undefined, return a fallback string
    if (formatted === undefined) {
      return 'undefined';
    }

    if (!searchTerm) return formatted;

    // Highlight search terms
    const regex = new RegExp(
      `(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`,
      'gi'
    );
    return formatted.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
  };

  const filterJsonByPath = (json: any, path: string): any => {
    if (!path) return json;

    try {
      const keys = path.split('.');
      let current = json;

      for (const key of keys) {
        if (current && typeof current === 'object') {
          current = current[key];
        } else {
          return null;
        }
      }

      return current;
    } catch {
      return json;
    }
  };

  const getDifferenceIcon = (type: string) => {
    switch (type) {
      case 'added':
        return <Plus className='w-4 h-4 text-green-600' />;
      case 'removed':
        return <Minus className='w-4 h-4 text-red-600' />;
      case 'modified':
        return <Edit3 className='w-4 h-4 text-yellow-600' />;
      case 'type-changed':
        return <RefreshCw className='w-4 h-4 text-purple-600' />;
      default:
        return <AlertCircle className='w-4 h-4 text-gray-600' />;
    }
  };

  const getDifferenceColor = (type: string) => {
    switch (type) {
      case 'added':
        return 'border-l-green-500 bg-green-50';
      case 'removed':
        return 'border-l-red-500 bg-red-50';
      case 'modified':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'type-changed':
        return 'border-l-purple-500 bg-purple-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const displayJson = filterJsonByPath(parsedJson, filterPath);

  return (
    <div className='space-y-6'>
      {/* SEO-optimized header */}
      <div className='bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-6'>
        <div className='flex items-center space-x-3 mb-4'>
          <Code className='w-8 h-8' />
          <div>
            <h1 className='text-2xl font-bold'>
              Professional JSON Parser & Formatter
            </h1>
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-5 gap-4 text-sm'>
          <div className='flex items-center space-x-2'>
            <CheckCircle className='w-4 h-4 text-green-300' />
            <span>Real-time validation</span>
          </div>
          <div className='flex items-center space-x-2'>
            <Eye className='w-4 h-4 text-blue-300' />
            <span>Beautiful formatting</span>
          </div>
          <div className='flex items-center space-x-2'>
            <Search className='w-4 h-4 text-yellow-300' />
            <span>Search & filter</span>
          </div>
          <div className='flex items-center space-x-2'>
            <GitCompare className='w-4 h-4 text-pink-300' />
            <span>JSON comparison</span>
          </div>
          <div className='flex items-center space-x-2'>
            <Download className='w-4 h-4 text-purple-300' />
            <span>Export & share</span>
          </div>
        </div>
      </div>

      <div className='bg-white rounded-lg shadow-lg p-6'>
        {/* Input Method Selection */}
        <div className='mb-6'>
          <h2 className='text-lg font-semibold text-gray-800 mb-4'>
            Choose Input Method
          </h2>
          <div className='grid grid-cols-2 md:grid-cols-5 gap-3'>
            <button
              onClick={() => setInputMethod('manual')}
              className={`flex items-center space-x-2 px-4 py-3 rounded-lg transition-all ${
                inputMethod === 'manual'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Code className='w-4 h-4' />
              <span>Manual Input</span>
            </button>

            <button
              onClick={() => setInputMethod('file')}
              className={`flex items-center space-x-2 px-4 py-3 rounded-lg transition-all ${
                inputMethod === 'file'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Upload className='w-4 h-4' />
              <span>Upload File</span>
            </button>

            <button
              onClick={() => setInputMethod('curl')}
              className={`flex items-center space-x-2 px-4 py-3 rounded-lg transition-all ${
                inputMethod === 'curl'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Terminal className='w-4 h-4' />
              <span>cURL Command</span>
            </button>

            <button
              onClick={() => setInputMethod('url')}
              className={`flex items-center space-x-2 px-4 py-3 rounded-lg transition-all ${
                inputMethod === 'url'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Globe className='w-4 h-4' />
              <span>Fetch from URL</span>
            </button>

            <button
              onClick={() => setInputMethod('compare')}
              className={`flex items-center space-x-2 px-4 py-3 rounded-lg transition-all ${
                inputMethod === 'compare'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <GitCompare className='w-4 h-4' />
              <span>Compare JSONs</span>
            </button>
          </div>
        </div>

        {/* Input Areas */}
        <div className='space-y-6'>
          {/* Manual Input */}
          {inputMethod === 'manual' && (
            <div>
              <div className='flex items-center justify-between mb-3'>
                <label className='block text-sm font-medium text-gray-700'>
                  JSON Input
                </label>
                <div className='flex items-center space-x-2'>
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className='p-1 text-gray-400 hover:text-gray-600 transition-colors'
                    title={isExpanded ? 'Minimize' : 'Expand'}
                  >
                    {isExpanded ? (
                      <Minimize2 className='w-4 h-4' />
                    ) : (
                      <Maximize2 className='w-4 h-4' />
                    )}
                  </button>
                  <button
                    onClick={clearAll}
                    className='p-1 text-gray-400 hover:text-red-600 transition-colors'
                    title='Clear all'
                  >
                    <Trash2 className='w-4 h-4' />
                  </button>
                </div>
              </div>
              <textarea
                value={inputText}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder='Paste your JSON here...'
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm resize-none transition-all ${
                  isExpanded ? 'h-96' : 'h-48'
                }`}
              />
            </div>
          )}

          {/* File Upload */}
          {inputMethod === 'file' && (
            <div className='border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors'>
              <Upload className='w-12 h-12 text-gray-400 mx-auto mb-4' />
              <div className='space-y-2'>
                <p className='text-lg font-medium text-gray-700'>
                  Upload JSON File
                </p>
                <p className='text-sm text-gray-500'>
                  Supports .json, .txt files
                </p>
                <input
                  ref={fileInputRef}
                  type='file'
                  accept='.json,.txt'
                  onChange={handleFileUpload}
                  className='hidden'
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className='inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
                >
                  <FileText className='w-4 h-4 mr-2' />
                  Choose File
                </button>
              </div>
            </div>
          )}

          {/* cURL Command */}
          {inputMethod === 'curl' && (
            <div className='space-y-4'>
              <div className='bg-gray-50 border border-gray-200 rounded-lg p-4'>
                <div className='flex items-center space-x-2 mb-3'>
                  <Terminal className='w-5 h-5 text-gray-600' />
                  <h3 className='font-medium text-gray-800'>
                    Extract JSON from cURL Command
                  </h3>
                </div>
                <textarea
                  value={curlCommand}
                  onChange={(e) => setCurlCommand(e.target.value)}
                  placeholder={`curl -X POST https://api.example.com/data -H 'Content-Type: application/json' -d '{"key": "value"}'`}
                  className='w-full px-3 py-2 border border-gray-300 rounded font-mono text-sm h-24 resize-none'
                />
                <button
                  onClick={handleCurlParse}
                  className='mt-3 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors'
                >
                  Extract JSON
                </button>
              </div>
            </div>
          )}

          {/* URL Fetch */}
          {inputMethod === 'url' && (
            <div className='space-y-4'>
              <div className='bg-gray-50 border border-gray-200 rounded-lg p-4'>
                <div className='flex items-center space-x-2 mb-3'>
                  <Globe className='w-5 h-5 text-gray-600' />
                  <h3 className='font-medium text-gray-800'>
                    Fetch JSON from URL
                  </h3>
                </div>
                <div className='flex space-x-2'>
                  <input
                    type='url'
                    value={jsonUrl}
                    onChange={(e) => setJsonUrl(e.target.value)}
                    placeholder='https://api.example.com/data.json'
                    className='flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  />
                  <button
                    onClick={handleUrlFetch}
                    disabled={loading}
                    className='px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors'
                  >
                    {loading ? (
                      <RefreshCw className='w-4 h-4 animate-spin' />
                    ) : (
                      <Globe className='w-4 h-4' />
                    )}
                    <span>Fetch</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* JSON Comparison */}
          {inputMethod === 'compare' && (
            <div className='space-y-6'>
              <div className='bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4'>
                <div className='flex items-center space-x-2 mb-3'>
                  <GitCompare className='w-6 h-6 text-purple-600' />
                  <h3 className='text-lg font-medium text-gray-800'>
                    JSON Comparison Tool
                  </h3>
                </div>
                <p className='text-sm text-gray-600'>
                  Compare two JSON objects to identify differences, additions,
                  removals, and type changes.
                </p>
              </div>

              <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                {/* Left JSON */}
                <div className='space-y-3'>
                  <div className='flex items-center justify-between'>
                    <label className='block text-sm font-medium text-gray-700'>
                      JSON A (Left)
                    </label>
                    <div className='flex items-center space-x-2'>
                      <input
                        ref={leftFileInputRef}
                        type='file'
                        accept='.json,.txt'
                        onChange={(e) => handleComparisonFileUpload(e, 'left')}
                        className='hidden'
                      />
                      <button
                        onClick={() => leftFileInputRef.current?.click()}
                        className='text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors'
                      >
                        Upload File
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={leftJson}
                    onChange={(e) =>
                      handleComparisonInputChange(e.target.value, 'left')
                    }
                    placeholder='Paste first JSON here...'
                    className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm h-64 resize-none'
                  />
                  {leftError && (
                    <div className='p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700'>
                      {leftError}
                    </div>
                  )}
                </div>

                {/* Right JSON */}
                <div className='space-y-3'>
                  <div className='flex items-center justify-between'>
                    <label className='block text-sm font-medium text-gray-700'>
                      JSON B (Right)
                    </label>
                    <div className='flex items-center space-x-2'>
                      <input
                        ref={rightFileInputRef}
                        type='file'
                        accept='.json,.txt'
                        onChange={(e) => handleComparisonFileUpload(e, 'right')}
                        className='hidden'
                      />
                      <button
                        onClick={() => rightFileInputRef.current?.click()}
                        className='text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors'
                      >
                        Upload File
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={rightJson}
                    onChange={(e) =>
                      handleComparisonInputChange(e.target.value, 'right')
                    }
                    placeholder='Paste second JSON here...'
                    className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm h-64 resize-none'
                  />
                  {rightError && (
                    <div className='p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700'>
                      {rightError}
                    </div>
                  )}
                </div>
              </div>

              {/* Comparison Results */}
              {comparisonResult && (
                <div className='space-y-4'>
                  {/* Summary */}
                  <div
                    className={`p-4 rounded-lg border-l-4 ${
                      comparisonResult.identical
                        ? 'border-l-green-500 bg-green-50'
                        : 'border-l-yellow-500 bg-yellow-50'
                    }`}
                  >
                    <div className='flex items-center justify-between mb-3'>
                      <h4 className='font-medium text-gray-800'>
                        {comparisonResult.identical
                          ? 'JSONs are identical'
                          : 'Differences found'}
                      </h4>
                      {!comparisonResult.identical && (
                        <button
                          onClick={downloadComparisonReport}
                          className='px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors'
                        >
                          Download Report
                        </button>
                      )}
                    </div>

                    {!comparisonResult.identical && (
                      <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'>
                        <div className='text-center'>
                          <div className='text-lg font-semibold text-green-600'>
                            {comparisonResult.added}
                          </div>
                          <div className='text-gray-600'>Added</div>
                        </div>
                        <div className='text-center'>
                          <div className='text-lg font-semibold text-red-600'>
                            {comparisonResult.removed}
                          </div>
                          <div className='text-gray-600'>Removed</div>
                        </div>
                        <div className='text-center'>
                          <div className='text-lg font-semibold text-yellow-600'>
                            {comparisonResult.modified}
                          </div>
                          <div className='text-gray-600'>Modified</div>
                        </div>
                        <div className='text-center'>
                          <div className='text-lg font-semibold text-purple-600'>
                            {comparisonResult.typeChanged}
                          </div>
                          <div className='text-gray-600'>Type Changed</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Differences List */}
                  {differences.length > 0 && (
                    <div className='space-y-3'>
                      <h4 className='font-medium text-gray-800'>
                        Detailed Differences
                      </h4>
                      <div className='max-h-96 overflow-y-auto scrollbar-thin space-y-2'>
                        {differences.map((diff, index) => (
                          <div
                            key={index}
                            className={`p-3 border-l-4 rounded-lg ${getDifferenceColor(
                              diff.type
                            )}`}
                          >
                            <div className='flex items-start space-x-3'>
                              {getDifferenceIcon(diff.type)}
                              <div className='flex-1'>
                                <div className='flex items-center space-x-2 mb-1'>
                                  <code className='text-sm font-mono bg-gray-100 px-2 py-1 rounded'>
                                    {diff.path}
                                  </code>
                                  <span className='text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded'>
                                    {diff.type.replace('-', ' ').toUpperCase()}
                                  </span>
                                </div>
                                <p className='text-sm text-gray-600 mb-2'>
                                  {diff.message}
                                </p>

                                {(diff.leftValue !== undefined ||
                                  diff.rightValue !== undefined) && (
                                  <div className='grid grid-cols-1 md:grid-cols-2 gap-3 text-xs'>
                                    {diff.leftValue !== undefined && (
                                      <div>
                                        <span className='font-medium text-gray-700'>
                                          Left (A):
                                        </span>
                                        <pre className='mt-1 p-2 bg-red-50 border border-red-200 rounded overflow-x-auto scrollbar-thin'>
                                          {JSON.stringify(
                                            diff.leftValue,
                                            null,
                                            2
                                          )}
                                        </pre>
                                      </div>
                                    )}
                                    {diff.rightValue !== undefined && (
                                      <div>
                                        <span className='font-medium text-gray-700'>
                                          Right (B):
                                        </span>
                                        <pre className='mt-1 p-2 bg-green-50 border border-green-200 rounded overflow-x-auto scrollbar-thin'>
                                          {JSON.stringify(
                                            diff.rightValue,
                                            null,
                                            2
                                          )}
                                        </pre>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Error Display for single JSON */}
        {inputMethod !== 'compare' && error && (
          <div className='mt-4 p-4 bg-red-50 border border-red-200 rounded-lg'>
            <div className='flex items-center space-x-2'>
              <AlertCircle className='w-5 h-5 text-red-600' />
              <div>
                <h4 className='font-medium text-red-800'>JSON Parse Error</h4>
                <p className='text-sm text-red-700 mt-1'>{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Validation Info for single JSON */}
        {inputMethod !== 'compare' && validationInfo && (
          <div className='mt-4 p-4 bg-green-50 border border-green-200 rounded-lg'>
            <div className='flex items-center space-x-2 mb-3'>
              <CheckCircle className='w-5 h-5 text-green-600' />
              <h4 className='font-medium text-green-800'>Valid JSON</h4>
            </div>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'>
              <div>
                <span className='text-gray-600'>Type:</span>
                <span className='ml-2 font-medium text-green-700'>
                  {validationInfo.type}
                </span>
              </div>
              <div>
                <span className='text-gray-600'>Size:</span>
                <span className='ml-2 font-medium text-green-700'>
                  {validationInfo.size} bytes
                </span>
              </div>
              <div>
                <span className='text-gray-600'>Depth:</span>
                <span className='ml-2 font-medium text-green-700'>
                  {validationInfo.depth} levels
                </span>
              </div>
              <div>
                <span className='text-gray-600'>Keys:</span>
                <span className='ml-2 font-medium text-green-700'>
                  {validationInfo.keys} total
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tools and Controls for single JSON */}
        {inputMethod !== 'compare' && parsedJson && (
          <div className='mt-6 space-y-4'>
            <div className='flex flex-wrap items-center justify-between gap-4'>
              <div className='flex items-center space-x-3'>
                <button
                  onClick={copyToClipboard}
                  className='flex items-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors'
                >
                  {copied ? (
                    <Check className='w-4 h-4 text-green-600' />
                  ) : (
                    <Copy className='w-4 h-4' />
                  )}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>

                <button
                  onClick={downloadJson}
                  className='flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors'
                >
                  <Download className='w-4 h-4' />
                  <span>Download</span>
                </button>

                <button
                  onClick={() => setShowRaw(!showRaw)}
                  className='flex items-center space-x-2 px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors'
                >
                  {showRaw ? (
                    <EyeOff className='w-4 h-4' />
                  ) : (
                    <Eye className='w-4 h-4' />
                  )}
                  <span>{showRaw ? 'Formatted' : 'Raw'}</span>
                </button>
              </div>

              <button
                onClick={() => handleJsonParse(parsedJson, 'Parsed JSON')}
                className='flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors'
              >
                <Zap className='w-4 h-4' />
                <span>Use in API Tool</span>
              </button>
            </div>

            {/* Search and Filter for single JSON */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Search in JSON
                </label>
                <div className='relative'>
                  <Search className='w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' />
                  <input
                    type='text'
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder='Search for keys or values...'
                    className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  />
                </div>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Filter by Path
                </label>
                <div className='relative'>
                  <Filter className='w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' />
                  <input
                    type='text'
                    value={filterPath}
                    onChange={(e) => setFilterPath(e.target.value)}
                    placeholder='e.g., user.profile.name'
                    className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* JSON Display for single JSON */}
        {inputMethod !== 'compare' && parsedJson && (
          <div className='mt-6'>
            <div className='flex items-center justify-between mb-3'>
              <h3 className='text-lg font-medium text-gray-800'>
                {filterPath
                  ? `Filtered JSON (${filterPath})`
                  : 'Formatted JSON'}
              </h3>
              <div className='text-sm text-gray-500'>
                {displayJson === null ? 'Path not found' : ''}
              </div>
            </div>

            <div className='bg-gray-900 text-gray-100 rounded-lg p-4 max-h-96 overflow-auto scrollbar-thin'>
              {displayJson !== null ? (
                <pre
                  className='text-sm font-mono whitespace-pre-wrap'
                  dangerouslySetInnerHTML={{
                    __html: showRaw
                      ? JSON.stringify(displayJson) || 'undefined'
                      : formatJson(displayJson, searchTerm),
                  }}
                />
              ) : (
                <div className='text-center py-8 text-gray-400'>
                  <AlertCircle className='w-8 h-8 mx-auto mb-2' />
                  <p>Path not found in JSON structure</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className='mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6'>
          <div className='flex items-start space-x-3'>
            <Info className='w-6 h-6 text-blue-600 mt-0.5' />
            <div className='text-sm text-blue-800'>
              <h4 className='font-medium mb-2'>JSON Parser Features</h4>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <h5 className='font-medium mb-1'>Input Methods:</h5>
                  <ul className='space-y-1 text-xs list-disc list-inside'>
                    <li>Manual text input with real-time validation</li>
                    <li>File upload for JSON and text files</li>
                    <li>Extract JSON data from cURL commands</li>
                    <li>Fetch JSON directly from URLs</li>
                    <li>
                      <strong>Compare two JSON objects side-by-side</strong>
                    </li>
                  </ul>
                </div>
                <div>
                  <h5 className='font-medium mb-1'>Advanced Features:</h5>
                  <ul className='space-y-1 text-xs list-disc list-inside'>
                    <li>Real-time syntax validation and error reporting</li>
                    <li>Search and highlight within JSON content</li>
                    <li>Filter by object path (e.g., user.profile.name)</li>
                    <li>Copy, download, and export functionality</li>
                    <li>
                      <strong>
                        Detailed difference analysis with visual indicators
                      </strong>
                    </li>
                  </ul>
                </div>
              </div>
              <div className='mt-3 pt-3 border-t border-blue-200'>
                <h5 className='font-medium mb-1'>JSON Comparison:</h5>
                <p className='text-xs'>
                  Compare two JSON objects to identify additions, removals,
                  modifications, and type changes. Perfect for API response
                  validation, configuration comparison, and data migration
                  verification. Export detailed comparison reports for
                  documentation and analysis.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default JsonParser;
