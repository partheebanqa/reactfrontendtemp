// Example of using CSP validation with API calls
import { secureFetch } from '@/security/cspUtils';

export async function fetchUserData(userId: string) {
  try {
    // This will automatically validate the URL against CSP directives
    const response = await secureFetch(`https://api.github.com/users/${userId}`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching user data:', error);
    throw error;
  }
}
