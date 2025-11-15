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
  const cleanCommand = curlCommand
    .replace(/\\\s*\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const result: ParsedCurlRequest = {
    url: '',
    method: 'GET',
    headers: [],
    bodyType: 'none',
    params: [],
  };

  const urlMatch = cleanCommand.match(
    /curl\s+(?:-[^\s]+\s+)*'([^']+)'|curl\s+(?:-[^\s]+\s+)*"([^"]+)"|curl\s+(?:-[^\s]+\s+)*([^\s]+)/
  );
  if (urlMatch) {
    const url = urlMatch[1] || urlMatch[2] || urlMatch[3];
    try {
      const urlObj = new URL(url);
      result.url = `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;

      urlObj.searchParams.forEach((value, key) => {
        result.params.push({
          key,
          value,
          enabled: true,
        });
      });
    } catch {
      result.url = url;
    }
  }

  const methodMatch = cleanCommand.match(/(?:-X|--request)\s+([A-Z]+)/);
  if (methodMatch) {
    result.method = methodMatch[1];
  }

  const headerMatches = cleanCommand.matchAll(
    /(?:-H|--header)\s+(["'])(.*?)\1/g
  );
  for (const match of headerMatches) {
    const headerString = match[2];
    const colonIndex = headerString.indexOf(':');
    if (colonIndex > 0) {
      const key = headerString.substring(0, colonIndex).trim();
      const value = headerString.substring(colonIndex + 1).trim();

      if (key.toLowerCase() === 'authorization') {
        if (value.toLowerCase().startsWith('bearer ')) {
          result.auth = {
            type: 'bearer',
            token: value.substring(7).trim(),
          };
        } else if (value.toLowerCase().startsWith('basic ')) {
          try {
            const credentials = atob(value.substring(6).trim());
            const [username, password] = credentials.split(':');
            result.auth = {
              type: 'basic',
              username: username || '',
              password: password || '',
            };
          } catch {
            result.auth = { type: 'basic', username: '', password: '' };
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

  const bodyMatch = cleanCommand.match(
    /(?:--data|--data-raw|--data-binary|-d)\s+(["'])([\s\S]*?)\1/
  );

  if (bodyMatch) {
    const bodyData = bodyMatch[2];
    if (bodyData) {
      result.body = bodyData;

      try {
        JSON.parse(bodyData);
        result.bodyType = 'json';
      } catch {
        if (bodyData.includes('=') && bodyData.includes('&')) {
          result.bodyType = 'x-www-form-urlencoded';
        } else {
          result.bodyType = 'raw';
        }
      }

      if (result.method === 'GET') {
        result.method = 'POST';
      }
    }
  }

  const formMatches = cleanCommand.matchAll(/(?:--form|-F)\s+(["'])(.*?)\1/g);
  const formFields = [];
  for (const match of formMatches) {
    if (match[2].includes('=')) {
      const [key, value] = match[2].split('=', 2);
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
