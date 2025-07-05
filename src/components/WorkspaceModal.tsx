import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Edit } from "lucide-react";

interface Workspace {
  id: string;
  name: string;
  description?: string;
  slug?: string;
  subscriptionPlan?: "free" | "pro" | "enterprise";
}

interface WorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveWorkspace: (workspace: Partial<Workspace>) => Promise<any>;
  workspace?: Workspace | null; // If provided, we're in edit mode
  mode: 'add' | 'edit';
}

export default function WorkspaceModal({ 
  isOpen, 
  onClose, 
  onSaveWorkspace, 
  workspace = null,
  mode = 'add' 
}: WorkspaceModalProps) {
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceDescription, setWorkspaceDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // When the modal opens or the workspace changes, update the form
  useEffect(() => {
    if (workspace && mode === 'edit') {
      setWorkspaceName(workspace.name || "");
      setWorkspaceDescription(workspace.description || "");
    } else {
      // Reset form for add mode
      setWorkspaceName("");
      setWorkspaceDescription("");
    }
  }, [workspace, isOpen, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceName.trim()) return;
    
    setIsSubmitting(true);
    try {
      const workspaceData: Partial<Workspace> = {
        name: workspaceName,
        description: workspaceDescription
      };
      
      // If in edit mode, include the workspace ID
      if (mode === 'edit' && workspace) {
        workspaceData.id = workspace.id;
      }
      
      // Call the onSaveWorkspace prop with the workspace data
      await onSaveWorkspace(workspaceData);
      
      if (mode === 'add') {
        // Only reset form fields in add mode
        setWorkspaceName("");
        setWorkspaceDescription("");
      }
      
      onClose();
    } catch (error) {
      console.error(`Failed to ${mode} workspace:`, error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const title = mode === 'add' ? 'Create New Workspace' : 'Edit Workspace';
  const description = mode === 'add' 
    ? 'Create a new workspace to organize your API tests and collaborate with your team.'
    : 'Update your workspace details.';
  const buttonText = mode === 'add' ? 'Create Workspace' : 'Update Workspace';
  const loadingText = mode === 'add' ? 'Creating...' : 'Updating...';
  const IconComponent = mode === 'add' ? PlusCircle : Edit;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconComponent className="h-5 w-5 text-blue-500" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-left">
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="workspace-name">Workspace Name</Label>
            <Input
              id="workspace-name"
              placeholder="My Workspace"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="workspace-description">Description</Label>
            <Textarea
              id="workspace-description"
              placeholder="Brief description of your workspace"
              value={workspaceDescription}
              onChange={(e) => setWorkspaceDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              type="button" 
              onClick={onClose} 
              variant="outline" 
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1"
              disabled={isSubmitting || !workspaceName.trim()}
            >
              {isSubmitting ? loadingText : buttonText}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
