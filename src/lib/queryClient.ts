import { validateCSPCompliance } from "@/security/cspConfig";
import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { getEncryptedCookie } from "./cookieUtils";
import { USER_COOKIE_NAME } from "./constants";

async function throwIfResNotOk(res: Response) {
  console.log("🚀 ~ throwIfResNotOk ~ res:", res)
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

interface IRequestOptions {
  body?: any;
  headers?: Record<string, string>;
  requiresAuth?: boolean;
}

export async function apiRequest(
  method: string,
  url: string,
  options?: IRequestOptions
): Promise<Response> {
  
  // if (!validateCSPCompliance(url)) {
  //   throw new Error(
  //     `URL ${url} does not comply with Content Security Policy directives`
  //   );
  // }

  const cachedUserData = getEncryptedCookie(USER_COOKIE_NAME);
  console.log("🚀 ~ cachedUserData:", cachedUserData)
  if(cachedUserData && cachedUserData.token){
    options = {
      ...options,
      headers: {
        ...options?.headers,
        Authorization: `Bearer ${cachedUserData.token}`,
      },
    };
  }

  
  const res = await fetch(url,{
    body: options?.body ? JSON.stringify(options.body) : undefined,
    method,
    headers:{
      ...options?.headers,
    }
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey[0] as string;

    // if (!validateCSPCompliance(url)) {
    //   throw new Error(
    //     `URL ${url} does not comply with Content Security Policy directives`
    //   );
    // }

    const res = await fetch(url, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
