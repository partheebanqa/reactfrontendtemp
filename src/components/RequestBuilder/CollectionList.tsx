import React, { useEffect, useRef, useState } from "react";
import {
  Plus,
  MoreVertical,
  Upload,
  FolderTree,
  Trash2,
  Edit,
  Move,
  StarIcon,
  Star,
  MoveRight,
  ChevronLeft,
  ChevronRight,
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

interface CollectionListProps {
  showMenu?: string | null;
    handleAddRequest: (collectionId: string) => void;
    handleRenameCollection: (collection: Collection) => void;
}

export const CollectionList = ({handleAddRequest, handleRenameCollection} : CollectionListProps) => {
  const { collectionList, fetchCollectionRequests } = useRequestBuilder();
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>();
  const [showRequestMenu, setShowRequestMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [showMenu, setShowMenu] = useState<string | null>(null);
  const [activeSubMenu, setActiveSubMenu] = useState<string | null>(null);

  const toggleCollection = (collectionId: string) => {
    setExpandedCollections((prev) => {
      const next = new Set(prev);
      if (next.has(collectionId)) {
        next.delete(collectionId);
      } else {
        next.add(collectionId);
      }
      return next;
    });

    const targetCollection = collectionList?.find(
      (col) => col.id === collectionId
    );
    console.log("🚀 ~ toggleCollection ~ targetCollection:", targetCollection)

    if (targetCollection?.hasFetchedRequests) {
      return;
    }
    console.log("🚀 ~ fetchCollectionRequests ~ collectionId11:", collectionId);
    fetchCollectionRequests(collectionId).catch((error) => {
      console.error("Failed to fetch requests for collection:", error);
    });
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowRequestMenu(null);
      }
    };

    if (showRequestMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showRequestMenu]);

  return (
    <div className="flex-1 p-2">
      {collectionList?.map((collection) => (
        <div key={collection.id} className="mb-2">
          <div className="flex items-center group hover:bg-gray-100">
            <button
              onClick={() => toggleCollection(collection.id)}
              className="p-1 text-gray-500"
            >
              <FolderTree size={16} />
            </button>
            <button
              className="flex-1 px-2 py-1 text-sm text-left rounded"
              onClick={() => toggleCollection(collection.id)}
            >
              {collection.name}
            </button>
            <div className="relative">
              <button className="text-gray-400 hover:text-gray-600">
                <Star
                  size={16}
                  fill={collection.isImportant ? "currentColor" : "none"}
                />
              </button>
              <button
                onClick={() =>
                  setShowRequestMenu(
                    showRequestMenu === collection.id ? null : collection.id
                  )
                }
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <MoreVertical size={16} />
              </button>
              {showRequestMenu === collection.id && (
                <div
                  className="absolute mt-1 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200"
                  ref={menuRef}
                >
                  <div className="p-1">
                    <button
                      onClick={() => handleAddRequest(collection.id)}
                      className="w-full px-4 py-2 text-sm text-left text-gray-70 flex items-center gap-2"
                    >
                      {/* <Plus size={14} /> */}
                      Add Request
                    </button>
                    <button className="w-full px-4 py-2 text-sm text-left text-gray-700 flex items-center gap-2">
                      Add folder
                    </button>
                    <hr />
                    <button className="w-full px-4 py-2 text-sm text-left text-gray-700 flex items-center gap-2">
                      Share
                    </button>
                    <button className="w-full px-4 py-2 text-sm text-left text-gray-700 flex items-center gap-2">
                      Move
                    </button>
                    <hr />
                    <button
                      onClick={() => handleRenameCollection(collection)}
                      className="w-full px-4 py-2 text-sm text-left text-gray-700 flex items-center gap-2"
                    >
                      Rename
                    </button>
                    <button className="w-full px-4 py-2 text-sm text-left text-gray-700 flex items-center gap-2">
                      Duplicate
                    </button>
                    <button
                      onMouseDown={(e) => e.stopPropagation()} // prevent menu from closing early
                      onClick={() => {
                        onCollectionDelete(collection.id);
                        setShowMenu(null);
                        setActiveSubMenu(null);
                      }}
                      className="w-full px-4 py-2 text-sm text-left text-red-600 flex items-center gap-2"
                    >
                      Delete
                    </button>
                    <hr />
                    <div className="flex relative group">
                      <button
                        onClick={() =>
                          setActiveSubMenu(
                            activeSubMenu === collection.id
                              ? null
                              : collection.id
                          )
                        }
                        className="w-full px-4 py-2 text-sm text-left text-gray-700 flex items-center gap-2"
                      >
                        More
                        <ChevronRight size={16} className="ml-auto mt-[2px]" />
                      </button>

                      {activeSubMenu === collection.id && (
                        <div className="absolute left-full top-0 ml-1 w-40 bg-white border border-gray-200 rounded-md shadow z-20 p-2">
                          <button className="w-full px-4 py-2 text-sm text-left text-gray-70">
                            Generate Test
                          </button>
                          <hr />
                          <button className="w-full px-4 py-2 text-sm text-left text-gray-70">
                            Export
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {expandedCollections?.has(collection.id) &&
            collection?.requests?.length > 0 && (
              <div className="ml-4 mt-1 space-y-1">
                {collection.requests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center group hover:bg-gray-100"
                  >
                    <button
                      onClick={() => onRequestSelect(request)}
                      className={`text-sm text-left
                        ${
                          request.method === "GET"
                            ? "text-blue-600"
                            : request.method === "POST" ||
                              request.method === "PUT"
                            ? "text-yellow-600"
                            : request.method === "DELETE"
                            ? "text-red-600"
                            : "text-gray-700"
                        }`}
                    >
                      {request.method}
                    </button>
                    <button
                      onClick={() => onRequestSelect(request)}
                      className="flex-1 px-2 py-1 text-sm text-left rounded"
                    >
                      {request.name}
                    </button>
                    <div className="relative">
                      <button
                        onClick={() => setShowMenu(`request-${request.id}`)}
                        className="p-1 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100"
                      >
                        <MoreVertical size={16} />
                      </button>
                      {showMenu === `request-${request.id}` && (
                        <div
                          className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200"
                          ref={requestMenuRef}
                        >
                          <div className="py-1">
                            {/* Add this Rename button */}
                            <button
                              onClick={() => {
                                setRenameValue(request.name);
                                setShowRequestRenameModal(true);
                                setShowMenu(null);
                                setRequestId(request.id);
                              }}
                              className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                            >
                              Rename
                            </button>
                            <button
                              disabled={isSubmitting}
                              onClick={() => {
                                duplicateRequest(collection.id, request.id);
                              }}
                              className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                            >
                              Duplicate
                            </button>
                            <button
                              onClick={() => {
                                deleteRequest(collection.id, request.id);
                              }}
                              className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>
      ))}
    </div>
  );
};
