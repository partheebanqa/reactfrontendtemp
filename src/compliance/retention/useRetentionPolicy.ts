import { useQuery } from "@tanstack/react-query";
import { RETENTION_POLICIES, getRetentionPolicy, shouldDeleteData } from "./retentionConfig";

export const useRetentionPolicy = (dataType?: string) => {
  const { data: policies } = useQuery({
    queryKey: ["/api/retention/policies"],
    initialData: RETENTION_POLICIES,
  });

  const getPolicy = (type: string) => getRetentionPolicy(type);
  const checkDataExpiry = (type: string, date: Date) => shouldDeleteData(type, date);

  return {
    policies,
    getPolicy,
    checkDataExpiry,
    selectedPolicy: dataType ? getPolicy(dataType) : undefined,
  };
};