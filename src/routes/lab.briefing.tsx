import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/lab/briefing")({
  head: () => ({
    meta: [
      { title: "The 6:04 briefing — Threadwise lab" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Briefing,
});

type SceneId = "start" | "claim" | "source" | "gap" | "test";

type Scene = {
  id: SceneId;
  tone: "cobalt" | "marigold" | "mint" | "ink";
  time: string;
  kicker: string;
  title: string;
  body: string;
  choices?: { label: string; next: SceneId }[];
};

const SCENES: Record<SceneId, Scene> = {
  start: {
    id: "start",
    tone: "cobalt",
    time: "06:04",
    kicker: "A briefing arrives",
    title: "A report has raised concerns. The report is not attached.",
    body: "The sentence is already moving. It has a subject, a mood and a deadline. What it does not have is the document.",
    choices: [
      { label: "Read the sentence again", next: "claim" },
      { label: "Ask who sent it", next: "source" },
      { label: "Wait for the document", next: "gap" },
    ],
  },
  claim: {
    id: "claim",
    tone: "marigold",
    time: "06:06",
    kicker: "You read it again",
    title: "The sentence contains a claim and a mood. It does not contain a finding.",
    body: "‘Concerns’ can mean a capability, an intention, an access problem, or a political judgement. You still do not know which. The word is doing more work than the evidence.",
    choices: [{ label: "Name what would settle it", next: "test" }],
  },
  source: {
    id: "source",
    tone: "mint",
    time: "06:09",
    kicker: "You ask who sent it",
    title: "A leak is also a move.",
    body: "The sender has a reason to put the sentence in the room. You learn who wants it heard, and who benefits from the timing. You still do not learn what the document says.",
    choices: [{ label: "Return to the missing page", next: "test" }],
  },
  gap: {
    id: "gap",
    tone: "ink",
    time: "06:14",
    kicker: "You wait for the document",
    title: "The document does not arrive. The story does.",
    body: "By lunchtime, the claim has been repeated in six places. Repetition feels like corroboration. It is not. The missing page has become the loudest thing in the room.",
    choices: [{ label: "Name the test", next: "test" }],
  },
  test: {
    id: "test",
    tone: "cobalt",
    time: "06:17",
    kicker: "The room is still",
    title: "The only sentence that would settle this is not in the story.",
    body: "A named finding. A published annex. A measured quantity. Until one appears, the honest position is not ‘nothing happened’ but ‘the record does not say’.",
  },
};

const CLOSING: Record<Exclude<SceneId, "start" | "test">, string> = {
  claim: "You kept the claim separate from the finding.",
  source: "You asked who benefits from the sentence being heard.",
  gap: "You noticed that repetition is not corroboration.",
};

function Briefing() {
  const [sceneId, setSceneId] = useState<SceneId>("start");
  const [path, setPath] = useState<Exclude<SceneId, "start" | "test"> | null>(null);
  const scene = SCENES[sceneId];

  const choose = (next: SceneId) => {
    if (next !== "test") setPath(next as Exclude<SceneId, "start" | "test">);
    setSceneId(next);
  };

  const restart = () => {
    setSceneId("start");
    setPath(null);
  };

  return (
    <div className="brief-lab" data-tone={scene.tone}>
      <header className="brief-nav">
        <Link to="/" className="brief-brand">THREADWISE / THE 6:04 BRIEFING</Link>
        <span className="brief-nav__note">A reading in three moves</span>
        <Link to="/analyst" className="brief-nav__skip">Skip to the desk <span aria-hidden="true">↗</span></Link>
      </header>

      <main className="brief-stage" key={scene.id} aria-live="polite">
        <div className="brief-time" aria-hidden="true">{scene.time}</div>
        <div className="brief-copy">
          <p className="brief-kicker">{scene.kicker}</p>
          <h1>{scene.title}</h1>
          <p className="brief-body">{scene.body}</p>

          {scene.choices ? (
            <div className="brief-choices" role="group" aria-label="Choose a reading move">
              {scene.choices.map((choice, index) => (
                <button key={choice.next} type="button" onClick={() => choose(choice.next)}>
                  <span>0{index + 1}</span>
                  {choice.label}
                  <b aria-hidden="true">→</b>
                </button>
              ))}
            </div>
          ) : (
            <div className="brief-end">
              <p className="brief-closing">{path ? CLOSING[path] : "You kept the room open."}</p>
              <p>You have a reading: the claim is not the finding, the timing is a question, and the document is the missing exhibit.</p>
              <div className="brief-actions">
                <Link to="/analyst">Put a source on the desk <span aria-hidden="true">↗</span></Link>
                <button type="button" onClick={restart}>Read it again</button>
              </div>
            </div>
          )}
        </div>

        <div className="brief-progress" aria-hidden="true">
          <span className={scene.id === "start" ? "is-current" : scene.id !== "test" ? "is-done" : "is-done"} />
          <span className={path ? "is-done" : ""} />
          <span className={scene.id === "test" ? "is-current" : ""} />
        </div>
      </main>

      <footer className="brief-foot">
        <span>Threadwise / a reading desk</span>
        <span>Read the move / keep the question / leave a test</span>
        <span>Briefing 01</span>
      </footer>
    </div>
  );
}
