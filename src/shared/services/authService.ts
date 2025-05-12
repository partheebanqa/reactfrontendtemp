interface Credentials {
  email: string;
  password: string;
}

interface Register {
    firstName: string,
    lastName: string,
    organization: string,
    email: string,
    password: string,
}

const API_URL = "https://apibackenddev.onrender.com";

export const authService = {

  login: async (credentials: Credentials): Promise<any> => {
    try {
      const response = await fetch(`${API_URL}/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });
      const data = await response.json();
      localStorage.setItem("userDetails", JSON.stringify(data));
      return data;
    }
    catch (error: any) {
      throw error;
    }
  },

  register: async (register: Register): Promise<any> => {
    try {
      const response = await fetch(`${API_URL}/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(register),
      });
      const data = await response.json();
      return data;
    }
    catch (error: any) {
      throw error;
    }
  },
}