import React from 'react';
import { Calendar, Star, Trash2, Eye, Download } from 'lucide-react';
import { SchemaType } from '@/shared/types/schema';
import { useSchema } from '@/hooks/useSchema';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface SchemaListProps {
  compareMode: boolean;
  selectedSchemas: string[];
  onSchemaSelect: (schemaId: string) => void;
  onViewSchema: (schema: { id: string; name: string; schema: any }) => void;
  onDownloadSchema: (schema: { name: string; schema: any }) => void;
}

const SchemaList: React.FC<SchemaListProps> = ({
  compareMode,
  selectedSchemas,
  onSchemaSelect,
  onViewSchema,
  onDownloadSchema,
}) => {
  const { schemas, deleteSchema, setPrimarySchema } = useSchema();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSchemaTypeLabel = (type: SchemaType) => {
    switch (type) {
      case 'postman':
        return 'Postman';
      case 'openapi':
        return 'OpenAPI';
      case 'generated':
        return 'Generated';
      default:
        return 'Unknown';
    }
  };

  if (!schemas.length) {
    return (
      <p className='text-sm text-muted-foreground mt-4'>No schemas available</p>
    );
  }

  return (
    <div className='mt-4 space-y-3'>
      {schemas.map((schema) => (
        <Card
          key={schema.id}
          className={`transition-colors ${
            schema.isPrimary
              ? 'border-indigo-300 bg-indigo-50/60'
              : 'hover:border-gray-300'
          }`}
        >
          <CardContent className='flex flex-col gap-2 p-4'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                {compareMode && (
                  <input
                    type='checkbox'
                    checked={selectedSchemas.includes(schema.id)}
                    onChange={() => onSchemaSelect(schema.id)}
                    className='h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded'
                  />
                )}
                <h3 className='font-medium'>{schema.name}</h3>
                {schema.isPrimary && (
                  <Badge
                    variant='secondary'
                    className='bg-indigo-100 text-indigo-800'
                  >
                    Primary
                  </Badge>
                )}
                {/* <Badge variant='outline'>
                  {getSchemaTypeLabel(schema.type)}
                </Badge> */}
              </div>

              {!compareMode && (
                <div className='flex items-center gap-2'>
                  <Button
                    size='icon'
                    variant='ghost'
                    aria-label='View schema'
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewSchema(schema);
                    }}
                  >
                    <Eye size={18} />
                  </Button>

                  <Button
                    size='icon'
                    variant='ghost'
                    aria-label='Download schema'
                    onClick={(e) => {
                      e.stopPropagation();
                      onDownloadSchema(schema);
                    }}
                  >
                    <Download size={18} />
                  </Button>

                  {!schema.isPrimary && (
                    <Button
                      size='icon'
                      variant='ghost'
                      aria-label='Set as primary'
                      onClick={(e) => {
                        e.stopPropagation();
                        setPrimarySchema(schema.id);
                      }}
                    >
                      <Star size={18} />
                    </Button>
                  )}

                  <Button
                    size='icon'
                    variant='ghost'
                    className='text-red-600 hover:text-red-700'
                    aria-label='Delete schema'
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSchema(schema.id);
                    }}
                  >
                    <Trash2 size={18} />
                  </Button>
                </div>
              )}
            </div>

            <div className='flex items-center text-xs text-muted-foreground'>
              <Calendar size={14} className='mr-1' />
              <span>{formatDate(schema.createdAt)}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default SchemaList;
