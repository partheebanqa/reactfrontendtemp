import { v4 as uuidv4 } from 'uuid';

export interface ParsedCurlRequest {
  url: string;
  method: string;
  headers: Array<{ key: string; value: string; enabled: boolean }>;
  body?: string;
  bodyType: 'none' | 'json' | 'form-data' | 'x-www-form-urlencoded' | 'raw';
  auth?: {
    type: 'bearer' | 'basic' | 'none';
    token?: string;
    username?: string;
    password?: string;
  };
  params: Array<{ key: string; value: string; enabled: boolean }>;
}

export function importCurlCommand(curlCommand: string): ParsedCurlRequest {
  // Clean up the curl command
  const cleanCommand = curlCommand
    .replace(/\\\s*\n/g, ' ') // Remove line breaks with backslashes
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();

  // Initialize the result
  const result: ParsedCurlRequest = {
    url: '',
    method: 'GET',
    headers: [],
    bodyType: 'none',
    params: [],
  };

  // Extract URL (first argument after curl)
  const urlMatch = cleanCommand.match(
    /curl\s+(?:-[^\s]+\s+)*'([^']+)'|curl\s+(?:-[^\s]+\s+)*"([^"]+)"|curl\s+(?:-[^\s]+\s+)*([^\s]+)/
  );
  if (urlMatch) {
    const url = urlMatch[1] || urlMatch[2] || urlMatch[3];

    // Parse URL and extract query parameters
    try {
      const urlObj = new URL(url);
      result.url = `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;

      // Extract query parameters
      urlObj.searchParams.forEach((value, key) => {
        result.params.push({
          key,
          value,
          enabled: true,
        });
      });
    } catch (e) {
      result.url = url;
    }
  }

  // Extract method (-X or --request)
  const methodMatch = cleanCommand.match(/(?:-X|--request)\s+([A-Z]+)/);
  if (methodMatch) {
    result.method = methodMatch[1];
  }

  // Extract headers (-H or --header)
  const headerMatches = cleanCommand.matchAll(
    /(?:-H|--header)\s+['"]([^'"]+)['"]/g
  );
  for (const match of headerMatches) {
    const headerString = match[1];
    const colonIndex = headerString.indexOf(':');
    if (colonIndex > 0) {
      const key = headerString.substring(0, colonIndex).trim();
      const value = headerString.substring(colonIndex + 1).trim();

      // Check for authorization header
      if (key.toLowerCase() === 'authorization') {
        if (value.toLowerCase().startsWith('bearer ')) {
          result.auth = {
            type: 'bearer',
            token: value.substring(7).trim(),
          };
        } else if (value.toLowerCase().startsWith('basic ')) {
          // Decode basic auth if needed
          try {
            const credentials = atob(value.substring(6).trim());
            const [username, password] = credentials.split(':');
            result.auth = {
              type: 'basic',
              username: username || '',
              password: password || '',
            };
          } catch (e) {
            result.auth = {
              type: 'basic',
              username: '',
              password: '',
            };
          }
        }
      } else {
        result.headers.push({
          key,
          value,
          enabled: true,
        });
      }
    }
  }

  // Extract data/body (--data, --data-raw, --data-binary, -d)
  const dataMatches = [
    cleanCommand.match(
      /(?:--data|--data-raw|--data-binary|-d)\s+['"]([^'"]*)['"]/
    ),
    cleanCommand.match(
      /(?:--data|--data-raw|--data-binary|-d)\s+([^-\s][^\s]*)/
    ),
  ];

  for (const dataMatch of dataMatches) {
    if (dataMatch) {
      const bodyData = dataMatch[1];
      if (bodyData) {
        result.body = bodyData;

        // Determine body type based on content
        try {
          JSON.parse(bodyData);
          result.bodyType = 'json';
        } catch (e) {
          // Check if it looks like form data
          if (bodyData.includes('=') && bodyData.includes('&')) {
            result.bodyType = 'x-www-form-urlencoded';
          } else {
            result.bodyType = 'raw';
          }
        }

        // Set method to POST if not explicitly set and body exists
        if (result.method === 'GET') {
          result.method = 'POST';
        }

        break;
      }
    }
  }

  // Extract form data (--form or -F)
  const formMatches = cleanCommand.matchAll(
    /(?:--form|-F)\s+['"]([^'"]+)['"]/g
  );
  const formFields = [];
  for (const match of formMatches) {
    const formField = match[1];
    if (formField.includes('=')) {
      const [key, value] = formField.split('=', 2);
      formFields.push(`${key}=${value}`);
    }
  }

  if (formFields.length > 0) {
    result.body = formFields.join('&');
    result.bodyType = 'form-data';
    if (result.method === 'GET') {
      result.method = 'POST';
    }
  }

  return result;
}