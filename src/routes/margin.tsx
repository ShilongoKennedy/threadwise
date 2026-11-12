import { createFileRoute } from "@tanstack/react-router";
import { MarginRead } from "@/components/threadwise/MarginRead";

export const Route = createFileRoute("/margin")({
  head: () => ({
    meta: [
      { title: "The margin — Threadwise" },
      { name: "robots", content: "noindex" },
      {
        name: "description",
        content: "An experiment in reading the notes the record leaves out.",
      },
    ],
  }),
  component: MarginRead,
});
