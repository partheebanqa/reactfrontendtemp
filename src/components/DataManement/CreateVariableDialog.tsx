import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Variable, Environment } from '@/shared/types/datamanagement';

interface VariableCreateDialogProps {
  open: boolean;
  setOpen: (val: boolean) => void;
  newVariable: Variable;
  setNewVariable: React.Dispatch<React.SetStateAction<Variable>>;
  handleCreate: () => void;
  environments: Environment[];
}

const VariableCreateDialog: React.FC<VariableCreateDialogProps> = ({
  open,
  setOpen,
  newVariable,
  setNewVariable,
  handleCreate,
  environments,
}) => {
  const [errors, setErrors] = useState<{
    name?: string;
    environmentId?: string;
    type?: string;
    initialValue?: string;
  }>({});

  const validateForm = (): boolean => {
    const newErrors: {
      name?: string;
      environmentId?: string;
      type?: string;
      initialValue?: string;
    } = {};

    if (!newVariable.name.trim()) {
      newErrors.name = 'Variable name is required';
    } else if (newVariable.name.length < 2) {
      newErrors.name = 'Variable name must be at least 2 characters';
    } else if (!/^[A-Z0-9_]+$/.test(newVariable.name)) {
      newErrors.name = 'Variable name can only contain uppercase letters, numbers, and underscores';
    }

    // Validate environment
    if (!newVariable.environmentId) {
      newErrors.environmentId = 'Please select an environment';
    }

    // Validate type (should already be set by default, but just in case)
    if (!newVariable.type) {
      newErrors.type = 'Variable type is required';
    }

    // Validate initial value (can be optional for some types)
    if (newVariable.type !== 'dynamic' && !newVariable.initialValue.trim()) {
      newErrors.initialValue = 'Initial value is required';
    } else if (newVariable.type === 'number' && isNaN(Number(newVariable.initialValue))) {
      newErrors.initialValue = 'Initial value must be a valid number';
    } else if (newVariable.type === 'boolean' &&
      !['true', 'false', '0', '1'].includes(newVariable.initialValue.toLowerCase())) {
      newErrors.initialValue = 'Initial value must be a valid boolean (true/false)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission with validation
  const handleSubmit = () => {
    if (validateForm()) {
      handleCreate();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Variable</Button>
      </DialogTrigger>

      <DialogContent className='max-w-2xl max-h-[80vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Create Variable</DialogTitle>
        </DialogHeader>

        <div className='space-y-4'>
          {/* Variable Name */}
          <div className='space-y-1'>
            <label className='text-sm font-medium'>Variable Name</label>
            <Input
              placeholder='e.g., USER_ID, API_TOKEN'
              value={newVariable.name}
              className={errors.name ? 'border-red-500' : ''}
              onChange={(e) => {
                setNewVariable((prev) => ({
                  ...prev,
                  name: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_'),
                }));
                // Clear error when user types
                if (errors.name) {
                  setErrors(prev => ({ ...prev, name: undefined }));
                }
              }}
            />
            {errors.name ? (
              <p className='text-xs text-red-500 mt-1'>{errors.name}</p>
            ) : (
              <p className='text-xs text-muted-foreground mt-1'>
                Use in requests as: <code>{'{{' + newVariable.name + '}}'}</code>
              </p>
            )}
          </div>

          {/* Environment */}
          <div className='space-y-1'>
            <label className='text-sm font-medium'>Environment</label>
            <Select
              value={newVariable.environmentId}
              onValueChange={(value) => {
                setNewVariable((prev) => ({ ...prev, environmentId: value }));
                // Clear error when user selects
                if (errors.environmentId) {
                  setErrors(prev => ({ ...prev, environmentId: undefined }));
                }
              }}
            >
              <SelectTrigger className={errors.environmentId ? 'border-red-500' : ''}>
                <SelectValue placeholder='Select environment' />
              </SelectTrigger>
              <SelectContent>
                {environments.map((env) => (
                  <SelectItem key={env.id} value={env.id}>
                    {env.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.environmentId && (
              <p className='text-xs text-red-500 mt-1'>{errors.environmentId}</p>
            )}
          </div>

          {/* Type */}
          <div className='space-y-1'>
            <label className='text-sm font-medium'>Variable Type</label>
            <Select
              value={newVariable.type}
              onValueChange={(value) => {
                setNewVariable((prev) => ({
                  ...prev,
                  type: value,
                  initialValue: '',
                  currentValue: '',
                }));
                // Clear error when user selects
                if (errors.type) {
                  setErrors(prev => ({ ...prev, type: undefined }));
                }
              }}
            >
              <SelectTrigger className={errors.type ? 'border-red-500' : ''}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='string'>String</SelectItem>
                <SelectItem value='number'>Number</SelectItem>
                <SelectItem value='boolean'>Boolean</SelectItem>
                <SelectItem value='secret'>Secret</SelectItem>
                <SelectItem value='environment'>Environment</SelectItem>
                <SelectItem value='dynamic'>Dynamic</SelectItem>
              </SelectContent>
            </Select>
            {errors.type && (
              <p className='text-xs text-red-500 mt-1'>{errors.type}</p>
            )}
          </div>

          {/* Initial Value */}
          <div className='space-y-1'>
            <label className='text-sm font-medium'>Initial Value</label>
            <Input
              placeholder='Enter initial value'
              value={newVariable.initialValue}
              className={errors.initialValue ? 'border-red-500' : ''}
              onChange={(e) => {
                setNewVariable((prev) => ({
                  ...prev,
                  initialValue: e.target.value,
                  currentValue: e.target.value,
                }));
                // Clear error when user types
                if (errors.initialValue) {
                  setErrors(prev => ({ ...prev, initialValue: undefined }));
                }
              }}
            />
            {errors.initialValue && (
              <p className='text-xs text-red-500 mt-1'>{errors.initialValue}</p>
            )}
          </div>

          {/* Description */}
          <div className='space-y-1'>
            <label className='text-sm font-medium'>Description</label>
            <Textarea
              placeholder='Enter a description for this variable'
              value={newVariable.description}
              onChange={(e) =>
                setNewVariable((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
            />
          </div>

          <div className='flex justify-end space-x-2 pt-4'>
            <Button
              variant='outline'
              onClick={() => {
                setOpen(false);
                // Clear all errors when closing the dialog
                setErrors({});
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit}>Create Variable</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VariableCreateDialog;
