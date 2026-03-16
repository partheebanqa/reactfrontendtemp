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

/**
 * Tokenizes a curl command string into an array of tokens,
 * respecting single-quoted, double-quoted, and $'...' (ANSI-C) quoted strings.
 */
function tokenize(command: string): string[] {
  const tokens: string[] = [];
  let i = 0;

  while (i < command.length) {
    // Skip whitespace
    while (i < command.length && /\s/.test(command[i])) i++;
    if (i >= command.length) break;

    let token = '';

    // ANSI-C quoting: $'...'
    if (command[i] === '$' && command[i + 1] === "'") {
      i += 2; // skip $'
      while (i < command.length && command[i] !== "'") {
        if (command[i] === '\\') {
          i++;
          const escapes: Record<string, string> = {
            n: '\n',
            t: '\t',
            r: '\r',
            '\\': '\\',
            "'": "'",
            '"': '"',
          };
          token += escapes[command[i]] ?? command[i];
        } else {
          token += command[i];
        }
        i++;
      }
      i++; // skip closing '
    } else if (command[i] === "'") {
      // Single-quoted string — no escape processing
      i++;
      while (i < command.length && command[i] !== "'") {
        token += command[i++];
      }
      i++; // skip closing '
    } else if (command[i] === '"') {
      // Double-quoted string — handle backslash escapes
      i++;
      while (i < command.length && command[i] !== '"') {
        if (command[i] === '\\' && i + 1 < command.length) {
          i++;
          token += command[i];
        } else {
          token += command[i];
        }
        i++;
      }
      i++; // skip closing "
    } else {
      // Unquoted token
      while (i < command.length && !/\s/.test(command[i])) {
        token += command[i++];
      }
    }

    if (token.length > 0) tokens.push(token);
  }

  return tokens;
}

