import { expect, it } from "vitest";
import { readReactions } from "./reactions";
it("malformed imported reactions cannot crash cards", () => {
  expect(readReactions("not JSON")).toEqual({});
  expect(readReactions("null")).toEqual({});
  expect(readReactions('{"agree":2,"challenge":-1,"invented":20}')).toEqual({ agree: 2 });
});
