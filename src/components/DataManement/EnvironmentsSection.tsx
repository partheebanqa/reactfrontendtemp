// EnvironmentsSection.tsx
import React, { useState } from 'react';
import { Environment } from '@/models/datamanagement';
import { Button } from '@/components/ui/button';
import EnvironmentCard from './EnvironmentCard';
import CreateEnvironmentDialog from './CreateEnvironmentDialog';
import EditEnvironmentDialog from './EditEnvironmentDialog';
import { useToast } from '@/hooks/useToast';

const initialEnvironments: Environment[] = [
  {
    id: '1',
    name: 'Development',
    description: 'Development environment for testing',
    baseUrl: 'https://api-dev.company.com',
    variables: {
      api_version: 'v1',
      timeout: '5000',
      retry_count: '3',
    },
    isDefault: true,
    createdAt: '2024-01-15T10:30:00Z',
  },
  {
    id: '2',
    name: 'Staging',
    description: 'Staging environment for pre-production testing',
    baseUrl: 'https://api-staging.company.com',
    variables: {
      api_version: 'v1',
      timeout: '3000',
      retry_count: '2',
    },
    isDefault: false,
    createdAt: '2024-01-10T09:15:00Z',
  },
];

const EnvironmentsSection: React.FC = () => {
  const { toast } = useToast();
  const [environments, setEnvironments] = useState(initialEnvironments);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingEnvironment, setEditingEnvironment] =
    useState<Environment | null>(null);

  const handleDeleteEnv = (id: string, label: string) => {
    setEnvironments((prev) => prev.filter((env) => env.id !== id));
    toast({
      title: 'Environment Deleted',
      description: `${label} has been deleted`,
      variant: 'destructive',
    });
  };
  const handleCreate = (env: Environment) => {
    setEnvironments((prev) => [...prev, env]);
    setIsCreateOpen(false);
  };

  const handleUpdate = (env: Environment) => {
    setEnvironments((prev) => prev.map((e) => (e.id === env.id ? env : e)));
    setEditingEnvironment(null);
  };

  return (
    <>
      <div className='flex justify-between items-center my-4'>
        <h2 className='text-xl font-semibold'>Environments</h2>
        <Button onClick={() => setIsCreateOpen(true)}>Add Environment</Button>
      </div>

      <div className='grid gap-4'>
        {environments.map((env) => (
          <EnvironmentCard
            key={env.id}
            environment={env}
            onEdit={setEditingEnvironment}
            onDelete={() => handleDeleteEnv(env.id, env.name)}
          />
        ))}
      </div>

      <CreateEnvironmentDialog
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSave={handleCreate}
      />

      {editingEnvironment && (
        <EditEnvironmentDialog
          environment={editingEnvironment}
          open={true}
          onClose={() => setEditingEnvironment(null)}
          onSave={handleUpdate}
        />
      )}
    </>
  );
};

export default EnvironmentsSection;
