import { describe, it, assert } from "vitest";
import parse from "./index";

describe("parseRange(len, str)", function () {
  it("should reject non-string str", function () {
    assert.throws(
      () => parse(200, {} as any),
      TypeError,
      /argument str must be a string/,
    );
  });

  it("should return -2 for completely empty header", function () {
    assert.strictEqual(parse(200, ""), -2);
  });

  it("should return -2 for range missing dash", function () {
    assert.strictEqual(parse(200, "bytes=100200"), -2);
    assert.strictEqual(parse(200, "bytes=,100200"), -2);
  });

  it("should return -2 for invalid str", function () {
    assert.strictEqual(parse(200, "malformed"), -2);
  });

  it("should return -2 for invalid start byte position", function () {
    assert.strictEqual(parse(200, "bytes=x-100"), -2);
  });

  it("should return -2 for invalid end byte position", function () {
    assert.strictEqual(parse(200, "bytes=100-x"), -2);
  });

  it("should return -2 for invalid range format", function () {
    assert.strictEqual(parse(200, "bytes=--100"), -2);
    assert.strictEqual(parse(200, "bytes=100--200"), -2);
    assert.strictEqual(parse(200, "bytes=-"), -2);
    assert.strictEqual(parse(200, "bytes= - "), -2);
  });

  it("should return -2 for empty range value", function () {
    assert.strictEqual(parse(200, "bytes="), -2);
    assert.strictEqual(parse(200, "bytes=,"), -2);
    assert.strictEqual(parse(200, "bytes= , , "), -2);
  });

  it("should return -2 with multiple dashes in range", function () {
    assert.strictEqual(parse(200, "bytes=100-200-300"), -2);
  });

  it("should return -2 for negative start byte position", function () {
    assert.strictEqual(parse(200, "bytes=-100-150"), -2);
  });

  it("should return -2 for invalid number format", function () {
    assert.strictEqual(parse(200, "bytes=01a-150"), -2);
    assert.strictEqual(parse(200, "bytes=100-15b0"), -2);
  });

  it("should return -2 when all multiple ranges have invalid format", function () {
    assert.strictEqual(parse(200, "bytes=y-v,x-"), -2);
    assert.strictEqual(parse(200, "bytes=abc-def,ghi-jkl"), -2);
    assert.strictEqual(parse(200, "bytes=x-,y-,z-"), -2);
  });

  it("should return -1 for unsatisfiable range", function () {
    assert.strictEqual(parse(200, "bytes=500-600"), -1);
  });

  it("should return -1 for unsatisfiable range with multiple ranges", function () {
    assert.strictEqual(parse(200, "bytes=500-600,601-700"), -1);
  });

  it("should return -1 if all specified ranges are invalid", function () {
    assert.strictEqual(parse(200, "bytes=500-20"), -1);
    assert.strictEqual(parse(200, "bytes=500-999"), -1);
    assert.strictEqual(parse(200, "bytes=500-999,1000-1499"), -1);
  });

  it("should return -1 for mixed invalid and unsatisfiable ranges", function () {
    assert.strictEqual(parse(200, "bytes=abc-def,500-999"), -1);
    assert.strictEqual(parse(200, "bytes=500-999,xyz-uvw"), -1);
    assert.strictEqual(parse(200, "bytes=abc-def,500-999,xyz-uvw"), -1);
  });

  it("should parse str", function () {
    var range = parse(1000, "bytes=0-499");
    assert.deepEqual(
      range,
      Object.assign([{ start: 0, end: 499 }], { type: "bytes" }),
    );
  });

  it("should cap end at size", function () {
    var range = parse(200, "bytes=0-499");
    assert.deepEqual(
      range,
      Object.assign([{ start: 0, end: 199 }], { type: "bytes" }),
    );
  });

  it("should parse str", function () {
    var range = parse(1000, "bytes=40-80");
    assert.deepEqual(
      range,
      Object.assign([{ start: 40, end: 80 }], { type: "bytes" }),
    );
  });

  it("should parse str asking for last n bytes", function () {
    var range = parse(1000, "bytes=-400");
    assert.deepEqual(
      range,
      Object.assign([{ start: 600, end: 999 }], { type: "bytes" }),
    );
  });

  it("should parse str with only start", function () {
    var range = parse(1000, "bytes=400-");
    assert.deepEqual(
      range,
      Object.assign([{ start: 400, end: 999 }], { type: "bytes" }),
    );
  });

  it('should parse "bytes=0-"', function () {
    var range = parse(1000, "bytes=0-");
    assert.deepEqual(
      range,
      Object.assign([{ start: 0, end: 999 }], { type: "bytes" }),
    );
  });

  it("should parse str with no bytes", function () {
    var range = parse(1000, "bytes=0-0");
    assert.deepEqual(
      range,
      Object.assign([{ start: 0, end: 0 }], { type: "bytes" }),
    );
  });

  it("should parse str asking for last byte", function () {
    var range = parse(1000, "bytes=-1");
    assert.deepEqual(
      range,
      Object.assign([{ start: 999, end: 999 }], { type: "bytes" }),
    );
  });

  it("should ignore invalid format range when valid range exists", function () {
    var range = parse(1000, "bytes=100-200,x-");
    assert.deepEqual(
      range,
      Object.assign([{ start: 100, end: 200 }], { type: "bytes" }),
    );
  });

  it("should ignore invalid format ranges when some are valid", function () {
    var range = parse(1000, "bytes=x-,0-100,y-");
    assert.deepEqual(
      range,
      Object.assign([{ start: 0, end: 100 }], { type: "bytes" }),
    );
  });

  it("should ignore invalid format ranges at different positions", function () {
    var range = parse(1000, "bytes=0-50,abc-def,100-150");
    assert.deepEqual(
      range,
      Object.assign(
        [
          { start: 0, end: 50 },
          { start: 100, end: 150 },
        ],
        { type: "bytes" },
      ),
    );
  });

  it("should parse str with multiple ranges", function () {
    var range = parse(1000, "bytes=40-80,81-90,-1");
    assert.deepEqual(
      range,
      Object.assign(
        [
          { start: 40, end: 80 },
          { start: 81, end: 90 },
          { start: 999, end: 999 },
        ],
        { type: "bytes" },
      ),
    );
  });

  it("should parse str with some invalid ranges", function () {
    var range = parse(200, "bytes=0-499,1000-,500-999");
    assert.deepEqual(
      range,
      Object.assign([{ start: 0, end: 199 }], { type: "bytes" }),
    );
  });

  it("should parse str with whitespace", function () {
    var range = parse(1000, "bytes=   40-80 , 81-90 , -1 ");
    assert.deepEqual(
      range,
      Object.assign(
        [
          { start: 40, end: 80 },
          { start: 81, end: 90 },
          { start: 999, end: 999 },
        ],
        { type: "bytes" },
      ),
    );
  });

  it("should parse non-byte range", function () {
    var range = parse(1000, "items=0-5");
    assert.deepEqual(
      range,
      Object.assign([{ start: 0, end: 5 }], { type: "items" }),
    );
  });

  describe("when combine: true", function () {
    it("should combine overlapping ranges", function () {
      var range = parse(150, "bytes=0-4,90-99,5-75,100-199,101-102", {
        combine: true,
      });

      assert.deepEqual(
        range,
        Object.assign(
          [
            { start: 0, end: 75 },
            { start: 90, end: 149 },
          ],
          { type: "bytes" },
        ),
      );
    });

    it("should retain original order", function () {
      var range = parse(150, "bytes=-1,20-100,0-1,101-120", { combine: true });

      assert.deepEqual(
        range,
        Object.assign(
          [
            { start: 149, end: 149 },
            { start: 20, end: 120 },
            { start: 0, end: 1 },
          ],
          { type: "bytes" },
        ),
      );
    });
  });

  it("should ignore whitespace-only invalid ranges when valid present", function () {
    var range = parse(1000, "bytes= , 0-10");

    assert.deepEqual(
      range,
      Object.assign([{ start: 0, end: 10 }], { type: "bytes" }),
    );
  });
});
