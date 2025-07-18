import React, { useState, useRef } from 'react';
import { X, Upload, AlertCircle, Link as LinkIcon, FileText } from 'lucide-react';
import { ImportCollection } from '@/shared/types/collection';
import { importPostmanCollection } from '@/lib/importers/postmanImporter';
import { importSwaggerCollection } from '@/lib/importers/swaggerImporter';
import { importCurlCommand } from '@/lib/importers/curlImporter';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useCollection } from '@/hooks/useCollection';
import { useToast } from '@/hooks/useToast';


interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, }) => {
  const [importText, setImportText] = useState('');
  const [postmanUrl, setPostmanUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importType, setImportType] = useState<'file' | 'url' | 'text'>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { currentWorkspace } = useWorkspace();
  const { importCollectionMutation } = useCollection();
  const { success, error: showError } = useToast();

  if (!isOpen) return null;

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file type
      if (!file.type.includes('json') && !file.name.endsWith('.json')) {
        setError('Only JSON files are accepted');
        showError('Invalid File Type', 'Please select a JSON file');
        setSelectedFile(null);
        // Reset the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }
      // Check file size (5MB = 5 * 1024 * 1024 bytes)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size exceeds 5MB limit');
        showError('File Too Large', 'Please select a file under 5MB');
        setSelectedFile(null);
        // Reset the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleOnClose = () => {
    setImportText('');
    setPostmanUrl('');
    setSelectedFile(null);
    setImporting(false);
    setError(null);
    onClose();
  };

  const handleImport = async () => {
    setImporting(true);
    setError(null);
    let textToImport = importText;

    try {
      if (importType === 'url') {
        const response = await fetch(postmanUrl);
        if (!response.ok) {
          throw new Error('Failed to fetch collection from URL');
        }
        textToImport = await response.text();
      } else if (importType === 'file' && selectedFile) {
        textToImport = await selectedFile.text();
      }
      try {
        const json = JSON.parse(textToImport);
        if (json.info?.schema?.includes('schema.getpostman.com')) {
          const response = await importCollectionMutation.mutateAsync({
            name: json.info.name,
            workspaceId: currentWorkspace?.id || '',
            inputMethod: "raw",
            specificationType: 'postman',
            raw: JSON.stringify(json),
          });

          success('Import Successful', `Imported Postman collection: ${json.info.name}`);
          handleOnClose();
          return;
        } else {
          throw new Error('Not a valid Postman collection');
        }
      } catch (e) {
        // Not JSON or not a valid Postman collection
      }

      // Try to parse as cURL
      if (textToImport.trim().toLowerCase().startsWith('curl')) {
        const result = importCurlCommand(textToImport);
        success('Import Successful', 'Imported cURL command');
        handleOnClose();
        return;
      }

      const errorMsg = 'Unsupported format. Please provide a valid Postman collection or cURL command.';
      setError(errorMsg);
      showError('Import Failed', errorMsg);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to import collection';
      setError(errorMessage);
      showError('Import Error', errorMessage);
    } finally {
      setImporting(false);
    }
  };

  const isImportDisabled = () => {
    switch (importType) {
      case 'text':
        return !importText.trim();
      case 'url':
        return !postmanUrl.trim();
      case 'file':
        return !selectedFile;
      default:
        return true;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Import Collection</h2>
          <button
            onClick={handleOnClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          <div className="space-y-4">
            <div className="flex rounded-lg bg-gray-100 p-1">
              <button
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${importType === 'file'
                    ? 'bg-white text-gray-800 shadow'
                    : 'text-gray-600 hover:text-gray-800'
                  }`}
                onClick={() => setImportType('file')}
              >
                Upload File
              </button>
              <button
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${importType === 'url'
                    ? 'bg-white text-gray-800 shadow'
                    : 'text-gray-600 hover:text-gray-800'
                  }`}
                onClick={() => setImportType('url')}
              >
                Import from URL
              </button>
              <button
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${importType === 'text'
                    ? 'bg-white text-gray-800 shadow'
                    : 'text-gray-600 hover:text-gray-800'
                  }`}
                onClick={() => setImportType('text')}
              >
                Import from Text
              </button>
            </div>

            {importType === 'text' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Paste Collection
                </label>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  className="w-full h-64 px-3 py-2 text-sm font-mono border border-gray-300 rounded-md"
                  placeholder="Paste your Postman collection or cURL command here..."
                />
              </div>
            )}

            {importType === 'url' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Postman Collection URL
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <LinkIcon size={16} className="text-gray-400" />
                    </div>
                    <input
                      type="url"
                      value={postmanUrl}
                      onChange={(e) => setPostmanUrl(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-md"
                      placeholder="https://api.example.com/postman-collection.json"
                    />
                  </div>
                </div>
              </div>
            )}

            {importType === 'file' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Upload File
                </label>
                <div
                  className="mt-1 flex flex-col items-center justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-blue-400 transition-colors"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                      const file = e.dataTransfer.files[0];
                      // Check file type
                      if (!file.type.includes('json') && !file.name.endsWith('.json')) {
                        setError('Only JSON files are accepted');
                        showError('Invalid File Type', 'Please select a JSON file');
                        return;
                      }
                      // Check file size
                      if (file.size > 5 * 1024 * 1024) {
                        setError('File size exceeds 5MB limit');
                        showError('File Too Large', 'Please select a file under 5MB');
                      } else {
                        setSelectedFile(file);
                        setError(null);
                      }
                    }
                  }}
                >
                  <div className="space-y-3 text-center">
                    <div className="flex flex-col items-center">
                      <Upload size={42} className="mx-auto text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">Choose a file</h3>
                    </div>
                    <div className="flex justify-center text-sm text-gray-600">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
                      >
                        <span>Choose a file</span>
                        <input
                          id="file-upload"
                          ref={fileInputRef}
                          type="file"
                          className="sr-only"
                          accept="application/json,.json"
                          onChange={handleFileSelect}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      Postman collection JSON files up to 5MB
                    </p>
                    {selectedFile && (
                      <div className="mt-2 text-sm bg-gray-50 px-3 py-2 rounded-md text-green-600">
                        <span className="font-medium text-[#47515f]">Selected:</span> {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded">
                <AlertCircle size={16} />
                <span className="text-sm">{error}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t border-gray-200">
          <button
            onClick={handleOnClose}
            className="px-4 py-2 text-gray-700 hover:text-gray-900"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={isImportDisabled() || importing}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
          >
            <Upload size={16} />
            {importing ? 'Importing...' : 'Import'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportModal;