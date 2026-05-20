declare module "pdf-parse/lib/pdf-parse.js" {
  type PdfData = {
    text: string;
    numpages: number;
    numrender: number;
    info: Record<string, unknown>;
    metadata: unknown;
    version: string;
  };
  const pdf: (buffer: Buffer) => Promise<PdfData>;
  export default pdf;
}
