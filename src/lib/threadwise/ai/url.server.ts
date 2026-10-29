export async function readWeb(urlText: string, signal: AbortSignal) {
  const apiKey = process.env["FIRECRAWL_API_KEY"];
  if (!apiKey) {
    throw new Error("Firecrawl is not configured. Add FIRECRAWL_API_KEY to your .env file.");
  }

  let url: URL;
  try {
    url = new URL(urlText);
  } catch {
    throw new Error("Invalid URL format.");
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Only HTTP and HTTPS URLs are supported.");
  }

  try {
    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        url: urlText,
        formats: ["markdown"],
        onlyMainContent: true,
        excludeTags: ["script", "style", "nav", "footer", "header"]
      }),
      signal
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `The site could not be read (${response.status}).`);
    }

    const json = await response.json();
    if (!json.success || !json.data || !json.data.markdown) {
      throw new Error("Firecrawl returned no usable content for this URL.");
    }

    let text = json.data.markdown;
    const title = json.data.metadata?.title || url.hostname;

    if (text.length < 40) {
      throw new Error("This page has no readable text. Paste an excerpt instead.");
    }
    
    // Truncate to avoid overloading the AI model
    if (text.length > 80_000) {
      text = text.slice(0, 80_000);
    }

    return { text, title, url: urlText };
  } catch (error) {
    if ((error as Error).name === "AbortError") throw error;
    throw new Error(error instanceof Error ? error.message : "Failed to scrape the URL.");
  }
}