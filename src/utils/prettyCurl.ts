// utils/prettyCurl.ts
export const prettyCurl = (raw: string) => {
  if (!raw) return "";

  let s = raw.trim();

  // Ensure it starts with curl
  if (!/^curl\b/.test(s)) s = "curl " + s;

  // 1) Unquote -X 'METHOD'  ->  -X METHOD
  s = s.replace(/\s-X\s'([^']+)'/g, " \\\n  -X $1");

  // 2) Headers:  -H 'Header: value'  -> newline + double-quoted
  s = s.replace(/\s-H\s'([^']+)'/g, ' \\\n  -H "$1"');

  // 3) --data / -d blocks -> newline and try to pretty-print JSON
  s = s.replace(/\s(--data-raw|-d)\s'([^']+)'/g, (_m, flag, body) => {
    let pretty = body;
    try {
      const parsed = JSON.parse(body);
      pretty = JSON.stringify(parsed, null, 2);
    } catch {
      /* not JSON — leave as-is */
    }
    // keep single quotes for bash safety, escape any single quotes inside
    const safe = pretty.replace(/'/g, `'\\''`);
    return ` \\\n  ${flag} '${safe}'`;
  });

  // 4) URL at the end:  'https://...'
  s = s.replace(/\s'(https?:\/\/[^']+)'/g, ' \\\n  "$1"');

  // 5) Optional: mask Bearer tokens quickly (safe for demos/logs)
//   s = s.replace(/(Authorization:\s*Bearer\s+)[\w.-]+/i, "$1•••");

  // 6) Compact multiple spaces
  s = s.replace(/[ \t]+/g, " ");

  return s;
};
