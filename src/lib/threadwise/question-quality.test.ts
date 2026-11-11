import { describe, expect, it } from "vitest";
import { isQuestionLike } from "./question-quality";

describe("isQuestionLike", () => {
  it("accepts a question mark", () => {
    expect(isQuestionLike("Will Iran let inspectors back in?")).toBe(true);
  });

  it("accepts a question opener without a question mark", () => {
    expect(isQuestionLike("Has Starlink become a US government tool")).toBe(true);
    expect(isQuestionLike("Should the Board meet")).toBe(true);
  });

  it("rejects a thesis dressed as a question", () => {
    expect(isQuestionLike("Chinese military technology is not as strong as the United States")).toBe(false);
  });
});
