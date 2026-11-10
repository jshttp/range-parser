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
 * Result object contains a status code, type, and array of Range objects.
 */
export interface Result {
  code: number;
  type: string;
  ranges: readonly Range[];
}

/**
 * Format normalized ranges as a "Range" header value.
 */
export function format(obj: Partial<Result>): string {
  const { type, ranges } = obj;

  if (!type || /[^!#$%&'*+\-.^_`|~0-9A-Za-z]/.test(type)) {
    throw new TypeError("Invalid range type");
  }

  if (!ranges || ranges.length === 0) {
    throw new TypeError("At least one range is required");
  }

  const parts: string[] = [];
  for (const range of ranges) {
    if (
      !range ||
      !Number.isSafeInteger(range.start) ||
      !Number.isSafeInteger(range.end) ||
      range.start < 0 ||
      range.end < range.start
    ) {
      throw new TypeError("Invalid range");
    }

    parts.push(`${range.start}-${range.end}`);
  }

  return `${type}=${parts.join(",")}`;
}

/**
 * Parse "Range" header `str` relative to the given file `size`.
 */
export function parse(size: number, str: string): Result {
  if (!Number.isSafeInteger(size) || size < 0) {
    throw new TypeError(`Invalid size: ${size}`);
  }

  const ranges: Range[] = [];
  const eqIndex = str.indexOf("=");
  if (eqIndex === -1) return { code: 1, type: "", ranges };

  const type = str.slice(0, eqIndex);
  const len = str.length;
  let index = eqIndex + 1;
  let code: Result["code"] = 0;
  let hasRange = false;

  do {
    const commaIndex = str.indexOf(",", index);
    const endIndex = commaIndex !== -1 ? commaIndex : len;

    // Ignore empty list elements, including optional whitespace.
    let startStrIndex = index;
    let endStrIndex = endIndex;
    while (
      str.charCodeAt(startStrIndex) === 32 ||
      str.charCodeAt(startStrIndex) === 9
    )
      startStrIndex++;

    while (
      str.charCodeAt(endStrIndex - 1) === 32 ||
      str.charCodeAt(endStrIndex - 1) === 9
    )
      endStrIndex--;

    index = endIndex + 1;

    if (startStrIndex >= endStrIndex) {
      continue;
    }

    hasRange = true;

    const dashIndex = str.indexOf("-", startStrIndex);
    if (dashIndex === -1 || dashIndex > endStrIndex) {
      code |= 1; // Invalid range.
      continue;
    }

    let start = NaN;
    let end = NaN;

    if (startStrIndex === dashIndex) {
      if (endStrIndex === dashIndex + 1) {
        code |= 1; // Invalid range.
        continue; // Just "-" is not valid.
      }

      // suffix-byte-range-spec, e.g. "-500"
      const suffixLength = parsePos(str, dashIndex + 1, endStrIndex);
      // A nonzero suffix is satisfiable for an empty file.
      if (size === 0 && suffixLength > 0) continue;

      start = Math.max(size - suffixLength, 0);
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

    if (isNaN(start) || isNaN(end)) {
      code |= 1; // Unable to parse.
      continue;
    }

    if (start > end) {
      code |= 2; // Bad range request.
      continue;
    }

    ranges.push({
      start: start,
      end: end,
    });
  } while (index < len);

  // A range-set must contain at least one nonempty element.
  if (!hasRange) return { code: 1, type, ranges };

  return { code, type, ranges };
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
  if (ranges.length === 0) return [];

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
