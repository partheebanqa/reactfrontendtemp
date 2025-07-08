import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { CollectionFolder } from '@/shared/types/collection';

interface FolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (folder: CollectionFolder) => void;
  parentId?: string;
  folder?: CollectionFolder;
}

const FolderModal: React.FC<FolderModalProps> = ({
  isOpen,
  onClose,
  onSave,
  parentId,
  folder
}) => {
  const [name, setName] = useState(folder?.name || '');
  const [description, setDescription] = useState(folder?.description || '');

  if (!isOpen) return null;

  const handleSave = () => {
    const newFolder: CollectionFolder = {
      id: folder?.id || uuidv4(),
      name,
      description,
      parentId,
      requests: folder?.requests || [],
      folders: folder?.folders || []
    };

    onSave(newFolder);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">
            {folder ? 'Edit Folder' : 'New Folder'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Folder name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md h-32"
              placeholder="Describe your folder..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:text-gray-900"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
          >
            <Save size={16} />
            Save Folder
          </button>
        </div>
      </div>
    </div>
  );
};

export default FolderModal;