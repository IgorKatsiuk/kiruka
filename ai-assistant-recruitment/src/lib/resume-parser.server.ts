// Server-only resume text extractor. Imported from .functions.ts files via
// dynamic-safe top-level import (these libs are pure JS and Worker-compatible
// for our cases — pdf-parse + mammoth work in Node/Workers with buffers).

export async function extractResumeText(buf: Buffer, ext: "pdf" | "docx"): Promise<string> {
  if (ext === "pdf") {
    const mod: any = await import("pdf-parse");
    const pdfParse = mod.default ?? mod;
    const result = await pdfParse(buf);
    return (result.text ?? "").trim();
  }
  if (ext === "docx") {
    const mammoth: any = await import("mammoth");
    const { value } = await mammoth.extractRawText({ buffer: buf });
    return (value ?? "").trim();
  }
  return "";
}
