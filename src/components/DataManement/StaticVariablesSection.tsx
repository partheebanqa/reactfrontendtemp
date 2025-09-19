import React, { useState, useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Variable } from '@/shared/types/datamanagement';
import VariableCreateDialog from './CreateVariableDialog';
import VariableCard from './VariableCard';
import VariableEditDialog from './EditVariableDialog';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useDataManagement } from '@/hooks/useDataManagement';
import { useToast } from '@/hooks/useToast';
import PaginationControls from '@/admin/PaginationControls';

const StaticVariablesSection: React.FC = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const {
    environments,
    variables,
    createVariableMutation,
    deletedVariableMutation,
    updateVariableMutation,
  } = useDataManagement();
  const [editingVariable, setEditingVariable] = useState<Variable | null>(null);
  const [newVariable, setNewVariable] = useState<Variable>({
    id: '',
    environmentId: '',
    name: '',
    description: '',
    type: 'string',
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
  const [search, setSearch] = useState('');
  const [environmentFilter, setEnvironmentFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const { error: errorToast, success: successToast } = useToast();

  // CREATE
  const handleCreate = async (payload: any) => {
    try {
      let finalName = payload.name;

      if (payload.type === 'static' && !payload.name.startsWith('S_')) {
        finalName = `S_${payload.name}`;
      } else {
        finalName = `D_${payload.name}`;
      }

      await createVariableMutation.mutateAsync({
        ...payload,
        name: finalName,
      });
    } catch (error: any) {
      errorToast(
        error instanceof Error ? error.message : 'Failed to create variable'
      );
      return;
    }

    setNewVariable({
      id: '',
      environmentId: '',
      name: '',
      description: '',
      type: 'string',
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
    setIsCreateOpen(false);
  };

  // UPDATE
  const handleUpdate = () => {
    try {
      if (editingVariable) {
        updateVariableMutation.mutate({
          ...editingVariable,
          updatedAt: new Date().toISOString(),
        });
      }
      setEditingVariable(null);
      setIsEditOpen(false);
    } catch (error: any) {
      errorToast(
        error instanceof Error ? error.message : 'Failed to update variable'
      );
      return;
    }
  };

  // DELETE
  const handleDelete = async (id: string, label: string) => {
    try {
      await deletedVariableMutation.mutateAsync(id);
    } catch (error) {
      errorToast(
        error instanceof Error ? error.message : 'Failed to delete variable'
      );
      return;
    }
  };

  // COPY
  const handleCopy = (text: string) => {
    const formatted = `{{${text}}}`;
    navigator.clipboard.writeText(formatted);
    successToast('Variable copied to clipboard');
  };

  // FILTER
  const filteredVariables = useMemo(() => {
    return variables.filter((v) => {
      const matchesSearch =
        v.name.toLowerCase().includes(search.toLowerCase()) ||
        v.description?.toLowerCase().includes(search.toLowerCase());
      const matchesEnv =
        environmentFilter === 'all' || v.environmentId === environmentFilter;
      const matchesType = typeFilter === 'all' || v.type === typeFilter;
      return matchesSearch && matchesEnv && matchesType;
    });
  }, [variables, search, environmentFilter, typeFilter]);

  // PAGINATION
  const totalPages = Math.ceil(filteredVariables.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedVariables = useMemo(() => {
    return filteredVariables.slice(startIndex, endIndex);
  }, [filteredVariables, startIndex, endIndex]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* Filters + Search + Create */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center my-4 gap-4'>
        <div className='flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto'>
          <h2 className='text-xl font-semibold shrink-0'>Static Variables</h2>
        </div>

        <div className='flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto'>
          {/* Search */}
          <div className='relative w-full sm:w-64'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4' />
            <Input
              placeholder='Search variables...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='pl-10 w-full'
            />
          </div>

          {/* Environment Filter */}
          <Select
            value={environmentFilter}
            onValueChange={setEnvironmentFilter}
          >
            <SelectTrigger className='w-full sm:w-48'>
              <SelectValue placeholder='Filter by environment' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Environments</SelectItem>
              <SelectItem value='global'>Global</SelectItem>
              {environments.map((env) => (
                <SelectItem key={env.id} value={env.id}>
                  {env.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Type Filter */}
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className='w-full sm:w-48'>
              <SelectValue placeholder='Filter by type' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Types</SelectItem>
              <SelectItem value='string'>String</SelectItem>
              <SelectItem value='number'>Number</SelectItem>
              <SelectItem value='boolean'>Boolean</SelectItem>
              <SelectItem value='secret'>Secret</SelectItem>
              <SelectItem value='environment'>Environment</SelectItem>
              <SelectItem value='dynamic'>Dynamic</SelectItem>
            </SelectContent>
          </Select>

          {/* Create Button/Dialog */}
          <VariableCreateDialog
            open={isCreateOpen}
            setOpen={setIsCreateOpen}
            newVariable={newVariable}
            setNewVariable={setNewVariable}
            handleCreate={handleCreate}
            environments={environments}
            type='static'
          />
        </div>
      </div>

      {/* Variable List */}
      <div className='grid gap-4'>
        <VariableCard
          variables={paginatedVariables}
          environments={environments}
          handleCopy={handleCopy}
          onEdit={(v) => {
            setEditingVariable(v);
            setIsEditOpen(true);
          }}
          onDelete={handleDelete}
        />
      </div>

      {/* Pagination */}
      {filteredVariables.length > 0 && (
        <div className='mt-6'>
          <div className='flex justify-between items-center mb-2'>
            <div className='text-sm text-muted-foreground'>
              Showing {startIndex + 1} to{' '}
              {Math.min(endIndex, filteredVariables.length)} of{' '}
              {filteredVariables.length} variables
            </div>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => {
                setItemsPerPage(Number(value));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className='w-[140px]'>
                <SelectValue placeholder='Items per page' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='5'>5 per page</SelectItem>
                <SelectItem value='10'>10 per page</SelectItem>
                <SelectItem value='20'>20 per page</SelectItem>
                <SelectItem value='50'>50 per page</SelectItem>
                <SelectItem value='100'>100 per page</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* Empty State */}
      {filteredVariables.length === 0 && (
        <div className='text-center p-8'>
          <p className='text-muted-foreground'>
            No variables found with the current filters.
          </p>
        </div>
      )}

      {/* Edit Dialog */}
      <VariableEditDialog
        open={isEditOpen}
        setOpen={setIsEditOpen}
        editingVariable={editingVariable}
        setEditingVariable={setEditingVariable}
        onSave={handleUpdate}
        onOpenChange={setIsEditOpen}
      />
    </>
  );
};

export default StaticVariablesSection;
