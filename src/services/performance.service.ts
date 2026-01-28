import { API_PERFORMANCE, API_PERFORMANCE_REQUESTS } from "@/config/apiRoutes";
import { apiRequest } from "@/lib/queryClient";
import {
  PerformanceTestConfigDTO,
  PerformanceTestCreatePayload,
  PerformanceTestCreateResponseApi,
  PerformanceTestUpdatePayload,
} from "@/models/performanceTest.model";

export const performanceTestCreate = async (
  payload: PerformanceTestCreatePayload,
): Promise<PerformanceTestCreateResponseApi> => {
  const response = await apiRequest("POST", API_PERFORMANCE, {
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errMsg = "Failed to create performance test";
    try {
      const errData = await response.json();
      errMsg = errData?.message || errData?.error || errMsg;
    } catch {}
    throw new Error(errMsg);
  }

  return response.json();
};

export const getPerformanceTestConfig = async (
  id: string,
): Promise<PerformanceTestCreateResponseApi> => {
  const response = await apiRequest("GET", `${API_PERFORMANCE}/${id}`, {
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    let errMsg = "Failed to fetch performance test config";
    try {
      const errData = await response.json();
      errMsg = errData?.message || errData?.error || errMsg;
    } catch {}
    throw new Error(errMsg);
  }

  return (await response.json()) as PerformanceTestCreateResponseApi;
};

export const updatePerformanceTestConfig = async (
  id: string,
  payload: PerformanceTestUpdatePayload,
) => {
  const response = await apiRequest("PUT", `${API_PERFORMANCE}/${id}`, {
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let msg = "Failed to update performance test config";
    try {
      const err = await response.json();
      msg = err?.message || err?.error || msg;
    } catch {}
    throw new Error(msg);
  }

  return response.json();
};

export const getPerformanceConfigsByRequestId = async (
  requestId: string,
): Promise<PerformanceTestConfigDTO[]> => {
  const res = await apiRequest(
    "GET",
    `${API_PERFORMANCE_REQUESTS}/request/${requestId}`,
    { headers: { "Content-Type": "application/json" } },
  );

  if (!res.ok) {
    let msg = "Failed to fetch performance configs";
    try {
      const err = await res.json();
      msg = err?.message || err?.error || msg;
    } catch {}
    throw new Error(msg);
  }

  const data = (await res.json()) as PerformanceTestConfigDTO[];
  return Array.isArray(data) ? data : [];
};
