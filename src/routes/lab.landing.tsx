import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/lab/landing")({
  head: () => ({
    meta: [
      { title: "Newsprint — Threadwise lab" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NewsprintStage,
});

function NewsprintStage() {
  return (
    <main className="newsprint-stage" aria-label="Newspaper background experiment">
      <div className="newsprint-sheet" aria-hidden="true">
        <div className="newsprint-masthead">
          <span className="newsprint-masthead__rule" />
        </div>
        <div className="newsprint-columns" />
        <div className="newsprint-fold" />
        <div className="newsprint-gutter" />
        <div className="newsprint-halftone" />
        <span className="newsprint-crop newsprint-crop--tl" />
        <span className="newsprint-crop newsprint-crop--tr" />
        <span className="newsprint-crop newsprint-crop--bl" />
        <span className="newsprint-crop newsprint-crop--br" />
        <div className="newsprint-folio" />
      </div>
    </main>
  );
}
