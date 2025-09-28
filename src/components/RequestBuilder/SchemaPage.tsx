'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Download, Server, X, GitCompare, Upload, Info } from 'lucide-react';
import SchemaUploader from './schema/SchemaUploader';
import SchemaList from './schema/SchemaList';
import SchemaComparer from './schema/SchemaComparer';
import JsonTreeViewer from './schema/JsonTreeViewer';
import { useSchema } from '@/hooks/useSchema';
import { useCollection } from '@/hooks/useCollection';
import { useToast } from '@/hooks/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';

const SchemaPage: React.FC = () => {
  const { schemas, uploadSchemaMutation } = useSchema();
  const { activeRequest } = useCollection();
  const { toast } = useToast();

  const [compareMode, setCompareMode] = useState(false);
  const [selectedSchemas, setSelectedSchemas] = useState<string[]>([]);
  const [viewSchema, setViewSchema] = useState<{
    id: string;
    name: string;
    schema: any;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload handler shared by both button + drag-drop
  const processFile = async (file: File) => {
    if (!activeRequest?.id) {
      toast({
        title: 'Error',
        description: 'Please save the request before uploading a schema.',
        variant: 'destructive',
      });
      return;
    }
    try {
      const response = await uploadSchemaMutation.mutateAsync({
        requestId: activeRequest.id,
        schema: file,
      });
      toast({
        title: 'Schema Uploaded',
        description: response.message,
      });
    } catch {
      toast({
        title: 'Upload Failed',
        description: 'Error reading or uploading schema file.',
        variant: 'destructive',
      });
    }
  };

  const toggleCompareMode = () => {
    setCompareMode(!compareMode);
    setSelectedSchemas([]);
  };

  const handleSchemaSelect = (schemaId: string) => {
    if (compareMode) {
      if (selectedSchemas.includes(schemaId)) {
        setSelectedSchemas(selectedSchemas.filter((id) => id !== schemaId));
      } else if (selectedSchemas.length < 2) {
        setSelectedSchemas([...selectedSchemas, schemaId]);
      }
    }
  };

  const handleViewSchema = (schema: {
    id: string;
    name: string;
    schema: any;
  }) => {
    setViewSchema(schema);
  };

  const handleDownloadSchema = (schema: { name: string; schema: any }) => {
    const blob = new Blob([JSON.stringify(schema.schema, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${schema.name}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const canCompare = selectedSchemas.length === 2;

  return (
    <div className='space-y-6'>
      {/* Schemas Section */}
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0'>
          <div>
            <h3 className='text-base sm:text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2'>
              API Schemas
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className='w-4 h-4 text-muted-foreground cursor-pointer' />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      You can upload up to 2 JSON schema files for comparison
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </h3>
          </div>
          <div className='flex space-x-2'>
            {/* Hidden input for Upload button */}
            <input
              ref={fileInputRef}
              type='file'
              accept='.json,.yaml,.yml'
              className='hidden'
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) processFile(file);
              }}
            />
            <Button
              variant='outline'
              disabled={schemas.length >= 2}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className='w-4 h-4 mr-2' /> Upload Schema
            </Button>

            <Button
              variant={compareMode ? 'outline' : 'default'}
              onClick={toggleCompareMode}
            >
              {compareMode ? (
                <>
                  <X className='w-4 h-4 mr-2' /> Cancel Compare
                </>
              ) : (
                <>
                  <GitCompare className='w-4 h-4 mr-2' /> Compare Schemas
                </>
              )}
            </Button>
            {compareMode && (
              <Button
                variant={canCompare ? 'default' : 'outline'}
                disabled={!canCompare}
              >
                <GitCompare className='w-4 h-4 mr-2' /> Compare Selected
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {schemas.length === 0 ? (
            <SchemaUploader onUpload={processFile} />
          ) : (
            <SchemaList
              compareMode={compareMode}
              selectedSchemas={selectedSchemas}
              onSchemaSelect={handleSchemaSelect}
              onViewSchema={handleViewSchema}
              onDownloadSchema={handleDownloadSchema}
            />
          )}
        </CardContent>
      </Card>

      {/* Schema Comparison */}
      {canCompare && (
        <Card>
          <CardHeader>
            <h3 className='text-base sm:text-lg font-medium text-gray-900 dark:text-white'>
              Schema Comparison
            </h3>
          </CardHeader>
          <CardContent>
            <SchemaComparer schemaIds={selectedSchemas} />
          </CardContent>
        </Card>
      )}

      {/* Schema Viewer Modal */}
      {viewSchema && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white dark:bg-gray-900 rounded-lg shadow-xl w-11/12 max-w-4xl max-h-[90vh] overflow-hidden'>
            <div className='p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center'>
              <div className='flex items-center space-x-2'>
                <Server size={20} className='text-indigo-600' />
                <h3 className='text-base sm:text-lg font-medium text-gray-900 dark:text-white'>
                  {viewSchema.name}
                </h3>
              </div>
              <Button
                variant='ghost'
                size='icon'
                onClick={() => setViewSchema(null)}
              >
                <X className='h-5 w-5' />
              </Button>
            </div>
            <div className='p-4 overflow-auto max-h-[calc(90vh-8rem)]'>
              <JsonTreeViewer json={viewSchema.schema} />
            </div>
            <div className='p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end'>
              <Button
                onClick={() => handleDownloadSchema(viewSchema)}
                className='flex items-center'
              >
                <Download size={16} className='mr-2' />
                Download JSON
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchemaPage;
