import React, { useState, useRef } from 'react';
import { Upload } from 'lucide-react';
import { useSchema } from '@/hooks/useSchema';
import { useCollection } from '@/hooks/useCollection';
import { useToast } from '@/hooks/use-toast';

const SchemaUploader: React.FC = () => {
  const { uploadSchemaMutation } = useSchema();
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { activeRequest } = useCollection();
  const { toast } = useToast();

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
    if (!activeRequest?.id) {
      setError('Please save the request before uploading a schema.');
      setUploading(false);
      return;
    }
    setUploading(true);
    setError(null);

    try {
      const response = await uploadSchemaMutation.mutateAsync({
        requestId: activeRequest?.id || '',
        schema: file,
      });
      toast({
        title: 'Schema Uploaded',
        description: response.message,
      });
      setUploading(false);
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

  return (
    <div className='mb-4'>
      <label
        htmlFor='schema-upload'
        className={`cursor-pointer border-2 border-dashed rounded-md p-6 text-center block transition ${
          dragActive ? 'border-indigo-400 bg-indigo-50' : 'border-gray-300'
        }`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        <input
          id='schema-upload'
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

        {error && (
          <div className='mt-3 text-sm text-red-600 bg-red-50 p-2 rounded-md'>
            {error}
          </div>
        )}
      </label>
    </div>
  );
};

export default SchemaUploader;
