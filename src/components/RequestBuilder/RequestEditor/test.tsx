import { useState, useRef, useEffect } from 'react';

// ─── Variables ───────────────────────────────────────────────────────
const STATIC_VARS = [
  { name: 'base_url', value: 'https://api.example.com', type: 'static' },
  { name: 'api_key', value: 'sk-••••••••••', type: 'static' },
  { name: 'user_id', value: 'usr_12345', type: 'static' },
  { name: 'org_id', value: 'org_98765', type: 'static' },
  { name: 'tenant_id', value: 'tnt_00123', type: 'static' },
];
const DYNAMIC_VARS = [
  { name: '$timestamp', value: '1717000000', type: 'dynamic' },
  { name: '$randomEmail', value: 'rand@mail.com', type: 'dynamic' },
  { name: '$uuid', value: 'f47ac10b-...', type: 'dynamic' },
  { name: '$randomInt', value: '42', type: 'dynamic' },
];
const ALL_VARS = [...STATIC_VARS, ...DYNAMIC_VARS];

// ─── Postman-inspired dark theme colors ──────────────────────────────
// Background:   #1e1e1e  (editor bg)
// Keys:         #9cdcfe  (light blue  — VS Code / Postman key color)
// String vals:  #ce9178  (orange-tan  — Postman string value color)
// Number vals:  #b5cea8  (light green — numeric literals)
// Bool/null:    #569cd6  (blue        — keywords)
// Punctuation:  #808080  (grey        — braces, colons, commas)
// Line numbers: #858585
// Hover row bg: #2a2d2e

const C = {
  editorBg: '#1e1e1e',
  lineNumBg: '#1e1e1e',
  lineNum: '#858585',
  lineNumHov: '#c6c6c6',
  gutter: '#2b2b2b',
  key: '#9cdcfe',
  strVal: '#ce9178',
  numVal: '#b5cea8',
  boolNull: '#569cd6',
  punct: '#808080',
  braces: '#ffd700',
  brackets: '#da70d6',
  caret: '#aeafad',
  rowHov: 'rgba(255,255,255,0.04)',
  rowHovBdr: '#3794ff',
  rightBg: '#252526',
  rightHov: 'rgba(55,148,255,0.10)',
  rightBdr: '#3794ff',
  toolbarBg: '#1a1a1a',
  border: '#3c3c3c',
  text: '#d4d4d4',
};

const DEFAULT_BODY = `{
  "email": "stagetestthree@yopmail.com",
  "password": "Test@12345",
  "role": "admin",
  "org_id": "org_default",
  "notify": true,
  "retries": 3
}`;

