import React, { useState, useRef } from 'react';
import { X, Upload, AlertCircle, Link as LinkIcon, FileText, Terminal } from 'lucide-react';
import { ImportCollection } from '@/shared/types/collection';
import { importPostmanCollection } from '@/lib/importers/postmanImporter';
import { importSwaggerCollection } from '@/lib/importers/swaggerImporter';
import { importCurlCommand } from '@/lib/importers/curlImporter';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useCollection } from '@/hooks/useCollection';
import { useToast } from '@/hooks/useToast';

// Helper function to validate JSON
const isValidJson = (text: string): boolean => {
  try {
    JSON.parse(text);
    return true;
  } catch (e) {
    return false;
  }
};

// Helper function to check if it's a Postman collection
const isPostmanCollection = (json: any): boolean => {
  return json?.info?.schema?.includes('schema.getpostman.com');
};

// Helper function to check if it's a Swagger/OpenAPI specification
const isSwaggerSpec = (json: any): boolean => {
  return Boolean(json?.swagger || json?.openapi);
};

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, }) => {
  const [importText, setImportText] = useState('');
  const [postmanUrl, setPostmanUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importType, setImportType] = useState<'file' | 'swagger' | 'curl'>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { currentWorkspace } = useWorkspace();
  const { importCollectionMutation } = useCollection();
  const { success, error: showError } = useToast();

  if (!isOpen) return null;

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file type - allow JSON and other formats that might be valid for import
      const isAcceptedType = file.type.includes('json') ||
        file.type.includes('application/x-yaml') ||
        file.type.includes('text/') ||
        file.name.endsWith('.json') ||
        file.name.endsWith('.yaml') ||
        file.name.endsWith('.yml');

      if (!isAcceptedType) {
        setError('Invalid file type. Please select a JSON, YAML, or text file');
        showError('Invalid File Type', 'Please select a supported file format');
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

      if (importType === 'swagger') {
        const response = await importCollectionMutation.mutateAsync({
          workspaceId: currentWorkspace?.id || '',
          inputMethod: "url",
          specificationType: 'swagger',
          url: postmanUrl.trim(),
        });
      } if (importType === 'curl') {
        const response = await importCollectionMutation.mutateAsync({
          workspaceId: currentWorkspace?.id || '',
          inputMethod: "raw",
          specificationType: 'curl',
          url: importText.trim(),
        });
      } else if (importType === 'file' && selectedFile) {
        const fileText = await selectedFile.text();
        const json = JSON.parse(fileText);
        let specificationType: 'postman' | 'swagger' | 'openapi' | 'file' = 'file';
        let collectionName = '';

        if (json.info?.schema?.includes('schema.getpostman.com')) {
          specificationType = 'postman';
          collectionName = json.info.name || 'Imported Postman Collection';
        } else if (json.swagger) {
          specificationType = 'swagger';
          collectionName = json.info?.title || 'Imported API';
        } else if (json.openapi) {
          specificationType = 'openapi';
          collectionName = json.info?.title || 'Imported API';
        } else {
          throw new Error('Not a valid Postman collection or Swagger/OpenAPI specification');
        }
           await importCollectionMutation.mutateAsync({
          name: collectionName,
          workspaceId: currentWorkspace?.id || '',
          inputMethod: "file",
          specificationType: specificationType,
          file: selectedFile,
        });
      }
    } catch (err) {
      showError('Import Error', err instanceof Error ? err.message : 'Failed to import collection');
    } finally {
      setImporting(false);
    }
  };

  const isImportDisabled = () => {
    if (importing) return true;

    switch (importType) {
      case 'curl':
        return !importText.trim();
      case 'swagger':
        // Allow either URL or direct JSON input
        return !postmanUrl.trim() && !importText.trim();
      case 'file':
        // Allow either file upload or direct JSON input
        return !selectedFile && !importText.trim();
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
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${importType === 'file'
                  ? 'bg-white text-gray-800 shadow'
                  : 'text-gray-600 hover:text-gray-800'
                  }`}
                onClick={() => setImportType('file')}
              >
                <FileText size={16} />
                File Upload
              </button>
              <button
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${importType === 'swagger'
                  ? 'bg-white text-gray-800 shadow'
                  : 'text-gray-600 hover:text-gray-800'
                  }`}
                onClick={() => setImportType('swagger')}
              >
                <LinkIcon size={16} />
                Swagger URL
              </button>
              <button
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${importType === 'curl'
                  ? 'bg-white text-gray-800 shadow'
                  : 'text-gray-600 hover:text-gray-800'
                  }`}
                onClick={() => setImportType('curl')}
              >
                <Terminal size={16} />
                cURL Command
              </button>
            </div>



            {importType === 'swagger' && (
              <div>
                <input
                  type="url"
                  value={postmanUrl}
                  onChange={(e) => setPostmanUrl(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                  placeholder="https://api.example.com/swagger.json"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Enter a URL to a Swagger/OpenAPI specification or paste JSON in the box below
                </p>
              </div>
            )}

            {importType === 'curl' && (
              <>
                <div>
                  <textarea
                    value={importText}
                    onChange={(e) => {
                      setImportText(e.target.value);
                      // Clear error if there was one when user starts typing
                      if (error && e.target.value) {
                        setError(null);
                      }

                      // Basic validation for cURL format
                      if (!e.target.value.trim().toLowerCase().startsWith('curl')) {
                        setError('Input should start with "curl"');
                      } else {
                        setError(null);
                      }
                    }}
                    className={`w-full h-64 px-3 py-2 text-sm font-mono border rounded-md ${error && importText.trim() ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                    placeholder="Paste your cURL command here..."
                  />

                  {importText.trim().toLowerCase().startsWith('curl') && (
                    <div className="mt-1">
                      <p className="text-xs text-green-600">
                        ✓ Valid cURL format detected
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}

            {importType === 'file' && (
              <div>
                <div
                  className="flex flex-col items-center justify-center px-6 py-10 border border-gray-300 border-dashed rounded-lg"
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
                  <div className="text-center">
                    <Upload size={36} className="mx-auto text-gray-400 mb-4" />

                    <p className="text-sm mb-2">
                      <label
                        htmlFor="file-upload"
                        className="cursor-pointer text-blue-600 font-medium hover:text-blue-700"
                      >
                        Upload a file
                        <input
                          id="file-upload"
                          ref={fileInputRef}
                          type="file"
                          className="sr-only"
                          accept="application/json,.json,application/x-yaml,.yaml,.yml,text/plain"
                          onChange={handleFileSelect}
                        />
                      </label>
                      <span className="text-gray-600"> or drag and drop</span>
                    </p>

                    <p className="text-xs text-gray-500">
                      Postman Collection, OpenAPI/Swagger, cURL or JSON
                    </p>

                    {selectedFile && (
                      <div className="mt-4 text-sm bg-gray-50 px-3 py-2 rounded-md text-gray-600">
                        <span className="font-medium">Selected:</span> {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
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

        <div className="flex justify-between items-center p-4 border-t border-gray-200">
          <div>
            {importing && (
              <p className="text-sm text-blue-600">
                Importing... please wait
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleOnClose}
              className="px-4 py-2 text-gray-700 hover:text-gray-900"
              disabled={importing}
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={isImportDisabled() || importing}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {importing ? 'Importing...' : 'Import'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportModal;