import React, { useState, useRef } from 'react';
import { Upload } from 'lucide-react';

interface SchemaUploaderProps {
  onUpload?: (file: File) => void;
}

const SchemaUploader: React.FC<SchemaUploaderProps> = ({ onUpload }) => {
  const [dragActive, setDragActive] = useState(false);
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

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file && onUpload) onUpload(file);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUpload) onUpload(file);
  };

  return (
    <div className='mb-4'>
      <label
        htmlFor='schema-upload-box'
        className={`cursor-pointer border-2 border-dashed rounded-md p-6 text-center block transition ${
          dragActive ? 'border-indigo-400 bg-indigo-50' : 'border-gray-300'
        }`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        <input
          id='schema-upload-box'
          ref={fileInputRef}
          type='file'
          className='hidden'
          accept='.json,.yaml,.yml'
          onChange={handleFileChange}
        />

        <Upload className='mx-auto h-12 w-12 text-gray-400' />
        <div className='mt-2'>
          <p className='text-sm text-gray-600'>
            Drag & drop your schema file here, or{' '}
            <span className='font-semibold text-indigo-600'>browse</span>
          </p>
        </div>
        <p className='mt-1 text-xs text-gray-500'>
          Supports Postman and OpenAPI schema files (.json, .yaml, .yml)
        </p>
      </label>
    </div>
  );
};

export default SchemaUploader;
