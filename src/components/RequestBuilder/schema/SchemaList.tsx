import React from 'react';
import { Calendar, Star, Trash2, Eye, Download } from 'lucide-react';
import { SchemaType } from '@/shared/types/schema';
import { useSchema } from '@/hooks/useSchema';

interface SchemaListProps {
  compareMode: boolean;
  selectedSchemas: string[];
  onSchemaSelect: (schemaId: string) => void;
  onViewSchema: (schema: { id: string; name: string; content: any }) => void;
  onDownloadSchema: (schema: { name: string; content: any }) => void;
}

const SchemaList: React.FC<SchemaListProps> = ({
  compareMode,
  selectedSchemas,
  onSchemaSelect,
  onViewSchema,
  onDownloadSchema
}) => {
  const { schemas, deleteSchema, setPrimarySchema } = useSchema();
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
  
  return (
    <div className="mt-4 space-y-3">
      {schemas.map((schema) => (
        <div 
          key={schema.id}
          className={`border rounded-md p-3 transition-colors ${
            schema.isPrimary 
              ? 'border-indigo-200 bg-indigo-50' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {compareMode && (
                <input
                  type="checkbox"
                  checked={selectedSchemas.includes(schema.id)}
                  onChange={() => onSchemaSelect(schema.id)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
              )}
              <h3 className="font-medium">{schema.name}</h3>
              {schema.isPrimary && (
                <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-0.5 rounded-full">
                  Primary
                </span>
              )}
              <span className="bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded-full">
                {getSchemaTypeLabel(schema.type)}
              </span>
            </div>
            
            {!compareMode && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewSchema(schema);
                  }}
                  className="text-gray-500 hover:text-indigo-600 transition-colors"
                  title="View schema"
                >
                  <Eye size={18} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDownloadSchema(schema);
                  }}
                  className="text-gray-500 hover:text-indigo-600 transition-colors"
                  title="Download schema"
                >
                  <Download size={18} />
                </button>
                {!schema.isPrimary && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPrimarySchema(schema.id);
                    }}
                    className="text-gray-500 hover:text-indigo-600 transition-colors"
                    title="Set as primary"
                  >
                    <Star size={18} />
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSchema(schema.id);
                  }}
                  className="text-gray-500 hover:text-red-600 transition-colors"
                  title="Delete schema"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            )}
          </div>
          
          <div className="mt-1 flex items-center text-xs text-gray-500">
            <Calendar size={14} className="mr-1" />
            <span>{formatDate(schema.createdAt)}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SchemaList;