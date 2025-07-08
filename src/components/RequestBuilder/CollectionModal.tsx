import React, { useState, useEffect } from "react";
import { X, Save } from "lucide-react";
import { Collection } from "@/shared/types/collection";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useRequestBuilder } from "@/hooks/useRequestBuilder";

interface CollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  // onSave: (collection: Collection) => void;
  onSaveCollection: (collection: Collection) => void;
  collection?: Collection;
  // collection?: CollectionList;
}

const CollectionModal: React.FC<CollectionModalProps> = ({
  isOpen,
  onClose,
  onSaveCollection,
  collection,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const { currentWorkspace } = useWorkspace();
  const { addCollection } = useRequestBuilder();

  useEffect(() => {
    if (collection) {
      setName(collection.name);
      // setDescription(collection.Description || '');
    } else {
      setName("");
      // setDescription('');
    }
  }, [collection]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (collection) {
      const response = await renameCollection(collection?.id, name);
      console.log("🚀 ~ handleSave ~ response:", response);
      onSaveCollection({
        ...collection,
        name,
      });
      onClose();
      return;
    } else {
      const response = await addCollection({
        name: name,
        isImportant: false,
        workspaceId: currentWorkspace?.id as string,
      });

      const newCollection: Collection = {
        id: response.collectionId,
        createdAt: String(new Date()),
        name: name,
        isImportant: false,
        updatedAt: String(new Date()),
        workspaceId: currentWorkspace?.id || "",
        requests: [],
        deletedAt: "",
      };

      onSaveCollection(newCollection);
      showSnackbar(response.message, "success");
      onClose();
    }

    // const newCollection: Collection = {
    //   id: collection?.id || uuidv4(),
    //   name,
    //   description,
    //   folders: collection?.folders || [],
    //   requests: collection?.requests || [],
    //   createdAt: collection?.createdAt || new Date().toISOString(),
    //   updatedAt: new Date().toISOString(),
    //   changelog: [
    //     ...(collection?.changelog || []),
    //     {
    //       id: uuidv4(),
    //       action: collection ? 'update' : 'create',
    //       itemType: 'collection',
    //       itemId: collection?.id || uuidv4(),
    //       itemName: name,
    //       timestamp: new Date().toISOString(),
    //       details: collection ? 'Collection updated' : 'Collection created'
    //     }
    //   ]
    // };
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">
            {collection ? "Edit Collection" : "New Collection"}
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
              placeholder="Collection name"
            />
          </div>

          {/* <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md h-32"
              placeholder="Describe your collection..."
            />
          </div> */}
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
            Save Collection
          </button>
        </div>
      </div>
    </div>
  );
};

export default CollectionModal;
