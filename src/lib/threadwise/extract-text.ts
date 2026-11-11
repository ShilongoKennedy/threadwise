/**
 * The reader returns a title/URL preamble and the site's navigation before the
 * article. The analyst should receive the article, not the furniture.
 */
export function cleanArticleText(input: string): string {
  let text = input.replace(/\r\n/g, "\n").trim();

  const marker = text.indexOf("Markdown Content:");
  if (marker >= 0) {
    text = text.slice(marker + "Markdown Content:".length).trim();
  }

  // The first H1 is the article headline; everything before it is chrome.
  const heading = text.match(/^# .+$/m);
  if (heading?.index !== undefined && heading.index < 4000) {
    text = text.slice(heading.index);
  }

  return text.replace(/\n{3,}/g, "\n\n").trim();
}
