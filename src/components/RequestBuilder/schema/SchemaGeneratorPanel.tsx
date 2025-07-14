import React, { useState } from 'react';
import { useSchema } from '@/hooks/useSchema';
import { generateJsonSchema } from '@/lib/schemaUtils';

interface SchemaGeneratorPanelProps {
  response: any;
  onClose: () => void;
}

const SchemaGeneratorPanel: React.FC<SchemaGeneratorPanelProps> = ({ response, onClose }) => {
  const { addSchema } = useSchema();
  const [schemaName, setSchemaName] = useState('');
  const [makePrimary, setMakePrimary] = useState(false);
  
  const handleGenerateSchema = () => {
    if (!schemaName.trim()) return;
    
    const generatedSchema = generateJsonSchema(response);
    
    addSchema({
      id: Math.random().toString(36).substr(2, 9),
      name: schemaName,
      content: generatedSchema,
      isPrimary: makePrimary,
      type: 'generated',
      createdAt: new Date().toISOString()
    });
    
    onClose();
  };
  
  return (
    <div className="border border-gray-200 p-8 rounded-md bg-gray-50">
      <h3 className="font-medium text-lg mb-3">Generate Schema from Response</h3>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="schema-name" className="block text-sm font-medium text-gray-700 mb-1">
            Schema Name
          </label>
          <input
            type="text"
            id="schema-name"
            value={schemaName}
            onChange={(e) => setSchemaName(e.target.value)}
            placeholder="My API Schema"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="make-primary"
            checked={makePrimary}
            onChange={(e) => setMakePrimary(e.target.checked)}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label htmlFor="make-primary" className="ml-2 block text-sm text-gray-700">
            Make this schema primary
          </label>
        </div>
        
        <div className="flex space-x-3 pt-2">
          <button
            type="button"
            onClick={handleGenerateSchema}
            disabled={!schemaName.trim()}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Save Schema
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default SchemaGeneratorPanel;