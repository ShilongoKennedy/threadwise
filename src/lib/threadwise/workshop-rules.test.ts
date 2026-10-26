import { describe, it, expect } from "vitest";
import { canVote, voteTotal } from "./workshop-rules";
describe("dot voting", () => {
  it("enforces the configured per-participant dot budget", () => {
    expect(canVote("vote", 2, 3)).toBe(true);
    expect(canVote("vote", 3, 3)).toBe(false);
    expect(
      voteTotal(
        [
          { user_id: "one", dots: 2 },
          { user_id: "two", dots: 3 },
          { user_id: "one", dots: 1 },
        ],
        "one",
      ),
    ).toBe(3);
  });
  it("only opens voting during the vote phase", () => {
    for (const phase of ["setup", "silent", "discuss", "closed"])
      expect(canVote(phase, 0, 3)).toBe(false);
  });
});
