// EnvironmentsSection.tsx
import React, { useState } from 'react';
import { Environment } from '@/shared/types/datamanagement';
import { Button } from '@/components/ui/button';
import EnvironmentCard from './EnvironmentCard';
import CreateEnvironmentDialog from './CreateEnvironmentDialog';
import EditEnvironmentDialog from './EditEnvironmentDialog';
import { useToast } from '@/hooks/useToast';
import { useDataManagement } from '@/hooks/useDataManagement';
import { useLocation } from 'wouter';


const EnvironmentsSection: React.FC = () => {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { environments } = useDataManagement();
  const [editingEnvironment, setEditingEnvironment] =
    useState<Environment | null>(null);
  const [_,setLocation] = useLocation()

  const handleDeleteEnv = (id: string, label: string) => {
    // setEnvironments((prev) => prev.filter((env) => env.id !== id));
    toast({
      title: 'Environment Deleted',
      description: `${label} has been deleted`,
      variant: 'destructive',
    });
  };
  const handleCreate = (env: Environment) => {
    setIsCreateOpen(false);
  };

  const handleUpdate = (env: Environment) => {
    setEditingEnvironment(null);
  };

  return (
    <>
      <div className='flex justify-between items-center my-4'>
        <h2 className='text-xl font-semibold'>Environments</h2>
        <Button onClick={() =>setLocation('/settings/account?tab=environments') }>Manage Environment</Button>
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
