import type { StateStorage } from "zustand/middleware";

export const safeStorage: StateStorage = {
  getItem: (name) => {
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, value);
    } catch (error) {
      // Quota exceeded! Let's prune the history to free up space and try again.
      try {
        const parsed = JSON.parse(value);
        let modified = false;
        
        if (name === "threadwise-workspaces-v1" && parsed.state?.workspaces) {
          parsed.state.workspaces.forEach((w: any) => {
            w.document.canvases.forEach((c: any) => {
              if (c.history && c.history.length > 10) {
                c.history = c.history.slice(-10); // Keep only the 10 most recent snapshots
                modified = true;
              }
            });
          });
        } 
        else if (name === "threadwise-canvas-v1" && parsed.state?.history) {
          if (parsed.state.history.length > 10) {
            parsed.state.history = parsed.state.history.slice(-10);
            modified = true;
          }
        }

        if (modified) {
          localStorage.setItem(name, JSON.stringify(parsed));
          console.warn("LocalStorage quota reached. Pruned history to save the canvas.");
        } else {
          console.error("LocalStorage quota exceeded, and cannot prune further.", error);
        }
      } catch (retryError) {
        console.error("Failed to save to localStorage:", retryError);
      }
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name);
    } catch {}
  },
};