// EditEnvironmentDialog.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Environment } from "@/shared/types/datamanagement";
import { useToast } from "@/hooks/useToast";

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (env: Environment) => void;
  environment: Environment;
  loading?: boolean;
};

const EditEnvironmentDialog: React.FC<Props> = ({
  open,
  onClose,
  onSave,
  environment,
  loading = false,
}) => {
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: "",
    description: "",
    baseUrl: "",
  });


  useEffect(() => {
    if (!open || !environment) return;
    setForm({
      name: environment.name ?? "",
      description: environment.description ?? "",
      baseUrl: environment.baseUrl ?? "",
    });
  }, [open, environment]);

  const isDirty = useMemo(() => {
    return (
      form.name !== (environment?.name ?? "") ||
      form.description !== (environment?.description ?? "") ||
      form.baseUrl !== (environment?.baseUrl ?? "")
    );
  }, [form, environment]);

  const onChange =
    (key: keyof typeof form) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm((prev) => ({ ...prev, [key]: e.target.value }));
      };

  const handleSave = () => {
    const updated: Environment = {
      ...environment,
      name: form.name.trim(),
      description: form.description.trim(),
      baseUrl: form.baseUrl.trim(),
    };

    onSave(updated);
    toast({
      title: "Environment Updated",
      description: "Your environment has been updated successfully",
      variant: "success",
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && isDirty && !loading) {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (!o ? onClose() : void 0)}>
      <DialogContent onKeyDown={handleKeyDown}>
        <DialogHeader>
          <DialogTitle>Edit Environment</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            placeholder="Name"
            value={form.name}
            onChange={onChange("name")}
            autoFocus
          />

          <Textarea
            placeholder="Description"
            value={form.description}
            onChange={onChange("description")}
            rows={4}
          />

          <Input
            placeholder="Base URL (e.g. https://api.example.com)"
            value={form.baseUrl}
            onChange={onChange("baseUrl")}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {loading ? "Updating..." : "Update Environment"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditEnvironmentDialog;
