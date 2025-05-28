export const formatJson = (json: any): string => {
  try {
    if (typeof json === 'string') {
      try {
        // Try to parse if it's a JSON string
        const parsed = JSON.parse(json);
        return JSON.stringify(parsed, null, 2);
      } catch (e) {
        // Return as is if it's not valid JSON
        return json;
      }
    }
    return JSON.stringify(json, null, 2);
  } catch (error) {
    console.error('Error formatting JSON:', error);
    return String(json);
  }
};