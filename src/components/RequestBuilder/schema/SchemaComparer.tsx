import React, { useEffect, useState } from 'react';
import { SchemaDifference } from '@/shared/types/schema';
import { useSchema } from '@/contexts/SchemaContext';
import { compareSchemas } from '@/lib/schemaUtils';

interface SchemaComparerProps {
  schemaIds: string[];
}

const SchemaComparer: React.FC<SchemaComparerProps> = ({ schemaIds }) => {
  const { getSchemaById } = useSchema();
  const [differences, setDifferences] = useState<SchemaDifference[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (schemaIds.length === 2) {
      setLoading(true);
      
      const schema1 = getSchemaById(schemaIds[0]);
      const schema2 = getSchemaById(schemaIds[1]);
      
      if (schema1 && schema2) {
        const diffs = compareSchemas(schema1.content, schema2.content);
        setDifferences(diffs);
      }
      
      setLoading(false);
    }
  }, [schemaIds, getSchemaById]);
  
  if (loading) {
    return <div className="text-center py-4">Comparing schemas...</div>;
  }
  
  if (differences.length === 0) {
    return (
      <div className="bg-green-50 p-4 rounded-md text-green-700">
        No differences found. The schemas are identical.
      </div>
    );
  }

  const schema1 = getSchemaById(schemaIds[0]);
  const schema2 = getSchemaById(schemaIds[1]);
  
  return (
    <div className="space-y-4">
      {/* Schema Headers */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 p-4 rounded-md">
          <h3 className="font-medium text-gray-700">{schema1?.name}</h3>
        </div>
        <div className="bg-gray-50 p-4 rounded-md">
          <h3 className="font-medium text-gray-700">{schema2?.name}</h3>
        </div>
      </div>

      {/* Differences Summary */}
      <div className="flex space-x-4 mb-4">
        <div className="px-3 py-1 bg-green-100 text-green-800 rounded-md text-sm">
          {differences.filter(d => d.type === 'added').length} additions
        </div>
        <div className="px-3 py-1 bg-red-100 text-red-800 rounded-md text-sm">
          {differences.filter(d => d.type === 'removed').length} removals
        </div>
        <div className="px-3 py-1 bg-amber-100 text-amber-800 rounded-md text-sm">
          {differences.filter(d => d.type === 'changed').length} changes
        </div>
      </div>

      {/* Side by Side Comparison */}
      <div className="grid grid-cols-2 gap-4">
        {differences.map((diff, index) => (
          <React.Fragment key={index}>
            <div className={`p-4 rounded-md font-mono text-sm ${
              diff.type === 'removed' ? 'bg-red-50' : 
              diff.type === 'changed' ? 'bg-amber-50' : 'bg-gray-50'
            }`}>
              <div className="font-medium mb-2 text-gray-700">{diff.path}</div>
              {diff.oldValue !== undefined && (
                <pre className="whitespace-pre-wrap break-all">
                  {JSON.stringify(diff.oldValue, null, 2)}
                </pre>
              )}
            </div>
            <div className={`p-4 rounded-md font-mono text-sm ${
              diff.type === 'added' ? 'bg-green-50' : 
              diff.type === 'changed' ? 'bg-amber-50' : 'bg-gray-50'
            }`}>
              <div className="font-medium mb-2 text-gray-700">{diff.path}</div>
              {diff.newValue !== undefined && (
                <pre className="whitespace-pre-wrap break-all">
                  {JSON.stringify(diff.newValue, null, 2)}
                </pre>
              )}
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default SchemaComparer;