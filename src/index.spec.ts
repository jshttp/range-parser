import { describe, it, expect } from "vitest";
import { parse, format, combineRanges } from "./index.js";

describe("format({ type, ranges })", () => {
  it("should format a single byte range", () => {
    expect(format({ type: "bytes", ranges: [{ start: 0, end: 0 }] })).toBe(
      "bytes=0-0",
    );
  });

  it("should preserve input order without modifying or combining ranges", () => {
    const ranges = Object.freeze([
      Object.freeze({ start: 20, end: 30 }),
      Object.freeze({ start: 0, end: 20 }),
      Object.freeze({ start: 20, end: 30 }),
    ]);
    expect(format({ type: "bytes", ranges })).toBe("bytes=20-30,0-20,20-30");
  });

  it("should format a custom range unit", () => {
    expect(format({ type: "items", ranges: [{ start: 0, end: 5 }] })).toBe(
      "items=0-5",
    );
  });

  it("should accept all HTTP token characters in the range unit", () => {
    const type =
      "!#$%&'*+-.^_`|~0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    expect(format({ type: type, ranges: [{ start: 0, end: 0 }] })).toBe(
      `${type}=0-0`,
    );
  });

  it("should round trip normalized parsed ranges", () => {
    const result = parse(1000, "bytes=40-80,900-,-10");
    expect(format(result)).toBe("bytes=40-80,900-999,990-999");
    expect(parse(1000, format(result))).toEqual(result);
  });

  it("should format retained ranges regardless of the parse status code", () => {
    expect(format(parse(100, "bytes=0-9,x-,200-"))).toBe("bytes=0-9");
  });

  it("should format safe integer boundaries without exponential notation", () => {
    expect(
      format({
        type: "bytes",
        ranges: [{ start: 0, end: Number.MAX_SAFE_INTEGER }],
      }),
    ).toBe("bytes=0-9007199254740991");
  });

  it("should reject an empty range list", () => {
    expect(() => format({ type: "bytes", ranges: [] })).toThrow(TypeError);
  });

  it("should reject sparse range lists", () => {
    expect(() => format({ type: "bytes", ranges: new Array(1) })).toThrow(
      TypeError,
    );
  });

  it.each([-1, 0.5, NaN, Infinity, -Infinity, Number.MAX_SAFE_INTEGER + 1])(
    "should reject an invalid position of %s",
    (position) => {
      expect(() =>
        format({ type: "bytes", ranges: [{ start: position, end: 10 }] }),
      ).toThrow(TypeError);
      expect(() =>
        format({ type: "bytes", ranges: [{ start: 0, end: position }] }),
      ).toThrow(TypeError);
    },
  );

  it("should reject reversed bounds", () => {
    expect(() =>
      format({ type: "bytes", ranges: [{ start: 10, end: 9 }] }),
    ).toThrow(TypeError);
  });

  it.each([
    "",
    "bytes ",
    " bytes",
    "a=b",
    "a,b",
    "a/b",
    "bytes\r\nX: y",
    "é",
    "bytes\n",
  ])("should reject an invalid range unit of %j", (type) => {
    expect(() =>
      format({ type: type, ranges: [{ start: 0, end: 0 }] }),
    ).toThrow(TypeError);
  });

  it("should reject non-string range units", () => {
    // @ts-expect-error Invalid JavaScript input.
    expect(() => format({ type: 123, ranges: [{ start: 0, end: 0 }] })).toThrow(
      TypeError,
    );
  });
});

