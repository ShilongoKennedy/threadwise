import { Trash2, ArrowUpRight } from "lucide-react";
import { deleteAnalysis, useAnalysisArchive, type AnalysisKind, type SavedAnalysis } from "@/lib/threadwise/analysis-archive";

const KIND_LABEL: Record<AnalysisKind, string> = {
  analyst: "Read",
  seminar: "Seminar",
  anatomy: "Anatomy",
};

export function AnalysisShelf({
  kind,
  onOpen,
  label = "Saved analyses",
}: {
  kind: AnalysisKind;
  onOpen: (item: SavedAnalysis) => void;
  label?: string;
}) {
  const items = useAnalysisArchive(kind);
  if (items.length === 0) return null;

  return (
    <section className="analysis-shelf" aria-label={label}>
      <div className="analysis-shelf__head">
        <span className="analysis-shelf__eyebrow">{label}</span>
        <span className="analysis-shelf__count">{String(items.length).padStart(2, "0")} on this device</span>
      </div>
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <button type="button" className="analysis-shelf__open" onClick={() => onOpen(item)}>
              <span className="analysis-shelf__meta">
                {KIND_LABEL[item.kind]}
                <span aria-hidden="true"> · </span>
                {new Date(item.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
              </span>
              <span className="analysis-shelf__title">{item.title}</span>
              {item.subtitle ? <span className="analysis-shelf__subtitle">{item.subtitle}</span> : null}
              <span className="analysis-shelf__reopen">Reopen <ArrowUpRight aria-hidden="true" /></span>
            </button>
            <button
              type="button"
              className="analysis-shelf__delete"
              aria-label={`Delete ${item.title}`}
              onClick={() => {
                if (window.confirm("Delete this saved analysis?")) deleteAnalysis(item.id);
              }}
            >
              <Trash2 aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
