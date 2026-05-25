import { renderDocxHtml } from "@/lib/parsers";

/** Reads a DOCX blob stream and returns an HTML Response for inline preview. */
export async function docxHtmlResponse(stream: ReadableStream): Promise<Response> {
  try {
    const buffer = Buffer.from(await new Response(stream).arrayBuffer());
    const html = await renderDocxHtml(buffer);
    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return new Response("Could not render document", { status: 422 });
  }
}
