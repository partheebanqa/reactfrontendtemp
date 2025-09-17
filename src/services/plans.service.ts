import { ENV } from "@/config/env";
import { apiRequest } from "@/lib/queryClient";




export const getAllPlans = async () => {
  const response = await apiRequest(
    'GET',
    `${ENV.API_BASE_URL}/plans`
  );
 
  if (!response.ok) {
    throw new Error('Failed to fetch test suite report');
  }
  return response.json();
};

