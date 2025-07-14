import React, { useState, useRef } from 'react';
import { Upload } from 'lucide-react';
import { detectSchemaType, validateSchema } from '@/lib/schemaUtils';
import { useSchema } from '@/hooks/useSchema';

const SchemaUploader: React.FC = () => {
  const { addSchema } = useSchema();
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };
  
  const processFile = async (file: File) => {
    setUploading(true);
    setError(null);
    
    try {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          const content = event.target?.result as string;
          const jsonData = JSON.parse(content);
          
          const schemaType = detectSchemaType(jsonData);
          
          if (!schemaType) {
            setError('Invalid schema format. Please upload a valid Postman or OpenAPI schema.');
            setUploading(false);
            return;
          }
          
          const isValid = validateSchema(jsonData, schemaType);
          
          if (!isValid) {
            setError(`Invalid ${schemaType} schema. Please check your file.`);
            setUploading(false);
            return;
          }
          
          addSchema({
            id: Math.random().toString(36).substr(2, 9),
            name: file.name.replace(/\.(json|yaml|yml)$/, ''),
            content: jsonData,
            isPrimary: false,
            type: schemaType,
            createdAt: new Date().toISOString()
          });
          
          setUploading(false);
        } catch (err) {
          setError('Error parsing schema file. Please make sure it\'s valid JSON.');
          setUploading(false);
        }
      };
      
      reader.readAsText(file);
    } catch (err) {
      setError('Error reading file.');
      setUploading(false);
    }
  };
  
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFile(e.dataTransfer.files[0]);
    }
  };
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0]);
    }
  };
  
  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };
  
  return (
    <div className="mb-4">
      <div
        className={`border-2 border-dashed rounded-md p-6 text-center ${
          dragActive 
            ? 'border-indigo-400 bg-indigo-50' 
            : 'border-gray-300'
        }`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".json,.yaml,.yml"
          onChange={handleFileChange}
        />
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <div className="mt-2">
          <p className="text-sm text-gray-600">
            Drag and drop your schema file here, or
          </p>
          <button
            type="button"
            onClick={handleButtonClick}
            disabled={uploading}
            className="mt-1 text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none disabled:opacity-50"
          >
            browse to upload
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Supports Postman and OpenAPI schema files (.json)
        </p>
        
        {error && (
          <div className="mt-3 text-sm text-red-600 bg-red-50 p-2 rounded-md">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default SchemaUploader;