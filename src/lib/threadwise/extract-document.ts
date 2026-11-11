/**
 * Browser-side document extraction. PDF text is read locally, so the file
 * never leaves the device; only the extracted text goes to the analyst.
 */
export async function extractPdfText(file: File, maxChars = 12_000): Promise<string> {
  if (!/\.pdf$/i.test(file.name) && file.type !== "application/pdf") {
    throw new Error("Choose a PDF file.");
  }

  const pdf = await import("pdfjs-dist");
  const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
  pdf.GlobalWorkerOptions.workerSrc = worker.default;

  const task = pdf.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  const document = await task.promise;
  let text = "";

  try {
    const pages = Math.min(document.numPages, 40);
    for (let page = 1; page <= pages; page += 1) {
      const current = await document.getPage(page);
      const content = await current.getTextContent();
      text += `\n[Page ${page}]\n${content.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ")}`;
    }
  } finally {
    await task.destroy();
  }

  const clean = text
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (!clean) {
    throw new Error("This PDF has no selectable text. Paste a screenshot of the page instead.");
  }
  return clean.slice(0, maxChars);
}

/** Plain text and Markdown are safe to read directly. */
export async function extractTextFile(file: File, maxChars = 12_000): Promise<string> {
  if (!/\.(txt|md|markdown)$/i.test(file.name) && !file.type.startsWith("text/")) {
    throw new Error("Choose a PDF, TXT or Markdown file.");
  }
  return (await file.text()).slice(0, maxChars);
}
