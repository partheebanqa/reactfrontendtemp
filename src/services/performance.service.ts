import {
  API_PERFORMANCE,
  API_PERFORMANCE_REQUESTS,
  API_PERFORMANCE_TEST,
} from "@/config/apiRoutes";
import { apiRequest } from "@/lib/queryClient";
import {
  PerformanceRunApi,
  PerformanceRunDTO,
  PerformanceRunResultApi,
  PerformanceRunResultDTO,
  PerformanceRunResultsResponse,
  PerformanceTestConfigApi,
  PerformanceTestConfigDTO,
  PerformanceTestCreatePayload,
  PerformanceTestCreateResponseApi,
  PerformanceTestUpdatePayload,
} from "@/models/performanceTest.model";
import {
  mapPerformanceRun,
  mapPerformanceRunResult,
  mapPerformanceRunSummary,
} from "@/utils/mapPerformanceRun";

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
): Promise<PerformanceTestConfigApi> => {
  const response = await apiRequest(
    "GET",
    `${API_PERFORMANCE_TEST}/config/${id}`,
    {
      headers: { "Content-Type": "application/json" },
    },
  );

  if (!response.ok) {
    let errMsg = "Failed to fetch performance test config";
    try {
      const errData = await response.json();
      errMsg = errData?.message || errData?.error || errMsg;
    } catch {}
    throw new Error(errMsg);
  }

  return (await response.json()) as PerformanceTestConfigApi;
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
): Promise<PerformanceTestConfigApi[]> => {
  const res = await apiRequest(
    "GET",
    `${API_PERFORMANCE_REQUESTS}/request/${requestId}`,
    { headers: { "Content-Type": "application/json" } },
  );

  // console.log(res, "res");

  if (!res.ok) {
    let msg = "Failed to fetch performance configs";
    try {
      const err = await res.json();
      msg = err?.message || err?.error || msg;
    } catch {}
    throw new Error(msg);
  }

  const data = (await res.json()) as PerformanceTestConfigApi[];
  return Array.isArray(data) ? data : [];
};

export const deletePerformanceTestConfig = async (
  id: string,
): Promise<{ message?: string }> => {
  const response = await apiRequest("DELETE", `${API_PERFORMANCE}/${id}`, {
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    let errMsg = "Failed to delete performance test config";
    try {
      const errData = await response.json();
      errMsg = errData?.message || errData?.error || errMsg;
    } catch {}
    throw new Error(errMsg);
  }

  // some DELETE APIs return empty body
  try {
    return (await response.json()) as { message?: string };
  } catch {
    return { message: "Deleted" };
  }
};

export const executePerformanceTest = async (payload: {
  configId: string;
}): Promise<any> => {
  const response = await apiRequest("POST", `${API_PERFORMANCE_TEST}/execute`, {
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errMsg = "Failed to execute performance test";
    try {
      const errData = await response.json();
      errMsg = errData?.message || errData?.error || errMsg;
    } catch {}
    throw new Error(errMsg);
  }

  // execute api might return jobId / executionId / details
  try {
    return await response.json();
  } catch {
    return { ok: true };
  }
};

// export const getPerformanceRunByExecutionId = async (
//   executionId: string,
// ): Promise<PerformanceRunDTO> => {
//   const response = await apiRequest(
//     "GET",
//     `${API_PERFORMANCE_TEST}/runs/${executionId}`,
//     {
//       headers: { "Content-Type": "application/json" },
//     },
//   );

//   if (!response.ok) {
//     let errMsg = "Failed to fetch run details";
//     try {
//       const errData = await response.json();
//       errMsg = errData?.message || errData?.error || errMsg;
//     } catch {}
//     throw new Error(errMsg);
//   }

//   return await response.json();
// };

export const getPerformanceRunByExecutionId = async (
  executionId: string,
): Promise<PerformanceRunDTO> => {
  const response = await apiRequest(
    "GET",
    `${API_PERFORMANCE_TEST}/runs/${executionId}`,
    {
      headers: { "Content-Type": "application/json" },
    },
  );

  if (!response.ok) {
    let errMsg = "Failed to fetch run details";
    try {
      const errData = await response.json();
      errMsg = errData?.message || errData?.error || errMsg;
    } catch {}
    throw new Error(errMsg);
  }

  const data = (await response.json()) as PerformanceRunApi;

  return mapPerformanceRun(data);
};

export const getPerformanceRunResults = async (
  executionId: string,
): Promise<PerformanceRunResultsResponse> => {
  const response = await apiRequest(
    "GET",
    `${API_PERFORMANCE_TEST}/runs/${executionId}/results`,
    {
      headers: { "Content-Type": "application/json" },
    },
  );

  if (!response.ok) {
    let errMsg = "Failed to fetch run results";
    try {
      const errData = await response.json();
      errMsg = errData?.message || errData?.error || errMsg;
    } catch {}
    throw new Error(errMsg);
  }

  const data = await response.json();

  console.log("Raw Run Results:", data);

  return {
    summary: mapPerformanceRunSummary(data.summary),
    results: data.results.map(mapPerformanceRunResult),
  };
};
