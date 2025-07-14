import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Environment } from '@/models/datamanagement';
import { useToast } from '@/hooks/useToast';

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (env: Environment) => void;
};

const { toast } = useToast();

const CreateEnvironmentDialog: React.FC<Props> = ({
  open,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [baseUrl, setBaseUrl] = useState('');

  const handleSave = () => {
    const env: Environment = {
      id: Date.now().toString(),
      name,
      description,
      baseUrl,
      isDefault: false,
      createdAt: new Date().toISOString(),
      variables: {},
    };
    onSave(env);
    setName('');
    setDescription('');
    setBaseUrl('');
    onClose();
    toast({
      title: 'Environment created',
      description: 'Your environment has been created successfully',
      variant: 'success',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Environment</DialogTitle>
        </DialogHeader>
        <div className='space-y-4'>
          <div className='space-y-1'>
            <label className='text-sm font-medium'>Environment Name</label>
            <Input
              placeholder='e.g., Development, Staging, Production'
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className='space-y-1'>
            <label className='text-sm font-medium'>Description</label>
            <Textarea
              placeholder='Describe this environment'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className='space-y-1'>
            <label className='text-sm font-medium'>Base URL</label>
            <Input
              placeholder='https://api.example.com'
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
            />
          </div>

          <div className='flex justify-end space-x-2'>
            <Button variant='outline' onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}> Create Environment</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateEnvironmentDialog;
