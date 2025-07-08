import React, { useState, useEffect } from "react";
import { X, Save, Plus, FolderTree } from "lucide-react";
import {
  CollectionRequest,
  Collection,
  CollectionFolder,
} from "@/shared/types/collection";
import CollectionModal from "./CollectionModal";
import { useRequestBuilder } from "@/hooks/useRequestBuilder";

interface RequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (request: CollectionRequest) => void;
  request?: CollectionRequest;
  currentRequest?: CollectionRequest;
  collectionId?: string;
}

const RequestModal: React.FC<RequestModalProps> = ({
  isOpen,
  onClose,
  onSave,
  request,
  currentRequest,
  collectionId,
}) => {
  // State management with proper initialization
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>("");
  const [selectedFolderId, setSelectedFolderId] = useState<string>("");
  const [showNewCollectionModal, setShowNewCollectionModal] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set()
  );
  const { collectionList, addCollectionMutation } = useRequestBuilder();

  // Reset form when modal opens or props change
  useEffect(() => {
    if (isOpen) {
      setName(request?.name || "");
      setDescription(request?.description || "");
      setSelectedCollectionId(collectionId || collectionList[0]?.id || "");
      setSelectedFolderId("");
    }
  }, [isOpen, request, collectionId, collectionList]);

  // Early return pattern
  if (!isOpen) return null;

  // Memoized handlers to prevent unnecessary re-renders
  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const handleSave = () => {
    // Create a well-formed request object with proper defaults
    const newRequest: CollectionRequest = {
      id: request?.id || Date.now().toString(), // Generate an ID if none exists
      name,
      description,
      collectionId: selectedCollectionId,
      createdAt: request?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      order: request?.order || 0,
      method: request?.method || "GET",
      bodyType: request?.bodyType || "",
      bodyFormData: request?.bodyFormData || null,
      bodyRawContent: request?.bodyRawContent || "",
      authorizationType: request?.authorizationType || "",
      authorization: request?.authorization || {
        token: undefined,
      },
      variables: request?.variables || {},
      headers: request?.headers || [],
      params: request?.params || [],
      createdBy: request?.createdBy || "",
      url: request?.url || "",
    };

    // Call the onSave callback with the new request
    onSave(newRequest);
    onClose();
  };

  const handleNewCollectionCreate = (collection: Collection) => {
    addCollectionMutation.mutate(collection);
    setSelectedCollectionId(collection.id);
    setShowNewCollectionModal(false);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-card text-card-foreground rounded-lg shadow-lg w-full max-w-md border border-border">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-xl font-semibold">
              {request ? "Edit Request" : "Save Request"}
            </h2>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Request name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring min-h-[80px]"
                placeholder="Describe your request..."
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium">
                  Collection
                </label>
                <button
                  onClick={() => setShowNewCollectionModal(true)}
                  className="text-sm text-primary hover:text-primary/90 flex items-center gap-1"
                >
                  <Plus size={14} />
                  New Collection
                </button>
              </div>
              <select
                value={selectedCollectionId}
                onChange={(e) => {
                  setSelectedCollectionId(e.target.value);
                  setSelectedFolderId("");
                }}
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select a collection</option>
                {collectionList.map((collection) => (
                  <option key={collection.id} value={collection.id}>
                    {collection.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 p-4 border-t border-border">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm hover:text-foreground/80"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!name.trim() || !selectedCollectionId}
              className="px-4 py-2 bg-primary text-primary-foreground text-sm rounded-md hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
            >
              <Save size={16} />
              Save Request
            </button>
          </div>
        </div>
      </div>

      {showNewCollectionModal && (
        <CollectionModal
          isOpen={showNewCollectionModal}
          onClose={() => setShowNewCollectionModal(false)}
          onSaveCollection={handleNewCollectionCreate}
        />
      )}
    </>
  );
};

export default RequestModal;
