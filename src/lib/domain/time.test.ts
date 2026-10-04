import { describe, expect, it } from "vitest";
import { parseLocalDateTime } from "./time";

describe("parseLocalDateTime", () => {
  it("interprets the value as Paris wall-clock time (summer and winter)", () => {
    expect(parseLocalDateTime("2026-07-01T19:00")?.toISOString()).toBe("2026-07-01T17:00:00.000Z");
    expect(parseLocalDateTime("2026-12-01T19:00")?.toISOString()).toBe("2026-12-01T18:00:00.000Z");
  });
  it("rejects malformed input", () => {
    expect(parseLocalDateTime("")).toBeNull();
    expect(parseLocalDateTime("tomorrow")).toBeNull();
  });
});
