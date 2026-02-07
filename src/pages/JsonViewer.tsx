import { useState } from "react";

import { Code2 } from "lucide-react";
import { ThemeToggle } from "@/components/JSONviewer/ThemeToggle";
import { JsonInput } from "@/components/JSONviewer/JsonInput";
import { JsonTreeView } from "@/components/JSONviewer/JsonTreeView";
import LandingLayout from "@/components/LandingLayout/LandingLayout";

export default function JsonViewer() {
  const [jsonInput, setJsonInput] = useState("");
  const [parsedData, setParsedData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleParse = () => {
    setError(null);
    setParsedData(null);

    if (!jsonInput.trim()) {
      setError("Please enter some JSON to parse");
      return;
    }

    try {
      const parsed = JSON.parse(jsonInput);
      setParsedData(parsed);
    } catch (err) {
      if (err instanceof Error) {
        setError(`JSON Parse Error: ${err.message}`);
      } else {
        setError("Invalid JSON format");
      }
    }
  };

  return (
    <LandingLayout>
      <div className="flex flex-col">
        <header className="h-14 border-b flex items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-semibold">JSON Parser & Visualizer</h1>
          </div>
          <ThemeToggle />
        </header>

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          <div className="w-full lg:w-2/5 border-r p-6 overflow-auto">
            <JsonInput
              value={jsonInput}
              onChange={setJsonInput}
              onParse={handleParse}
              error={error}
            />
          </div>

          <div className="flex-1 p-6 overflow-auto">
            <JsonTreeView data={parsedData} />
          </div>
        </div>
      </div>
    </LandingLayout>
  );
}
