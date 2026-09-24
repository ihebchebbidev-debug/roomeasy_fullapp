import { useEffect, useRef } from "react";
import DOMPurify from "dompurify";
import { Bold, Heading2, Heading3, Italic, Link2, List, ListOrdered, Quote, RemoveFormatting, Underline } from "lucide-react";

import { cn } from "@/lib/utils";

const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Converts older plain-text pages ("## " headings, blank-line paragraphs) to HTML. */
export function toHtml(body: string): string {
  if (/<\/?(p|h[1-6]|ul|ol|li|strong|em|b|i|u|br|a|blockquote|div)\b/i.test(body)) return body;
  return body
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean)
    .map((b) => (b.startsWith("## ") ? `<h2>${escape(b.slice(3))}</h2>` : `<p>${escape(b).replace(/\n/g, "<br>")}</p>`))
    .join("");
}

export function sanitize(html: string): string {
  if (typeof window === "undefined") return "";
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["p", "br", "strong", "b", "em", "i", "u", "s", "h2", "h3", "ul", "ol", "li", "a", "blockquote", "div", "span"],
    ALLOWED_ATTR: ["href", "target", "rel"],
  });
}

export const richTextClass =
  "max-w-none text-sm leading-relaxed text-muted-foreground [&_a]:text-primary [&_a]:underline [&_b]:font-semibold [&_b]:text-foreground [&_strong]:font-semibold [&_strong]:text-foreground [&_blockquote]:border-l-4 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:italic [&_h2]:mt-6 [&_h2]:mb-2 [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-foreground [&_h3]:mt-4 [&_h3]:mb-1 [&_h3]:font-semibold [&_h3]:text-foreground [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:my-1 break-words";

export function RichTextView({ body, className }: { body: string; className?: string }) {
  return <div className={cn(richTextClass, className)} dangerouslySetInnerHTML={{ __html: sanitize(toHtml(body)) }} />;
}

export function RichTextEditor({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const last = useRef<string>("");

  useEffect(() => {
    if (!ref.current || value === last.current) return;
    const html = sanitize(toHtml(value));
    ref.current.innerHTML = html;
    last.current = value;
  }, [value]);

  const emit = () => {
    if (!ref.current) return;
    const html = ref.current.innerHTML;
    last.current = html;
    onChange(html);
  };

  const exec = (cmd: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(cmd, false, arg);
    emit();
  };

  const tools = [
    { icon: Bold, label: "Bold", run: () => exec("bold") },
    { icon: Italic, label: "Italic", run: () => exec("italic") },
    { icon: Underline, label: "Underline", run: () => exec("underline") },
    { icon: Heading2, label: "Heading", run: () => exec("formatBlock", "<h2>") },
    { icon: Heading3, label: "Subheading", run: () => exec("formatBlock", "<h3>") },
    { icon: List, label: "Bullet list", run: () => exec("insertUnorderedList") },
    { icon: ListOrdered, label: "Numbered list", run: () => exec("insertOrderedList") },
    { icon: Quote, label: "Quote", run: () => exec("formatBlock", "<blockquote>") },
    {
      icon: Link2,
      label: "Link",
      run: () => {
        const url = window.prompt("Link address (https://…)");
        if (url && /^(https?:|mailto:|\/)/i.test(url)) exec("createLink", url);
      },
    },
    { icon: RemoveFormatting, label: "Clear formatting", run: () => { exec("removeFormat"); exec("formatBlock", "<p>"); } },
  ];

  return (
    <div className="overflow-hidden rounded-md border border-input bg-background">
      <div className="flex flex-wrap gap-1 border-b border-border bg-muted/50 p-1">
        {tools.map(({ icon: Icon, label, run }) => (
          <button
            key={label}
            type="button"
            title={label}
            aria-label={label}
            onMouseDown={(e) => e.preventDefault()}
            onClick={run}
            className="grid h-8 w-8 place-items-center rounded text-muted-foreground hover:bg-background hover:text-foreground"
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={emit}
        onBlur={emit}
        className={cn(richTextClass, "min-h-[320px] p-3 outline-none")}
      />
    </div>
  );
}
