import React, { Dispatch, SetStateAction } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Button } from '@/components/ui/button';
import { Variable } from '@/shared/types/datamanagement';

interface Props {
  open: boolean;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
  editingVariable: Variable | null;
  setEditingVariable: (v: Variable | null) => void;
  onSave: () => void;
  setOpen: (val: boolean) => void;
}

const EditVariableDialog: React.FC<Props> = ({
  open,
  onOpenChange,
  editingVariable,
  setEditingVariable,
  onSave,
  setOpen,
}) => {
  const handleChange = (field: keyof Variable, value: any) => {
    if (editingVariable) {
      setEditingVariable({
        ...editingVariable,
        [field]: value,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className='max-w-2xl max-h-[80vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Edit Variable</DialogTitle>
        </DialogHeader>

        {editingVariable && (
          <div className='space-y-4'>
            {/* Name */}
            <div>
              <label className='text-sm font-medium'>Variable Name</label>
              <Input
                value={editingVariable.name}
                onChange={(e) =>
                  handleChange(
                    'name',
                    e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_')
                  )
                }
              />
              <p className='text-xs text-muted-foreground mt-1'>
                Use in requests as: <code>{`{{${editingVariable.name}}}`}</code>
              </p>
            </div>

            {/* Type */}

            <div>
              <label className='text-sm font-medium'>Variable Type</label>
              <Select
                value={editingVariable.type}
                onValueChange={(value: string) => handleChange('type', value)}
              >
                <SelectTrigger>
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
            </div>

            {/* Current Value */}
            <div className='space-y-1'>
              <label className='text-sm font-medium'>Current Value</label>
              <Input
                placeholder='Enter current value'
                value={editingVariable.currentValue}
                onChange={(e) => handleChange('currentValue', e.target.value)}
              />
            </div>

            {/* Description */}
            <div className='space-y-1'>
              <label className='text-sm font-medium'>Description</label>
              <Textarea
                placeholder='Enter a description for this variable'
                value={editingVariable.description}
                onChange={(e) => handleChange('description', e.target.value)}
              />
            </div>

            <div className='flex justify-end space-x-2 pt-4'>
              <Button
                variant='outline'
                onClick={() => {
                  setOpen(false);
                  setEditingVariable(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={onSave}>Update Variable</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EditVariableDialog;
