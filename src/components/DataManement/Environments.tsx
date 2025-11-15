import React, { useEffect, useMemo, useState } from "react";
import { Search, Plus, Copy, Pencil, Trash2, X, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useDataManagement } from "@/hooks/useDataManagement";
import type { Environment } from "@/shared/types/datamanagement";
import { Button } from "../ui/button";
import CreateEnvironmentDialog from "./CreateEnvironmentDialog";
import EditEnvironmentDialog from "./EditEnvironmentDialog";
import { Loader } from "../Loader";
import { Input } from "../ui/input";


const debounce = (fn: (...a: any[]) => void, ms = 250) => {
  let t: ReturnType<typeof setTimeout>;
  return (...args: any[]) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
};



export const Environments: React.FC = () => {
  const { toast } = useToast();
  const [, setLocation] = useLocation();


  const dm = useDataManagement() as {
    environments?: Environment[];
    isLoading?: boolean;
    refetch?: () => Promise<unknown>;
    createEnvironment?: (payload: Partial<Environment>) => Promise<Environment>;
    updateEnvironment?: (id: string, payload: Partial<Environment>) => Promise<Environment>;
    deleteEnvironment?: (id: string) => Promise<void>;
  };

  const environments = dm.environments;
  const isLoading = dm.isLoading ?? environments === undefined;

  const createEnvironment = dm.createEnvironment;
  const updateEnvironment = dm.updateEnvironment;
  const deleteEnvironment = dm.deleteEnvironment;

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");

  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingEnvironment, setEditingEnvironment] = useState<Environment | null>(null);

  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdatingId, setIsUpdatingId] = useState<string | null>(null);

  // optimistic local list (only set when data exists)
  const [localList, setLocalList] = useState<Environment[]>([]);
  useEffect(() => {
    if (environments) setLocalList(environments);
  }, [environments]);

  // debounce search
  useEffect(() => {
    const run = debounce((v: string) => setDebouncedTerm(v), 250);
    run(searchTerm);
  }, [searchTerm]);

  // filtering (by name or baseUrl)
  const filtered = useMemo(() => {
    const q = debouncedTerm.trim().toLowerCase();
    if (!q) return localList;
    return localList.filter((env) => {
      const name = env.name?.toLowerCase() || "";
      const base = env.baseUrl?.toLowerCase() || "";
      return name.includes(q) || base.includes(q);
    });
  }, [debouncedTerm, localList]);

  // pagination (based on filtered)
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const clampedPage = Math.min(currentPage, totalPages);
  const startIndex = (clampedPage - 1) * itemsPerPage;
  const currentEnvironments = filtered.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedTerm, itemsPerPage]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text || "");
      toast({ title: "Copied", description: "Value copied to clipboard" });
    } catch {
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  /* ---------- CRUD (simple + optimistic) ---------- */
  const handleAddEnvironment = () => setIsCreateOpen(true);

  const handleCreateSave = async (payload: Partial<Environment>) => {
    if (!createEnvironment) return setIsCreateOpen(false);
    setIsCreating(true);
    try {
      const created = await createEnvironment(payload);
      setLocalList((prev) => [created, ...prev]);
      toast({ title: "Environment created", description: created.name || "New environment created." });
      setIsCreateOpen(false);
    } catch (e: any) {
      toast({ title: "Create failed", description: e?.message || "Could not create environment.", variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditEnvironment = (env: Environment) => setEditingEnvironment(env);

  const handleEditSave = async (payload: Environment) => {
    if (!payload?.id || !updateEnvironment) return setEditingEnvironment(null);
    const id = payload.id;
    setIsUpdatingId(id);

    const prev = localList;
    setLocalList((list) => list.map((e) => (e.id === id ? { ...e, ...payload } : e)));
    try {
      const updated = await updateEnvironment(id, payload);
      setLocalList((list) => list.map((e) => (e.id === id ? updated : e)));
      toast({ title: "Environment updated", description: updated.name || id });
      setEditingEnvironment(null);
    } catch (e: any) {
      setLocalList(prev);
      toast({ title: "Update failed", description: e?.message || "Could not update environment.", variant: "destructive" });
    } finally {
      setIsUpdatingId(null);
    }
  };

  const handleDeleteEnv = async (id: string, label?: string) => {
    const ok = window.confirm(`Delete environment "${label ?? id}"?`);
    if (!ok) return;
    setIsDeletingId(id);

    const prev = localList;
    setLocalList((list) => list.filter((e) => e.id !== id));
    try {
      if (deleteEnvironment) await deleteEnvironment(id);
      toast({ title: "Environment deleted", description: `${label ?? "Environment"} has been deleted.`, variant: "destructive" });
    } catch (e: any) {
      setLocalList(prev);
      toast({ title: "Delete failed", description: e?.message || "We couldn’t delete the environment.", variant: "destructive" });
    } finally {
      setIsDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* top bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <Input
            type="text"
            placeholder="Search environments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-16 py-2 text-sm rounded-md  "
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

        <div className="flex items-center gap-2">
          <Button className="inline-flex items-center gap-1" onClick={() => setLocation("/settings/account?tab=environments")}>
            Manage Environment
          </Button>
          {/* <Button onClick={handleAddEnvironment} className="inline-flex items-center gap-1">
            <Plus size={16} />
            Create
          </Button> */}

        </div>
      </div>


      {isLoading ? (
        <Loader />
      ) : filtered.length === 0 ? (
        <div className="border border-gray-200 rounded-lg p-8 text-center bg-white">
          <p className="text-sm text-gray-600 mb-3">
            {debouncedTerm ? "No environments match your search." : "No environments yet."}
          </p>
          <Button onClick={handleAddEnvironment} className="inline-flex items-center gap-1">
            <Plus size={16} />
            Create Environment
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
                  {/* <th className="px-4 py-2 text-right text-xs font-medium text-gray-600 uppercase tracking-wider w-24">Actions</th> */}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {currentEnvironments.map((env) => (
                  <tr key={env.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-4 py-2.5">
                      <span className="text-sm font-mono font-medium text-gray-900">{env.name}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <code className="text-sm font-mono text-gray-700 truncate max-w-[28rem]">
                          {env.baseUrl || "—"}
                        </code>
                        {env.baseUrl && (
                          <button
                            onClick={() => copyToClipboard(env.baseUrl!)}
                            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 transition-opacity flex-shrink-0"
                            title="Copy value"
                          >
                            <Copy size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                    {/* <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEditEnvironment(env)}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Edit"
                          disabled={isUpdatingId === env.id}
                        >
                          {isUpdatingId === env.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Pencil size={14} />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteEnv(env.id, env.name)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                          title="Delete"
                          disabled={isDeletingId === env.id}
                        >
                          {isDeletingId === env.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Trash2 size={14} />
                          )}
                        </button>
                      </div>
                    </td> */}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* footer / pagination */}
          <div className="flex items-center justify-between text-xs mt-2">
            <div className="text-gray-600">
              {filtered.length === 0
                ? "0"
                : `${startIndex + 1}-${Math.min(startIndex + itemsPerPage, filtered.length)}`}{" "}
              of {filtered.length}
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
        </>
      )}




      <CreateEnvironmentDialog
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSave={handleCreateSave}

      />


      {editingEnvironment && (
        <EditEnvironmentDialog
          environment={editingEnvironment}
          open={true}
          onClose={() => setEditingEnvironment(null)}
          onSave={handleEditSave}
          loading={!!isUpdatingId}
        />
      )}
    </div>
  );
};
