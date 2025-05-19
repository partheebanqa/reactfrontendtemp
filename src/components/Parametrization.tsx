import React, { useState, useRef } from 'react';
import { Upload, Play, Trash2, FileText, AlertCircle, Clock } from 'lucide-react';
import Papa from 'papaparse';
import { Request } from '../types';

interface ParametrizationProps {
  request: Request;
  onRequestChange: (request: Request) => void;
  onSend: () => void;
}

interface DataRow {
  [key: string]: string;
}

const Parametrization: React.FC<ParametrizationProps> = ({
  request,
  onRequestChange,
  onSend
}) => {
  const [data, setData] = useState<DataRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [delay, setDelay] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setError('Error parsing CSV file');
          return;
        }

        const parsedData = results.data as DataRow[];
        setData(parsedData);
        if (parsedData.length > 0) {
          setHeaders(Object.keys(parsedData[0]));
        }
        setError(null);
      },
      error: () => {
        setError('Error parsing CSV file');
      }
    });
  };

  const handleJSONUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string);
        if (Array.isArray(jsonData)) {
          setData(jsonData);
          if (jsonData.length > 0) {
            setHeaders(Object.keys(jsonData[0]));
          }
          setError(null);
        } else {
          setError('JSON file must contain an array of objects');
        }
      } catch {
        setError('Invalid JSON file');
      }
    };
    reader.readAsText(file);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const runParameterizedTests = async () => {
    // For data-driven tests
    if (data.length > 0) {
      for (const row of data) {
        let currentRequest = { ...request };

        // Replace variables in URL
        let url = request.url;
        headers.forEach(header => {
          url = url.replace(`{{${header}}}`, row[header]);
        });
        currentRequest.url = url;

        // Replace variables in body
        if (request.body) {
          let body = request.body;
          headers.forEach(header => {
            body = body.replace(`{{${header}}}`, row[header]);
          });
          currentRequest.body = body;
        }

        // Replace variables in headers
        const processedHeaders = { ...request.headers };
        Object.entries(processedHeaders).forEach(([key, value]) => {
          headers.forEach(header => {
            processedHeaders[key] = value.replace(`{{${header}}}`, row[header]);
          });
        });
        currentRequest.headers = processedHeaders;

        // Replace variables in params
        const processedParams = { ...request.params };
        Object.entries(processedParams).forEach(([key, value]) => {
          headers.forEach(header => {
            processedParams[key] = value.replace(`{{${header}}}`, row[header]);
          });
        });
        currentRequest.params = processedParams;

        onRequestChange(currentRequest);
        await onSend();

        // Add delay between requests if specified
        if (delay > 0) {
          await sleep(delay * 1000);
        }
      }
    }

    // For file upload tests
    for (const file of selectedFiles) {
      const formData = new FormData();
      formData.append('file', file);

      const currentRequest = {
        ...request,
        headers: {
          ...request.headers,
          'Content-Type': 'multipart/form-data'
        },
        body: formData as any
      };

      onRequestChange(currentRequest);
      await onSend();

      // Add delay between requests if specified
      if (delay > 0) {
        await sleep(delay * 1000);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Data-Driven Testing</h3>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-mediummb-2">
                Upload CSV File
              </label>
              <div className="flex items-center gap-2">
                <input
                  ref={csvInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleCSVUpload}
                  className="hidden"
                />
                <button
                  onClick={() => csvInputRef.current?.click()}
                  className="px-4 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 flex items-center gap-2"
                >
                  <Upload size={16} />
                  Upload CSV
                </button>
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">
                Upload JSON File
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleJSONUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 flex items-center gap-2"
                >
                  <Upload size={16} />
                  Upload JSON
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded">
              <AlertCircle size={16} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {data.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Available Variables</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-3 gap-4">
                  {headers.map(header => (
                    <div key={header} className="text-sm">
                      <code className="bg-gray-100 px-2 py-1 rounded">{'{{' + header + '}}'}</code>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-4">File Upload Testing</h3>
        <div className="space-y-4">
          <div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 flex items-center gap-2"
            >
              <Upload size={16} />
              Upload Files
            </button>
          </div>

          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Selected Files</h4>
              <div className="space-y-2">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-50 p-2 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-gray-500" />
                      <span className="text-sm">{file.name}</span>
                      <span className="text-xs text-gray-500">
                        ({(file.size / 1024).toFixed(2)} KB)
                      </span>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {(data.length > 0 || selectedFiles.length > 0) && (
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Request Delay</h4>
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-gray-500" />
              <input
                type="number"
                min="0"
                step="1"
                value={delay}
                onChange={(e) => setDelay(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-24 px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                placeholder="Seconds"
              />
              <span className="text-sm text-gray-500">seconds between requests</span>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={runParameterizedTests}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center gap-2"
            >
              <Play size={16} />
              Run Tests
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Parametrization;