import { normalizeArticleContent } from "@/lib/articleContent";

function InlineText({ children }) {
  return children.map((run, index) => {
    let text = run.text;
    if (run.bold) text = <strong>{text}</strong>;
    if (run.italic) text = <em>{text}</em>;
    if (run.underline) text = <u>{text}</u>;
    if (run.href) text = <a href={run.href} rel="noopener noreferrer" className="text-brand-navy underline underline-offset-4">{text}</a>;
    return <span key={index}>{text}</span>;
  });
}

export default function ArticleBody({ content }) {
  const normalized = normalizeArticleContent(content);
  if (!normalized.ok || !normalized.content) return null;
  return (
    <div className="space-y-6 whitespace-pre-wrap text-body-lg leading-relaxed text-brand-slate [overflow-wrap:anywhere]">
      {normalized.content.blocks.map((block, index) => {
        if (block.type === "heading") {
          const Heading = block.level === 2 ? "h2" : "h3";
          return <Heading key={index} className={`pt-5 font-display font-bold text-brand-navyDark ${block.level === 2 ? "text-h2" : "text-h3"}`}><InlineText>{block.children}</InlineText></Heading>;
        }
        if (block.type === "paragraph") return <p key={index}><InlineText>{block.children}</InlineText></p>;
        const List = block.type === "orderedList" ? "ol" : "ul";
        return <List key={index} className={`space-y-2 pl-7 ${block.type === "orderedList" ? "list-decimal" : "list-disc"}`}>
          {block.items.map((item, itemIndex) => <li key={itemIndex}><InlineText>{item}</InlineText></li>)}
        </List>;
      })}
    </div>
  );
}
