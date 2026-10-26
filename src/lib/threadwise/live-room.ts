import { create } from "zustand";
export const useLiveRoom = create<{
  roomId: string | null;
  title: string;
  setRoom: (id: string | null, title?: string) => void;
}>((set) => ({ roomId: null, title: "", setRoom: (roomId, title = "") => set({ roomId, title }) }));
