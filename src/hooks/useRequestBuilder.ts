import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  addCollection,
  fetchCollectionList,
  getCollectionRequests
} from "@/service/request-builder.service";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useState, useEffect } from "react";
import { Collection, CollectionRequest } from "@/shared/types/collection";
import { useToast } from "@/hooks/use-toast";

export function useRequestBuilder() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Try to get the workspace context, handle if not available
  let workspaceContext;
  try {
    workspaceContext = useWorkspace();
  } catch (error) {
    console.error("WorkspaceContext not available:", error);
    workspaceContext = { currentWorkspace: null };
  }

  const { currentWorkspace } = workspaceContext;

  const [activeRequest, setActiveRequest] = useState<CollectionRequest>({
    id: "",
    collectionId: "",
    description: "",
    name: "",
    order: 0,
    method: "GET",
    url: "",
    bodyType: "none",
    bodyFormData: null,
    bodyRawContent: "",
    authorizationType: "none",
    authorization: {},
    headers: [],
    params: [],
    variables: {},
    createdBy: "",
    createdAt: "",
    updatedAt: ""
  });
  const [collectionList, setCollectionList] = useState<Collection[]>([]);

  const {
    data: collectionsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/collections", currentWorkspace?.id],
    retry: false,
    queryFn: () =>
      currentWorkspace?.id
        ? fetchCollectionList(currentWorkspace.id)
        : Promise.resolve({ collections: [] }),
    refetchInterval: false,
    staleTime: Infinity,
    enabled: !!currentWorkspace?.id, // Only run the query if workspace ID exists
  });

  useEffect(() => {
    if (collectionsData?.collections) {
      setCollectionList(collectionsData.collections);
    } else {
      setCollectionList([]);
    }
  }, [collectionsData]);

  const addCollectionMutation = useMutation({
    mutationFn: (collectionData: any) => {
      console.log("🚀 ~ useRequestBuilder ~ collectionData:", collectionData)
      if (!currentWorkspace?.id) {
        return Promise.reject(new Error("No workspace selected"));
      }
      return addCollection({
        ...collectionData,
        workspaceId: currentWorkspace.id,
      });
    },
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({
        queryKey: ["/collections", currentWorkspace?.id],
      });
      queryClient.setQueryData(
        ["/collections", currentWorkspace?.id],
        (oldData: any) => {
          return {
            ...oldData,
            data: [...(oldData?.data || []), response.data],
          };
        }
      );
    },
  });

  const fetchCollectionRequestsMutation = useMutation({
    mutationFn: async (collectionId: string) => {
      return getCollectionRequests(collectionId);
    },
    onSuccess: (requests, collectionId) => {
      console.log("🚀 ~ useRequestBuilder ~ requests:", requests);
      queryClient.setQueryData(
        ["/collections", currentWorkspace?.id],
        (oldData: any) => {
          console.log("🚀 ~ useRequestBuilder ~ oldData:", oldData);
          if (!oldData?.collections) return oldData;

          return {
            ...oldData,
            collections: oldData.collections.map((collection: Collection) => {
              console.log(
                "🚀 ~ collections:oldData.collections.map ~ collection:",
                collection
              );
              if (collection.id === collectionId) {
                return {
                  ...collection,
                  requests: requests,
                  hasFetchedRequests: true,
                };
              }
              return collection;
            }),
          };
        }
      );
    },
  });

  const saveEndpointMutation = useMutation({
    mutationFn: async (endpointData: any) => {
      const projectId = currentWorkspace?.id;

      return await apiRequest("POST", "/api/endpoints", {
        ...endpointData,
        projectId,
      });
    },
    onSuccess: () => {
      toast({
        title: "Endpoint saved",
        description: "Your API endpoint has been saved successfully",
      });
    },
  });

  return {
    collectionList: collectionList || [],
    collectionListLoading: isLoading,
    addCollection: addCollectionMutation.mutateAsync,
    activeRequest,
    fetchCollectionRequests: fetchCollectionRequestsMutation.mutateAsync,
    setActiveRequest,
    setCollectionList,
  };
}
