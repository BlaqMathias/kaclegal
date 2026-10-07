/** Structured article text, shared by the editor, API validation and reader.
 * No submitted HTML is stored or rendered. Only these blocks/marks survive.
 */
export const MAX_ARTICLE_CHARACTERS = 100000;
export const MAX_ARTICLE_BYTES = 1000000;

export function safeArticleLink(value) {
  if (typeof value !== "string" || value.length > 2048) return null;
  const href = value.trim();
  if (/[\u0000-\u0020\u007f]/.test(href)) return null;
  if (!/^(https?:\/\/|mailto:)/i.test(href)) return null;
  try {
    const url = new URL(href);
    if (url.protocol !== "mailto:" && (!url.hostname || url.username || url.password)) return null;
    return href;
  } catch {
    return null;
  }
}

export function normalizeArticleContent(value) {
  if (value == null) return { ok: true, content: null, text: "" };
  if (!value || typeof value !== "object" || value.version !== 1 ||
      !Array.isArray(value.blocks) || value.blocks.length > 2000) {
    return { ok: false, error: "The article content is not valid. Please paste it into the editor again." };
  }
  let characters = 0;
  let runs = 0;
  const text = [];
  function normalizeRuns(children) {
    if (!Array.isArray(children)) throw new Error("Invalid paragraph.");
    return children.map((run) => {
      if (!run || typeof run.text !== "string") throw new Error("Invalid article text.");
      characters += run.text.length;
      runs += 1;
      if (characters > MAX_ARTICLE_CHARACTERS || runs > 20000) {
        throw new Error(`Articles must contain ${MAX_ARTICLE_CHARACTERS.toLocaleString("en-US")} characters or fewer.`);
      }
      text.push(run.text);
      const result = { text: run.text };
      for (const mark of ["bold", "italic", "underline"]) {
        if (run[mark] === true) result[mark] = true;
      }
      const href = safeArticleLink(run.href);
      if (href) result.href = href;
      return result;
    });
  }
  try {
    const blocks = value.blocks.map((block) => {
      if (!block || typeof block !== "object") throw new Error("Invalid article block.");
      if (block.type === "paragraph") {
        const children = normalizeRuns(block.children);
        text.push("\n");
        return { type: "paragraph", children };
      }
      if (block.type === "heading" && [2, 3].includes(block.level)) {
        const children = normalizeRuns(block.children);
        text.push("\n");
        return { type: "heading", level: block.level, children };
      }
      if (["bulletList", "orderedList"].includes(block.type) &&
          Array.isArray(block.items) && block.items.length <= 2000) {
        return { type: block.type, items: block.items.map((item) => {
          const children = normalizeRuns(item);
          text.push("\n");
          return children;
        }) };
      }
      throw new Error("Unsupported article formatting.");
    });
    const content = { version: 1, blocks };
    if (JSON.stringify(content).length > MAX_ARTICLE_BYTES) throw new Error("This article is too large to save.");
    return { ok: true, content, text: text.join("") };
  } catch (error) {
    return { ok: false, error: error.message || "The article content is not valid." };
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}

/** Used only to populate the editable surface from validated structured text. */
export function articleContentToHtml(value) {
  const normalized = normalizeArticleContent(value);
  if (!normalized.ok || !normalized.content) return "";
  const inline = (children) => children.map((run) => {
    let html = escapeHtml(run.text).replace(/\n/g, "<br>");
    if (run.bold) html = `<strong>${html}</strong>`;
    if (run.italic) html = `<em>${html}</em>`;
    if (run.underline) html = `<u>${html}</u>`;
    if (run.href) html = `<a href="${escapeHtml(run.href)}">${html}</a>`;
    return html;
  }).join("");
  return normalized.content.blocks.map((block) => {
    if (block.type === "heading") return `<h${block.level}>${inline(block.children) || "<br>"}</h${block.level}>`;
    if (block.type === "paragraph") return `<p>${inline(block.children) || "<br>"}</p>`;
    const tag = block.type === "orderedList" ? "ol" : "ul";
    return `<${tag}>${block.items.map((item) => `<li>${inline(item) || "<br>"}</li>`).join("")}</${tag}>`;
  }).join("");
}

/** Browser DOM -> structured text. Discards images, embeds, scripts and styles. */
export function articleContentFromDom(root) {
  const ignored = new Set(["SCRIPT", "STYLE", "IFRAME", "OBJECT", "EMBED", "IMG", "SVG", "VIDEO", "AUDIO", "NOSCRIPT", "TEMPLATE"]);
  const blockTags = new Set(["P", "DIV", "H1", "H2", "H3", "H4", "H5", "H6", "UL", "OL", "BLOCKQUOTE", "SECTION", "ARTICLE", "PRE", "TABLE", "TR", "TD"]);
  function inline(nodes, marks = {}) {
    const children = [];
    for (const node of nodes) {
      if (node.nodeType === 3) {
        if (node.textContent) children.push({ text: node.textContent, ...marks });
      } else if (node.nodeType === 1 && !ignored.has(node.tagName)) {
        if (node.tagName === "BR") { children.push({ text: "\n", ...marks }); continue; }
        const next = { ...marks };
        if (["B", "STRONG"].includes(node.tagName) || /^(bold|[6-9]00)$/.test(node.style.fontWeight)) next.bold = true;
        if (["I", "EM"].includes(node.tagName) || node.style.fontStyle === "italic") next.italic = true;
        if (node.tagName === "U" || node.style.textDecoration.includes("underline")) next.underline = true;
        if (node.tagName === "A") {
          const href = safeArticleLink(node.getAttribute("href"));
          if (href) next.href = href;
        }
        children.push(...inline(node.childNodes, next));
      }
    }
    return children;
  }
  const blocks = [];
  function walk(container) {
    let loose = [];
    const flush = () => {
      if (loose.length && loose.some((run) => run.text.trim())) blocks.push({ type: "paragraph", children: loose });
      loose = [];
    };
    for (const node of container.childNodes) {
      if (node.nodeType === 1 && ignored.has(node.tagName)) continue;
      if (node.nodeType !== 1 || !blockTags.has(node.tagName)) {
        loose.push(...inline([node]));
        continue;
      }
      flush();
      if (["UL", "OL"].includes(node.tagName)) {
        blocks.push({ type: node.tagName === "OL" ? "orderedList" : "bulletList",
          items: Array.from(node.children).filter((child) => child.tagName === "LI").map((item) => inline(item.childNodes)) });
      } else if (/^H[1-6]$/.test(node.tagName)) {
        blocks.push({ type: "heading", level: ["H1", "H2"].includes(node.tagName) ? 2 : 3, children: inline(node.childNodes) });
      } else if (Array.from(node.children).some((child) => blockTags.has(child.tagName))) {
        walk(node);
      } else {
        blocks.push({ type: "paragraph", children: inline(node.childNodes) });
      }
    }
    flush();
  }
  walk(root);
  return { version: 1, blocks };
}