describe("parse(size, str)", () => {
  it("should return code 1 for an empty str", () => {
    expect(parse(200, "")).toEqual({ code: 1, type: "", ranges: [] });
  });

  it("should return code 1 for range missing dash", () => {
    expect(parse(200, "bytes=100200")).toEqual({
      code: 1,
      type: "bytes",
      ranges: [],
    });
    expect(parse(200, "bytes=,100200")).toEqual({
      code: 1,
      type: "bytes",
      ranges: [],
    });
  });

  it("should return code 1 for empty range value", () => {
    expect(parse(200, "bytes=")).toEqual({
      code: 1,
      type: "bytes",
      ranges: [],
    });
    expect(parse(200, "bytes=,")).toEqual({
      code: 1,
      type: "bytes",
      ranges: [],
    });
    expect(parse(200, "bytes= , , ")).toEqual({
      code: 1,
      type: "bytes",
      ranges: [],
    });
  });

  it("should return code 1 when all multiple ranges have invalid format", () => {
    expect(parse(200, "bytes=y-v,x-")).toEqual({
      code: 1,
      type: "bytes",
      ranges: [],
    });
    expect(parse(200, "bytes=abc-def,ghi-jkl")).toEqual({
      code: 1,
      type: "bytes",
      ranges: [],
    });
    expect(parse(200, "bytes=x-,y-,z-")).toEqual({
      code: 1,
      type: "bytes",
      ranges: [],
    });
  });

  it("should return code 1 for a header missing equals", () => {
    expect(parse(200, "malformed")).toEqual({ code: 1, type: "", ranges: [] });
  });

  it("should return code 1 for missing bytes", () => {
    expect(parse(200, "bytes=")).toEqual({
      code: 1,
      type: "bytes",
      ranges: [],
    });
    expect(parse(200, "bytes= ")).toEqual({
      code: 1,
      type: "bytes",
      ranges: [],
    });
  });

  it("should return code 1 for invalid start byte position", () => {
    expect(parse(200, "bytes=x-100")).toEqual({
      code: 1,
      type: "bytes",
      ranges: [],
    });
  });

  it("should return code 1 for invalid end byte position", () => {
    expect(parse(200, "bytes=100-x")).toEqual({
      code: 1,
      type: "bytes",
      ranges: [],
    });
  });

  it("should return code 1 for invalid range format", () => {
    expect(parse(200, "bytes=--100")).toEqual({
      code: 1,
      type: "bytes",
      ranges: [],
    });
    expect(parse(200, "bytes=100--200")).toEqual({
      code: 1,
      type: "bytes",
      ranges: [],
    });
  });

  it("should return code 1 for bare dash ranges", () => {
    expect(parse(200, "bytes=-")).toEqual({
      code: 1,
      type: "bytes",
      ranges: [],
    });
    expect(parse(200, "bytes= - ")).toEqual({
      code: 1,
      type: "bytes",
      ranges: [],
    });
  });

  it("should retain valid ranges when a bare dash is present", () => {
    expect(parse(200, "bytes=-,0-10")).toEqual({
      code: 1,
      type: "bytes",
      ranges: [{ start: 0, end: 10 }],
    });
  });

  it("should return code 1 with multiple dashes in range", () => {
    expect(parse(200, "bytes=100-200-300")).toEqual({
      code: 1,
      type: "bytes",
      ranges: [],
    });
  });

  it("should return code 1 for negative start byte position", () => {
    expect(parse(200, "bytes=-100-150")).toEqual({
      code: 1,
      type: "bytes",
      ranges: [],
    });
  });

  it("should return code 1 for invalid number format", () => {
    expect(parse(200, "bytes=01a-150")).toEqual({
      code: 1,
      type: "bytes",
      ranges: [],
    });
    expect(parse(200, "bytes=100-15b0")).toEqual({
      code: 1,
      type: "bytes",
      ranges: [],
    });
  });

  it.each([
    -1,
    Number.MIN_SAFE_INTEGER,
    Number.MAX_SAFE_INTEGER + 1,
    Number.MIN_SAFE_INTEGER - 1,
    1e20,
    Infinity,
    -Infinity,
    NaN,
    1.5,
  ])("should reject an invalid size of %s", (size) => {
    expect(() => parse(size, "bytes=0-0")).toThrow(
      new TypeError(`Invalid size: ${size}`),
    );
  });

  it("should accept the maximum safe integer size", () => {
    expect(parse(Number.MAX_SAFE_INTEGER, "bytes=9007199254740990-")).toEqual({
      code: 0,
      type: "bytes",
      ranges: [{ start: 9007199254740990, end: 9007199254740990 }],
    });
  });

  it("should cap overflowing end positions at size", () => {
    expect(parse(200, `bytes=0-${"9".repeat(400)}`)).toEqual({
      code: 0,
      type: "bytes",
      ranges: [{ start: 0, end: 199 }],
    });
  });

  it("should reject invalid digits after positions exceed safe integers", () => {
    expect(parse(200, "bytes=0-90071992547409930x")).toEqual({
      code: 1,
      type: "bytes",
      ranges: [],
    });
  });

  it("should return code 2 for unsatisfiable range", () => {
    expect(parse(200, "bytes=500-600")).toEqual({
      code: 2,
      type: "bytes",
      ranges: [],
    });
  });

  it("should return code 2 for unsatisfiable range with multiple ranges", () => {
    expect(parse(200, "bytes=500-600,601-700")).toEqual({
      code: 2,
      type: "bytes",
      ranges: [],
    });
  });

  it("should return code 2 if all specified ranges are unsatisfiable", () => {
    expect(parse(200, "bytes=500-999")).toEqual({
      code: 2,
      type: "bytes",
      ranges: [],
    });
    expect(parse(200, "bytes=500-999,1000-1499")).toEqual({
      code: 2,
      type: "bytes",
      ranges: [],
    });
  });

  it.each([
    "bytes=50-20",
    "bytes=500-20",
    "bytes=600-500",
    "bytes=9007199254740993-9007199254740992",
    `bytes=${"9".repeat(400)}-${"8".repeat(400)}`,
  ])("should return code 2 for reversed bounds in %s", (header) => {
    expect(parse(200, header)).toEqual({ code: 2, type: "bytes", ranges: [] });
  });

  it("should preserve valid ranges when explicit bounds are reversed", () => {
    expect(parse(200, "bytes=50-20,0-10")).toEqual({
      code: 2,
      type: "bytes",
      ranges: [{ start: 0, end: 10 }],
    });
  });

  it("should report reversed bounds together with unsatisfiable ranges", () => {
    expect(parse(200, "bytes=50-20,500-600")).toEqual({
      code: 2,
      type: "bytes",
      ranges: [],
    });
  });

  it.each([
    "bytes=9007199254740992-9007199254740993",
    `bytes=${"8".repeat(400)}-${"9".repeat(400)}`,
  ])("should keep large ordered bounds unsatisfiable in %s", (header) => {
    expect(parse(200, header)).toEqual({ code: 2, type: "bytes", ranges: [] });
  });

  it("should return code 3 when ranges are malformed and unsatisfiable", () => {
    expect(parse(200, "bytes=abc-def,500-999")).toEqual({
      code: 3,
      type: "bytes",
      ranges: [],
    });
    expect(parse(200, "bytes=500-999,xyz-uvw")).toEqual({
      code: 3,
      type: "bytes",
      ranges: [],
    });
    expect(parse(200, "bytes=abc-def,500-999,xyz-uvw")).toEqual({
      code: 3,
      type: "bytes",
      ranges: [],
    });
  });

  it.each(["bytes=-1", "bytes=-500", "bytes=,-1,", "bytes=-1,-2"])(
    "should accept nonzero suffixes for an empty representation in %s",
    (header) => {
      expect(parse(0, header)).toEqual({ code: 0, type: "bytes", ranges: [] });
    },
  );

  it.each([
    ["bytes=-0", 2],
    ["bytes=0-", 2],
    ["bytes=0-0", 2],
    ["bytes=-x", 1],
    ["bytes=-1,x-", 1],
    ["bytes=-1,0-", 2],
    ["bytes=-1,-0", 2],
    ["bytes=-1,x-,0-", 3],
    ["bytes=, \t,", 1],
  ])(
    "should preserve errors for an empty representation in %s",
    (header, code) => {
      expect(parse(0, header)).toEqual({ code, type: "bytes", ranges: [] });
    },
  );

  it("should parse str", () => {
    var range = parse(1000, "bytes=0-499");
    expect(range).toEqual({
      code: 0,
      type: "bytes",
      ranges: [{ start: 0, end: 499 }],
    });
  });

  it("should cap end at size", () => {
    var range = parse(200, "bytes=0-499");
    expect(range).toEqual({
      code: 0,
      type: "bytes",
      ranges: [{ start: 0, end: 199 }],
    });
  });

  it("should parse str", () => {
    var range = parse(1000, "bytes=40-80");
    expect(range).toEqual({
      code: 0,
      type: "bytes",
      ranges: [{ start: 40, end: 80 }],
    });
  });

  it("should parse str asking for last n bytes", () => {
    var range = parse(1000, "bytes=-400");
    expect(range).toEqual({
      code: 0,
      type: "bytes",
      ranges: [{ start: 600, end: 999 }],
    });
  });

  it("should parse str with only start", () => {
    var range = parse(1000, "bytes=400-");
    expect(range).toEqual({
      code: 0,
      type: "bytes",
      ranges: [{ start: 400, end: 999 }],
    });
  });

  it('should parse "bytes=0-"', () => {
    var range = parse(1000, "bytes=0-");
    expect(range).toEqual({
      code: 0,
      type: "bytes",
      ranges: [{ start: 0, end: 999 }],
    });
  });

  it("should parse str with no bytes", () => {
    var range = parse(1000, "bytes=0-0");
    expect(range).toEqual({
      code: 0,
      type: "bytes",
      ranges: [{ start: 0, end: 0 }],
    });
  });

  it("should parse str asking for last byte", () => {
    var range = parse(1000, "bytes=-1");
    expect(range).toEqual({
      code: 0,
      type: "bytes",
      ranges: [{ start: 999, end: 999 }],
    });
  });

  it("should parse str with multiple ranges", () => {
    var range = parse(1000, "bytes=40-80,81-90,-1");
    expect(range).toEqual({
      code: 0,
      type: "bytes",
      ranges: [
        { start: 40, end: 80 },
        { start: 81, end: 90 },
        { start: 999, end: 999 },
      ],
    });
  });

  it("should retain valid ranges with code 2 for unsatisfiable ranges", () => {
    var range = parse(200, "bytes=0-499,1000-,500-999");
    expect(range).toEqual({
      code: 2,
      type: "bytes",
      ranges: [{ start: 0, end: 199 }],
    });
  });

  it("should parse str with whitespace", () => {
    var range = parse(1000, "bytes=   40-80 , 81-90 , -1 ");
    expect(range).toEqual({
      code: 0,
      type: "bytes",
      ranges: [
        { start: 40, end: 80 },
        { start: 81, end: 90 },
        { start: 999, end: 999 },
      ],
    });
  });

  it("should parse tabs around range elements", () => {
    expect(parse(1000, "bytes=\t40-80\t,\t81-\t,\t-1\t")).toEqual({
      code: 0,
      type: "bytes",
      ranges: [
        { start: 40, end: 80 },
        { start: 81, end: 999 },
        { start: 999, end: 999 },
      ],
    });
  });

  it("should parse non-byte range", () => {
    var range = parse(1000, "items=0-5");
    expect(range).toEqual({
      code: 0,
      type: "items",
      ranges: [{ start: 0, end: 5 }],
    });
  });

  it("should use the whole representation when the suffix-length is larger", () => {
    expect(parse(100, "bytes=-101")).toEqual({
      code: 0,
      type: "bytes",
      ranges: [{ start: 0, end: 99 }],
    });
  });

  it("should report code 1 for invalid format range when valid range exists", () => {
    var range = parse(1000, "bytes=100-200,x-");
    expect(range).toEqual({
      code: 1,
      type: "bytes",
      ranges: [{ start: 100, end: 200 }],
    });
  });

  it("should report code 1 for invalid format ranges when some are valid", () => {
    var range = parse(1000, "bytes=x-,0-100,y-");
    expect(range).toEqual({
      code: 1,
      type: "bytes",
      ranges: [{ start: 0, end: 100 }],
    });
  });

  it("should report code 1 for invalid format ranges at different positions", () => {
    var range = parse(1000, "bytes=0-50,abc-def,100-150");
    expect(range).toEqual({
      code: 1,
      type: "bytes",
      ranges: [
        { start: 0, end: 50 },
        { start: 100, end: 150 },
      ],
    });
  });

  it.each([
    "bytes=,0-10",
    "bytes= , 0-10",
    "bytes=0-10,",
    "bytes=0-10,,",
    "bytes=, ,\t,0-10, \t,",
  ])("should ignore empty list elements in %s", (header) => {
    var range = parse(1000, header);

    expect(range).toEqual({
      code: 0,
      type: "bytes",
      ranges: [{ start: 0, end: 10 }],
    });
  });

  it("should ignore empty elements between ranges", () => {
    expect(parse(200, "bytes=0-10,, \t,20-30")).toEqual({
      code: 0,
      type: "bytes",
      ranges: [
        { start: 0, end: 10 },
        { start: 20, end: 30 },
      ],
    });
  });

  it.each([
    ["bytes=,500-600,", 2],
    ["bytes=,x-,", 1],
    ["bytes=,x-,,500-600,", 3],
    ["bytes=, \t,", 1],
  ])(
    "should preserve errors while ignoring empty elements in %s",
    (header, code) => {
      expect(parse(200, header)).toEqual({ code, type: "bytes", ranges: [] });
    },
  );

  it.each([
    "bytes=0-10,x-,1000-",
    "bytes=1000-,0-10,x-",
    "bytes=x-,1000-,0-10",
  ])("should retain valid ranges with both status bits for %s", (header) => {
    expect(parse(200, header)).toEqual({
      code: 3,
      type: "bytes",
      ranges: [{ start: 0, end: 10 }],
    });
  });
});

