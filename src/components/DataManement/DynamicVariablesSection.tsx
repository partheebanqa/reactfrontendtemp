import React, { useState, useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import DynamicVariableCard from './DynamicVariableCard';
import VariableCreateDialog from './CreateVariableDialog';
import EditDynamicVariableDialog from './EditDynamicVariableDialog';
import { Search, Settings } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useDataManagement } from '@/hooks/useDataManagement';
import { useToast } from '@/hooks/useToast';
import PaginationControls from '@/admin/PaginationControls';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface DynamicVariable {
  id: string;
  workspaceId: string;
  name: string;
  generatorId: string;
  generatorName: string;
  parameters: Record<string, any>;
  type: string;
  category: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

interface Variable {
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
}

const DynamicVariablesSection: React.FC = () => {
  const {
    environments,
    dynamicVariables,
    createVariableMutation,
    updateDynamicVariableMutation,
    deletedDynamicVariableMutation,
  } = useDataManagement();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const { error: showError, success: showSuccess, toast } = useToast();
  const [editingVariable, setEditingVariable] =
    useState<DynamicVariable | null>(null);
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
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [generatorFilter, setGeneratorFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const { error: errorToast, success: successToast } = useToast();

  console.log('Dynamic Variables:', dynamicVariables);

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
      toast({
        title: 'Variable Created',
        description: 'The variable has been created successfully.',
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
  const handleDynamicUpdate = async (id: string, payload: any) => {
    try {
      await updateDynamicVariableMutation.mutateAsync({
        id,
        ...payload,
      });
      successToast('Dynamic variable updated successfully');
      setEditingVariable(null);
      setIsEditOpen(false);
    } catch (error) {
      errorToast(
        error instanceof Error
          ? error.message
          : 'Failed to update dynamic variable'
      );
    }
  };

  // DELETE
  const handleDelete = async (id: string, name: string) => {
    try {
      await deletedDynamicVariableMutation.mutateAsync(id);
      successToast(`Dynamic variable "${name}" deleted successfully`);
    } catch (error) {
      errorToast(
        error instanceof Error
          ? error.message
          : 'Failed to delete dynamic variable'
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

  // Handle edit button click
  const handleEditClick = (variable: DynamicVariable) => {
    setEditingVariable(variable);
    setIsEditOpen(true);
  };

  // Get unique values for filters
  const uniqueCategories = useMemo(() => {
    const categories = [...new Set(dynamicVariables.map((v) => v.category))];
    return categories.sort();
  }, [dynamicVariables]);

  const uniqueGenerators = useMemo(() => {
    const generators = [
      ...new Set(dynamicVariables.map((v) => v.generatorName)),
    ];
    return generators.sort();
  }, [dynamicVariables]);

  const uniqueTypes = useMemo(() => {
    const types = [...new Set(dynamicVariables.map((v) => v.type))];
    return types.sort();
  }, [dynamicVariables]);

  // FILTER
  const filteredVariables = useMemo(() => {
    return dynamicVariables.filter((v) => {
      const matchesSearch =
        v.name.toLowerCase().includes(search.toLowerCase()) ||
        v.generatorName.toLowerCase().includes(search.toLowerCase()) ||
        v.generatorId.toLowerCase().includes(search.toLowerCase());

      const matchesCategory =
        categoryFilter === 'all' || v.category === categoryFilter;

      const matchesType = typeFilter === 'all' || v.type === typeFilter;

      const matchesGenerator =
        generatorFilter === 'all' || v.generatorName === generatorFilter;

      return (
        matchesSearch && matchesCategory && matchesType && matchesGenerator
      );
    });
  }, [dynamicVariables, search, categoryFilter, typeFilter, generatorFilter]);

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
      {/* Header */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center my-4 gap-4'>
        <div className='flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto'>
          <h2 className='text-xl font-semibold shrink-0 flex items-center gap-2'>
            <span className='p-1 rounded bg-orange-100 dark:bg-orange-900'>
              <Settings className='w-5 h-5 text-orange-600' />
            </span>
            Dynamic Variables
          </h2>
          <div className='text-sm text-muted-foreground'>
            {filteredVariables.length} of {dynamicVariables.length} variables
          </div>
        </div>

        <div className='flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto'>
          {/* Search */}
          <div className='relative w-full sm:w-64'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4' />
            <Input
              placeholder='Search dynamic variables...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='pl-10 w-full'
            />
          </div>

          {/* Category Filter */}
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className='w-full sm:w-48'>
              <SelectValue placeholder='Filter by category' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Categories</SelectItem>
              {uniqueCategories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
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
              {uniqueTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
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
            type='dynamic'
          />
        </div>
      </div>

      {/* Variable List */}
      <div className='grid gap-4'>
        <DynamicVariableCard
          variables={paginatedVariables}
          environments={environments}
          handleCopy={handleCopy}
          onEdit={handleEditClick}
          onDelete={handleDelete}
        />
      </div>

      {/* Edit Dialog */}
      <EditDynamicVariableDialog
        open={isEditOpen}
        setOpen={setIsEditOpen}
        variable={editingVariable}
        handleDynamicUpdate={handleDynamicUpdate}
      />

      {/* Pagination */}
      {filteredVariables.length > 0 && (
        <div className='mt-6'>
          <div className='flex justify-between items-center mb-2'>
            <div className='text-sm text-muted-foreground'>
              Showing {startIndex + 1} to{' '}
              {Math.min(endIndex, filteredVariables.length)} of{' '}
              {filteredVariables.length} dynamic variables
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
          <div className='mx-auto w-24 h-24 bg-orange-50 dark:bg-orange-950 rounded-full flex items-center justify-center mb-4'>
            <Settings className='w-12 h-12 text-orange-400' />
          </div>
          <h3 className='text-lg font-semibold mb-2'>
            No Dynamic Variables Found
          </h3>
          <p className='text-muted-foreground mb-4'>
            {search ||
            categoryFilter !== 'all' ||
            typeFilter !== 'all' ||
            generatorFilter !== 'all'
              ? 'No dynamic variables match your current filters.'
              : 'Get started by creating your first dynamic variable.'}
          </p>
          {(search ||
            categoryFilter !== 'all' ||
            typeFilter !== 'all' ||
            generatorFilter !== 'all') && (
            <Button
              variant='outline'
              onClick={() => {
                setSearch('');
                setCategoryFilter('all');
                setTypeFilter('all');
                setGeneratorFilter('all');
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      )}
    </>
  );
};

export default DynamicVariablesSection;
