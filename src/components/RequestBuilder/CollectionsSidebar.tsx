import React, { useEffect, useRef, useState } from "react";
import {
  Plus,
  MoreVertical,
  Upload,
  FolderTree,
  Trash2,
  Edit,
  Move,
  Star,
  X,
  Save,
} from "lucide-react";
import {
  Collection,
  CollectionFolder,
  CollectionRequest,
  Request,
} from "@/shared/types/collection";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import {
  getCollectionRequests,
  renameCollection,
} from "@/service/request-builder.service";
import { useRequestBuilder } from "@/hooks/useRequestBuilder";
import CollectionModal from "./CollectionModal";
import { CollectionList } from "./CollectionList";
import ImportModal from "./ImportModal";
import RequestModal from "./RequestModal";

interface CollectionsSidebarProps {
  currentRequest?: CollectionRequest;
}

const CollectionsSidebar: React.FC<CollectionsSidebarProps> = ({
  currentRequest,
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set()
  );
  const [showMenu, setShowMenu] = useState<string | null>(null);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedCollection, setSelectedCollection] =
    useState<Collection | null>(null);
  const [selectedCollectionForRequest, setSelectedCollectionForRequest] =
    useState<string>("");
  const [selectedFolderForRequest, setSelectedFolderForRequest] = useState<
    string | null
  >(null);
  const [selectedRequest, setSelectedRequest] =
    useState<CollectionRequest | null>(null);
  const { collectionList, addCollectionMutation } = useRequestBuilder();

  const [showRequestRenameModal, setShowRequestRenameModal] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [requestId, setRequestId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  
  const renameRequest = async () => {
    try {
      // Implementation would call the API to rename the request
      // const response = await renameCollection(requestId, renameValue);
      setShowRequestRenameModal(false);
    } catch (error) {
      console.error("Failed to rename request:", error);
    }
  };

  const handleRenameCollection = (collection: Collection) => {
    setSelectedCollection(collection);
    setShowCollectionModal(true);
    setShowMenu(null);
  };

  const onSaveCollection = (collection: Collection) => {
    // Implementation would update the collection in state/backend
    setShowCollectionModal(false);
  };

  const handleAddRequest = (collectionId: string, folderId?: string) => {
    setSelectedCollectionForRequest(collectionId);
    setSelectedFolderForRequest(folderId || null);
    setShowRequestModal(true);
    setShowMenu(null);
  };

  const handleSaveRequest = (request: CollectionRequest) => {
    const collection = collectionList?.find(
      (c) => c.id === request.collectionId
    );
    if (!collection) return;

    // Implementation would update the request in state/backend
    setShowRequestModal(false);
  };

  const requestMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        requestMenuRef.current &&
        !requestMenuRef.current.contains(event.target as Node)
      ) {
        setShowMenu(null);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  return (
    <div className="w-64 h-full bg-card text-card-foreground border-r border-border flex flex-col">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Collections</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCollectionModal(true)}
              className="p-1 text-muted-foreground hover:text-foreground rounded-md hover:bg-accent/10"
              title="New Collection"
            >
              <Plus size={16} />
            </button>
            <button
              onClick={() => setShowImportModal(true)}
              className="p-1 text-muted-foreground hover:text-foreground rounded-md hover:bg-accent/10"
              title="Import Collection"
            >
              <Upload size={16} />
            </button>
          </div>
        </div>
      </div>

      <CollectionList
        showMenu={showMenu}
        handleAddRequest={handleAddRequest}
        handleRenameCollection={handleRenameCollection}
      />

      {showCollectionModal && (
        <CollectionModal
          isOpen={showCollectionModal}
          onClose={() => {
            setShowCollectionModal(false);
            setSelectedCollection(null);
          }}
          onSaveCollection={onSaveCollection}
          collection={selectedCollection || undefined}
        />
      )}

      {showRequestRenameModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card text-card-foreground rounded-lg shadow-lg w-full max-w-md border border-border">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-xl font-semibold">Rename Request</h2>
              <button
                onClick={() => {
                  setShowRequestRenameModal(false);
                }}
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
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md"
                  placeholder="Request name"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 p-4 border-t border-border">
              <button
                onClick={() => {
                  setShowRequestRenameModal(false);
                }}
                className="px-4 py-2 text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  renameRequest();
                }}
                disabled={!renameValue.trim()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
              >
                <Save size={16} />
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {showRequestModal && (
        <RequestModal
          isOpen={showRequestModal}
          onClose={() => setShowRequestModal(false)}
          onSave={handleSaveRequest}
          currentRequest={currentRequest}
          collectionId={selectedCollectionForRequest}
        />
      )}

      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
      />
    </div>
  );
};

export default CollectionsSidebar;
