import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Upload } from "lucide-react";
import { useState } from "react";

interface JsonInputProps {
  value: string;
  onChange: (value: string) => void;
  onParse: () => void;
  error: string | null;
}

export function JsonInput({ value, onChange, onParse, error }: JsonInputProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileUpload = (file: File) => {
    const maxSizeInBytes = 2 * 1024 * 1024; // 2 MB
    
    if (file.size > maxSizeInBytes) {
      alert(`File size exceeds 2 MB limit. Please upload a smaller file.`);
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      onChange(content);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type === "application/json") {
      handleFileUpload(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const loadSampleJson = () => {
    const sample = {
      folders: [
        {
          id: "44c3f586-196e-43b2-b26c-91ba41621cfe",
          collectionId: "5b522b64-c280-4fa6-b48d-ae6f8ad1a231",
          name: "CICD",
          createdAt: "2025-10-14T11:14:28.356011Z",
          updatedAt: "2025-10-14T11:14:28.356011Z",
          requests: [
            {
              id: "8f0d2fdb-00e5-4897-9ca1-2ae9c82d1aef",
              collectionId: "5b522b64-c280-4fa6-b48d-ae6f8ad1a231",
              folderId: "44c3f586-196e-43b2-b26c-91ba41621cfe",
              name: "CICDTestSuiteExecution_status",
              description: "",
              method: "GET",
              url: "https://apibackenddev.onrender.com/cicd/test-suites/ba01d0ca-4811-4c7c-a685-1781d6aef5db/executionstatus",
              bodyType: "raw",
              bodyFormData: null,
              bodyRawContent: "",
              authorization: [],
              authorizationType: "none"
            }
          ]
        }
      ]
    };
    onChange(JSON.stringify(sample, null, 2));
  };

  const charCount = value.length;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            JSON Input
          </h2>
          <span className="text-xs text-muted-foreground">
            {charCount.toLocaleString()} chars
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground" data-testid="text-file-limit">
            Max file size: 2 MB
          </span>
          <label htmlFor="file-upload">
            <Button
              variant="ghost"
              size="sm"
              asChild
              data-testid="button-upload"
            >
              <span className="cursor-pointer">
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </span>
            </Button>
            <input
              id="file-upload"
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleFileInputChange}
            />
          </label>
        </div>
      </div>

      <div
        className={`flex-1 relative ${isDragging ? "ring-2 ring-primary" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder='Paste JSON here or drag & drop a .json file...'
          className="font-mono text-sm h-full min-h-[400px] resize-none"
          data-testid="input-json"
        />
        {isDragging && (
          <div className="absolute inset-0 bg-primary/10 flex items-center justify-center pointer-events-none">
            <p className="text-sm font-medium">Drop JSON file here</p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-3 p-3 rounded-md bg-destructive/10 border border-destructive/20 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="flex gap-2 mt-4">
        <Button
          onClick={onParse}
          className="flex-1"
          data-testid="button-parse"
        >
          Parse JSON
        </Button>
        <Button
          variant="secondary"
          onClick={loadSampleJson}
          data-testid="button-sample"
        >
          Load Sample
        </Button>
        <Button
          variant="secondary"
          onClick={() => onChange("")}
          data-testid="button-clear"
        >
          Clear
        </Button>
      </div>
    </div>
  );
}
