import { describe, bench } from "vitest";
import { parse, combineRanges } from "./index";

describe("parse", () => {
  bench("1000 byte range", () => {
    parse(1000, "bytes=0-499");
  });

  bench("multiple byte ranges", () => {
    parse(1000, "bytes=0-99,200-299,400-499,600-699,800-899");
  });
});

describe("combineRanges", () => {
  bench("simple overlapping ranges", () => {
    combineRanges([
      {
        start: 0,
        end: 499,
      },
      { start: 400, end: 999 },
    ]);
  });

  bench("complex overlapping ranges", () => {
    combineRanges([
      { start: 0, end: 199 },
      { start: 150, end: 349 },
      { start: 300, end: 499 },
      { start: 400, end: 699 },
      { start: 600, end: 999 },
    ]);
  });
});
