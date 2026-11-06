import { describe, test } from "vitest";
import { parse, combineRanges } from "./index";

describe("parse", () => {
  test("1000 byte range", ({ bench }) => {
    bench("parse", () => {
      parse(1000, "bytes=0-499");
    });
  });

  test("multiple byte ranges", ({ bench }) => {
    bench("parse", () => {
      parse(1000, "bytes=0-99,200-299,400-499,600-699,800-899");
    });
  });
});

describe("parse edge cases", () => {
  for (const [name, header] of [
    ["whitespace", "bytes=   40-80 , 81-90 , -1 "],
    ["suffix", "bytes=-400"],
    ["malformed", "bytes=abc-def"],
    ["unsatisfiable", "bytes=2000-3000"],
    ["overflowing position", `bytes=0-${"9".repeat(400)}`],
    ["many invalid ranges", `bytes=${"x,".repeat(100)}0-99`],
  ]) {
    test(name, ({ bench }) => {
      bench("parse", () => {
        parse(1000, header);
      });
    });
  }
});

describe("combineRanges", () => {
  test("simple overlapping ranges", ({ bench }) => {
    bench("combine", () => {
      combineRanges([
        {
          start: 0,
          end: 499,
        },
        { start: 400, end: 999 },
      ]);
    });
  });

  test("complex overlapping ranges", ({ bench }) => {
    bench("combine", () => {
      combineRanges([
        { start: 0, end: 199 },
        { start: 150, end: 349 },
        { start: 300, end: 499 },
        { start: 400, end: 699 },
        { start: 600, end: 999 },
      ]);
    });
  });
});
