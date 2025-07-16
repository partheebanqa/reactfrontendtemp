import React, { useState } from "react";
import { Download, Eye, Server } from "lucide-react";
import SchemaUploader from "./schema/SchemaUploader";
import SchemaList from "./schema/SchemaList";
import SchemaComparer from "./schema/SchemaComparer";
import JsonTreeViewer from "./schema/JsonTreeViewer";
import { useSchema } from "@/hooks/useSchema";

const SchemaPage: React.FC = () => {
  const { schemas } = useSchema();
  const [compareMode, setCompareMode] = useState(false);
  const [selectedSchemas, setSelectedSchemas] = useState<string[]>([]);
  const [viewSchema, setViewSchema] = useState<{
    id: string;
    name: string;
    content: any;
  } | null>(null);

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
    content: any;
  }) => {
    setViewSchema(schema);
  };

  const handleDownloadSchema = (schema: { name: string; content: any }) => {
    const blob = new Blob([JSON.stringify(schema.content, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${schema.name}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const canCompare = selectedSchemas.length === 2;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">API Schemas</h2>
          <div className="flex space-x-3">
            <button
              className={`px-3 py-1 rounded-md transition-colors ${
                compareMode
                  ? "bg-gray-200 text-gray-800"
                  : "bg-indigo-600 text-white hover:bg-indigo-700"
              }`}
              onClick={toggleCompareMode}
            >
              {compareMode ? "Cancel Compare" : "Compare Schemas"}
            </button>
            {compareMode && (
              <button
                className={`px-3 py-1 rounded-md ${
                  canCompare
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                } transition-colors`}
                disabled={!canCompare}
              >
                Compare Selected
              </button>
            )}
          </div>
        </div>

        <SchemaUploader />

        {schemas.length > 0 ? (
          <SchemaList
            compareMode={compareMode}
            selectedSchemas={selectedSchemas}
            onSchemaSelect={handleSchemaSelect}
            onViewSchema={handleViewSchema}
            onDownloadSchema={handleDownloadSchema}
          />
        ) : (
          <div className="p-6 border border-dashed border-gray-300 rounded-md text-center text-gray-500">
            <p>No schemas available</p>
            <p className="mt-2 text-sm">
              Upload a schema or generate one from an API response
            </p>
          </div>
        )}
      </div>

      {canCompare && (
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="text-xl font-semibold mb-4">Schema Comparison</h2>
          <SchemaComparer schemaIds={selectedSchemas} />
        </div>
      )}

      {/* Schema Viewer Modal */}
      {viewSchema && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-11/12 max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Server size={20} className="text-indigo-600" />
                <h3 className="text-lg font-semibold">{viewSchema.name}</h3>
              </div>
              <button
                onClick={() => setViewSchema(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <span className="sr-only">Close</span>
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-4 overflow-auto max-h-[calc(90vh-8rem)]">
              <JsonTreeViewer json={viewSchema.content} />
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => handleDownloadSchema(viewSchema)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center space-x-2"
              >
                <Download size={16} />
                <span>Download JSON</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchemaPage;
