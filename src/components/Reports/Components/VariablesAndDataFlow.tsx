import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VariableTable from "./VariableTable";
import { ExtractedVariable, Variable } from "@/shared/types/requestChain.model";


type KV =
  | Record<string, any>
  | Array<{ name: string; value: any }>
  | undefined
  | null;

interface VariablesAndDataFlowProps {
  globalVariables?: KV;
  extractedVariables?: KV;
}

/**
 * Normalize KV into a simple Record<string, string>
 */
function normalizeToRecord(input: KV): Record<string, string> {
  if (!input) return {};

  const result: Record<string, string> = {};

  if (Array.isArray(input)) {
    input.forEach((item) => {
      const k = String(item?.name ?? "");
      const v = item?.value;
      if (!k) return;
      result[k] =
        v == null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
    });
  } else {
    Object.entries(input).forEach(([k, v]) => {
      if (!k) return;
      result[String(k)] =
        v == null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
    });
  }

  return result;
}

/**
 * Map KV -> Variable[]
 * For now, everything is "static".
 * (You can later add logic to detect env/dynamic types.)
 */
function mapToGlobalVariables(input: KV): Variable[] {
  const record = normalizeToRecord(input);
  return Object.entries(record).map<Variable>(([name, value]) => ({
    name,
    value,
    currentValue: value,
    type: "static",
  }));
}

/**
 * Map KV -> ExtractedVariable[]
 */
function mapToExtractedVariables(input: KV): ExtractedVariable[] {
  const record = normalizeToRecord(input);
  return Object.entries(record).map<ExtractedVariable>(([name, value]) =>
  ({
    name,
    value,
    source: "response",
  } as unknown as ExtractedVariable)
  );
}

export default function VariablesAndDataFlow({
  globalVariables,
  extractedVariables,
}: VariablesAndDataFlowProps) {
  const globalVars = mapToGlobalVariables(globalVariables);
  const extractedVars = mapToExtractedVariables(extractedVariables);

  const staticVars = globalVars.filter((v) => v.type === "static");
  const dynamicVars = globalVars.filter((v) => v.type === "dynamic");
  const envVars = globalVars.filter((v) => v.type === "environment");

  return (
    <div className="mx-auto mt-3">
      <h2 className="text-lg font-semibold text-foreground mb-4">Variables</h2>
      <Card className="p-6">
        <Tabs defaultValue="global" className="w-full">
          <TabsList>
            <TabsTrigger value="global" data-testid="tab-global-variables">
              Global Variables ({globalVars.length})
            </TabsTrigger>
            <TabsTrigger value="extracted" data-testid="tab-extracted-variables">
              Extracted Variables ({extractedVars.length})
            </TabsTrigger>
          </TabsList>

          {/* Global Variables Tab */}
          <TabsContent value="global" className="mt-4">
            <div className="space-y-6">
              {envVars.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-3">
                    Environment Variables
                  </h3>
                  <VariableTable
                    variables={envVars}
                    title="Environment Variables"
                    testId="table-env-vars"
                  />
                </div>
              )}
              {dynamicVars.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-3">
                    Dynamic Variables
                  </h3>
                  <VariableTable
                    variables={dynamicVars}
                    title="Dynamic Variables"
                    testId="table-dynamic-vars"
                  />
                </div>
              )}
              {staticVars.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-3">
                    Static Variables
                  </h3>
                  <VariableTable
                    variables={staticVars}
                    title="Static Variables"
                    testId="table-static-vars"
                  />
                </div>
              )}

              {/* If no global variables at all */}
              {envVars.length === 0 &&
                dynamicVars.length === 0 &&
                staticVars.length === 0 && (
                  <VariableTable
                    variables={[]}
                    title="Global Variables"
                    testId="table-empty-global"
                  />
                )}
            </div>
          </TabsContent>

          {/* Extracted Variables Tab */}
          <TabsContent value="extracted" className="mt-4">
            <VariableTable
              variables={extractedVars}
              title="Extracted Variables"
              testId="table-all-extracted"
            />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
