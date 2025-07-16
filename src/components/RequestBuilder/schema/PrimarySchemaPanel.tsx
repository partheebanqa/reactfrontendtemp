import React from "react";
import { AlertTriangle } from "lucide-react";
import { useSchema } from "@/hooks/useSchema";
import JsonTreeViewer from "./JsonTreeViewer";
import { useRequest } from "@/hooks/useRequest";
import { SchemaDifference } from "@/shared/types/schema";

const PrimarySchemaPanel: React.FC = () => {
  const { primarySchema, primarySchemaValidation } = useSchema();
  const { responseData } = useRequest();

  if (!primarySchema) return null;

  const hasValidationResults = primarySchemaValidation !== null;
  const hasDifferences =
    hasValidationResults && primarySchemaValidation.differences.length > 0;

  return (
    <div className="space-y-4 p-4 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="h-3 w-3 rounded-full bg-green-500"></div>
          <span className="font-medium text-gray-800">{primarySchema.name}</span>
        </div>

        {responseData && hasDifferences && (
          <div className="flex items-center text-amber-600 text-sm font-medium bg-amber-50 px-2 py-1 rounded">
            <AlertTriangle size={16} className="mr-1.5" />
            <span>Schema differences detected</span>
          </div>
        )}
      </div>

      <div className="max-h-[calc(100vh-300px)] overflow-auto rounded border border-gray-100 p-2">
        <JsonTreeViewer json={primarySchema.content} />
      </div>

      {responseData && hasValidationResults && (
        <div className="mt-4 border-t border-gray-200 pt-4">
          <h3 className="font-medium text-gray-800 mb-3">Validation Results</h3>

          {hasDifferences ? (
            <div>
              <p className="text-sm text-gray-600 mb-3">
                {primarySchemaValidation.differences.length} difference
                {primarySchemaValidation.differences.length !== 1 ? "s" : ""} found
              </p>
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                {primarySchemaValidation.differences.map(
                  (diff: SchemaDifference, index: number) => (
                    <div
                      key={index}
                      className={`text-sm p-3 rounded-md shadow-sm ${
                        diff.type === "added"
                          ? "bg-green-50 text-green-700 border-l-3 border-green-500"
                          : diff.type === "removed"
                          ? "bg-red-50 text-red-700 border-l-3 border-red-500"
                          : "bg-amber-50 text-amber-700 border-l-3 border-amber-500"
                      }`}
                    >
                      <span className="font-mono text-xs block">
                        <strong>Path:</strong> {diff.path}
                      </span>
                      <span className="font-mono text-xs mt-1 block">
                        <strong>Issue:</strong> {diff.message}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          ) : (
            <div className="bg-green-50 p-3 rounded-md text-green-700 text-sm border border-green-200 shadow-sm flex items-center">
              <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
              Schema matches the response
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PrimarySchemaPanel;
