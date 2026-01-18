// services/pilotProgram.service.ts

import { API_URL } from "@/config/apiRoutes";

export interface PilotProgramPayload {
  name: string;
  email: string;
  role: string;
  phone: string;
  challenges: string;
}

export async function submitPilotProgram(payload: PilotProgramPayload) {
  const response = await fetch(`${API_URL}/pilot-program`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw error;
  }

  return response.json();
}
