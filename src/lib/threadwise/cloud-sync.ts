import { useEffect } from "react";
import { create } from "zustand";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspaces } from "./workspaces";
import { cloudDocument, type Workspace, type WorkspaceDocument } from "./workspace-model";
import type { Json } from "@/integrations/supabase/types";

export const useAccount = create<{ user: User | null; loading: boolean }>(() => ({
  user: null,
  loading: true,
}));
let busy = false;
let queued = false;
function cloudError(error: unknown) {
  return error && typeof error === "object" && "message" in error
    ? String(error.message)
    : "Cloud unavailable";
}
export async function syncWorkspaces() {
  const user = useAccount.getState().user;
  if (!user) return;
  if (busy) {
    queued = true;
    return;
  }
  if (!navigator.onLine) {
    useWorkspaces.setState({ status: "Offline · edits saved here" });
    return;
  }
  busy = true;
  try {
    useWorkspaces.getState().capture();
    const { data: rows, error } = await supabase
      .from("workspaces")
      .select("*")
      .eq("user_id", user.id);
    if (error) throw error;
    if (useAccount.getState().user?.id !== user.id) return;
    const remote = (rows ?? []).map((row): Workspace => ({
      id: row.id,
      title: row.title,
      document: row.document as unknown as WorkspaceDocument,
      revision: row.revision,
      dirty: false,
      generation: 0,
    }));
    useWorkspaces.getState().replaceRemote(remote);
    for (const w of useWorkspaces.getState().workspaces.filter((w) => w.dirty)) {
      if (useAccount.getState().user?.id !== user.id) break;
      useWorkspaces.setState({ status: "Saving…" });
      const { data, error: saveError } = await supabase.rpc("save_threadwise_workspace", {
        p_id: w.id,
        p_title: w.title,
        p_document: cloudDocument(w.document) as unknown as Json,
        p_revision: w.revision,
      });
      if (saveError) throw saveError;
      if (useAccount.getState().user?.id !== user.id) return;
      const saved = data?.[0];
      if (saved) useWorkspaces.getState().acknowledge(w.id, saved.revision, w.generation);
      else {
        const { data: latest, error: latestError } = await supabase
          .from("workspaces")
          .select("*")
          .eq("id", w.id)
          .eq("user_id", user.id)
          .maybeSingle();
        if (latestError) throw latestError;
        if (useAccount.getState().user?.id !== user.id) return;
        const other = latest
          ? {
              id: latest.id,
              title: latest.title,
              document: latest.document as unknown as WorkspaceDocument,
              revision: latest.revision,
              dirty: false,
              generation: 0,
            }
          : undefined;
        if (
          other &&
          JSON.stringify(cloudDocument(other.document)) ===
            JSON.stringify(cloudDocument(w.document)) &&
          other.title === w.title
        ) {
          useWorkspaces.getState().acknowledge(w.id, other.revision, w.generation);
          continue;
        }
        if (other) useWorkspaces.getState().preserveConflict(w.id, other);
        else useWorkspaces.getState().rekeyUnsaved(w.id);
        queued = true;
      }
    }
    useWorkspaces.setState({
      status: useWorkspaces.getState().workspaces.some((w) => w.dirty)
        ? "Edits queued"
        : "Cloud synced",
    });
  } catch (error) {
    queued = false;
    useWorkspaces.setState({ status: `Saved locally · ${cloudError(error)} · Retry cloud` });
  } finally {
    busy = false;
    if (queued) {
      queued = false;
      setTimeout(() => void syncWorkspaces(), 100);
    }
  }
}

/** Mounted once by the root, including while switching Socratic URLs. */
export function useCloudSync() {
  useEffect(() => {
    useWorkspaces.getState().boot();
    const apply = (user: User | null) => {
      const previous = useAccount.getState().user?.id;
      useAccount.setState({ user, loading: false });
      if (previous !== user?.id || useWorkspaces.getState().owner !== (user?.id ?? null))
        useWorkspaces.getState().attachOwner(user?.id ?? null);
      if (user) void syncWorkspaces();
      else useWorkspaces.setState({ status: "Saved in this browser" });
    };
    void supabase.auth.getSession().then(({ data }) => apply(data.session?.user ?? null));
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (["SIGNED_IN", "SIGNED_OUT", "USER_UPDATED"].includes(event))
        setTimeout(() => apply(session?.user ?? null), 0);
    });
    const offline = () => useWorkspaces.setState({ status: "Offline · edits saved here" });
    const online = () => void syncWorkspaces();
    const capture = () => useWorkspaces.getState().capture();
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    window.addEventListener("pagehide", capture);
    const interval = setInterval(() => void syncWorkspaces(), 6000);
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = useWorkspaces.subscribe((s, previous) => {
      if (s.workspaces === previous.workspaces) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => void syncWorkspaces(), 1000);
    });
    return () => {
      data.subscription.unsubscribe();
      unsubscribe();
      clearInterval(interval);
      if (timer) clearTimeout(timer);
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
      window.removeEventListener("pagehide", capture);
    };
  }, []);
}
