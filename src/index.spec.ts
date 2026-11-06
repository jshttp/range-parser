import { describe, it, expect } from "vitest";
import { parse, combineRanges } from "./index";

describe("parse(len, str)", () => {
  it("should return -2 for an empty str", () => {
    expect(parse(200, "")).toBe(-2);
  });

  it("should return -2 for range missing dash", () => {
    expect(parse(200, "bytes=100200")).toBe(-2);
    expect(parse(200, "bytes=,100200")).toBe(-2);
  });

  it("should return -2 for empty range value", () => {
    expect(parse(200, "bytes=")).toBe(-2);
    expect(parse(200, "bytes=,")).toBe(-2);
    expect(parse(200, "bytes= , , ")).toBe(-2);
  });

  it("should return -2 when all multiple ranges have invalid format", () => {
    expect(parse(200, "bytes=y-v,x-")).toBe(-2);
    expect(parse(200, "bytes=abc-def,ghi-jkl")).toBe(-2);
    expect(parse(200, "bytes=x-,y-,z-")).toBe(-2);
  });

  it("should return -2 for invalid str", () => {
    expect(parse(200, "malformed")).toBe(-2);
  });

  it("should return -2 for missing bytes", () => {
    expect(parse(200, "bytes=")).toBe(-2);
    expect(parse(200, "bytes= ")).toBe(-2);
  });

  it("should return -2 for invalid start byte position", () => {
    expect(parse(200, "bytes=x-100")).toBe(-2);
  });

  it("should return -2 for invalid end byte position", () => {
    expect(parse(200, "bytes=100-x")).toBe(-2);
  });

  it("should return -2 for invalid range format", () => {
    expect(parse(200, "bytes=--100")).toBe(-2);
    expect(parse(200, "bytes=100--200")).toBe(-2);
    expect(parse(200, "bytes=-")).toBe(-2);
    expect(parse(200, "bytes= - ")).toBe(-2);
  });

  it("should return -2 with multiple dashes in range", () => {
    expect(parse(200, "bytes=100-200-300")).toBe(-2);
  });

  it("should return -2 for negative start byte position", () => {
    expect(parse(200, "bytes=-100-150")).toBe(-2);
  });

  it("should return -2 for invalid number format", () => {
    expect(parse(200, "bytes=01a-150")).toBe(-2);
    expect(parse(200, "bytes=100-15b0")).toBe(-2);
  });

  it.each([
    Number.MAX_SAFE_INTEGER + 1,
    Number.MIN_SAFE_INTEGER - 1,
    1e20,
    Infinity,
    -Infinity,
    NaN,
    1.5,
  ])("should reject an unsafe size of %s", (size) => {
    expect(() => parse(size, "bytes=0-0")).toThrow(
      new TypeError(`Unsafe size: ${size}`),
    );
  });

  it("should accept the maximum safe integer size", () => {
    expect(parse(Number.MAX_SAFE_INTEGER, "bytes=9007199254740990-")).toEqual({
      type: "bytes",
      ranges: [{ start: 9007199254740990, end: 9007199254740990 }],
    });
  });

  it("should cap overflowing end positions at size", () => {
    expect(parse(200, `bytes=0-${"9".repeat(400)}`)).toEqual({
      type: "bytes",
      ranges: [{ start: 0, end: 199 }],
    });
  });

  it("should reject invalid digits after positions exceed safe integers", () => {
    expect(parse(200, "bytes=0-90071992547409930x")).toBe(-2);
  });

  it("should return -1 for unsatisfiable range", () => {
    expect(parse(200, "bytes=500-600")).toBe(-1);
  });

  it("should return -1 for unsatisfiable range with multiple ranges", () => {
    expect(parse(200, "bytes=500-600,601-700")).toBe(-1);
  });

  it("should return -1 if all specified ranges are unsatisfiable", () => {
    expect(parse(200, "bytes=500-20")).toBe(-1);
    expect(parse(200, "bytes=500-999")).toBe(-1);
    expect(parse(200, "bytes=500-999,1000-1499")).toBe(-1);
  });

  it("should prefer -1 when all ranges are invalid and unsatisfiable ranges", () => {
    expect(parse(200, "bytes=abc-def,500-999")).toBe(-1);
    expect(parse(200, "bytes=500-999,xyz-uvw")).toBe(-1);
    expect(parse(200, "bytes=abc-def,500-999,xyz-uvw")).toBe(-1);
  });

  it("should be unsatisfiable asking for -0", () => {
    expect(parse(1000, "bytes=-0")).toBe(-1);
  });

  it("should parse str", () => {
    var range = parse(1000, "bytes=0-499");
    expect(range).toEqual({
      type: "bytes",
      ranges: [{ start: 0, end: 499 }],
    });
  });

  it("should cap end at size", () => {
    var range = parse(200, "bytes=0-499");
    expect(range).toEqual({
      type: "bytes",
      ranges: [{ start: 0, end: 199 }],
    });
  });

  it("should parse str", () => {
    var range = parse(1000, "bytes=40-80");
    expect(range).toEqual({
      type: "bytes",
      ranges: [{ start: 40, end: 80 }],
    });
  });

  it("should parse str asking for last n bytes", () => {
    var range = parse(1000, "bytes=-400");
    expect(range).toEqual({
      type: "bytes",
      ranges: [{ start: 600, end: 999 }],
    });
  });

  it("should parse str with only start", () => {
    var range = parse(1000, "bytes=400-");
    expect(range).toEqual({
      type: "bytes",
      ranges: [{ start: 400, end: 999 }],
    });
  });

  it('should parse "bytes=0-"', () => {
    var range = parse(1000, "bytes=0-");
    expect(range).toEqual({
      type: "bytes",
      ranges: [{ start: 0, end: 999 }],
    });
  });

  it("should parse str with no bytes", () => {
    var range = parse(1000, "bytes=0-0");
    expect(range).toEqual({
      type: "bytes",
      ranges: [{ start: 0, end: 0 }],
    });
  });

  it("should parse str asking for last byte", () => {
    var range = parse(1000, "bytes=-1");
    expect(range).toEqual({
      type: "bytes",
      ranges: [{ start: 999, end: 999 }],
    });
  });

  it("should parse str with multiple ranges", () => {
    var range = parse(1000, "bytes=40-80,81-90,-1");
    expect(range).toEqual({
      type: "bytes",
      ranges: [
        { start: 40, end: 80 },
        { start: 81, end: 90 },
        { start: 999, end: 999 },
      ],
    });
  });

  it("should parse str with some invalid ranges", () => {
    var range = parse(200, "bytes=0-499,1000-,500-999");
    expect(range).toEqual({
      type: "bytes",
      ranges: [{ start: 0, end: 199 }],
    });
  });

  it("should parse str with whitespace", () => {
    var range = parse(1000, "bytes=   40-80 , 81-90 , -1 ");
    expect(range).toEqual({
      type: "bytes",
      ranges: [
        { start: 40, end: 80 },
        { start: 81, end: 90 },
        { start: 999, end: 999 },
      ],
    });
  });

  it("should parse non-byte range", () => {
    var range = parse(1000, "items=0-5");
    expect(range).toEqual({
      type: "items",
      ranges: [{ start: 0, end: 5 }],
    });
  });

  it("should use the whole representation when the suffix-length is larger", () => {
    expect(parse(100, "bytes=-101")).toEqual({
      type: "bytes",
      ranges: [{ start: 0, end: 99 }],
    });
  });

  it("should ignore invalid format range when valid range exists", () => {
    var range = parse(1000, "bytes=100-200,x-");
    expect(range).toEqual({
      type: "bytes",
      ranges: [{ start: 100, end: 200 }],
    });
  });

  it("should ignore invalid format ranges when some are valid", () => {
    var range = parse(1000, "bytes=x-,0-100,y-");
    expect(range).toEqual({ type: "bytes", ranges: [{ start: 0, end: 100 }] });
  });

  it("should ignore invalid format ranges at different positions", () => {
    var range = parse(1000, "bytes=0-50,abc-def,100-150");
    expect(range).toEqual({
      type: "bytes",
      ranges: [
        { start: 0, end: 50 },
        { start: 100, end: 150 },
      ],
    });
  });

  it("should ignore whitespace-only invalid ranges when valid present", () => {
    var range = parse(1000, "bytes= , 0-10");

    expect(range).toEqual({ type: "bytes", ranges: [{ start: 0, end: 10 }] });
  });
});

describe("combineRanges(ranges)", () => {
  it("should combine overlapping ranges", () => {
    var combined = combineRanges([
      { start: 0, end: 4 },
      { start: 90, end: 99 },
      { start: 5, end: 75 },
      { start: 100, end: 199 },
      { start: 101, end: 102 },
    ]);
    expect(combined).toEqual([
      { start: 0, end: 75 },
      { start: 90, end: 199 },
    ]);
  });

  it("should retain original order", () => {
    var combined = combineRanges([
      { start: 149, end: 149 },
      { start: 20, end: 100 },
      { start: 0, end: 1 },
      { start: 101, end: 120 },
    ]);
    expect(combined).toEqual([
      { start: 149, end: 149 },
      { start: 20, end: 120 },
      { start: 0, end: 1 },
    ]);
  });
});
