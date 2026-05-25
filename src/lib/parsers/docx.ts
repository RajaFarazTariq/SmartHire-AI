import mammoth from "mammoth";

export async function extractDocxText(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

/**
 * Converts a DOCX into clean, semantic HTML for inline preview.
 * mammoth emits a constrained tag set (headings, paragraphs, lists, tables,
 * data-URI images) and never <script>, but we still strip event handlers and
 * dangerous URL schemes as defense-in-depth (the file may be attacker-supplied).
 */
export async function renderDocxHtml(buffer: Buffer): Promise<string> {
  const result = await mammoth.convertToHtml(
    { buffer },
    {
      styleMap: [
        "p[style-name='Title'] => h1:fresh",
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh",
        "p[style-name='Heading 3'] => h3:fresh",
      ],
    },
  );
  return sanitizeDocxHtml(result.value);
}

function sanitizeDocxHtml(html: string): string {
  return (
    html
      // Drop anything executable defensively.
      .replace(/<\/?(script|style|iframe|object|embed|link|meta)\b[^>]*>/gi, "")
      // Strip inline event handlers (onclick, onerror, …).
      .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
      // Neutralize javascript:/vbscript: URLs (keeps data:image used for inline images).
      .replace(
        /(href|src)\s*=\s*("|')\s*(?:javascript|vbscript):[^"']*\2/gi,
        '$1=$2#$2',
      )
  );
}
