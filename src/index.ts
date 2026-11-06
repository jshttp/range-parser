/*!
 * range-parser
 * Copyright(c) 2012-2014 TJ Holowaychuk
 * Copyright(c) 2015-2016 Douglas Christopher Wilson
 * MIT Licensed
 */

/**
 * Range object contains normalized start and end positions.
 */
export interface Range {
  start: number;
  end: number;
}

/**
 * Result object contains type and array of Range objects.
 */
export interface Result {
  type: string;
  ranges: Range[];
}

/**
 * Parse "Range" header `str` relative to the given file `size`.
 */
export function parse(size: number, str: string): Result | -1 | -2 {
  if (!Number.isSafeInteger(size)) {
    throw new TypeError(`Invalid size: ${size}`);
  }

  const eqIndex = str.indexOf("=");
  if (eqIndex === -1) return -2;

  const ranges: Range[] = [];
  const type = str.slice(0, eqIndex);
  const len = str.length;
  let index = eqIndex + 1;
  let valid = false;

  do {
    const commaIndex = str.indexOf(",", index);
    const endIndex = commaIndex !== -1 ? commaIndex : len;
    const dashIndex = str.indexOf("-", index);

    if (dashIndex === -1 || dashIndex > endIndex) {
      index = endIndex + 1;
      continue;
    }

    // handle ows around numbers
    let startStrIndex = index;
    let endStrIndex = endIndex;
    while (str.charCodeAt(startStrIndex) === 32) startStrIndex++;
    while (str.charCodeAt(endStrIndex - 1) === 32) endStrIndex--;

    let start = NaN;
    let end = NaN;

    if (startStrIndex === dashIndex) {
      if (endStrIndex === dashIndex + 1) {
        index = endIndex + 1;
        continue; // Just "-" is not valid.
      }

      // suffix-byte-range-spec, e.g. "-500"
      start = Math.max(size - parsePos(str, dashIndex + 1, endStrIndex), 0);
      end = size - 1;
    } else {
      start = parsePos(str, startStrIndex, dashIndex);
      if (endStrIndex === dashIndex + 1) {
        // open-ended range, e.g. "9500-"
        end = size - 1;
      } else {
        end = parsePos(str, dashIndex + 1, endStrIndex);
        if (end > size - 1) end = size - 1;
      }
    }

    index = endIndex + 1;

    if (isNaN(start) || isNaN(end)) {
      continue;
    }

    // Invalid or unsatisfiable.
    if (start > end) {
      valid = true;
      continue;
    }

    ranges.push({
      start: start,
      end: end,
    });
  } while (index < len);

  if (ranges.length < 1) {
    // unsatisfiable
    return valid ? -1 : -2;
  }

  return { type, ranges };
}

/**
 * Parse string to integer.
 */
function parsePos(str: string, start: number, end: number): number {
  let value = 0;
  for (let i = start; i < end; i++) {
    const code = str.charCodeAt(i);
    if (code < 48 || code > 57) return NaN; // not a digit
    value = value * 10 + (code - 48);
  }

  return value;
}

export interface RangeWithIndex extends Range {
  index: number;
}

/**
 * Combine overlapping & adjacent ranges.
 */
export function combineRanges(ranges: Range[]): RangeWithIndex[] {
  const ordered = ranges
    .map((range, index) => ({ start: range.start, end: range.end, index }))
    .sort((a, b) => a.start - b.start);

  let j = 0;
  for (let i = 1; i < ordered.length; i++) {
    const range = ordered[i];
    const current = ordered[j];

    if (range.start > current.end + 1) {
      ordered[++j] = range;
    } else {
      current.end = Math.max(current.end, range.end);
      current.index = Math.min(current.index, range.index);
    }
  }

  ordered.length = j + 1;
  return ordered.sort((a, b) => a.index - b.index);
}
