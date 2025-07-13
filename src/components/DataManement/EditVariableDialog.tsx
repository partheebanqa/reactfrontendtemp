import React, { Dispatch, SetStateAction } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Variable } from "@/models/datamanagement";
import { allGenerators, getGenerator } from "@/lib/dynamicVariables";
import {
  FileText,
  Zap,
  Globe,
  Code2,
  Shield,
  Calendar,
  Wifi,
} from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
  editingVariable: Variable | null;
  setEditingVariable: (v: Variable | null) => void;
  onSave: () => void;
  setOpen: (val: boolean) => void;
}

const EditVariableDialog: React.FC<Props> = ({
  open,
  onOpenChange,
  editingVariable,
  setEditingVariable,
  onSave,
  setOpen
}) => {
  const handleChange = (field: keyof Variable, value: any) => {
    if (editingVariable) {
      setEditingVariable({
        ...editingVariable,
        [field]: value,
      });
    }
  };

  const renderDynamicConfig = () => {
    if (!editingVariable?.generatorFunction) return null;

    const generator = getGenerator(editingVariable.generatorFunction);
    if (!generator?.configSchema) return null;

    return (
      <div className="space-y-3 p-3 bg-muted/50 rounded-lg mt-4">
        <div className="text-sm font-medium">Generator Configuration</div>
        {Object.entries(generator.configSchema).map(([key, schema]: [string, any]) => (
          <div key={key} className="space-y-1">
            <label className="text-xs font-medium capitalize">
              {key.replace(/_/g, " ")}
            </label>
            <Input
              type={schema.type}
              placeholder={schema.default?.toString() || ""}
              value={
                editingVariable.generatorConfig?.[key] ??
                schema.default ??
                ""
              }
              onChange={(e) => {
                const value =
                  schema.type === "number"
                    ? parseInt(e.target.value) || schema.default
                    : e.target.value;
                setEditingVariable({
                  ...editingVariable,
                  generatorConfig: {
                    ...(editingVariable.generatorConfig || {}),
                    [key]: value,
                  },
                });
              }}
              min={schema.min}
              max={schema.max}
            />
          </div>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Variable</DialogTitle>
        </DialogHeader>

        {editingVariable && (
          <div className="space-y-4">
            {/* Key */}
            <div>
              <label className="text-sm font-medium">Variable Key</label>
              <Input
                value={editingVariable.key}
                onChange={(e) =>
                  handleChange(
                    "key",
                    e.target.value
                      .toUpperCase()
                      .replace(/[^A-Z0-9_]/g, "_")
                  )
                }
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use in requests as: <code>{`{{${editingVariable.key}}}`}</code>
              </p>
            </div>

            {/* Type */}
            <div>
              <label className="text-sm font-medium">Variable Type</label>
              <Select
                value={editingVariable.type}
                onValueChange={(value: any) =>
                  handleChange("type", value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="static">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <div>
                        <div className="font-medium">Static Variable</div>
                        <div className="text-xs text-muted-foreground">
                          Fixed value that doesn't change
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="dynamic">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      <div>
                        <div className="font-medium">Dynamic Variable</div>
                        <div className="text-xs text-muted-foreground">
                          Generated at runtime
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="environment">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      <div>
                        <div className="font-medium">
                          Environment Variable
                        </div>
                        <div className="text-xs text-muted-foreground">
                          From system environment
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Static Value */}
            {editingVariable.type === "string" && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Static Value</label>
                  <Input
                    placeholder="Enter fixed value"
                    type={editingVariable.isSecret ? "password" : "text"}
                    value={editingVariable.value}
                    onChange={(e) => handleChange("value", e.target.value)}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="secret-toggle"
                    checked={editingVariable.isSecret}
                    onCheckedChange={(checked) =>
                      handleChange("isSecret", checked)
                    }
                  />
                  <label
                    htmlFor="secret-toggle"
                    className="text-sm font-medium cursor-pointer"
                  >
                    Mark as secret variable
                  </label>
                </div>
                {editingVariable.isSecret && (
                  <p className="text-xs text-orange-600 dark:text-orange-400">
                    Secret variables will be hidden in the UI and logs for security.
                  </p>
                )}
              </div>
            )}

            {/* Dynamic variable settings */}
            {editingVariable.type === "dynamic" && (
              <>
                <div>
                  <label className="text-sm font-medium">
                    Generator Function
                  </label>
                  <Select
                    value={editingVariable.generatorFunction}
                    onValueChange={(value) =>
                      handleChange("generatorFunction", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose generator" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                        Basic
                      </div>
                      {allGenerators
                        .filter((g) => g.category === "basic")
                        .map((g) => (
                          <SelectItem key={g.name} value={g.name}>
                            <div className="flex items-center gap-2">
                              <Code2 className="w-4 h-4" />
                              <div>
                                <div className="font-medium">{g.label}</div>
                                <div className="text-xs text-muted-foreground">
                                  {g.description}
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-2 pt-2">
                        Random Data
                      </div>
                      {allGenerators
                        .filter((g) => g.category === "random")
                        .map((g) => (
                          <SelectItem key={g.name} value={g.name}>
                            <div className="flex items-center gap-2">
                              <Zap className="w-4 h-4" />
                              <div>
                                <div className="font-medium">{g.label}</div>
                                <div className="text-xs text-muted-foreground">
                                  {g.description}
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-2 pt-2">
                        Authentication
                      </div>
                      {allGenerators
                        .filter((g) => g.category === "auth")
                        .map((g) => (
                          <SelectItem key={g.name} value={g.name}>
                            <div className="flex items-center gap-2">
                              <Shield className="w-4 h-4" />
                              <div>
                                <div className="font-medium">{g.label}</div>
                                <div className="text-xs text-muted-foreground">
                                  {g.description}
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-2 pt-2">
                        Date & Time
                      </div>
                      {allGenerators
                        .filter((g) => g.category === "date")
                        .map((g) => (
                          <SelectItem key={g.name} value={g.name}>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              <div>
                                <div className="font-medium">{g.label}</div>
                                <div className="text-xs text-muted-foreground">
                                  {g.description}
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-2 pt-2">
                        Network
                      </div>
                      {allGenerators
                        .filter((g) => g.category === "network")
                        .map((g) => (
                          <SelectItem key={g.name} value={g.name}>
                            <div className="flex items-center gap-2">
                              <Wifi className="w-4 h-4" />
                              <div>
                                <div className="font-medium">{g.label}</div>
                                <div className="text-xs text-muted-foreground">
                                  {g.description}
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                {renderDynamicConfig()}
              </>
            )}

            {/* Environment Variable */}
            {editingVariable.type === "environment" && (
              <div className="space-y-1">
                <label className="text-sm font-medium">
                  Environment Variable Key
                </label>
                <Input
                  placeholder="e.g. API_BASE_URL"
                  value={editingVariable.value}
                  onChange={(e) =>
                    handleChange("value", e.target.value)
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This value will be read from your system environment variables.
                </p>
              </div>
            )}

            {/* Scope */}
            <div>
              <label className="text-sm font-medium">Scope</label>
              <Select
                value={editingVariable.scope}
                onValueChange={(v) => handleChange("scope", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">Global (All Projects)</SelectItem>
                  <SelectItem value="project">Project Specific</SelectItem>
                  <SelectItem value="environment">Environment Specific</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={editingVariable.description || ""}
                onChange={(e) =>
                  handleChange("description", e.target.value)
                }
              />
            </div>

            <div className="flex justify-end pt-4 border-t space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  setEditingVariable(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={onSave}>Save</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EditVariableDialog;