// ─── Tokenize a single line into colored spans ────────────────────────
// Handles: key-value pairs, booleans, numbers, nulls, brackets, braces
function TokenizedLine({ raw, sub }) {
  // Full key-value line:  (indent) "key" : "value" (comma)
  const kvStr = raw.match(
    /^(\s*)("(?:[^"\\]|\\.)*")(\s*:\s*)("(?:[^"\\]|\\.)*")(,?\s*)$/,
  );
  const kvNum = raw.match(
    /^(\s*)("(?:[^"\\]|\\.)*")(\s*:\s*)(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)(,?\s*)$/,
  );
  const kvBool = raw.match(
    /^(\s*)("(?:[^"\\]|\\.)*")(\s*:\s*)(true|false|null)(,?\s*)$/,
  );
  const kvObj = raw.match(/^(\s*)("(?:[^"\\]|\\.)*")(\s*:\s*)(\[|\{)(,?\s*)$/);

  const render = (parts) => (
    <span>
      {parts.map((p, i) => (
        <span key={i} style={{ color: p.c }}>
          {p.t}
        </span>
      ))}
    </span>
  );

  if (sub) {
    // show variable substitution token in place of the value
    const key = raw.match(/^(\s*)("(?:[^"\\]|\\.)*")(\s*:\s*)/);
    if (key) {
      return render([
        { t: key[1], c: C.punct },
        { t: key[2], c: C.key },
        { t: key[3], c: C.punct },
        {
          t: `{{${sub}}}`,
          c: '#fff',
          style: {
            background: '#1d4ed8',
            padding: '1px 5px',
            borderRadius: '3px',
            fontSize: '11px',
          },
        },
      ]);
    }
  }

  if (kvStr)
    return render([
      { t: kvStr[1], c: C.punct },
      { t: kvStr[2], c: C.key },
      { t: kvStr[3], c: C.punct },
      { t: kvStr[4], c: C.strVal },
      { t: kvStr[5], c: C.punct },
    ]);
  if (kvNum)
    return render([
      { t: kvNum[1], c: C.punct },
      { t: kvNum[2], c: C.key },
      { t: kvNum[3], c: C.punct },
      { t: kvNum[4], c: C.numVal },
      { t: kvNum[5], c: C.punct },
    ]);
  if (kvBool)
    return render([
      { t: kvBool[1], c: C.punct },
      { t: kvBool[2], c: C.key },
      { t: kvBool[3], c: C.punct },
      { t: kvBool[4], c: C.boolNull },
      { t: kvBool[5], c: C.punct },
    ]);
  if (kvObj)
    return render([
      { t: kvObj[1], c: C.punct },
      { t: kvObj[2], c: C.key },
      { t: kvObj[3], c: C.punct },
      { t: kvObj[4], c: /[\[{]/.test(kvObj[4]) ? C.braces : C.punct },
      { t: kvObj[5], c: C.punct },
    ]);

  // plain structural lines: { } [ ] ,
  const colored = raw
    .replace(/[{}\[\]]/g, (m) => `<BRACE>${m}</BRACE>`)
    .replace(/,\s*$/, (m) => `<PUNCT>${m}</PUNCT>`);
  const parts = [];
  const re = /<(BRACE|PUNCT)>(.*?)<\/\1>/g;
  let last = 0,
    match;
  while ((match = re.exec(colored)) !== null) {
    if (match.index > last)
      parts.push({ t: colored.slice(last, match.index), c: C.punct });
    parts.push({ t: match[2], c: match[1] === 'BRACE' ? C.braces : C.punct });
    last = match.index + match[0].length;
  }
  if (last < colored.length) parts.push({ t: colored.slice(last), c: C.punct });
  if (parts.length === 0)
    return <span style={{ color: C.punct }}>{raw || ' '}</span>;
  return render(parts);
}

// ─── Parse lines ─────────────────────────────────────────────────────
function parseLines(text) {
  return text.split('\n').map((raw, index) => {
    const keyMatch = raw.match(/^(\s*)"([^"]+)"\s*:/);
    const valMatch = raw.match(
      /:\s*("([^"]*)"|-?\d+(\.\d+)?|\btrue\b|\bfalse\b|\bnull\b)/,
    );
    return {
      index,
      raw,
      hasKey: !!keyMatch,
      key: keyMatch?.[2] ?? null,
      value: valMatch
        ? valMatch[2] !== undefined
          ? valMatch[2]
          : valMatch[1]
        : null,
    };
  });
}

