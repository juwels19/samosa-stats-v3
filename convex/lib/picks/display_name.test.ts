import { describe, expect, it } from "vitest";

import { cleanDisplayName, getDisplayNamePrompt } from "./display_name";

describe("cleanDisplayName", () => {
  it("keeps the first line without quotes or a label", () => {
    expect(cleanDisplayName('"Bumper Cars Anonymous"')).toBe("Bumper Cars Anonymous");
    expect(cleanDisplayName("Name: Cheesecake Factory.\nThis plays on...")).toBe("Cheesecake Factory");
    expect(cleanDisplayName("  **Slow Climbers Club**  ")).toBe("Slow Climbers Club");
  });

  it("cuts names to the saved limit", () => {
    expect(cleanDisplayName("a".repeat(300))).toHaveLength(250);
  });
});

describe("getDisplayNamePrompt", () => {
  it("lists only what the player picked", () => {
    expect(
      getDisplayNamePrompt({
        eventName: "ONT District Humber College Event",
        teams: [{ number: 1114, name: "Simbotics" }],
        categories: [],
      }),
    ).toBe("Event: ONT District Humber College Event\nTeams picked: 1114 Simbotics");
  });
});
