const ARCHIVIST_URL = "https://threadwise-archivist.kennedy-nam.workers.dev";
const ARCHIVIST_SECRET = "super-secret-threadwise-key";

export async function archiveInsight(id: string, text: string, metadata: Record<string, string>) {
  try {
    const response = await fetch(`${ARCHIVIST_URL}/embed`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${ARCHIVIST_SECRET}`
      },
      body: JSON.stringify({ id, text, metadata })
    });
    if (!response.ok) throw new Error("Failed to archive");
    return await response.json();
  } catch (error) {
    console.error("Archivist Error:", error);
    return { success: false };
  }
}

export async function queryArchive(query: string) {
  try {
    const response = await fetch(`${ARCHIVIST_URL}/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${ARCHIVIST_SECRET}`
      },
      body: JSON.stringify({ query })
    });
    if (!response.ok) throw new Error("Failed to query");
    return await response.json();
  } catch (error) {
    console.error("Archivist Error:", error);
    return { matches: [] };
  }
}