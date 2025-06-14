import React, { useEffect, useState } from 'react';
import { WorkSpace, workspaceService } from '../../shared/services/workspaceService';
import { showSnackbar } from '../../shared/services/snackbarService';
import { useWorkspace } from '../../context/WorkspaceContext';

interface CreateWorkspaceModalProps {
  open: boolean;
  onClose: () => void;
  Workspace?: WorkSpace | null;
}

const CreateWorkspaceModal: React.FC<CreateWorkspaceModalProps> = ({
  open,
  onClose,
  Workspace
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const { setCreatedWorkspace } = useWorkspace(); 
  
  useEffect(() => {
    if (open) {
      if (Workspace) {
        setName(Workspace.Name);
        setDescription(Workspace.Description);
      } else {
        setName('');
        setDescription('');
      }
    }
  }, [open,Workspace]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if ( Workspace) {
        const response = await workspaceService.updateWorkspace( {
          name,
          description
        }, Workspace.Id);
        showSnackbar(response.message, 'success');
        const updatedWorkspace: WorkSpace = {
          ...Workspace,
          Name: name,
          Description: description,
        };

    setCreatedWorkspace(updatedWorkspace);
      } else {
        const response = await workspaceService.addWorkspace({ name, description });
        const workspace: WorkSpace = {
          Id: response.workspaceId,
          TenantID: "efe6f044-dff8-40e4-bd86-2d62c9ac98f6",
          Name: name,
          Description: description,
          CreatedAt: "",
          UpdatedAt: "",
          CreatedBy: "",
          DeletedAt: null,
        };
        setCreatedWorkspace(workspace);
        showSnackbar(response.message, 'success');
      }
      onClose();
    };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">Create Workspace</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="block mb-1 text-sm font-medium text-gray-700">Name</label>
            <input
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-blue-200"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              maxLength={50}
            />
          </div>
          <div className="mb-4">
            <label className="block mb-1 text-sm font-medium text-gray-700">Description</label>
            <textarea
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-blue-200"
              value={description}
              onChange={e => setDescription(e.target.value)}
              maxLength={200}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="px-4 py-2 text-sm rounded bg-gray-200 hover:bg-gray-300"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateWorkspaceModal;
