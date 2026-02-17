import React, { useEffect, useMemo, useState } from 'react';
import { Search, Copy, Trash2, X, Edit, Plus } from 'lucide-react';
import { useDataManagement } from '@/hooks/useDataManagement';
import { useToast } from '@/hooks/use-toast';
import VariableCreateDialog from './CreateVariableDialog';
import EditDynamicVariableDialog from './EditDynamicVariableDialog';
import type { DynamicVariable } from '@/shared/types/datamanagement';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader } from '@/components/Loader';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const debounce = (fn: (...a: any[]) => void, ms = 250) => {
  let t: ReturnType<typeof setTimeout>;
  return (...args: any[]) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
};

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
    createVariableMutation?: {
      mutateAsync: (
        p: Partial<NewVariableForm> & Record<string, any>,
      ) => Promise<any>;
    };
    updateDynamicVariableMutation?: {
      mutateAsync: (p: { id: string } & Record<string, any>) => Promise<any>;
    };
    deletedDynamicVariableMutation?: {
      mutateAsync: (id: string) => Promise<void>;
    };
  };

  // local list for optimistic UX
  const [localList, setLocalList] =
    useState<DynamicVariable[]>(dynamicVariables);
  useEffect(() => setLocalList(dynamicVariables), [dynamicVariables]);

  // search (debounced)
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  useEffect(() => {
    const run = debounce((v: string) => setDebouncedTerm(v), 250);
    run(searchTerm);
  }, [searchTerm]);

  // create/edit dialogs
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editing, setEditing] = useState<DynamicVariable | null>(null);

  const [newVariable, setNewVariable] = useState<NewVariableForm>({
    id: '',
    environmentId: '',
    name: '',
    description: '',
    type: 'dynamic',
    initialValue: '',
    currentValue: '',
    createdAt: '',
    updatedAt: '',
    deletedAt: null,
    value: '',
    scope: 'global',
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
      const name = v.name?.toLowerCase() || '';
      const genName = v.generatorName?.toLowerCase() || '';
      const genId = v.generatorId?.toLowerCase() || '';
      return name.includes(q) || genName.includes(q) || genId.includes(q);
    });
  }, [debouncedTerm, localList]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const clamped = Math.min(page, totalPages);
  const start = (clamped - 1) * itemsPerPage;
  const current = filtered.slice(start, start + itemsPerPage);

  useEffect(() => setPage(1), [debouncedTerm, itemsPerPage]);

  /* ---------------- actions ---------------- */

  const copyToClipboard = async (text: string, what: string) => {
    try {
      await navigator.clipboard.writeText(text || '');
      toast({ title: 'Copied', description: `${what} copied to clipboard` });
    } catch {
      toast({
        title: 'Copy failed',
        description: 'Could not copy.',
        variant: 'destructive',
      });
    }
  };

  // Create via CreateVariableDialog (prefix D_ for dynamic)
  const handleCreate = async (payload: any) => {
    try {
      let finalName = payload.name;
      if (payload.type === 'static' && !payload.name.startsWith('S_')) {
        finalName = `S_${payload.name}`;
      } else if (payload.type !== 'static' && !payload.name.startsWith('D_')) {
        finalName = `D_${payload.name}`;
      }

      if (!createVariableMutation)
        throw new Error('Create mutation not available');
      const created = await createVariableMutation.mutateAsync({
        ...payload,
        name: finalName,
      });

      setLocalList((prev) => [created as any, ...prev]);
      toast({
        title: 'Variable Created',
        description: 'Dynamic variable created successfully.',
      });

      setIsCreateOpen(false);
      setNewVariable((v) => ({
        ...v,
        id: '',
        name: '',
        description: '',
        value: '',
      }));
    } catch (error: any) {
      toast({
        title: 'Create failed',
        description: error?.message || 'Could not create dynamic variable',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (v: DynamicVariable) => {
    setEditing(v);
    setIsEditOpen(true);
  };

  const handleDynamicUpdate = async (
    id: string,
    patch: Record<string, any>,
  ) => {
    const prev = localList;
    setLocalList((list) =>
      list.map((v) =>
        v.id === id
          ? { ...v, ...patch, updatedAt: new Date().toISOString() }
          : v,
      ),
    );
    try {
      if (!updateDynamicVariableMutation)
        throw new Error('Update mutation not available');
      const saved = await updateDynamicVariableMutation.mutateAsync({
        id,
        ...patch,
      });
      setLocalList((list) =>
        list.map((v) => (v.id === id ? { ...v, ...saved } : v)),
      );
      toast({
        title: 'Updated',
        description: 'Dynamic variable updated successfully.',
      });
      setIsEditOpen(false);
      setEditing(null);
    } catch (error: any) {
      setLocalList(prev);
      toast({
        title: 'Update failed',
        description: error?.message || 'Could not update dynamic variable',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string, name?: string) => {
    const ok = window.confirm(`Delete dynamic variable "${name ?? id}"?`);
    if (!ok) return;

    const prev = localList;
    setLocalList((list) => list.filter((v) => v.id !== id));
    try {
      if (!deletedDynamicVariableMutation)
        throw new Error('Delete mutation not available');
      await deletedDynamicVariableMutation.mutateAsync(id);
      toast({
        title: 'Deleted',
        description: `Dynamic variable "${name ?? id}" deleted.`,
        variant: 'destructive',
      });
    } catch (error: any) {
      setLocalList(prev);
      toast({
        title: 'Delete failed',
        description: error?.message || 'Could not delete dynamic variable',
        variant: 'destructive',
      });
    }
  };

  const formatParameters = (parameters?: Record<string, any> | null) => {
    if (!parameters) return '';
    return Object.entries(parameters)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
  };

  /* ---------------- render ---------------- */
  return (
    <div className='space-y-4'>
      {/* top bar */}
      <div className='flex items-center justify-between gap-3'>
        <div className='relative flex-1 max-w-sm'>
          <Search
            className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-400'
            size={16}
          />
          <Input
            type='text'
            placeholder='Search variables...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className='w-full pl-9 pr-16 py-2 text-sm rounded-md'
          />
          {searchTerm && (
            <button
              className='absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600'
              onClick={() => setSearchTerm('')}
              aria-label='Clear search'
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
          type='dynamic'
        />
      </div>

      {/* content */}
      {isLoading ? (
        <Loader />
      ) : filtered.length === 0 ? (
        <div className='bg-white rounded-lg border border-slate-200 p-12 text-center'>
          <p className='text-sm text-slate-500 mb-3'>
            {debouncedTerm
              ? 'No dynamic variables match your search.'
              : 'No dynamic variables yet.'}
          </p>
          <Button
            onClick={() => setIsCreateOpen(true)}
            className='inline-flex items-center gap-1'
          >
            <Plus size={16} />
            Create Variable
          </Button>
        </div>
      ) : (
        <>
          <div className='bg-white rounded-lg border border-slate-200 overflow-hidden'>
            <Table>
              <TableHeader>
                <TableRow className='bg-slate-50'>
                  <TableHead className='font-semibold text-slate-600 text-sm capitalize tracking-wider'>
                    Name
                  </TableHead>
                  <TableHead className='font-semibold text-slate-600 text-sm capitalize tracking-wider'>
                    Generator Name
                  </TableHead>
                  <TableHead className='font-semibold text-slate-600 text-sm capitalize tracking-wider'>
                    Parameters
                  </TableHead>
                  <TableHead className='font-semibold text-slate-600 text-sm capitalize tracking-wider text-right w-24'>
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {current.map((variable) => (
                  <TableRow
                    key={variable.id}
                    className='border-b border-slate-100 hover:bg-slate-50 group'
                  >
                    <TableCell className='py-4'>
                      <div className='flex items-center gap-2'>
                        <span className='text-sm font-medium text-slate-900'>
                          {variable.name}
                        </span>
                        <button
                          onClick={() => copyToClipboard(variable.name, 'name')}
                          className='opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600 transition-opacity'
                          title='Copy name'
                        >
                          <Copy size={13} />
                        </button>
                      </div>
                    </TableCell>

                    <TableCell className='py-4'>
                      <div className='flex items-center gap-2'>
                        <span className='text-sm text-slate-700 truncate max-w-md'>
                          {variable.generatorName || '—'}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className='py-4'>
                      {Object.keys(variable.parameters ?? {}).length > 0 && (
                        <div className='flex items-center'>
                          <span className='px-2 py-1 rounded text-xs bg-slate-100 text-slate-700 truncate max-w-md'>
                            {formatParameters(variable.parameters)}
                          </span>
                        </div>
                      )}
                    </TableCell>

                    <TableCell className='py-4'>
                      <div className='flex items-center justify-end gap-1'>
                        <button
                          onClick={() => handleEdit(variable)}
                          className='p-1 text-slate-400 hover:text-blue-600 transition-colors'
                          title='Edit'
                        >
                          <Edit className='w-4 h-4' />
                        </button>
                        <button
                          onClick={() =>
                            handleDelete(variable.id, variable.name)
                          }
                          className='p-1 text-slate-400 hover:text-red-600 transition-colors'
                          title='Delete'
                        >
                          <Trash2 className='w-4 h-4' />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* footer / pagination */}
          {totalPages > 1 && (
            <div className='flex items-center justify-between text-xs mt-2'>
              <div className='text-slate-600'>
                {filtered.length === 0
                  ? '0'
                  : `${start + 1}-${Math.min(
                      start + itemsPerPage,
                      filtered.length,
                    )}`}{' '}
                of {filtered.length}
              </div>

              <div className='flex items-center gap-3'>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setPage(1);
                  }}
                  className='px-2 py-1 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500'
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>

                <div className='flex gap-1'>
                  <button
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    disabled={clamped === 1}
                    className='px-2 py-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                  >
                    Prev
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                    disabled={clamped === totalPages}
                    className='px-2 py-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
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
