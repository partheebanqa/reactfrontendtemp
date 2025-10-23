import React, { useEffect, useMemo, useState } from "react";
import { Search, Plus, Copy, Eye, EyeOff, Pencil, Trash2, X } from "lucide-react";
import { useDataManagement } from "@/hooks/useDataManagement";
import { useToast } from "@/hooks/useToast";
import VariableCreateDialog from "./CreateVariableDialog";
import EditDynamicVariableDialog from "./EditDynamicVariableDialog";
import type { DynamicVariable } from "@/shared/types/datamanagement";
import { Button } from "@/components/ui/button";
import { Input } from "../ui/input";


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

/* for CreateVariableDialog's form shape */
type NewVariableForm = {
  id: string;
  environmentId: string;
  name: string;
  description: string;
  type: string;
  initialValue: string;
  currentValue: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  value: string;
  scope: string;
  isGlobal: boolean;
  isSecret: boolean;
};

export function DynamicVariables() {
  const { toast } = useToast();

  // data & mutations from your hook
  const {
    environments = [],
    dynamicVariables = [],
    isLoading = false,
    createVariableMutation,
    updateDynamicVariableMutation,
    deletedDynamicVariableMutation,
  } = useDataManagement() as {
    environments?: { id: string; name: string }[];
    dynamicVariables?: DynamicVariable[];
    isLoading?: boolean;
    createVariableMutation?: { mutateAsync: (p: Partial<NewVariableForm> & Record<string, any>) => Promise<any> };
    updateDynamicVariableMutation?: { mutateAsync: (p: { id: string } & Record<string, any>) => Promise<any> };
    deletedDynamicVariableMutation?: { mutateAsync: (id: string) => Promise<void> };
  };

  // local list for optimistic UX
  const [localList, setLocalList] = useState<DynamicVariable[]>(dynamicVariables);
  useEffect(() => setLocalList(dynamicVariables), [dynamicVariables]);

  // search (debounced)
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  useEffect(() => {
    const run = debounce((v: string) => setDebouncedTerm(v), 250);
    run(searchTerm);
  }, [searchTerm]);

  // secrets visibility
  const [visibleSecrets, setVisibleSecrets] = useState<Set<string>>(new Set());
  const toggleSecretVisibility = (id: string) => {
    setVisibleSecrets((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // create/edit dialogs
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editing, setEditing] = useState<DynamicVariable | null>(null);

  const [newVariable, setNewVariable] = useState<NewVariableForm>({
    id: "",
    environmentId: "",
    name: "",
    description: "",
    type: "dynamic",
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

  // pagination
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [page, setPage] = useState(1);

  // filter (by name or generatorName or generatorId)
  const filtered = useMemo(() => {
    const q = debouncedTerm.trim().toLowerCase();
    if (!q) return localList;
    return localList.filter((v) => {
      const name = v.name?.toLowerCase() || "";
      const genName = v.generatorName?.toLowerCase() || "";
      const genId = v.generatorId?.toLowerCase() || "";
      return name.includes(q) || genName.includes(q) || genId.includes(q);
    });
  }, [debouncedTerm, localList]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const clamped = Math.min(page, totalPages);
  const start = (clamped - 1) * itemsPerPage;
  const current = filtered.slice(start, start + itemsPerPage);

  useEffect(() => setPage(1), [debouncedTerm, itemsPerPage]);

  /* ---------------- actions ---------------- */

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text || "");
      toast({ title: "Copied", description: "Copied to clipboard" });
    } catch {
      toast({ title: "Copy failed", description: "Could not copy.", variant: "destructive" });
    }
  };

  // Create via CreateVariableDialog (prefix D_ for dynamic)
  const handleCreate = async (payload: any) => {
    try {
      let finalName = payload.name;
      if (payload.type === "static" && !payload.name.startsWith("S_")) {
        finalName = `S_${payload.name}`;
      } else if (payload.type !== "static" && !payload.name.startsWith("D_")) {
        finalName = `D_${payload.name}`;
      }

      if (!createVariableMutation) throw new Error("Create mutation not available");
      const created = await createVariableMutation.mutateAsync({ ...payload, name: finalName });

      setLocalList((prev) => [created as any, ...prev]);
      toast({ title: "Variable Created", description: "Dynamic variable created successfully." });

      setIsCreateOpen(false);
      setNewVariable((v) => ({ ...v, id: "", name: "", description: "", value: "" }));
    } catch (error: any) {
      toast({
        title: "Create failed",
        description: error?.message || "Could not create dynamic variable",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (v: DynamicVariable) => {
    setEditing(v);
    setIsEditOpen(true);
  };

  const handleDynamicUpdate = async (id: string, patch: Record<string, any>) => {
    const prev = localList;
    setLocalList((list) => list.map((v) => (v.id === id ? { ...v, ...patch, updatedAt: new Date().toISOString() } : v)));
    try {
      if (!updateDynamicVariableMutation) throw new Error("Update mutation not available");
      const saved = await updateDynamicVariableMutation.mutateAsync({ id, ...patch });
      setLocalList((list) => list.map((v) => (v.id === id ? { ...v, ...saved } : v)));
      toast({ title: "Updated", description: "Dynamic variable updated successfully." });
      setIsEditOpen(false);
      setEditing(null);
    } catch (error: any) {
      setLocalList(prev);
      toast({
        title: "Update failed",
        description: error?.message || "Could not update dynamic variable",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string, name?: string) => {
    const ok = window.confirm(`Delete dynamic variable "${name ?? id}"?`);
    if (!ok) return;

    const prev = localList;
    setLocalList((list) => list.filter((v) => v.id !== id));
    try {
      if (!deletedDynamicVariableMutation) throw new Error("Delete mutation not available");
      await deletedDynamicVariableMutation.mutateAsync(id);
      toast({ title: "Deleted", description: `Dynamic variable "${name ?? id}" deleted.`, variant: "destructive" });
    } catch (error: any) {
      setLocalList(prev);
      toast({
        title: "Delete failed",
        description: error?.message || "Could not delete dynamic variable",
        variant: "destructive",
      });
    }
  };

  /* ---------------- render ---------------- */
  return (
    <div className="space-y-4">
      {/* top bar (new UI) */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <Input
            type="text"
            placeholder="Search variables..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-16 py-1.5 text-sm border border-gray-200 rounded-md"
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
          environments={environments}
          type="dynamic"
        />
      </div>

      {/* content */}
      {isLoading ? (
        <TableSkeleton rows={8} />
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-sm text-gray-500">
          {debouncedTerm ? "No dynamic variables match your search." : "No dynamic variables yet"}
        </div>
      ) : (
        <>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Generator Id</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Generator Name</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-600 uppercase tracking-wider w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {current.map((variable) => (
                  <tr key={variable.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono font-medium text-gray-900">{variable.name}</span>
                        <button
                          onClick={() => copyToClipboard(variable.name)}
                          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 transition-opacity"
                          title="Copy name"
                        >
                          <Copy size={13} />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono text-gray-700 truncate max-w-md">
                          {(variable.generatorId || "—")}
                        </code>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono text-gray-700 truncate max-w-md">

                          {(variable.generatorName || "—")}
                        </code>
                      </div>
                    </td>
                    {/* <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <code className="text-sm font-mono text-gray-700 truncate max-w-md">

                          {(variable.generatorName || "—")}
                        </code>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          {!!variable.generatorName && (
                            <button
                              onClick={() => copyToClipboard(variable.generatorName)}
                              className="text-gray-400 hover:text-gray-600 transition-colors"
                              title="Copy value"
                            >
                              <Copy size={14} />
                            </button>
                          )}
                          {!!variable.generatorName && (
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
                    </td> */}
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEdit(variable)}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(variable.id, variable.name)}
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
                {filtered.length === 0
                  ? "0"
                  : `${start + 1}-${Math.min(start + itemsPerPage, filtered.length)}`}{" "}
                of {filtered.length}
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setPage(1);
                  }}
                  className="px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>

                <div className="flex gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    disabled={clamped === 1}
                    className="px-2 py-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Prev
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                    disabled={clamped === totalPages}
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

      {/* Edit dialog */}
      <EditDynamicVariableDialog
        open={isEditOpen}
        setOpen={setIsEditOpen}
        variable={editing}
        handleDynamicUpdate={handleDynamicUpdate}
      />
    </div>
  );
}
