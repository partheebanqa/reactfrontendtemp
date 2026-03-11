import { useState, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import * as Tabs from "@radix-ui/react-tabs";
import * as Tooltip from "@radix-ui/react-tooltip";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CurlHeader {
    key: string;
    value: string;
    enabled: boolean;
}

interface CurlParam {
    key: string;
    value: string;
    enabled: boolean;
}

interface ParsedCurl {
    url: string;
    method: string;
    headers: CurlHeader[];
    params: CurlParam[];
    body?: string;
    bodyType: "none" | "json" | "form-data" | "x-www-form-urlencoded" | "raw";
    auth?: {
        type: "bearer" | "basic" | "none";
        token?: string;
        username?: string;
        password?: string;
    };
}

interface ExecutionResult {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: string;
    duration: number;
    size: string;
    timestamp: string;
    url: string;
    method: string;
    error?: string;
}

interface HistoryItem extends ExecutionResult {
    id: string;
    curlSnapshot: string;
}

// ─── Tokenizer ────────────────────────────────────────────────────────────────
// Handles: 'single quotes', "double quotes", $'ANSI-C quotes', unquoted tokens
// and backslash-newline continuations.

function tokenize(command: string): string[] {
    const tokens: string[] = [];
    let i = 0;

    while (i < command.length) {
        // skip whitespace
        while (i < command.length && /\s/.test(command[i])) i++;
        if (i >= command.length) break;

        let token = "";

        if (command[i] === "$" && command[i + 1] === "'") {
            // ANSI-C quoting: $'...' with backslash escapes
            i += 2;
            while (i < command.length && command[i] !== "'") {
                if (command[i] === "\\") {
                    i++;
                    const esc: Record<string, string> = {
                        n: "\n", t: "\t", r: "\r",
                        "\\": "\\", "'": "'", '"': '"', "0": "\0",
                    };
                    token += esc[command[i]] ?? command[i];
                } else {
                    token += command[i];
                }
                i++;
            }
            i++; // closing '
        } else if (command[i] === "'") {
            // Single-quoted: no escape processing at all
            i++;
            while (i < command.length && command[i] !== "'") token += command[i++];
            i++; // closing '
        } else if (command[i] === '"') {
            // Double-quoted: only backslash + the next char is treated as escape
            i++;
            while (i < command.length && command[i] !== '"') {
                if (command[i] === "\\" && i + 1 < command.length) {
                    i++;
                    token += command[i];
                } else {
                    token += command[i];
                }
                i++;
            }
            i++; // closing "
        } else {
            // Unquoted token — stop at whitespace
            while (i < command.length && !/\s/.test(command[i])) {
                token += command[i++];
            }
        }

        if (token.length > 0) tokens.push(token);
    }

    return tokens;
}

// ─── Parser ───────────────────────────────────────────────────────────────────

function parseCurl(curlCommand: string): ParsedCurl {
    // Normalise line continuations (\<newline>) then collapse runs of whitespace
    const clean = curlCommand
        .replace(/\\\r?\n/g, " ")
        .trim();

    const tokens = tokenize(clean);

    const result: ParsedCurl = {
        url: "",
        method: "",
        headers: [],
        params: [],
        bodyType: "none",
    };

    // Flags that always consume the very next token as their value
    const valuedFlags = new Set([
        "-H", "--header",
        "-d", "--data", "--data-raw", "--data-binary", "--data-urlencode",
        "-F", "--form",
        "-X", "--request",
        "-u", "--user",
        "-A", "--user-agent",
        "--url",
        "-e", "--referer",
        "-o", "--output",
        "--connect-timeout", "--max-time",
        "--proxy", "-x",
        "--cacert", "--cert", "--key",
        "--limit-rate",
    ]);

    let i = 1; // skip "curl" token

    while (i < tokens.length) {
        const tok = tokens[i];

        // ── Explicit method ──────────────────────────────────────────────────────
        if (tok === "-X" || tok === "--request") {
            result.method = (tokens[++i] ?? "").toUpperCase();

            // ── Headers ──────────────────────────────────────────────────────────────
        } else if (tok === "-H" || tok === "--header") {
            const hdr = tokens[++i] ?? "";
            const ci = hdr.indexOf(":");
            if (ci > 0) {
                const key = hdr.substring(0, ci).trim();
                const value = hdr.substring(ci + 1).trim();

                if (key.toLowerCase() === "authorization") {
                    if (value.toLowerCase().startsWith("bearer ")) {
                        result.auth = { type: "bearer", token: value.substring(7).trim() };
                    } else if (value.toLowerCase().startsWith("basic ")) {
                        try {
                            const decoded = atob(value.substring(6).trim());
                            const di = decoded.indexOf(":");
                            result.auth = {
                                type: "basic",
                                username: di >= 0 ? decoded.substring(0, di) : decoded,
                                password: di >= 0 ? decoded.substring(di + 1) : "",
                            };
                        } catch {
                            result.auth = { type: "basic", username: "", password: "" };
                        }
                    } else {
                        // Unknown auth scheme — keep as a plain header
                        result.headers.push({ key, value, enabled: true });
                    }
                } else {
                    result.headers.push({ key, value, enabled: true });
                }
            }

            // ── Basic auth via -u / --user ────────────────────────────────────────
        } else if (tok === "-u" || tok === "--user") {
            const u = tokens[++i] ?? "";
            const di = u.indexOf(":");
            result.auth = {
                type: "basic",
                username: di >= 0 ? u.substring(0, di) : u,
                password: di >= 0 ? u.substring(di + 1) : "",
            };

            // ── Body: -d / --data / --data-raw / --data-binary ────────────────────
        } else if (
            tok === "-d" || tok === "--data" ||
            tok === "--data-raw" || tok === "--data-binary"
        ) {
            const body = tokens[++i] ?? "";
            // Concatenate multiple -d flags with &
            result.body = result.body ? result.body + "&" + body : body;

            try {
                JSON.parse(result.body);
                result.bodyType = "json";
            } catch {
                result.bodyType = /^([^=&]+=[^=&]*)(&[^=&]+=[^=&]*)*$/.test(result.body.trim())
                    ? "x-www-form-urlencoded"
                    : "raw";
            }
            if (!result.method) result.method = "POST";

            // ── Body: --data-urlencode ────────────────────────────────────────────
        } else if (tok === "--data-urlencode") {
            const part = tokens[++i] ?? "";
            result.body = result.body ? result.body + "&" + part : part;
            result.bodyType = "x-www-form-urlencoded";
            if (!result.method) result.method = "POST";

            // ── Form data: -F / --form ────────────────────────────────────────────
        } else if (tok === "-F" || tok === "--form") {
            const field = tokens[++i] ?? "";
            if (field.includes("=")) {
                result.body = result.body ? result.body + "&" + field : field;
                result.bodyType = "form-data";
                if (!result.method || result.method === "GET") result.method = "POST";
            }

            // ── User-Agent shorthand ──────────────────────────────────────────────
        } else if (tok === "-A" || tok === "--user-agent") {
            result.headers.push({
                key: "User-Agent",
                value: tokens[++i] ?? "",
                enabled: true,
            });

            // ── Explicit --url flag ───────────────────────────────────────────────
        } else if (tok === "--url") {
            const rawUrl = tokens[++i] ?? "";
            if (!result.url) setUrl(result, rawUrl);

            // ── Compound short flags like -Lsv, -vk — no value token consumed ─────
        } else if (/^-[a-zA-Z]{2,}$/.test(tok) && !valuedFlags.has(tok)) {
            // boolean-only compound flag, skip

            // ── Other valued flags we recognise but don't process ─────────────────
        } else if (valuedFlags.has(tok)) {
            i++; // skip the flag's value token

            // ── Single boolean flags: -L -v -s -k --compressed etc. ──────────────
        } else if (tok.startsWith("-")) {
            // no-op

            // ── Bare URL ──────────────────────────────────────────────────────────
        } else {
            if (!result.url) setUrl(result, tok);
        }

        i++;
    }

    // ── Infer missing Content-Type ────────────────────────────────────────────
    if (result.body && result.bodyType !== "none") {
        const hasCT = result.headers.some(
            h => h.key.toLowerCase() === "content-type"
        );
        if (!hasCT) {
            const ctMap: Record<string, string> = {
                json: "application/json",
                "x-www-form-urlencoded": "application/x-www-form-urlencoded",
                "form-data": "multipart/form-data",
                raw: "text/plain",
            };
            const ct = ctMap[result.bodyType];
            if (ct) result.headers.push({ key: "Content-Type", value: ct, enabled: true });
        }
    }

    if (!result.method) result.method = "GET";
    return result;
}

/** Extract URL and split query-string into params */
function setUrl(result: ParsedCurl, raw: string): void {
    try {
        const urlObj = new URL(raw);
        result.url = `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;
        urlObj.searchParams.forEach((value, key) => {
            result.params.push({ key, value, enabled: true });
        });
    } catch {
        result.url = raw;
    }
}

// ─── Executor ─────────────────────────────────────────────────────────────────

async function executeCurl(parsed: ParsedCurl): Promise<ExecutionResult> {
    const start = performance.now();

    const headers: Record<string, string> = {};
    parsed.headers.filter(h => h.enabled).forEach(h => {
        headers[h.key] = h.value;
    });

    // Re-attach auth as Authorization header
    if (parsed.auth) {
        if (parsed.auth.type === "bearer" && parsed.auth.token) {
            headers["Authorization"] = `Bearer ${parsed.auth.token}`;
        } else if (parsed.auth.type === "basic") {
            headers["Authorization"] =
                `Basic ${btoa(`${parsed.auth.username ?? ""}:${parsed.auth.password ?? ""}`)}`;
        }
    }

    // Re-attach query params
    let finalUrl = parsed.url;
    const enabledParams = parsed.params.filter(p => p.enabled);
    if (enabledParams.length > 0) {
        const qs = new URLSearchParams(enabledParams.map(p => [p.key, p.value]));
        finalUrl += (finalUrl.includes("?") ? "&" : "?") + qs.toString();
    }

    const init: RequestInit = { method: parsed.method, headers };
    if (parsed.body && parsed.method !== "GET" && parsed.method !== "HEAD") {
        init.body = parsed.body;
    }

    try {
        const response = await fetch(finalUrl, init);
        const duration = Math.round(performance.now() - start);
        const bodyText = await response.text();

        const respHeaders: Record<string, string> = {};
        response.headers.forEach((v, k) => { respHeaders[k] = v; });

        const bytes = new TextEncoder().encode(bodyText).length;
        const size = bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;

        return {
            status: response.status,
            statusText: response.statusText,
            headers: respHeaders,
            body: bodyText,
            duration,
            size,
            timestamp: new Date().toLocaleTimeString(),
            url: finalUrl,
            method: parsed.method,
        };
    } catch (err) {
        const duration = Math.round(performance.now() - start);
        const isCors =
            err instanceof TypeError &&
            (err.message.toLowerCase().includes("fetch") ||
                err.message.toLowerCase().includes("network"));

        return {
            status: 0,
            statusText: "Network Error",
            headers: {},
            body: "",
            duration,
            size: "0 B",
            timestamp: new Date().toLocaleTimeString(),
            url: finalUrl,
            method: parsed.method,
            error: isCors
                ? "Request failed — likely a CORS restriction. The target server must allow requests from this origin, or use a CORS proxy."
                : err instanceof Error
                    ? err.message
                    : "Unknown network error",
        };
    }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatJson(str: string): string {
    try { return JSON.stringify(JSON.parse(str), null, 2); } catch { return str; }
}

function isJson(str: string): boolean {
    try { JSON.parse(str); return true; } catch { return false; }
}

function statusColor(status: number): string {
    if (status === 0) return "#8c8c8c";
    if (status >= 500) return "#ff4d4f";
    if (status >= 400) return "#fa8c16";
    if (status >= 300) return "#fadb14";
    if (status >= 200) return "#52c41a";
    return "#8c8c8c";
}

function methodColor(method: string): string {
    const m: Record<string, string> = {
        GET: "#52c41a", POST: "#1677ff", PUT: "#fa8c16",
        PATCH: "#722ed1", DELETE: "#ff4d4f", HEAD: "#13c2c2", OPTIONS: "#eb2f96",
    };
    return m[method] ?? "#8c8c8c";
}

async function copyToClipboard(text: string): Promise<boolean> {
    try { await navigator.clipboard.writeText(text); return true; }
    catch { return false; }
}

// ─── HighlightedJson ──────────────────────────────────────────────────────────

function HighlightedJson({ text }: { text: string }) {
    const display = isJson(text) ? formatJson(text) : text;
    const highlighted = display
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(
            /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
            (match) => {
                let cls = "jn";
                if (/^"/.test(match)) cls = /:$/.test(match) ? "jk" : "js";
                else if (/true|false/.test(match)) cls = "jb";
                else if (/null/.test(match)) cls = "jnu";
                return `<span class="${cls}">${match}</span>`;
            }
        );
    return (
        <pre className="json-block" dangerouslySetInnerHTML={{ __html: highlighted }} />
    );
}

// ─── KVTable ──────────────────────────────────────────────────────────────────

function KVTable({ rows }: { rows: Array<{ key: string; value: string }> }) {
    if (!rows.length) return <p className="kv-empty">No entries</p>;
    return (
        <div className="kv-table">
            {rows.map((r, i) => (
                <div key={i} className="kv-row">
                    <span className="kv-key">{r.key}</span>
                    <span className="kv-value">{r.value}</span>
                </div>
            ))}
        </div>
    );
}

// ─── CopyButton ───────────────────────────────────────────────────────────────

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
    const [copied, setCopied] = useState(false);
    const handle = async () => {
        const ok = await copyToClipboard(text);
        if (ok) { setCopied(true); setTimeout(() => setCopied(false), 1800); }
    };
    return (
        <button className="copy-btn" onClick={handle}>
            {copied ? "✓ Copied" : label}
        </button>
    );
}

// ─── Example commands ─────────────────────────────────────────────────────────

const EXAMPLES = [
    {
        label: "GET",
        curl: `curl https://jsonplaceholder.typicode.com/users/1`,
    },
    {
        label: "POST JSON",
        curl: `curl -X POST https://jsonplaceholder.typicode.com/posts \\\n  -H 'Content-Type: application/json' \\\n  -d '{"title":"foo","body":"bar","userId":1}'`,
    },
    {
        label: "Bearer",
        curl: `curl -X PUT https://jsonplaceholder.typicode.com/posts/1 \\\n  -H "Content-Type: application/json" \\\n  -H "Authorization: Bearer my-secret-token" \\\n  -d '{"id":1,"title":"updated","body":"new body","userId":1}'`,
    },
    {
        label: "Basic Auth",
        curl: `curl -u admin:password123 https://jsonplaceholder.typicode.com/posts/2`,
    },
    {
        label: "Params",
        curl: `curl "https://jsonplaceholder.typicode.com/posts?userId=1&_limit=3"`,
    },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CurlRunner() {
    const [curlInput, setCurlInput] = useState("");
    const [parsed, setParsed] = useState<ParsedCurl | null>(null);
    const [parseError, setParseError] = useState<string | null>(null);
    const [activeResult, setActiveResult] = useState<ExecutionResult | null>(null);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    // Increment this to force TanStack Query to re-run (avoids stale query key issues)
    const [runId, setRunId] = useState(0);
    const [shouldFetch, setShouldFetch] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // ── Parse ────────────────────────────────────────────────────────────────────
    const handleParse = useCallback(() => {
        setParseError(null);
        setParsed(null);
        setShouldFetch(false);
        setActiveResult(null);

        const trimmed = curlInput.trim();
        if (!trimmed) { setParseError("Please enter a cURL command."); return; }
        if (!trimmed.toLowerCase().startsWith("curl")) {
            setParseError('Command must start with "curl".');
            return;
        }
        try {
            const p = parseCurl(trimmed);
            if (!p.url) { setParseError("Could not extract a URL from the command."); return; }
            setParsed(p);
        } catch (e) {
            setParseError(e instanceof Error ? e.message : "Parse failed.");
        }
    }, [curlInput]);

    // ── Execute ──────────────────────────────────────────────────────────────────
    const handleExecute = useCallback(() => {
        if (!parsed) return;
        setActiveResult(null);   // clear stale result before new request
        setRunId(id => id + 1);  // new key → new fetch
        setShouldFetch(true);
    }, [parsed]);

    useQuery({
        queryKey: ["curl-exec", runId],
        queryFn: async () => {
            if (!parsed) throw new Error("Nothing to execute");
            const result = await executeCurl(parsed);
            setActiveResult(result);
            setHistory(prev =>
                [{ ...result, id: crypto.randomUUID(), curlSnapshot: curlInput }, ...prev].slice(0, 20)
            );
            setShouldFetch(false);
            return result;
        },
        enabled: shouldFetch && !!parsed,
        retry: false,
        staleTime: Infinity,
    });

    // Derive isFetching from shouldFetch so the button state is immediate
    const isFetching = shouldFetch;

    // ── Load example ──────────────────────────────────────────────────────────────
    const loadExample = useCallback((ex: string) => {
        setCurlInput(ex);
        setParsed(null);
        setShouldFetch(false);
        setActiveResult(null);
        setParseError(null);
    }, []);

    // ── Re-load history item ──────────────────────────────────────────────────────
    const loadHistoryItem = useCallback((item: HistoryItem) => {
        setCurlInput(item.curlSnapshot);
        setActiveResult(item);
        setParsed(null);
        setShouldFetch(false);
        setParseError(null);
    }, []);

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,400;0,600;0,700;1,400&family=Syne:wght@400;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg:         #080810;
          --surface:    #0f0f1a;
          --surface2:   #161625;
          --surface3:   #1e1e30;
          --border:     #252538;
          --border2:    #32324a;
          --accent:     #6c63ff;
          --accent-glow: rgba(108,99,255,0.35);
          --green:      #00d4aa;
          --text:       #dde1f0;
          --muted:      #5c5c78;
          --mono: 'JetBrains Mono', 'Fira Code', monospace;
          --sans: 'Syne', sans-serif;
          --r:  8px;
          --rl: 14px;
        }

        html, body { height: 100%; }
        body {
          background: var(--bg); color: var(--text);
          font-family: var(--sans); -webkit-font-smoothing: antialiased;
        }

        /* ── App shell ─────────────────────────────────── */
        .app {
          min-height: 100vh;
          background:
            radial-gradient(ellipse 90% 55% at 5%   0%, rgba(108,99,255,.14) 0%, transparent 65%),
            radial-gradient(ellipse 65% 45% at 95% 100%, rgba(0,212,170,.09) 0%, transparent 65%),
            var(--bg);
          display: flex; flex-direction: column;
        }

        /* ── Header ─────────────────────────────────────── */
        .hdr {
          border-bottom: 1px solid var(--border);
          background: rgba(8,8,16,.85);
          backdrop-filter: blur(16px);
          padding: 0 1rem; position: sticky; top: 0; z-index: 100;
        }
        .hdr-inner {
          max-width: 1360px; margin: 0 auto; height: 54px;
          display: flex; align-items: center;
          justify-content: space-between; gap: .75rem;
        }
        .logo {
          display: flex; align-items: center; gap: 10px;
          font-family: var(--sans); font-weight: 800;
          font-size: 1rem; letter-spacing: -.03em; white-space: nowrap;
        }
        .logo-icon {
          width: 32px; height: 32px;
          background: linear-gradient(135deg, var(--accent), var(--green));
          border-radius: 9px; display: flex; align-items: center;
          justify-content: center; font-size: 15px; flex-shrink: 0;
          box-shadow: 0 0 14px var(--accent-glow);
        }
        .logo-sub {
          font-family: var(--mono); font-size: .6rem;
          color: var(--muted); font-weight: 400; display: block; margin-top: 1px;
        }
        .hdr-stat {
          font-family: var(--mono); font-size: .65rem;
          padding: 3px 10px; border-radius: 20px;
          border: 1px solid var(--border2); color: var(--muted); white-space: nowrap;
        }

        /* ── Main ───────────────────────────────────────── */
        .main {
          flex: 1; max-width: 1360px; margin: 0 auto;
          width: 100%; padding: 1rem;
          display: flex; flex-direction: column; gap: 1rem;
        }

        /* ── Panel ──────────────────────────────────────── */
        .panel {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: var(--rl); overflow: hidden;
        }
        .panel-hdr {
          display: flex; align-items: center; justify-content: space-between;
          padding: .65rem 1rem; border-bottom: 1px solid var(--border);
          background: var(--surface2); gap: .5rem; flex-wrap: wrap;
        }
        .panel-title {
          font-family: var(--mono); font-size: .65rem; font-weight: 700;
          color: var(--muted); text-transform: uppercase; letter-spacing: .1em;
          display: flex; align-items: center; gap: 7px;
        }
        .dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }

        /* ── Examples ───────────────────────────────────── */
        .examples-row { display: flex; gap: 6px; flex-wrap: wrap; }
        .ex-chip {
          font-family: var(--mono); font-size: .62rem;
          padding: .28rem .65rem; border-radius: 20px;
          border: 1px dashed var(--border2); color: var(--muted);
          cursor: pointer; background: transparent; transition: all .15s ease;
          white-space: nowrap;
        }
        .ex-chip:hover {
          border-color: var(--accent); color: var(--accent);
          background: rgba(108,99,255,.06);
        }

        /* ── Textarea ───────────────────────────────────── */
        .curl-ta {
          width: 100%; min-height: 140px; background: transparent;
          border: none; outline: none; resize: vertical; padding: 1rem;
          font-family: var(--mono); font-size: .78rem; line-height: 1.75;
          color: var(--text); caret-color: var(--accent);
        }
        .curl-ta::placeholder { color: var(--muted); }

        /* ── Toolbar ────────────────────────────────────── */
        .toolbar {
          display: flex; align-items: center; gap: .5rem;
          padding: .6rem 1rem; border-top: 1px solid var(--border);
          background: var(--surface2); flex-wrap: wrap;
        }
        .toolbar-left { display: flex; gap: .4rem; flex: 1; flex-wrap: wrap; }
        .hint {
          font-family: var(--mono); font-size: .6rem; color: var(--muted);
          display: flex; align-items: center; gap: 4px;
        }
        .kbd {
          font-family: var(--mono); font-size: .55rem;
          padding: 1px 4px; border-radius: 4px;
          border: 1px solid var(--border2); color: var(--muted);
          background: var(--surface3);
        }

        /* ── Buttons ────────────────────────────────────── */
        .btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: .42rem .9rem; border-radius: var(--r);
          font-family: var(--mono); font-size: .72rem; font-weight: 600;
          cursor: pointer; border: 1px solid transparent;
          transition: all .15s ease; white-space: nowrap; line-height: 1;
        }
        .btn:disabled { opacity: .38; cursor: not-allowed; }
        .btn-primary {
          background: var(--accent); color: #fff; border-color: var(--accent);
          box-shadow: 0 0 10px rgba(108,99,255,.3);
        }
        .btn-primary:hover:not(:disabled) {
          background: #7c74ff; box-shadow: 0 0 16px rgba(108,99,255,.45);
        }
        .btn-run {
          background: linear-gradient(135deg, var(--green), #00a884);
          color: #081210; border-color: transparent; font-weight: 700;
          box-shadow: 0 0 10px rgba(0,212,170,.25);
        }
        .btn-run:hover:not(:disabled) {
          opacity: .9; transform: translateY(-1px);
          box-shadow: 0 4px 18px rgba(0,212,170,.35);
        }
        .btn-ghost {
          background: transparent; color: var(--muted); border-color: var(--border2);
        }
        .btn-ghost:hover:not(:disabled) { color: var(--text); border-color: var(--muted); }
        .btn-danger {
          background: transparent; color: #ff4d4f;
          border-color: rgba(255,77,79,.25);
        }
        .btn-danger:hover:not(:disabled) { background: rgba(255,77,79,.1); }

        /* ── Error / CORS bars ──────────────────────────── */
        .err-bar {
          margin: .75rem 1rem; padding: .6rem 1rem;
          border-radius: var(--r);
          background: rgba(255,77,79,.07); border: 1px solid rgba(255,77,79,.28);
          font-family: var(--mono); font-size: .73rem; color: #ff6b6b;
          display: flex; align-items: flex-start; gap: 8px;
        }
        .cors-bar {
          margin: .75rem 1rem; padding: .65rem 1rem;
          border-radius: var(--r);
          background: rgba(250,140,22,.07); border: 1px solid rgba(250,140,22,.28);
          font-family: var(--mono); font-size: .72rem; color: #fa8c16; line-height: 1.6;
        }

        /* ── Meta grid ──────────────────────────────────── */
        .meta-grid {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: .75rem; padding: .75rem;
        }
        @media (max-width: 520px) { .meta-grid { grid-template-columns: 1fr; } }
        .meta-card {
          background: var(--surface2); border: 1px solid var(--border);
          border-radius: var(--r); padding: .65rem .75rem;
        }
        .meta-label {
          font-family: var(--mono); font-size: .58rem; color: var(--muted);
          text-transform: uppercase; letter-spacing: .08em; margin-bottom: .3rem;
        }
        .meta-value {
          font-family: var(--mono); font-size: .78rem;
          color: var(--text); word-break: break-all; line-height: 1.5;
        }
        .meta-url { grid-column: 1 / -1; }

        /* ── Method badge ───────────────────────────────── */
        .method-badge {
          display: inline-block; font-family: var(--mono);
          font-size: .68rem; font-weight: 700;
          padding: 2px 9px; border-radius: 5px; letter-spacing: .04em;
        }

        /* ── Tabs ───────────────────────────────────────── */
        .tabs-list {
          display: flex; border-bottom: 1px solid var(--border);
          background: var(--surface2); overflow-x: auto; scrollbar-width: none;
        }
        .tabs-list::-webkit-scrollbar { display: none; }
        .tab-trigger {
          font-family: var(--mono); font-size: .68rem; font-weight: 600;
          padding: .6rem 1rem; color: var(--muted); background: transparent;
          border: none; border-bottom: 2px solid transparent; cursor: pointer;
          white-space: nowrap; transition: all .15s;
          display: flex; align-items: center; gap: 6px;
        }
        .tab-trigger:hover { color: var(--text); }
        .tab-trigger[data-state="active"] {
          color: var(--accent); border-bottom-color: var(--accent);
          background: rgba(108,99,255,.07);
        }
        .tab-content { padding: .85rem; }

        /* ── KV Table ───────────────────────────────────── */
        .kv-table { display: flex; flex-direction: column; gap: 4px; }
        .kv-row {
          display: grid; grid-template-columns: 1fr 2fr;
          gap: .5rem; padding: .45rem .75rem; border-radius: var(--r);
          background: var(--surface2); font-family: var(--mono); font-size: .7rem;
        }
        .kv-key { color: var(--green); word-break: break-all; }
        .kv-value { color: var(--text); word-break: break-all; }
        .kv-empty { font-family: var(--mono); font-size: .7rem; color: var(--muted); padding: .25rem 0; }

        /* ── Auth card ──────────────────────────────────── */
        .auth-card {
          background: rgba(108,99,255,.07); border: 1px solid rgba(108,99,255,.22);
          border-radius: var(--r); padding: .75rem 1rem;
        }
        .auth-type-label {
          font-family: var(--mono); font-size: .6rem; color: var(--accent);
          text-transform: uppercase; letter-spacing: .08em;
          margin-bottom: .5rem; display: block;
        }

        /* ── Status pill ────────────────────────────────── */
        .status-pill {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 3px 11px; border-radius: 20px;
          font-family: var(--mono); font-size: .72rem; font-weight: 700; border: 1px solid;
        }
        .stat-chip {
          font-family: var(--mono); font-size: .68rem; color: var(--muted);
          display: flex; align-items: center; gap: 4px;
        }

        /* ── JSON highlight ─────────────────────────────── */
        .json-block {
          font-family: var(--mono); font-size: .73rem; line-height: 1.75;
          white-space: pre-wrap; word-break: break-all; color: var(--text);
          background: var(--surface2); padding: .85rem; border-radius: var(--r);
          border: 1px solid var(--border); overflow: auto; max-height: 440px;
        }
        .jk  { color: #79c0ff; }
        .js  { color: #a5d6ff; }
        .jn  { color: #f2cc60; }
        .jb  { color: #d2a8ff; }
        .jnu { color: var(--muted); }

        /* ── Spinner ────────────────────────────────────── */
        @keyframes spin { to { transform: rotate(360deg); } }
        .spinner {
          border: 2px solid rgba(255,255,255,.15);
          border-top-color: currentColor; border-radius: 50%;
          animation: spin .55s linear infinite; flex-shrink: 0;
        }

        /* ── Pulse ──────────────────────────────────────── */
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.25} }
        .pulse { animation: blink 1.4s ease infinite; }

        /* ── Scroll ─────────────────────────────────────── */
        .scroll-vp {
          max-height: 400px; overflow: auto;
          scrollbar-width: thin; scrollbar-color: var(--border2) transparent;
        }
        .scroll-vp::-webkit-scrollbar { width: 4px; }
        .scroll-vp::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 2px; }

        /* ── Copy button ────────────────────────────────── */
        .copy-btn {
          font-family: var(--mono); font-size: .63rem;
          padding: 2px 8px; border-radius: 5px;
          border: 1px solid var(--border2); background: transparent;
          color: var(--muted); cursor: pointer; transition: all .15s;
        }
        .copy-btn:hover { color: var(--text); border-color: var(--muted); }

        /* ── History ────────────────────────────────────── */
        .hist-item {
          display: flex; align-items: center; gap: .5rem;
          padding: .45rem .75rem; border-radius: var(--r);
          background: var(--surface2); border: 1px solid var(--border);
          font-family: var(--mono); font-size: .68rem;
          margin-bottom: 4px; cursor: pointer;
          transition: border-color .15s, background .15s; flex-wrap: wrap;
        }
        .hist-item:hover { border-color: var(--border2); background: var(--surface3); }
        .hist-url {
          flex: 1; min-width: 0;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          color: var(--muted); font-size: .63rem;
        }

        /* ── Split layout ───────────────────────────────── */
        @media (min-width: 1024px) {
          .split { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; align-items: start; }
        }

        /* ── Fade in ────────────────────────────────────── */
        @keyframes fadeUp { from { opacity: 0; transform: translateY(7px); } to { opacity: 1; } }
        .fade-in { animation: fadeUp .22s ease; }
      `}</style>

            <Tooltip.Provider delayDuration={250}>
                <div className="app">

                    {/* ── Header ─────────────────────────────────────────────────── */}
                    <header className="hdr">
                        <div className="hdr-inner">
                            <div className="logo">
                                <div className="logo-icon">⚡</div>
                                <div>
                                    CurlRunner
                                    <span className="logo-sub">parse · inspect · execute</span>
                                </div>
                            </div>
                            <span className="hdr-stat">
                                {history.length} / 20 requests logged
                            </span>
                        </div>
                    </header>

                    <main className="main">

                        {/* ── Input panel ─────────────────────────────────────────── */}
                        <div className="panel">
                            <div className="panel-hdr">
                                <span className="panel-title">
                                    <span className="dot" style={{ background: "var(--accent)", boxShadow: "0 0 6px var(--accent-glow)" }} />
                                    cURL Command
                                </span>
                                <div className="examples-row">
                                    {EXAMPLES.map(ex => (
                                        <button key={ex.label} className="ex-chip" onClick={() => loadExample(ex.curl)}>
                                            {ex.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <textarea
                                ref={textareaRef}
                                className="curl-ta"
                                value={curlInput}
                                onChange={e => setCurlInput(e.target.value)}
                                onKeyDown={e => {
                                    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                                        e.preventDefault();
                                        // Smart shortcut: parse first, then execute on subsequent presses
                                        if (parsed) handleExecute();
                                        else handleParse();
                                    }
                                }}
                                placeholder={`curl -X POST https://api.example.com/data \\\n  -H 'Content-Type: application/json' \\\n  -H 'Authorization: Bearer token123' \\\n  -d '{"key": "value"}'`}
                                spellCheck={false}
                                autoCorrect="off"
                                autoCapitalize="off"
                            />

                            {parseError && (
                                <div className="err-bar">
                                    <span style={{ flexShrink: 0 }}>✖</span>
                                    <span>{parseError}</span>
                                </div>
                            )}

                            <div className="toolbar">
                                <div className="toolbar-left">
                                    <button className="btn btn-primary" onClick={handleParse}>
                                        ⟳ Parse
                                    </button>
                                    <Tooltip.Root>
                                        <Tooltip.Trigger asChild>
                                            <button
                                                className="btn btn-run"
                                                onClick={handleExecute}
                                                disabled={!parsed || isFetching}
                                            >
                                                {isFetching
                                                    ? <><div className="spinner" style={{ width: 11, height: 11 }} /> Running…</>
                                                    : <>▶ Execute</>}
                                            </button>
                                        </Tooltip.Trigger>
                                        <Tooltip.Portal>
                                            <Tooltip.Content
                                                style={{
                                                    background: "var(--surface3)", border: "1px solid var(--border2)",
                                                    borderRadius: 6, padding: "4px 10px",
                                                    fontFamily: "var(--mono)", fontSize: ".65rem", color: "var(--muted)",
                                                    zIndex: 200,
                                                }}
                                                sideOffset={5}
                                            >
                                                {!parsed ? "Parse first, then execute" : "Send HTTP request"}
                                                <Tooltip.Arrow style={{ fill: "var(--border2)" }} />
                                            </Tooltip.Content>
                                        </Tooltip.Portal>
                                    </Tooltip.Root>
                                </div>

                                <span className="hint">
                                    <kbd className="kbd">⌘</kbd>+<kbd className="kbd">↵</kbd>
                                    &nbsp;{parsed ? "execute" : "parse"}
                                </span>

                                <button
                                    className="btn btn-ghost"
                                    onClick={() => {
                                        setCurlInput(""); setParsed(null);
                                        setShouldFetch(false); setActiveResult(null); setParseError(null);
                                    }}
                                >
                                    Clear
                                </button>
                            </div>
                        </div>

                        {/* ── Split: Parsed request + Response ────────────────────── */}
                        <div className="split">

                            {/* Parsed request */}
                            {parsed && (
                                <div className="panel fade-in">
                                    <div className="panel-hdr">
                                        <span className="panel-title">
                                            <span className="dot" style={{ background: "var(--green)" }} />
                                            Parsed Request
                                        </span>
                                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                            <span
                                                className="method-badge"
                                                style={{
                                                    background: methodColor(parsed.method) + "22",
                                                    color: methodColor(parsed.method),
                                                    border: `1px solid ${methodColor(parsed.method)}44`,
                                                }}
                                            >
                                                {parsed.method}
                                            </span>
                                            <CopyButton text={curlInput} label="Copy cURL" />
                                        </div>
                                    </div>

                                    <div className="meta-grid">
                                        <div className="meta-card meta-url">
                                            <div className="meta-label">URL</div>
                                            <div className="meta-value">{parsed.url}</div>
                                        </div>
                                        <div className="meta-card">
                                            <div className="meta-label">Method</div>
                                            <div className="meta-value">{parsed.method}</div>
                                        </div>
                                        <div className="meta-card">
                                            <div className="meta-label">Body Type</div>
                                            <div className="meta-value">{parsed.bodyType}</div>
                                        </div>
                                    </div>

                                    <Tabs.Root defaultValue="headers">
                                        <Tabs.List className="tabs-list">
                                            <Tabs.Trigger className="tab-trigger" value="headers">
                                                Headers
                                                {parsed.headers.length > 0 && (
                                                    <span style={{ background: "var(--accent)", color: "#fff", borderRadius: 10, padding: "1px 6px", fontSize: ".58rem" }}>
                                                        {parsed.headers.length}
                                                    </span>
                                                )}
                                            </Tabs.Trigger>
                                            <Tabs.Trigger className="tab-trigger" value="params">
                                                Params
                                                {parsed.params.length > 0 && (
                                                    <span style={{ background: "var(--accent)", color: "#fff", borderRadius: 10, padding: "1px 6px", fontSize: ".58rem" }}>
                                                        {parsed.params.length}
                                                    </span>
                                                )}
                                            </Tabs.Trigger>
                                            <Tabs.Trigger className="tab-trigger" value="body">Body</Tabs.Trigger>
                                            <Tabs.Trigger className="tab-trigger" value="auth">Auth</Tabs.Trigger>
                                        </Tabs.List>

                                        <Tabs.Content className="tab-content" value="headers">
                                            <KVTable rows={parsed.headers} />
                                        </Tabs.Content>
                                        <Tabs.Content className="tab-content" value="params">
                                            <KVTable rows={parsed.params} />
                                        </Tabs.Content>
                                        <Tabs.Content className="tab-content" value="body">
                                            {parsed.body
                                                ? <HighlightedJson text={parsed.body} />
                                                : <p className="kv-empty">No body</p>}
                                        </Tabs.Content>
                                        <Tabs.Content className="tab-content" value="auth">
                                            {parsed.auth ? (
                                                <div className="auth-card">
                                                    <span className="auth-type-label">{parsed.auth.type} authentication</span>
                                                    {parsed.auth.type === "bearer" && (
                                                        <div className="meta-value" style={{ wordBreak: "break-all" }}>
                                                            {parsed.auth.token}
                                                        </div>
                                                    )}
                                                    {parsed.auth.type === "basic" && (
                                                        <KVTable rows={[
                                                            { key: "username", value: parsed.auth.username ?? "" },
                                                            { key: "password", value: "••••••••" },
                                                        ]} />
                                                    )}
                                                </div>
                                            ) : (
                                                <p className="kv-empty">No auth detected</p>
                                            )}
                                        </Tabs.Content>
                                    </Tabs.Root>
                                </div>
                            )}

                            {/* Response */}
                            {(activeResult || isFetching) && (
                                <div className="panel fade-in">
                                    <div className="panel-hdr">
                                        <span className="panel-title">
                                            <span
                                                className={`dot${isFetching ? " pulse" : ""}`}
                                                style={{
                                                    background: isFetching
                                                        ? "#fadb14"
                                                        : activeResult ? statusColor(activeResult.status) : "var(--muted)",
                                                }}
                                            />
                                            Response
                                        </span>
                                        {activeResult && !isFetching && (
                                            <div style={{ display: "flex", alignItems: "center", gap: ".6rem", flexWrap: "wrap" }}>
                                                <span
                                                    className="status-pill"
                                                    style={{
                                                        color: statusColor(activeResult.status),
                                                        borderColor: statusColor(activeResult.status) + "44",
                                                        background: statusColor(activeResult.status) + "12",
                                                    }}
                                                >
                                                    {activeResult.status || "ERR"} {activeResult.statusText}
                                                </span>
                                                <span className="stat-chip">⏱ {activeResult.duration}ms</span>
                                                <span className="stat-chip">📦 {activeResult.size}</span>
                                            </div>
                                        )}
                                    </div>

                                    {isFetching && (
                                        <div style={{ padding: "2.5rem", textAlign: "center", color: "var(--muted)", fontFamily: "var(--mono)", fontSize: ".78rem" }}>
                                            <div className="spinner" style={{ width: 22, height: 22, margin: "0 auto .75rem", color: "var(--green)" }} />
                                            Executing request…
                                        </div>
                                    )}

                                    {activeResult && !isFetching && (
                                        <>
                                            {activeResult.error && (
                                                <div className="cors-bar">⚠ {activeResult.error}</div>
                                            )}
                                            {!activeResult.error && (
                                                <Tabs.Root defaultValue="body">
                                                    <Tabs.List className="tabs-list">
                                                        <Tabs.Trigger className="tab-trigger" value="body">Body</Tabs.Trigger>
                                                        <Tabs.Trigger className="tab-trigger" value="resp-hdrs">Headers</Tabs.Trigger>
                                                    </Tabs.List>
                                                    <Tabs.Content className="tab-content" value="body">
                                                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, marginBottom: ".5rem" }}>
                                                            <CopyButton text={formatJson(activeResult.body)} label="Copy JSON" />
                                                            <CopyButton text={activeResult.body} label="Copy raw" />
                                                        </div>
                                                        <div className="scroll-vp">
                                                            <HighlightedJson text={activeResult.body} />
                                                        </div>
                                                    </Tabs.Content>
                                                    <Tabs.Content className="tab-content" value="resp-hdrs">
                                                        <div className="scroll-vp">
                                                            <KVTable rows={Object.entries(activeResult.headers).map(([key, value]) => ({ key, value }))} />
                                                        </div>
                                                    </Tabs.Content>
                                                </Tabs.Root>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* ── History ─────────────────────────────────────────────── */}
                        {history.length > 0 && (
                            <div className="panel">
                                <div className="panel-hdr">
                                    <span className="panel-title">
                                        <span className="dot" style={{ background: "#fa8c16" }} />
                                        Request History
                                        <span style={{ fontWeight: 400, fontSize: ".58rem", color: "var(--muted)" }}>
                                            — click to reload
                                        </span>
                                    </span>
                                    <button className="btn btn-danger" onClick={() => setHistory([])}>Clear</button>
                                </div>
                                <div style={{ padding: ".75rem" }}>
                                    {history.map(h => (
                                        <div
                                            key={h.id}
                                            className="hist-item"
                                            onClick={() => loadHistoryItem(h)}
                                            title={`Reload: ${h.curlSnapshot.slice(0, 100)}`}
                                        >
                                            <span
                                                className="method-badge"
                                                style={{
                                                    background: methodColor(h.method) + "22",
                                                    color: methodColor(h.method),
                                                    border: `1px solid ${methodColor(h.method)}44`,
                                                    fontSize: ".58rem", padding: "1px 6px",
                                                }}
                                            >
                                                {h.method}
                                            </span>
                                            <span style={{ fontWeight: 700, color: statusColor(h.status), minWidth: 32 }}>
                                                {h.status || "ERR"}
                                            </span>
                                            <span className="hist-url">{h.url}</span>
                                            <span className="stat-chip">{h.duration}ms</span>
                                            <span className="stat-chip">{h.size}</span>
                                            <span style={{ color: "var(--muted)", fontSize: ".63rem" }}>{h.timestamp}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                    </main>
                </div>
            </Tooltip.Provider>
        </>
    );
}