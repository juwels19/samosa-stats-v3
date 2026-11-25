import { describe, expect, it } from "vitest";

import {
  getMockEventCode,
  getMockTransitionTimestamps,
  isStatusAdvance,
} from "./mock_events";

describe("getMockTransitionTimestamps", () => {
  it("puts each step one interval apart, in order", () => {
    const now = 1_000_000;
    expect(getMockTransitionTimestamps(now, 2)).toEqual({
      submissionsOpen: now + 120_000,
      pickSubmissionReminder: now + 240_000,
      submissionsClosed: now + 360_000,
      ongoing: now + 480_000,
      complete: now + 600_000,
    });
  });
});

describe("getMockEventCode", () => {
  it("uses the first free number", () => {
    expect(getMockEventCode("ONOSH", new Set())).toBe("ONOSHMOCK1");
    expect(getMockEventCode("ONOSH", new Set(["ONOSHMOCK1", "ONOSHMOCK2"]))).toBe("ONOSHMOCK3");
  });
});

describe("isStatusAdvance", () => {
  it("allows only forward moves", () => {
    expect(isStatusAdvance("UPCOMING", "SUBMISSIONS_OPEN")).toBe(true);
    expect(isStatusAdvance("UPCOMING", "COMPLETE")).toBe(true);
    expect(isStatusAdvance("ONGOING", "SUBMISSIONS_OPEN")).toBe(false);
    expect(isStatusAdvance("ONGOING", "ONGOING")).toBe(false);
  });
});
