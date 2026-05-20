// Importing from /lib/pdf-parse avoids pdf-parse's index.js side effect
// that tries to read a test PDF file at module load.
import pdf from "pdf-parse/lib/pdf-parse.js";

export async function extractPdfText(buffer: Buffer): Promise<string> {
  const data = await pdf(buffer);
  return data.text;
}