// ─── Main ────────────────────────────────────────────────────────────
export default function SplitBodyEditor() {
  const [body, setBody] = useState(DEFAULT_BODY);
  const [substitutions, setSubstitutions] = useState({});
  const [hoveredLine, setHoveredLine] = useState(null);
  const [varPanelKey, setVarPanelKey] = useState(null);
  const [varSearch, setVarSearch] = useState('');
  // overlay mode: show syntax-highlighted div over the textarea when not focused
  const [editorFocused, setEditorFocused] = useState(false);
  const textareaRef = useRef(null);
  const overlayRef = useRef(null);

  const lines = parseLines(body);
  const dataLines = lines.filter((l) => l.hasKey);

  // keep overlay scroll in sync with textarea
  const syncScroll = () => {
    if (overlayRef.current && textareaRef.current) {
      overlayRef.current.scrollTop = textareaRef.current.scrollTop;
      overlayRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = ta.scrollHeight + 'px';
    }
  }, [body]);

  const syncCursorLine = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    const n = ta.value.substring(0, ta.selectionStart).split('\n').length - 1;
    setHoveredLine(n);
  };

  const setSub = (key, name) => {
    setSubstitutions((p) => ({ ...p, [key]: name }));
    setVarPanelKey(null);
    setVarSearch('');
  };
  const removeSub = (key) =>
    setSubstitutions((p) => {
      const n = { ...p };
      delete n[key];
      return n;
    });

  const addField = () => {
    try {
      const p = JSON.parse(body);
      p['new_key'] = 'value';
      setBody(JSON.stringify(p, null, 2));
    } catch {}
  };
  const beautify = () => {
    try {
      setBody(JSON.stringify(JSON.parse(body), null, 2));
    } catch {}
  };

  const filteredVars = ALL_VARS.filter(
    (v) =>
      !varSearch ||
      v.name.toLowerCase().includes(varSearch.toLowerCase()) ||
      v.value.toLowerCase().includes(varSearch.toLowerCase()),
  );

  // ── JSON validation with error line detection ──────────────────
  const { isValidJson, errorLine, errorMsg } = (() => {
    try {
      JSON.parse(body);
      return { isValidJson: true, errorLine: null, errorMsg: null };
    } catch (e) {
      // Most engines put "line N" or "at line N column M" in the message
      let line = null;
      const lineMatch = e.message.match(/line\s+(\d+)/i);
      const posMatch = e.message.match(/position\s+(\d+)/i);
      if (lineMatch) {
        line = parseInt(lineMatch[1], 10) - 1; // 0-indexed
      } else if (posMatch) {
        // count newlines up to character position to get line index
        const pos = parseInt(posMatch[1], 10);
        line = body.substring(0, pos).split('\n').length - 1;
      } else {
        // fallback: scan for the first line that looks syntactically broken
        const rawLines = body.split('\n');
        let accumulated = '';
        for (let i = 0; i < rawLines.length; i++) {
          accumulated += rawLines[i] + '\n';
          // try parsing a "closed" snippet — first line that breaks it
          try {
            JSON.parse(accumulated + '}');
          } catch {
            line = i;
            break;
          }
        }
      }
      return { isValidJson: false, errorLine: line, errorMsg: e.message };
    }
  })();

  const LINE_H = 22;

  return (
    <div
      style={{
        height: '100vh',
        background: C.toolbarBg,
        color: C.text,
        fontFamily: "'JetBrains Mono','Cascadia Code','Consolas',monospace",
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontSize: '13px',
      }}
    >
      {/* ── Toolbar ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '7px 14px',
          background: C.toolbarBg,
          borderBottom: `1px solid ${C.border}`,
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: '11px',
            color: '#858585',
            fontWeight: 600,
            letterSpacing: '0.06em',
          }}
        >
          Body
        </span>
        <span
          style={{
            fontSize: '10px',
            padding: '2px 7px',
            borderRadius: '3px',
            background: '#0d2137',
            color: '#3b82f6',
            border: '1px solid #1e3a5f',
          }}
        >
          JSON
        </span>

        {/* ── JSON validity indicator ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '2px 8px',
            borderRadius: '3px',
            background: isValidJson
              ? 'rgba(34,197,94,0.08)'
              : 'rgba(239,68,68,0.08)',
            border: `1px solid ${isValidJson ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
            transition: 'all 0.2s',
          }}
        >
          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              flexShrink: 0,
              background: isValidJson ? '#22c55e' : '#ef4444',
              boxShadow: isValidJson
                ? '0 0 6px rgba(34,197,94,0.6)'
                : '0 0 6px rgba(239,68,68,0.6)',
              transition: 'all 0.2s',
            }}
          />
          <span
            style={{
              fontSize: '10px',
              fontWeight: 600,
              color: isValidJson ? '#4ade80' : '#f87171',
              letterSpacing: '0.04em',
            }}
          >
            {isValidJson ? 'Valid JSON' : 'Invalid JSON'}
          </span>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '7px' }}>
          <TBtn onClick={beautify} c='#3b82f6'>
            Beautify
          </TBtn>
          <TBtn onClick={addField} c='#22c55e'>
            ＋ Add
          </TBtn>
        </div>
      </div>

      {/* ── Column labels ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '70% 30%',
          borderBottom: `1px solid ${C.border}`,
          flexShrink: 0,
          background: '#252526',
        }}
      >
        <div
          style={{
            padding: '4px 14px',
            fontSize: '10px',
            color: '#6a6a6a',
            textTransform: 'uppercase',
            letterSpacing: '0.09em',
            borderRight: `1px solid ${C.border}`,
          }}
        >
          Editor
        </div>
        <div
          style={{
            padding: '4px 12px',
            fontSize: '10px',
            color: '#6a6a6a',
            textTransform: 'uppercase',
            letterSpacing: '0.09em',
          }}
        >
          Substitute
        </div>
      </div>

      {/* ── Panes ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* ══ LEFT 70% — syntax-highlighted editor ══════════════ */}
        <div
          style={{
            width: '70%',
            borderRight: `1px solid ${C.border}`,
            display: 'flex',
            overflow: 'hidden',
            position: 'relative',
            background: C.editorBg,
          }}
        >
          {/* line numbers gutter */}
          <div
            style={{
              width: '42px',
              flexShrink: 0,
              background: C.lineNumBg,
              borderRight: `1px solid ${C.gutter}`,
              paddingTop: '10px',
              userSelect: 'none',
              overflowY: 'hidden',
            }}
          >
            {lines.map((l) => {
              const isErrLine = !isValidJson && errorLine === l.index;
              return (
                <div
                  key={l.index}
                  style={{
                    height: `${LINE_H}px`,
                    lineHeight: `${LINE_H}px`,
                    textAlign: 'right',
                    paddingRight: '10px',
                    fontSize: '12px',
                    color: isErrLine
                      ? '#f87171'
                      : hoveredLine === l.index
                        ? C.lineNumHov
                        : C.lineNum,
                    background: isErrLine
                      ? 'rgba(239,68,68,0.12)'
                      : 'transparent',
                    transition: 'color 0.1s',
                    position: 'relative',
                  }}
                >
                  {isErrLine ? (
                    <span
                      style={{
                        position: 'absolute',
                        left: '4px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontSize: '10px',
                      }}
                    >
                      ⚠
                    </span>
                  ) : null}
                  {l.index + 1}
                </div>
              );
            })}
          </div>

          {/* hover highlight layer */}
          <div
            style={{
              position: 'absolute',
              left: '42px',
              right: 0,
              top: '10px',
              pointerEvents: 'none',
              zIndex: 1,
            }}
          >
            {lines.map((l) => {
              const isErrLine = !isValidJson && errorLine === l.index;
              const isHov = hoveredLine === l.index;
              return (
                <div
                  key={l.index}
                  style={{
                    height: `${LINE_H}px`,
                    background: isErrLine
                      ? 'rgba(239,68,68,0.10)'
                      : isHov
                        ? C.rowHov
                        : 'transparent',
                    borderLeft: isErrLine
                      ? '2px solid #ef4444'
                      : isHov
                        ? `2px solid ${C.rowHovBdr}`
                        : '2px solid transparent',
                    boxShadow: isErrLine
                      ? 'inset 0 0 0 1px rgba(239,68,68,0.15)'
                      : 'none',
                    transition: 'background 0.1s, border-color 0.1s',
                  }}
                />
              );
            })}
          </div>

          {/* syntax-colored overlay — shown when NOT focused */}
          <div
            ref={overlayRef}
            onClick={() => {
              textareaRef.current?.focus();
              setEditorFocused(true);
            }}
            style={{
              position: 'absolute',
              left: '42px',
              right: 0,
              top: 0,
              bottom: 0,
              paddingTop: '10px',
              paddingLeft: '14px',
              paddingRight: '10px',
              overflowY: 'auto',
              overflowX: 'hidden',
              zIndex: editorFocused ? 0 : 2,
              opacity: editorFocused ? 0 : 1,
              pointerEvents: editorFocused ? 'none' : 'auto',
              cursor: 'text',
            }}
          >
            {lines.map((l) => {
              const isErrLine = !isValidJson && errorLine === l.index;
              return (
                <div
                  key={l.index}
                  style={{
                    height: `${LINE_H}px`,
                    lineHeight: `${LINE_H}px`,
                    whiteSpace: 'pre',
                    textDecoration: isErrLine
                      ? 'underline wavy #ef4444'
                      : 'none',
                    textDecorationSkipInk: 'none',
                    position: 'relative',
                  }}
                  onMouseEnter={() => setHoveredLine(l.index)}
                  onMouseLeave={() => setHoveredLine(null)}
                >
                  <TokenizedLine raw={l.raw} sub={null} />
                  {isErrLine && errorMsg && (
                    <span
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: '100%',
                        background: '#3b1111',
                        border: '1px solid #ef444466',
                        color: '#fca5a5',
                        fontSize: '10px',
                        padding: '2px 8px',
                        borderRadius: '0 0 4px 4px',
                        whiteSpace: 'nowrap',
                        zIndex: 10,
                        maxWidth: '400px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        pointerEvents: 'none',
                      }}
                    >
                      {errorMsg}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* actual editable textarea */}
          <textarea
            ref={textareaRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onFocus={() => setEditorFocused(true)}
            onBlur={() => setEditorFocused(false)}
            onClick={syncCursorLine}
            onKeyUp={syncCursorLine}
            onScroll={syncScroll}
            spellCheck={false}
            style={{
              flex: 1,
              paddingTop: '10px',
              paddingLeft: '14px',
              paddingRight: '10px',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: editorFocused ? C.text : 'transparent',
              fontSize: '13px',
              lineHeight: `${LINE_H}px`,
              fontFamily: 'inherit',
              resize: 'none',
              position: 'relative',
              zIndex: editorFocused ? 2 : 1,
              caretColor: C.caret,
              overflowY: 'auto',
              minHeight: '100%',
            }}
          />
        </div>

        {/* ══ RIGHT 30% — substitute panel ══════════════════════ */}
        <div
          style={{
            width: '30%',
            overflowY: 'auto',
            background: C.rightBg,
          }}
        >
          <div style={{ height: '10px' }} />

          {lines.map((l) => {
            if (!l.hasKey) {
              // structural line — empty slot to keep row alignment
              return <div key={l.index} style={{ height: `${LINE_H}px` }} />;
            }

            const sub = substitutions[l.key];
            const varInfo = ALL_VARS.find((v) => v.name === sub);
            const isHov = hoveredLine === l.index;
            const isVarOp = varPanelKey === l.key;

            return (
              <div
                key={l.index}
                onMouseEnter={() => setHoveredLine(l.index)}
                onMouseLeave={() => {
                  if (!isVarOp) setHoveredLine(null);
                }}
                style={{
                  borderLeft: `2px solid ${isHov ? C.rightBdr : 'transparent'}`,
                  background: isHov ? C.rightHov : 'transparent',
                  transition: 'background 0.1s, border-color 0.1s',
                  borderBottom: `1px solid rgba(255,255,255,0.03)`,
                }}
              >
                {/* row — 22px, right-aligned actions */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    height: `${LINE_H}px`,
                    padding: '0 8px',
                    gap: '5px',
                  }}
                >
                  {sub ? (
                    <>
                      <span
                        style={{
                          padding: '1px 7px',
                          borderRadius: '3px',
                          fontSize: '10px',
                          fontWeight: 700,
                          whiteSpace: 'nowrap',
                          background:
                            varInfo?.type === 'dynamic' ? '#2d1a52' : '#0e2040',
                          color: '#c5dff8',
                          border: `1px solid ${varInfo?.type === 'dynamic' ? '#6d28d9' : '#1d4ed8'}`,
                        }}
                      >{`{{${sub}}}`}</span>
                      {isHov && (
                        <ABtn c='#ef4444' onClick={() => removeSub(l.key)}>
                          ✕
                        </ABtn>
                      )}
                    </>
                  ) : isHov ? (
                    <ABtn
                      c='#3794ff'
                      onClick={() => {
                        setVarPanelKey(isVarOp ? null : l.key);
                        setVarSearch('');
                      }}
                    >
                      Substitute Variable
                    </ABtn>
                  ) : null}
                </div>

                {/* variable picker dropdown */}
                {isVarOp && (
                  <div
                    style={{
                      margin: '2px 6px 6px 6px',
                      background: '#1e1e2e',
                      border: `1px solid #3794ff44`,
                      borderRadius: '5px',
                      overflow: 'hidden',
                      animation: 'slideDown 0.14s ease',
                    }}
                  >
                    <div
                      style={{
                        padding: '5px 7px',
                        borderBottom: `1px solid ${C.border}`,
                      }}
                    >
                      <input
                        autoFocus
                        value={varSearch}
                        onChange={(e) => setVarSearch(e.target.value)}
                        placeholder='Search…'
                        style={{
                          width: '100%',
                          padding: '3px 8px',
                          borderRadius: '3px',
                          border: `1px solid #3794ff55`,
                          background: '#141424',
                          color: C.text,
                          fontSize: '11px',
                          fontFamily: 'inherit',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                    <div style={{ maxHeight: '160px', overflowY: 'auto' }}>
                      {['static', 'dynamic'].map((type) => {
                        const group = filteredVars.filter(
                          (v) => v.type === type,
                        );
                        if (!group.length) return null;
                        return (
                          <div key={type}>
                            <div
                              style={{
                                padding: '3px 8px',
                                fontSize: '9px',
                                color: '#6a6a6a',
                                textTransform: 'uppercase',
                                letterSpacing: '0.08em',
                                background: '#181828',
                                borderBottom: `1px solid ${C.border}`,
                                position: 'sticky',
                                top: 0,
                              }}
                            >
                              {type === 'static' ? '🔒 Static' : '⚡ Dynamic'}
                            </div>
                            {group.map((v) => (
                              <div
                                key={v.name}
                                onClick={() => setSub(l.key, v.name)}
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  padding: '5px 9px',
                                  cursor: 'pointer',
                                  fontSize: '11px',
                                  borderBottom: `1px solid #1a1a2a`,
                                  transition: 'background 0.08s',
                                }}
                                onMouseEnter={(e) =>
                                  (e.currentTarget.style.background = '#2a2d3e')
                                }
                                onMouseLeave={(e) =>
                                  (e.currentTarget.style.background =
                                    'transparent')
                                }
                              >
                                <span
                                  style={{ color: '#9cdcfe', fontWeight: 700 }}
                                >
                                  {v.name}
                                </span>
                                <span
                                  style={{
                                    color: '#6a6a6a',
                                    fontSize: '10px',
                                    maxWidth: '90px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {v.value}
                                </span>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                      {filteredVars.length === 0 && (
                        <div
                          style={{
                            padding: '10px',
                            textAlign: 'center',
                            color: '#4a4a5a',
                            fontSize: '11px',
                          }}
                        >
                          No variables
                        </div>
                      )}
                    </div>
                    <div
                      style={{
                        padding: '3px 8px',
                        borderTop: `1px solid ${C.border}`,
                        display: 'flex',
                        justifyContent: 'flex-end',
                      }}
                    >
                      <button
                        onClick={() => setVarPanelKey(null)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#6a6a6a',
                          cursor: 'pointer',
                          fontSize: '10px',
                          fontFamily: 'inherit',
                        }}
                      >
                        Close ✕
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          <div style={{ height: '20px' }} />
        </div>
      </div>

      {/* ── Footer ── */}
      <div
        style={{
          display: 'flex',
          gap: '20px',
          padding: '4px 14px',
          borderTop: `1px solid ${C.border}`,
          background: '#1a1a1a',
          fontSize: '10px',
          color: '#4a4a4a',
          flexShrink: 0,
        }}
      >
        <span>Click editor to type · click away to preview syntax colors</span>
        <span style={{ marginLeft: 'auto' }}>
          Hover any row → Substitute Variable
        </span>
      </div>

      <style>{`
        @keyframes slideDown {
          from { opacity:0; transform:translateY(-4px); }
          to   { opacity:1; transform:translateY(0); }
        }
        *::-webkit-scrollbar { width:6px; height:6px; }
        *::-webkit-scrollbar-track { background:transparent; }
        *::-webkit-scrollbar-thumb { background:#3c3c3c; border-radius:3px; }
        * { box-sizing:border-box; }
      `}</style>
    </div>
  );
}

function TBtn({ onClick, c, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '3px 10px',
        borderRadius: '3px',
        border: `1px solid ${c}44`,
        background: c + '18',
        color: c,
        fontSize: '11px',
        cursor: 'pointer',
        fontFamily: 'inherit',
        fontWeight: 600,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = c + '30')}
      onMouseLeave={(e) => (e.currentTarget.style.background = c + '18')}
    >
      {children}
    </button>
  );
}

function ABtn({ onClick, c, children }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      style={{
        padding: '1px 8px',
        borderRadius: '3px',
        border: `1px solid ${c}44`,
        background: c + '18',
        color: c,
        fontSize: '10px',
        fontWeight: 600,
        cursor: 'pointer',
        fontFamily: 'inherit',
        whiteSpace: 'nowrap',
        transition: 'background 0.1s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = c + '33')}
      onMouseLeave={(e) => (e.currentTarget.style.background = c + '18')}
    >
      {children}
    </button>
  );
}
