"use client";

import { useEffect, useRef, useState } from "react";
import { articleContentFromDom, articleContentToHtml, MAX_ARTICLE_CHARACTERS, normalizeArticleContent, safeArticleLink } from "@/lib/articleContent";

export default function ArticleEditor({ value, onChange, error, disabled = false }) {
  const editor = useRef(null);
  const selection = useRef(null);
  const initialValue = useRef(value);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkError, setLinkError] = useState("");
  const [editorError, setEditorError] = useState("");
  useEffect(() => {
    editor.current.innerHTML = articleContentToHtml(initialValue.current);
  }, []);

  function rememberSelection() {
    const current = window.getSelection();
    if (current?.rangeCount && editor.current.contains(current.anchorNode) && editor.current.contains(current.focusNode)) {
      selection.current = current.getRangeAt(0).cloneRange();
    }
  }
  function focusEditor() {
    editor.current.focus();
    const current = window.getSelection();
    current.removeAllRanges();
    if (selection.current && editor.current.contains(selection.current.commonAncestorContainer)) {
      current.addRange(selection.current);
    } else {
      const range = document.createRange();
      range.selectNodeContents(editor.current);
      range.collapse(false);
      current.addRange(range);
    }
  }
  function emitChange() {
    // Keep the live DOM intact while typing, so React never resets the caret.
    onChange(articleContentFromDom(editor.current));
    rememberSelection();
  }
  function command(name, argument = null) {
    focusEditor();
    document.execCommand("defaultParagraphSeparator", false, "p");
    document.execCommand(name, false, argument);
    emitChange();
  }
  function paste(event) {
    event.preventDefault();
    const html = event.clipboardData.getData("text/html");
    const plain = event.clipboardData.getData("text/plain");
    let content;
    if (html) {
      const doc = new DOMParser().parseFromString(html, "text/html");
      content = articleContentFromDom(doc.body);
    } else {
      content = { version: 1, blocks: plain.replace(/\r\n?/g, "\n").split(/\n/).map((text) => ({ type: "paragraph", children: [{ text }] })) };
    }
    const normalized = normalizeArticleContent(content);
    if (!normalized.ok) { setEditorError(normalized.error); return; }
    setEditorError("");
    rememberSelection();
    command("insertHTML", articleContentToHtml(normalized.content));
  }
  const normalized = normalizeArticleContent(value);
  const characters = normalized.ok ? normalized.text.replace(/\n/g, "").length : null;
  const toolbarButton = "rounded px-3 py-2 text-sm font-medium text-brand-navy hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy disabled:opacity-50";
  return (
    <div>
      <label id="article-content-label" className="mb-1.5 block text-caption font-medium text-white">Article content <span aria-hidden="true">*</span></label>
      <div className={`overflow-hidden border bg-white ${error ? "border-brand-error" : "border-slate-300"}`}>
        <div role="toolbar" aria-label="Article formatting" className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-brand-offWhite p-2">
          {[["bold", "Bold", <strong key="b">B</strong>], ["italic", "Italic", <em key="i">I</em>], ["underline", "Underline", <u key="u">U</u>], ["insertUnorderedList", "Bullet list", "• List"], ["insertOrderedList", "Numbered list", "1. List"]].map(([name, label, icon]) =>
            <button key={name} type="button" title={label} aria-label={label} disabled={disabled} className={toolbarButton} onMouseDown={(event) => event.preventDefault()} onClick={() => command(name)}>{icon}</button>)}
          <select aria-label="Paragraph style" disabled={disabled} defaultValue="p" className={toolbarButton} onFocus={rememberSelection} onChange={(event) => command("formatBlock", event.target.value)}>
            <option value="p">Normal</option><option value="h2">Heading 2</option><option value="h3">Heading 3</option>
          </select>
          <button type="button" disabled={disabled} className={toolbarButton} onMouseDown={(event) => event.preventDefault()} onClick={() => { rememberSelection(); setLinkOpen(!linkOpen); setLinkError(""); }} aria-expanded={linkOpen}>Link</button>
          <button type="button" disabled={disabled} className={toolbarButton} onMouseDown={(event) => event.preventDefault()} onClick={() => command("unlink")}>Unlink</button>
          <button type="button" disabled={disabled} className={toolbarButton} onMouseDown={(event) => event.preventDefault()} onClick={() => command("removeFormat")}>Clear formatting</button>
        </div>
        {linkOpen && <div className="border-b border-slate-200 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="article-link" className="text-caption text-brand-slate">Link URL</label>
            <input id="article-link" type="url" value={linkUrl} disabled={disabled} placeholder="https://example.com" onChange={(event) => setLinkUrl(event.target.value)} className="min-w-0 flex-1 border border-slate-300 px-3 py-2 text-sm text-brand-slate" />
            <button type="button" disabled={disabled} className={toolbarButton} onClick={() => {
              const href = safeArticleLink(linkUrl);
              if (!href) { setLinkError("Enter an https://, http:// or mailto: link."); return; }
              focusEditor();
              if (window.getSelection().isCollapsed) { setLinkError("Select the text you want to link first."); return; }
              command("createLink", href); setLinkOpen(false); setLinkUrl(""); setLinkError("");
            }}>Apply link</button>
          </div>
          {linkError && <p role="alert" className="mt-2 text-caption text-brand-error">{linkError}</p>}
        </div>}
        <div ref={editor} role="textbox" aria-multiline="true" aria-required="true" aria-labelledby="article-content-label" aria-invalid={Boolean(error)} aria-describedby={error ? "article-content-error" : "article-content-hint"} contentEditable={!disabled} suppressContentEditableWarning
          data-placeholder="Paste or write your article here…" onInput={emitChange} onPaste={paste} onKeyUp={rememberSelection} onMouseUp={rememberSelection} onBlur={rememberSelection}
          onDrop={(event) => event.preventDefault()}
          className="min-h-[320px] max-h-[650px] overflow-y-auto p-5 text-body text-brand-slate outline-none focus:ring-2 focus:ring-inset focus:ring-brand-navy/30 [overflow-wrap:anywhere] [&:empty]:before:pointer-events-none [&:empty]:before:text-brand-muted [&:empty]:before:content-[attr(data-placeholder)] [&_p]:mb-4 [&_h2]:my-5 [&_h2]:text-h2 [&_h2]:font-bold [&_h3]:my-4 [&_h3]:text-h3 [&_h3]:font-bold [&_ul]:list-disc [&_ul]:pl-7 [&_ol]:list-decimal [&_ol]:pl-7 [&_li]:my-2 [&_a]:text-brand-navy [&_a]:underline" />
      </div>
      <p id="article-content-hint" className="mt-2 text-caption text-brand-muted">Paste and edit the full article. Headings, paragraphs, lists and text formatting are preserved. Articles are free and contain no images or attachments.</p>
      <p className="mt-1 text-caption text-brand-muted">{characters == null ? "Article exceeds the content limit." : `${characters.toLocaleString("en-US")} / ${MAX_ARTICLE_CHARACTERS.toLocaleString("en-US")} characters`}</p>
      {(error || editorError) && <p id="article-content-error" role="alert" className="mt-2 text-caption text-brand-error">{error || editorError}</p>}
    </div>
  );
}