describe("combineRanges(ranges)", () => {
  it("should return an empty array for no ranges", () => {
    expect(combineRanges([])).toEqual([]);
  });

  it("should return new ranges without modifying the input", () => {
    const ranges = [
      { start: 10, end: 20 },
      { start: 0, end: 9 },
      { start: 30, end: 40 },
    ];
    const original = ranges.map((range) => ({ ...range }));
    const combined = combineRanges(ranges);

    expect(combined).toEqual([
      { start: 0, end: 20, index: 0 },
      { start: 30, end: 40, index: 2 },
    ]);
    expect(ranges).toEqual(original);
    expect(combined[1]).not.toBe(ranges[2]);
  });

  it("should combine overlapping ranges", () => {
    var combined = combineRanges([
      { start: 0, end: 4 },
      { start: 90, end: 99 },
      { start: 5, end: 75 },
      { start: 100, end: 199 },
      { start: 101, end: 102 },
    ]);
    expect(combined).toEqual([
      { start: 0, end: 75, index: 0 },
      { start: 90, end: 199, index: 1 },
    ]);
  });

  it("should retain the earliest index when absorbing a range", () => {
    expect(
      combineRanges([
        { start: 50, end: 60 },
        { start: 200, end: 300 },
        { start: 0, end: 100 },
      ]),
    ).toEqual([
      { start: 0, end: 100, index: 0 },
      { start: 200, end: 300, index: 1 },
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
      { start: 149, end: 149, index: 0 },
      { start: 20, end: 120, index: 1 },
      { start: 0, end: 1, index: 2 },
    ]);
  });
});
