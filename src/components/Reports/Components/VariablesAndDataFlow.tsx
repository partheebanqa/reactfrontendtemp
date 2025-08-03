import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface VariableSectionProps {
  globalVariables: Record<string, string>;
  extractedVariables: Record<string, string>;
}

const VariablesAndDataFlow = ({
  globalVariables,
  extractedVariables,
}: VariableSectionProps) => {
  const [open, setOpen] = useState(true);

  return (
    <div className="border border-gray-200 rounded-lg mt-5 p-2 bg-white">
      {/* Section Header */}
      <button
        className="w-full flex justify-between items-center px-5 py-3 hover:bg-gray-50 transition"
        onClick={() => setOpen(!open)}
      >
          <h2 className="text-1xl font-bold text-foreground mb-1">Variables & Data Flow</h2>
    
        {open ? (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </button>

      {open && (
        <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x border-t text-sm">
          {/* Global Variables */}
          <div className="w-full md:w-1/2 p-5">
            <h3 className="font-semibold mb-2 text-gray-700">Global Variables</h3>
            <div className="space-y-2">
              {Object.entries(globalVariables).map(([key, value]) => (
                <div
                  key={key}
                  className="flex justify-between items-center bg-blue-50 px-3 py-2 rounded-md"
                >
                  <span className="text-gray-700 font-medium">{key}</span>
                  <span className="text-gray-600 truncate max-w-[60%] text-right">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Extracted Variables */}
          <div className="w-full md:w-1/2 p-5">
            <h3 className="font-semibold mb-2 text-gray-700">Extracted Variables</h3>
            <div className="space-y-2">
              {Object.entries(extractedVariables).map(([key, value]) => (
                <div
                  key={key}
                  className="flex justify-between items-center bg-green-50 px-3 py-2 rounded-md"
                >
                  <span className="text-gray-700 font-medium">{key}</span>
                  <span className="text-gray-600 truncate max-w-[60%] text-right">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VariablesAndDataFlow;
