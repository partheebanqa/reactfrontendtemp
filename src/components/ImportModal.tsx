import React, { useState, useRef } from 'react';
import { X, Upload, AlertCircle, Link as LinkIcon, FileText } from 'lucide-react';
import { Collection, ImportCollection, ImportResult } from '../types';
import { importPostmanCollection } from '../utils/importers/postmanImporter';
import { importSwaggerCollection } from '../utils/importers/swaggerImporter';
import { importCurlCommand } from '../utils/importers/curlImporter';
import { collectionService } from '../shared/services/collectionService';
import { useWorkspace } from '../context/WorkspaceContext';
import { showSnackbar } from '../shared/services/snackbarService';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (collections: Collection[]) => void;
}

const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onImport }) => {
  const [importText, setImportText] = useState('');
  const [swaggerUrl, setSwaggerUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importType, setImportType] = useState<'text' | 'url' | 'file'>('text');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { selectedWorkspaceId } = useWorkspace(); 

  if (!isOpen) return null;

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleImport = async () => {
    setImporting(true);
    setError(null);

    try {
      let textToImport = importText;

      // Handle different import sources
      if (importType === 'url') {
        const response = await fetch(swaggerUrl);
        if (!response.ok) {
          throw new Error('Failed to fetch specification from URL');
        }
        textToImport = await response.text();
      } else if (importType === 'file' && selectedFile) {
        textToImport = await selectedFile.text();
        const json = JSON.parse(textToImport);
        if (json.info?.schema?.includes('schema.getpostman.com')) {
          const importedCollection : ImportCollection = {
            name: json.info?.name,
            workspaceId: selectedWorkspaceId,
            inputMethod: 'file',
            specificationType: 'postman',
            file: selectedFile,
            raw: '',
            url: ''
          }
          try{
            const response = await collectionService.importCollectionFile(importedCollection); 
            if (response) {
              showSnackbar(response.data.message, 'success');
            }
          }catch (err){
            setError(err instanceof Error ? err.message : 'Failed to import collection');
          }
          
        }
      }

      // Try to parse as JSON first (Postman collection)
      try {
        const json = JSON.parse(textToImport);
        if (json.info?.schema?.includes('schema.getpostman.com')) {
          const result = await importPostmanCollection(json);
          onImport(result.collections);
          onClose();
          return;
        }
      } catch (e) {
        // Not JSON, try other formats
      }

      // Try to parse as Swagger/OpenAPI
      if (textToImport.includes('swagger') || textToImport.includes('openapi')) {
        const result = await importSwaggerCollection(textToImport);
        onImport(result.collections);
        onClose();
        return;
      }

      // Try to parse as cURL
      if (textToImport.trim().toLowerCase().startsWith('curl')) {
        const result = importCurlCommand(textToImport);
        onImport(result.collections);
        onClose();
        return;
      }

      setError('Unsupported format. Please provide a valid Postman collection, Swagger/OpenAPI specification, or cURL command.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import collection');
    } finally {
      setImporting(false);
    }
  };

  const isImportDisabled = () => {
    switch (importType) {
      case 'text':
        return !importText.trim();
      case 'url':
        return !swaggerUrl.trim();
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
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          <div className="space-y-4">
            <div className="flex rounded-lg bg-gray-100 p-1">
              <button
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  importType === 'text'
                    ? 'bg-white text-gray-800 shadow'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                onClick={() => setImportType('text')}
              >
                Import from Text
              </button>
              <button
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  importType === 'url'
                    ? 'bg-white text-gray-800 shadow'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                onClick={() => setImportType('url')}
              >
                Import from URL
              </button>
              <button
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  importType === 'file'
                    ? 'bg-white text-gray-800 shadow'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                onClick={() => setImportType('file')}
              >
                Upload File
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
                  placeholder="Paste your Postman collection, Swagger/OpenAPI specification, or cURL command here..."
                />
              </div>
            )}

            {importType === 'url' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Swagger/OpenAPI URL
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <LinkIcon size={16} className="text-gray-400" />
                    </div>
                    <input
                      type="url"
                      value={swaggerUrl}
                      onChange={(e) => setSwaggerUrl(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-md"
                      placeholder="https://api.example.com/swagger.json"
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
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <FileText size={48} className="mx-auto text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                      >
                        <span>Upload a file</span>
                        <input
                          id="file-upload"
                          ref={fileInputRef}
                          type="file"
                          className="sr-only"
                          accept=".json,.yaml,.yml,.curl"
                          onChange={handleFileSelect}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      Postman Collection, Swagger/OpenAPI spec, or cURL file
                    </p>
                    {selectedFile && (
                      <p className="text-sm text-gray-600">
                        Selected: {selectedFile.name}
                      </p>
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
            onClick={onClose}
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