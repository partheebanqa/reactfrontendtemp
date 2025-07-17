import React, { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Variable, Environment } from '@/models/datamanagement';
import VariableCreateDialog from './CreateVariableDialog';
import VariableCard from './VariableCard';
import VariableEditDialog from './EditVariableDialog'; // ✅ CORRECTED
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface VariablesSectionProps {
  variables: Variable[];
  setVariables: React.Dispatch<React.SetStateAction<Variable[]>>;
  environments: Environment[];
  toast: any;
}

const VariablesSection: React.FC<VariablesSectionProps> = ({
  variables,
  setVariables,
  environments,
  toast,
}) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const [editingVariable, setEditingVariable] = useState<Variable | null>(null);
  const [newVariable, setNewVariable] = useState<Variable>({
    id: '',
    key: '',
    value: '',
    type: 'string',
    description: '',
    environmentId: '',
    isGlobal: true,
    generatorFunction: '',
    scope: 'global',
    isSecret: false,
  });
  const [search, setSearch] = useState('');
  const [environmentFilter, setEnvironmentFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const handleCreate = () => {
    setVariables((prev) => [
      ...prev,
      { ...newVariable, id: Date.now().toString() },
    ]);
    toast({
      title: 'Variable created',
      description: `${newVariable.key} created successfully.`,
      variant: 'success',
    });
    setIsCreateOpen(false);
    setNewVariable({
      id: '',
      key: '',
      value: '',
      type: 'string',
      description: '',
      environmentId: '',
      isGlobal: true,
      generatorFunction: '',
      scope: 'global',
      isSecret: false,
    });
  };

  const handleUpdate = () => {
    setVariables((prev) =>
      prev.map((v) => (v.id === editingVariable?.id ? editingVariable! : v))
    );
    toast({
      title: 'Variable updated',
      description: `${editingVariable?.key} updated successfully.`,
      variant: 'success',
    });
    setIsEditOpen(false);
    setEditingVariable(null);
  };

  const handleDelete = (id: string, label: string) => {
    setVariables((prev) => prev.filter((v) => v.id !== id));
    toast({
      title: 'Variable deleted',
      description: `${label} has been deleted.`,
      variant: 'destructive',
    });
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to clipboard',
      description: `Variable value copied.`,
      variant: 'success',
    });
  };

  const filteredVariables = variables.filter((v) => {
    const matchesSearch =
      v.key.toLowerCase().includes(search.toLowerCase()) ||
      v.description?.toLowerCase().includes(search.toLowerCase());
    const matchesEnv =
      environmentFilter === 'all' ||
      (environmentFilter === 'global' && v.isGlobal) ||
      v.environmentId === environmentFilter;
    const matchesType = typeFilter === 'all' || v.type === typeFilter;
    return matchesSearch && matchesEnv && matchesType;
  });

  return (
    <>
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center my-4 gap-4'>
        <div className='flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto'>
          <h2 className='text-xl font-semibold shrink-0'>Variables</h2>
        </div>

        <div className='flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto'>
          <div className='relative w-full sm:w-64'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4' />
            <Input
              placeholder='Search variables...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='pl-10 w-full'
            />
          </div>
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

          <VariableCreateDialog
            open={isCreateOpen}
            setOpen={setIsCreateOpen}
            newVariable={newVariable}
            setNewVariable={setNewVariable}
            handleCreate={handleCreate}
            environments={environments}
          />
        </div>
      </div>

      <div className='grid gap-4'>
        <VariableCard
          variables={filteredVariables}
          environments={environments}
          handleCopy={handleCopy}
          onEdit={(v) => {
            setEditingVariable(v);
            setIsEditOpen(true);
          }}
          onDelete={handleDelete}
        />
      </div>

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

export default VariablesSection;