export function importCurlCommand(curlCommand: string): ParsedCurlRequest {
  // Normalize line continuations and collapse whitespace
  const cleanCommand = curlCommand.replace(/\\\r?\n/g, ' ').trim();

  const result: ParsedCurlRequest = {
    url: '',
    method: '',
    headers: [],
    bodyType: 'none',
    params: [],
  };

  const tokens = tokenize(cleanCommand);

  // Flags that consume the next token as their value
  const valuedFlags = new Set([
    '-H',
    '--header',
    '-d',
    '--data',
    '--data-raw',
    '--data-binary',
    '--data-urlencode',
    '-F',
    '--form',
    '-X',
    '--request',
    '-u',
    '--user',
    '-A',
    '--user-agent',
    '--url',
    '-e',
    '--referer',
    '-o',
    '--output',
    '--connect-timeout',
    '--max-time',
    '--proxy',
    '-x',
    '--cacert',
    '--cert',
    '--key',
  ]);

  let i = 1; // skip 'curl'

  while (i < tokens.length) {
    const tok = tokens[i];

    // ── Method ────────────────────────────────────────────────────────────
    if (tok === '-X' || tok === '--request') {
      result.method = (tokens[++i] ?? '').toUpperCase();

      // ── Headers ───────────────────────────────────────────────────────────
    } else if (tok === '-H' || tok === '--header') {
      const headerString = tokens[++i] ?? '';
      const colonIndex = headerString.indexOf(':');
      if (colonIndex > 0) {
        const key = headerString.substring(0, colonIndex).trim();
        const value = headerString.substring(colonIndex + 1).trim();

        if (key.toLowerCase() === 'authorization') {
          if (value.toLowerCase().startsWith('bearer ')) {
            result.auth = { type: 'bearer', token: value.substring(7).trim() };
          } else if (value.toLowerCase().startsWith('basic ')) {
            try {
              const decoded = atob(value.substring(6).trim());
              const colonIdx = decoded.indexOf(':');
              const username =
                colonIdx >= 0 ? decoded.substring(0, colonIdx) : decoded;
              const password =
                colonIdx >= 0 ? decoded.substring(colonIdx + 1) : '';
              result.auth = { type: 'basic', username, password };
            } catch {
              result.auth = { type: 'basic', username: '', password: '' };
            }
          } else {
            // Unknown auth scheme — preserve as a regular header
            result.headers.push({ key, value, enabled: true });
          }
        } else {
          result.headers.push({ key, value, enabled: true });
        }
      }

      // ── Basic Auth via -u / --user ─────────────────────────────────────
    } else if (tok === '-u' || tok === '--user') {
      const userString = tokens[++i] ?? '';
      const colonIdx = userString.indexOf(':');
      const username =
        colonIdx >= 0 ? userString.substring(0, colonIdx) : userString;
      const password = colonIdx >= 0 ? userString.substring(colonIdx + 1) : '';
      result.auth = { type: 'basic', username, password };

      // ── Body: --data / -d / --data-raw / --data-binary ─────────────────
    } else if (
      tok === '-d' ||
      tok === '--data' ||
      tok === '--data-raw' ||
      tok === '--data-binary'
    ) {
      const bodyData = tokens[++i] ?? '';
      result.body = bodyData;

      try {
        JSON.parse(bodyData);
        result.bodyType = 'json';
      } catch {
        // Check for application/x-www-form-urlencoded: key=value&key2=value2
        const formPattern = /^([^=&]+=[^=&]*)(&[^=&]+=[^=&]*)*$/;
        if (formPattern.test(bodyData.trim())) {
          result.bodyType = 'x-www-form-urlencoded';
        } else {
          result.bodyType = 'raw';
        }
      }

      if (!result.method) result.method = 'POST';

      // ── Body: --data-urlencode ─────────────────────────────────────────
    } else if (tok === '--data-urlencode') {
      const bodyData = tokens[++i] ?? '';
      // May be in "name=value" or "=value" or "name@file" format;
      // store as-is and mark as url-encoded form
      result.body = (result.body ? result.body + '&' : '') + bodyData;
      result.bodyType = 'x-www-form-urlencoded';
      if (!result.method) result.method = 'POST';

      // ── Form data: --form / -F ─────────────────────────────────────────
    } else if (tok === '-F' || tok === '--form') {
      const formField = tokens[++i] ?? '';
      if (formField.includes('=')) {
        result.body = (result.body ? result.body + '&' : '') + formField;
        result.bodyType = 'form-data';
        if (!result.method || result.method === 'GET') result.method = 'POST';
      }

      // ── User-Agent shorthand ───────────────────────────────────────────
    } else if (tok === '-A' || tok === '--user-agent') {
      const ua = tokens[++i] ?? '';
      result.headers.push({ key: 'User-Agent', value: ua, enabled: true });

      // ── URL via --url flag ─────────────────────────────────────────────
    } else if (tok === '--url') {
      const rawUrl = tokens[++i] ?? '';
      if (!result.url && rawUrl) {
        try {
          const urlObj = new URL(rawUrl);
          result.url = `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;
          urlObj.searchParams.forEach((value, key) => {
            result.params.push({ key, value, enabled: true });
          });
        } catch {
          result.url = rawUrl;
        }
      }

      // ── Skip other valued flags without processing ─────────────────────
    } else if (valuedFlags.has(tok)) {
      i++; // skip flag value

      // ── Boolean flags (no value) ───────────────────────────────────────
    } else if (tok.startsWith('-')) {
      // e.g. --compressed, --insecure, -L, -v, -s, etc.
      // Compact flags like -Lv don't have a separate value token — skip them.
      // ── URL ────────────────────────────────────────────────────────────
    } else {
      // Anything that's not a flag is the URL
      if (!result.url) {
        const rawUrl = tok;
        try {
          const urlObj = new URL(rawUrl);
          result.url = `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;
          urlObj.searchParams.forEach((value, key) => {
            result.params.push({ key, value, enabled: true });
          });
        } catch {
          result.url = rawUrl;
        }
      }
    }

    i++;
  }

  // ── Infer Content-Type header for body types if not already set ────────
  if (result.body && result.bodyType !== 'none') {
    const hasContentType = result.headers.some(
      (h) => h.key.toLowerCase() === 'content-type',
    );
    if (!hasContentType) {
      const contentTypeMap: Record<string, string> = {
        json: 'application/json',
        'x-www-form-urlencoded': 'application/x-www-form-urlencoded',
        'form-data': 'multipart/form-data',
      };
      const ct = contentTypeMap[result.bodyType];
      if (ct) {
        result.headers.push({ key: 'Content-Type', value: ct, enabled: true });
      }
    }
  }

  // ── Default method ─────────────────────────────────────────────────────
  if (!result.method) {
    result.method = 'GET';
  }

  return result;
}
