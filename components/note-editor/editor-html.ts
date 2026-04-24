/**
 * Standalone HTML page hosting CodeMirror 6 with Obsidian-style markdown
 * live preview. Loaded by `MarkdownEditor` via `react-native-webview`.
 *
 * Live preview = formatting marks (** _ # ` etc.) are dimmed/hidden on lines
 * the cursor is NOT on, and shown on the active line so the user can edit
 * them. Headings, bold, italic, code blocks render visually as you type.
 *
 * Modules are pulled from esm.sh on first load. The bundle (~80 kB gz) is
 * cached by the WebView so subsequent opens are fast. No native build step.
 */
export function buildEditorHtml(initial: { value: string; theme: ThemeForEditor }): string {
  const t = initial.theme;
  // Stringify doc safely for embedding in JS.
  const initialDoc = JSON.stringify(initial.value ?? '');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no,maximum-scale=1,viewport-fit=cover" />
<style>
  :root {
    --bg: ${t.bg};
    --text: ${t.text};
    --text-dim: ${t.textDim};
    --muted: ${t.muted};
    --muted-deep: ${t.mutedDeep};
    --accent: ${t.accent};
    --accent-soft: ${t.accentSoft};
    --surface: ${t.surface};
    --border: ${t.borderSoft};
  }
  * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
  html, body {
    margin: 0; padding: 0; height: 100%; width: 100%;
    background: var(--bg);
    color: var(--text);
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, sans-serif;
    overscroll-behavior: none;
    -webkit-text-size-adjust: 100%;
  }
  /* Force the OS-drawn text caret to use the accent colour everywhere
     inside the editor. Without !important, WebView / contenteditable
     defaults to black, which on a near-black background = invisible. */
  *,
  body,
  html,
  .cm-editor,
  .cm-editor .cm-content,
  .cm-content [contenteditable] {
    caret-color: ${t.accent} !important;
  }
  #editor { height: 100%; width: 100%; }

  /* ---- CodeMirror chrome ---- */
  .cm-editor { height: 100%; background: transparent; outline: none; }
  .cm-editor.cm-focused { outline: none; }
  .cm-scroller {
    overflow-y: auto;
    padding: 16px 20px 24px 20px;
    line-height: 1.6;
    font-size: 17px;
    -webkit-overflow-scrolling: touch;
  }
  .cm-content { padding: 0; }
  .cm-line { padding: 1px 0; }
  .cm-cursor,
  .cm-cursor.cm-cursor-primary,
  .cm-editor .cm-cursor {
    border-left: 2px solid ${t.accent} !important;
    border-color: ${t.accent} !important;
  }
  .cm-selectionBackground, .cm-content ::selection {
    background: ${t.accentSoft} !important;
  }

  /* ---- Markdown live preview ---- */
  /* Headings: render as you type, mark visible on active line only */
  .tok-h1 { font-size: 28px; font-weight: 700; line-height: 1.25; letter-spacing: -0.4px; color: var(--text); }
  .tok-h2 { font-size: 23px; font-weight: 700; line-height: 1.3;  letter-spacing: -0.3px; color: var(--text); }
  .tok-h3 { font-size: 19px; font-weight: 600; line-height: 1.3;  color: var(--text); }
  .tok-h4 { font-size: 17px; font-weight: 600; color: var(--text); }
  .tok-strong { font-weight: 700; color: var(--text); }
  .tok-em { font-style: italic; color: var(--text); }
  .tok-strikethrough { text-decoration: line-through; color: var(--muted); }
  .tok-link { color: var(--accent); text-decoration: none; }
  .tok-link-text { color: var(--accent); }
  .tok-url { color: var(--muted); }
  .tok-quote { color: var(--text-dim); font-style: italic; }
  .tok-list-mark { color: var(--accent); }
  .tok-code-inline {
    font-family: 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace;
    background: var(--surface);
    color: var(--accent);
    border-radius: 4px;
    padding: 1px 6px;
    font-size: 14px;
  }
  .tok-code-block {
    font-family: 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace;
    color: var(--text-dim);
    font-size: 14px;
    line-height: 1.55;
  }
  .tok-fence-mark { color: var(--muted-deep); }
  .tok-mark {
    color: var(--muted-deep);
    font-weight: 400;
    font-style: normal;
  }

  /* On lines the cursor is NOT on: hide the marks entirely.
     CodeMirror adds .cm-activeLine to the cursor's line, so anywhere else
     we drop marks to display:none. */
  .cm-line:not(.cm-activeLine) .tok-mark,
  .cm-line:not(.cm-activeLine) .tok-fence-mark,
  .cm-line:not(.cm-activeLine) .tok-url-paren {
    display: none;
  }
  /* The link URL & its parens are only meaningful in editing — hide on inactive lines */
  .cm-line:not(.cm-activeLine) .tok-url { display: none; }

  /* Quote block: gentle accent rule */
  .cm-line:has(.tok-quote-mark) {
    border-left: 2px solid var(--accent);
    padding-left: 8px;
    margin-left: -10px;
  }
  .tok-quote-mark { display: none; }

  /* Active line: keep the .cm-activeLine class (we use it for the mark-hiding
     CSS above) but make the highlight itself basically invisible. The cursor
     itself is the visual cue for where you're editing. */
  .cm-activeLine,
  .cm-editor .cm-activeLine {
    background: transparent !important;
    border-radius: 0 !important;
  }

  /* Code block lines get a tinted background */
  .cm-line:has(.tok-code-block) { background: var(--surface); }

  /* Placeholder */
  .cm-placeholder { color: var(--muted-deep); font-style: normal; }
</style>
</head>
<body>
<div id="editor"></div>

<script type="module">
  import { EditorState, RangeSetBuilder } from 'https://esm.sh/@codemirror/state@6';
  import { EditorView, keymap, highlightActiveLine, placeholder, ViewPlugin, Decoration } from 'https://esm.sh/@codemirror/view@6';
  import { defaultKeymap, history, historyKeymap, undo, redo } from 'https://esm.sh/@codemirror/commands@6';
  import { markdown, markdownLanguage } from 'https://esm.sh/@codemirror/lang-markdown@6';
  import { syntaxTree } from 'https://esm.sh/@codemirror/language@6';

  const post = (msg) => {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify(msg));
    }
  };

  // Custom plugin: walk the syntax tree and apply 'tok-*' classes to nodes.
  // CodeMirror's built-in syntaxHighlighting + HighlightStyle would also work
  // but we want tighter control over which classes nodes get for our CSS.
  const markdownDecorations = ViewPlugin.fromClass(class {
    constructor(view) { this.decorations = this.build(view); }
    update(u) {
      if (u.docChanged || u.viewportChanged || u.selectionSet) {
        this.decorations = this.build(u.view);
      }
    }
    build(view) {
      const builder = new RangeSetBuilder();
      const map = {
        ATXHeading1: 'tok-h1',
        ATXHeading2: 'tok-h2',
        ATXHeading3: 'tok-h3',
        ATXHeading4: 'tok-h4',
        ATXHeading5: 'tok-h4',
        ATXHeading6: 'tok-h4',
        SetextHeading1: 'tok-h1',
        SetextHeading2: 'tok-h2',
        StrongEmphasis: 'tok-strong',
        Emphasis: 'tok-em',
        Strikethrough: 'tok-strikethrough',
        Link: 'tok-link',
        Image: 'tok-link',
        Blockquote: 'tok-quote',
        InlineCode: 'tok-code-inline',
        FencedCode: 'tok-code-block',
        CodeBlock: 'tok-code-block',
        URL: 'tok-url',
        LinkLabel: 'tok-link-text',
      };
      const markMap = {
        HeaderMark: 'tok-mark',
        EmphasisMark: 'tok-mark',
        StrikethroughMark: 'tok-mark',
        CodeMark: 'tok-mark',
        LinkMark: 'tok-mark',
        ListMark: 'tok-list-mark',
        QuoteMark: 'tok-quote-mark',
        CodeInfo: 'tok-fence-mark',
        FenceMark: 'tok-fence-mark',
      };
      const ranges = [];
      for (const { from, to } of view.visibleRanges) {
        syntaxTree(view.state).iterate({
          from, to,
          enter: (node) => {
            const cls = map[node.name] ?? markMap[node.name];
            if (cls) {
              ranges.push({ from: node.from, to: node.to, cls });
            }
          },
        });
      }
      // Sort by from, then by length DESC so wrapping decorations (e.g. heading)
      // are added before the inner mark decorations sitting at the same offset.
      ranges.sort((a, b) => a.from - b.from || (b.to - b.from) - (a.to - a.from));
      for (const r of ranges) {
        builder.add(r.from, r.to, Decoration.mark({ class: r.cls }));
      }
      return builder.finish();
    }
  }, { decorations: v => v.decorations });

  const updateListener = EditorView.updateListener.of((u) => {
    if (u.docChanged) {
      post({ type: 'change', text: u.state.doc.toString() });
    }
  });

  const startState = EditorState.create({
    doc: ${initialDoc},
    extensions: [
      history(),
      keymap.of([...defaultKeymap, ...historyKeymap]),
      EditorView.lineWrapping,
      markdown({ base: markdownLanguage, addKeymap: true }),
      markdownDecorations,
      highlightActiveLine(),
      updateListener,
      placeholder('Start writing…'),
    ],
  });

  const view = new EditorView({ state: startState, parent: document.getElementById('editor') });

  // Expose a single message handler for RN to call via injectJavaScript.
  window.__editor_handle = function (raw) {
    let msg;
    try { msg = typeof raw === 'string' ? JSON.parse(raw) : raw; }
    catch (e) { post({ type: 'error', message: 'bad json' }); return; }
    switch (msg.type) {
      case 'setValue': {
        const cur = view.state.doc.toString();
        if (cur !== msg.text) {
          view.dispatch({
            changes: { from: 0, to: cur.length, insert: msg.text },
            selection: { anchor: 0, head: 0 },
          });
        }
        break;
      }
      case 'focus':  view.focus(); break;
      case 'blur':   view.contentDOM.blur?.(); document.activeElement?.blur?.(); break;
      case 'undo':   undo(view); break;
      case 'redo':   redo(view); break;
      case 'wrap': {
        const sel = view.state.selection.main;
        const selected = view.state.sliceDoc(sel.from, sel.to) || (msg.placeholder || 'text');
        const insert = msg.before + selected + msg.after;
        view.dispatch({
          changes: { from: sel.from, to: sel.to, insert },
          selection: {
            anchor: sel.from + msg.before.length,
            head: sel.from + msg.before.length + selected.length,
          },
        });
        view.focus();
        break;
      }
      case 'prefixLine': {
        const sel = view.state.selection.main;
        const line = view.state.doc.lineAt(sel.head);
        view.dispatch({
          changes: { from: line.from, insert: msg.prefix },
          selection: { anchor: sel.head + msg.prefix.length },
        });
        view.focus();
        break;
      }
    }
  };

  post({ type: 'ready' });
</script>
</body>
</html>`;
}

export type ThemeForEditor = {
  bg: string;
  text: string;
  textDim: string;
  muted: string;
  mutedDeep: string;
  accent: string;
  accentSoft: string;
  surface: string;
  borderSoft: string;
};
