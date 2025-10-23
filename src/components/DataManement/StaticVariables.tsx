import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Search, Plus, Copy, Eye, EyeOff, Pencil, Trash2, X, Loader2 } from "lucide-react";
import { useDataManagement } from "@/hooks/useDataManagement";
import { Variable } from "@/shared/types/datamanagement";
import { useToast } from "@/hooks/useToast";
import VariableCreateDialog from "./CreateVariableDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

/* ---------------- helpers ---------------- */
const debounce = (fn: (...a: any[]) => void, ms = 250) => {
  let t: ReturnType<typeof setTimeout>;
  return (...args: any[]) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
};

const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 8 }) => (
  <div className="border border-gray-200 rounded-lg overflow-hidden">
    <table className="w-full">
      <thead>
        <tr className="bg-gray-50 border-b border-gray-200">
          <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Name</th>
          <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Value</th>
          <th className="px-4 py-2 text-right text-xs font-medium text-gray-600 uppercase tracking-wider w-24">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200 bg-white">
        {Array.from({ length: rows }).map((_, i) => (
          <tr key={i}>
            <td className="px-4 py-3"><div className="h-4 w-40 bg-gray-100 rounded animate-pulse" /></td>
            <td className="px-4 py-3"><div className="h-4 w-80 bg-gray-100 rounded animate-pulse" /></td>
            <td className="px-4 py-3"><div className="ml-auto h-4 w-20 bg-gray-100 rounded animate-pulse" /></td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

/* ---------------- inline edit dialog ---------------- */
type EditDialogProps = {
  open: boolean;
  onClose: () => void;
  onSave: (v: Variable) => void | Promise<void>;
  loading?: boolean;
  variable: Variable | null;
};

const EditVariableDialog: React.FC<EditDialogProps> = ({ open, onClose, onSave, loading, variable }) => {
  const [form, setForm] = useState({ name: "", description: "", value: "", isSecret: false });

  useEffect(() => {
    if (open && variable) {
      setForm({
        name: variable.name ?? "",
        description: variable.description ?? "",
        value: variable.value ?? "",
        isSecret: !!variable.isSecret,
      });
    }
  }, [open, variable]);

  const onChange =
    (k: keyof typeof form) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setForm((p) => ({ ...p, [k]: e.target.value }));

  if (!variable) return null;

  const handleSave = () => {
    onSave({
      ...variable,
      name: form.name.trim(),
      description: form.description.trim(),
      value: form.value,
      isSecret: form.isSecret,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (!o ? onClose() : void 0)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Variable</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input placeholder="Name" value={form.name} onChange={onChange("name")} />
          <Textarea placeholder="Description" value={form.description} onChange={onChange("description")} rows={3} />
          <Input
            placeholder={form.isSecret ? "Secret value" : "Value"}
            type={form.isSecret ? "password" : "text"}
            value={form.value}
            onChange={onChange("value")}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? "Updating..." : "Update"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/* ---------------- main ---------------- */
export function StaticVariables() {
  const { toast } = useToast();

  // Pull from your hook. Adjust names if they differ in your codebase.
  const dm = useDataManagement() as {
    environments?: { id: string; name: string }[];
    variables?: Variable[];
    isLoading?: boolean;
    createVariableMutation?: { mutateAsync: (p: Partial<Variable>) => Promise<Variable> };
    deletedVariableMutation?: { mutateAsync: (id: string) => Promise<void> };
    updateVariableMutation?: { mutate?: (v: Variable) => void; mutateAsync?: (v: Variable) => Promise<Variable> };
  };

  const environments = dm.environments ?? [];
  const variables = dm.variables; // optional during first load
  const isLoading = dm.isLoading ?? variables === undefined;

  const createVariableMutation = dm.createVariableMutation;
  const deletedVariableMutation = dm.deletedVariableMutation;
  const updateVariableMutation = dm.updateVariableMutation;

  // search & pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // secrets visibility
  const [visibleSecrets, setVisibleSecrets] = useState<Set<string>>(new Set());

  // create dialog
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newVariable, setNewVariable] = useState<Variable>({
    id: "",
    environmentId: "",
    name: "",
    description: "",
    type: "string",
    initialValue: "",
    currentValue: "",
    createdAt: "",
    updatedAt: "",
    deletedAt: null,
    value: "",
    scope: "global",
    isGlobal: false,
    isSecret: false,
  });

  // edit dialog
  const [editingVariable, setEditingVariable] = useState<Variable | null>(null);
  const [isUpdatingId, setIsUpdatingId] = useState<string | null>(null);

  // optimistic local list
  const [localList, setLocalList] = useState<Variable[]>([]);
  useEffect(() => {
    if (variables) setLocalList(variables);
  }, [variables]);

  // debounce search
  useEffect(() => {
    const run = debounce((v: string) => setDebouncedTerm(v), 250);
    run(searchTerm);
  }, [searchTerm]);

  // filter: name + (non-secret) value
  const filtered = useMemo(() => {
    const q = debouncedTerm.trim().toLowerCase();
    if (!q) return localList;
    return localList.filter((v) => {
      const name = v.name?.toLowerCase() || "";
      const val = v.isSecret ? "" : (v.value?.toLowerCase() || "");
      return name.includes(q) || val.includes(q);
    });
  }, [debouncedTerm, localList]);

  // pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const clampedPage = Math.min(currentPage, totalPages);
  const startIndex = (clampedPage - 1) * itemsPerPage;
  const currentVariables = filtered.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => setCurrentPage(1), [debouncedTerm, itemsPerPage]);

  /* ---------------- actions ---------------- */
  const toggleSecretVisibility = (id: string) => {
    setVisibleSecrets((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const copyToClipboard = async (text: string, what: "name" | "value") => {
    try {
      await navigator.clipboard.writeText(text || "");
      toast({ title: "Copied", description: `${what} copied to clipboard` });
    } catch {
      toast({ title: "Copy failed", description: "Could not copy.", variant: "destructive" });
    }
  };

  const handleCreate = async (payload: any) => {
    try {
      let finalName = payload.name;
      if (payload.type === "static" && !payload.name.startsWith("S_")) {
        finalName = `S_${payload.name}`;
      } else if (payload.type !== "static" && !payload.name.startsWith("D_")) {
        finalName = `D_${payload.name}`;
      }

      if (!createVariableMutation) throw new Error("Create mutation missing");
      const created = await createVariableMutation.mutateAsync({ ...payload, name: finalName });
      setLocalList((prev) => [created, ...prev]);

      toast({ title: "Variable Created", description: "The variable has been created successfully." });
      setIsCreateOpen(false);
      setNewVariable((v) => ({ ...v, id: "", name: "", description: "", value: "", environmentId: "" }));
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to create variable",
        variant: "destructive",
      });
    }
  };

  const handleEditVariable = (variable: Variable) => {
    setEditingVariable(variable);
  };

  const handleUpdate = useCallback(
    async (updated: Variable) => {
      if (!updated?.id) return setEditingVariable(null);
      setIsUpdatingId(updated.id);

      const prev = localList;
      setLocalList((list) => list.map((v) => (v.id === updated.id ? updated : v)));
      try {
        if (updateVariableMutation?.mutateAsync) {
          const saved = await updateVariableMutation.mutateAsync(updated);
          setLocalList((list) => list.map((v) => (v.id === updated.id ? saved : v)));
        } else if (updateVariableMutation?.mutate) {
          updateVariableMutation.mutate(updated);
        }
        toast({ title: "Variable Updated", description: "The variable has been updated successfully." });
        setEditingVariable(null);
      } catch (error: any) {
        // rollback
        setLocalList(prev);
        toast({
          title: "Update failed",
          description: error?.message || "Could not update variable",
          variant: "destructive",
        });
      } finally {
        setIsUpdatingId(null);
      }
    },
    [localList, toast, updateVariableMutation]
  );

  const handleDelete = async (id: string) => {
    const ok = window.confirm("Delete this variable?");
    if (!ok) return;

    const prev = localList;
    setLocalList((list) => list.filter((v) => v.id !== id));
    try {
      if (!deletedVariableMutation) throw new Error("Delete mutation missing");
      await deletedVariableMutation.mutateAsync(id);
      toast({ title: "Variable Deleted", description: "The variable has been deleted.", variant: "destructive" });
    } catch (error: any) {
      setLocalList(prev);
      toast({
        title: "Delete failed",
        description: error?.message || "Could not delete variable",
        variant: "destructive",
      });
    }
  };

  /* ---------------- render ---------------- */
  return (
    <div className="space-y-4">
      {/* top bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <Input
            type="text"
            placeholder="Search variables..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-16 py-2 text-sm border border-gray-200 rounded-md"
          />
          {searchTerm && (
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              onClick={() => setSearchTerm("")}
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>



        <VariableCreateDialog
          open={isCreateOpen}
          setOpen={setIsCreateOpen}
          newVariable={newVariable}
          setNewVariable={setNewVariable}
          handleCreate={handleCreate}
          // // pass environments if your dialog needs them:
          // environments={environments}
          type="static"
        />
      </div>

      {/* loader / empty / table */}
      {isLoading ? (
        <TableSkeleton rows={8} />
      ) : filtered.length === 0 ? (
        <div className="border border-gray-200 rounded-lg p-8 text-center bg-white">
          <p className="text-sm text-gray-600 mb-3">
            {debouncedTerm ? "No variables match your search." : "No variables yet."}
          </p>
          <Button onClick={() => setIsCreateOpen(true)} className="inline-flex items-center gap-1">
            <Plus size={16} />
            Create Variable
          </Button>
        </div>
      ) : (
        <>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Value</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-600 uppercase tracking-wider w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {currentVariables.map((variable) => (
                  <tr key={variable.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono font-medium text-gray-900">{variable.name}</span>
                        <button
                          onClick={() => copyToClipboard(variable.name, "name")}
                          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 transition-opacity"
                          title="Copy name"
                        >
                          <Copy size={13} />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <code className="text-sm font-mono text-gray-700 truncate max-w-md">
                          {variable.isSecret && !visibleSecrets.has(variable.id)
                            ? "••••••••••••"
                            : variable.value}
                        </code>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          {!variable.isSecret && (
                            <button
                              onClick={() => copyToClipboard(variable.value, "value")}
                              className="text-gray-400 hover:text-gray-600 transition-colors"
                              title="Copy value"
                            >
                              <Copy size={14} />
                            </button>
                          )}
                          {variable.isSecret && (
                            <button
                              onClick={() => toggleSecretVisibility(variable.id)}
                              className="text-gray-400 hover:text-gray-600 transition-colors"
                              title={visibleSecrets.has(variable.id) ? "Hide" : "Show"}
                            >
                              {visibleSecrets.has(variable.id) ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEditVariable(variable)}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Edit"
                          disabled={isUpdatingId === variable.id}
                        >
                          {isUpdatingId === variable.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Pencil size={14} />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(variable.id)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* footer / pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-xs mt-2">
              <div className="text-gray-600">
                {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filtered.length)} of {filtered.length}
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>

                <div className="flex gap-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={clampedPage === 1}
                    className="px-2 py-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Prev
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    disabled={clampedPage === totalPages}
                    className="px-2 py-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Edit Dialog */}
      <EditVariableDialog
        open={!!editingVariable}
        onClose={() => setEditingVariable(null)}
        onSave={handleUpdate}
        loading={!!isUpdatingId}
        variable={editingVariable}
      />
    </div>
  );
}
