import { Badge } from "@/components/ui/badge";
import { ExtractedVariable, Variable } from "@/shared/types/requestChain.model";


interface VariableTableProps {
  variables: (Variable | ExtractedVariable)[];
  title: string;
  testId?: string;
}

export default function VariableTable({ variables, title, testId }: VariableTableProps) {
  if (!variables || variables.length === 0) {
    return (
      <div className="text-sm text-muted-foreground italic text-center py-4" data-testid={`${testId}-empty`}>
        No {title.toLowerCase()} available
      </div>
    );
  }

  // console.log("Rendering VariableTable with variables:", variables);

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case "dynamic":
        return "default";
      case "static":
        return "secondary";
      case "environment":
        return "outline";
      case "extracted":
        return "default";
      default:
        return "secondary";
    }
  };

  const hasSource = variables.some((v) => "source" in v && v.source);
  const getVariableType = (variable: Variable | ExtractedVariable): string => {
    return "type" in variable ? variable?.type : "extracted";
  };

  // console.log("VariableTable Render - Variables:", variables);

  return (
    <div className="overflow-x-auto" data-testid={testId}>
      <table className="w-full text-sm">
        <thead className="border-b">
          <tr className="text-left">
            <th className="py-3 px-4 font-medium text-muted-foreground">Name</th>
            <th className="py-3 px-4 font-medium text-muted-foreground">Value</th>
            <th className="py-3 px-4 font-medium text-muted-foreground">Type</th>
            {hasSource && (
              <th className="py-3 px-4 font-medium text-muted-foreground">Source</th>
            )}
          </tr>
        </thead>
        <tbody>
          {variables.map((variable, index) => (
            <tr
              key={index}
              className="border-b last:border-0 hover-elevate"
              data-testid={`${testId}-row-${index}`}
            >
              <td className="py-3 px-4 font-mono text-xs text-foreground">{variable.name}</td>
              <td className="py-3 px-4 font-mono text-xs text-muted-foreground max-w-md truncate">
                {String(variable?.value ?? "").slice(0, 100)}
                {String(variable?.value ?? "").length > 100 && "..."}
              </td>
              <td className="py-3 px-4">
                <Badge variant={getTypeBadgeVariant(getVariableType(variable))} className="text-xs">
                  {getVariableType(variable)}
                </Badge>
              </td>
              {"source" in variable && variable.source && (
                <td className="py-3 px-4 text-xs text-muted-foreground">{variable.source}</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
