function publicAddress(value: string) {
  if (value.includes(":")) return !/^(::|fc|fd|fe80|ff|::ffff:)/i.test(value);
  const parts = value.split(".").map(Number);
  const a = parts[0] ?? 0, b = parts[1] ?? 0;
  return !(a === 0 || a === 10 || a === 127 || a >= 224 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || (a === 198 && (b === 18 || b === 19)));
}
async function validate(url: URL, signal: AbortSignal) {
  if (url.protocol !== "https:" || url.username || url.password || (url.port && url.port !== "443") || !url.hostname.includes(".") || /^(localhost|.*\.local|.*\.internal)$/.test(url.hostname) || /^\[|^\d+\.\d+\.\d+\.\d+$/.test(url.hostname)) throw new Error("Paste a public HTTPS web address.");
  for (const type of ["A", "AAAA"]) {
    const lookup = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(url.hostname)}&type=${type}`, { headers: { accept: "application/dns-json" }, signal });
    if (!lookup.ok) throw new Error("Could not verify that web address.");
    const dns = await lookup.json() as { Answer?: { type: number; data: string }[] };
    if (dns.Answer?.some((a) => [1, 28].includes(a.type) && !publicAddress(a.data))) throw new Error("That web address is not public.");
  }
}
export async function readWeb(urlText: string, signal: AbortSignal) {
  let url = new URL(urlText);
  for (let step = 0; step < 4; step++) {
    await validate(url, signal);
    const response = await fetch(url, { redirect: "manual", headers: { Accept: "text/html,text/plain" }, signal });
    if (response.status >= 300 && response.status < 400) { const location = response.headers.get("location"); if (!location) throw new Error("The site redirected without an address."); url = new URL(location, url); continue; }
    if (!response.ok) throw new Error(`The site could not be read (${response.status}). Paste its text instead.`);
    if (!/text\/html|text\/plain/.test(response.headers.get("content-type") ?? "")) throw new Error("Download the document and add it as a file instead.");
    const reader = response.body?.getReader(); if (!reader) throw new Error("The site returned no content.");
    let html = "", bytes = 0; const decoder = new TextDecoder();
    while (true) { const { value, done } = await reader.read(); if (done) break; bytes += value.length; if (bytes > 2_000_000) { await reader.cancel(); throw new Error("This page is too large. Paste a relevant excerpt instead."); } html += decoder.decode(value, { stream: true }); }
    const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? url.hostname;
    const text = html.replace(/<(script|style|nav|footer)[^>]*>[\s\S]*?<\/\1>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();
    if (text.length < 40) throw new Error("This page needs a browser or has no readable text. Paste an excerpt instead.");
    if (text.length > 80_000) throw new Error("Choose a shorter page or paste a relevant excerpt.");
    return { text, title, url: url.href };
  }
  throw new Error("This site redirects too often. Paste its text instead.");
}