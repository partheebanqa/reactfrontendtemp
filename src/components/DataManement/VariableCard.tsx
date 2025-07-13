import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Edit, Trash2, Key, FileText, Settings } from "lucide-react";
import { Variable, Environment } from "@/models/datamanagement";

interface VariableListProps {
  variables: Variable[];
  environments: Environment[];
  handleCopy: (text: string) => void;
  onEdit: (v: Variable) => void;
  onDelete: (id: string, label: string) => void;
}

const VariableCard: React.FC<VariableListProps> = ({
  variables,
  environments,
  handleCopy,
  onEdit,
  onDelete,
}) => {
  const getVariableIcon = (type: string) => {
    switch (type) {
      case "secret":
        return <Key className="w-4 h-4 text-red-500" />;
      case "string":
        return <FileText className="w-4 h-4 text-blue-500" />;
      case "number":
        return <span className="text-purple-500 font-bold">#</span>;
      case "boolean":
        return <span className="text-green-500 font-bold">✓</span>;
      default:
        return <Settings className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="grid gap-4">
      {variables.map((variable) => (
        <Card key={variable.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 flex-1">
                {getVariableIcon(variable.type)}
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-1">
                    <h4 className="font-semibold">{variable.key}</h4>
                    <Badge variant={variable.isGlobal ? "default" : "outline"}>
                      {variable.isGlobal
                        ? "Global"
                        : environments.find((e) => e.id === variable.environmentId)?.name || "Environment"}
                    </Badge>
                    <Badge variant="secondary" className="capitalize">
                      {variable.type}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2 mb-2">
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                      {variable.value}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        handleCopy(
                          variable.type === "secret" ? "••••••••" : variable.value
                        )
                      }
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                  {variable.description && (
                    <p className="text-xs text-muted-foreground">
                      {variable.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={() => onEdit(variable)}>
                  <Edit className="w-4 h-4" /> 
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onDelete(variable.id, variable.key)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default VariableCard;
