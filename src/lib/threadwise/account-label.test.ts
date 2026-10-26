import { it, expect } from "vitest";
import { accountLabel } from "./account-label";
it("supports accounts without optional profile information", () => {
  expect(accountLabel(null)).toBe("Participant");
  expect(accountLabel(undefined, "Account holder")).toBe("Account holder");
  expect(accountLabel({ display_name: 17 })).toBe("Participant");
  expect(accountLabel({ display_name: " Kennedy " })).toBe("Kennedy");
});
