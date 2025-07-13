// EditEnvironmentDialog.tsx
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Environment } from "@/models/datamanagement";
import { toast } from "@/hooks/use-toast";

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (env: Environment) => void;
  environment: Environment;
};

const EditEnvironmentDialog: React.FC<Props> = ({
  open,
  onClose,
  onSave,
  environment,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [baseUrl, setBaseUrl] = useState('');

  const handleSave = () => {
    onSave({
      ...environment,
      name,
      description,
      baseUrl,
    });
    toast({
        title: "Environment Updated",
        description: "Your environment has been updated successfully",
        variant: 'success',
      });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Environment</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
          <Input placeholder="Base URL" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} />
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave}> Update Environment</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditEnvironmentDialog;
