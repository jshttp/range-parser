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
 *
 * @param {Number} size
 * @param {String} str
 * @param {Object} [options]
 * @return {Array}
 * @public
 */
export function parse(size: number, str: string): Result | -1 | -2 {
  const eqIndex = str.indexOf("=");
  if (eqIndex === -1) return -2;

  const ranges: Range[] = [];
  const type = str.slice(0, eqIndex);
  const len = str.length;
  let index = eqIndex + 1;

  do {
    const commaIndex = str.indexOf(",", index);
    const endIndex = commaIndex !== -1 ? commaIndex : len;
    const dashIndex = str.indexOf("-", index);

    if (dashIndex === -1 || dashIndex > endIndex) {
      return -2;
    }

    // handle ows around numbers
    let startStrIndex = index;
    let endStrIndex = endIndex;
    while (str.charCodeAt(startStrIndex) === 32) startStrIndex++;
    while (str.charCodeAt(endStrIndex - 1) === 32) endStrIndex--;

    let start = NaN;
    let end = NaN;

    if (startStrIndex === dashIndex) {
      if (endStrIndex === dashIndex + 1) return -2; // just "-" is not valid

      // suffix-byte-range-spec, e.g. "-500"
      start = size - parsePos(str, dashIndex + 1, endStrIndex);
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
      return -2;
    }

    // invalid or unsatisfiable
    if (start > end || start < 0) {
      continue;
    }

    ranges.push({
      start: start,
      end: end,
    });
  } while (index < len);

  if (ranges.length < 1) {
    // unsatisfiable
    return -1;
  }

  return { type, ranges };
}

/**
 * Parse string to integer.
 * @private
 */
function parsePos(str: string, start: number, end: number): number {
  for (let i = start; i < end; i++) {
    const code = str.charCodeAt(i);
    if (code < 48 || code > 57) return NaN; // not a digit
  }

  return Number(str.slice(start, end));
}

/**
 * Combine overlapping & adjacent ranges.
 */
export function combineRanges(ranges: Range[]): Range[] {
  var ordered = ranges.map(mapWithIndex).sort(sortByRangeStart);

  for (var j = 0, i = 1; i < ordered.length; i++) {
    var range = ordered[i];
    var current = ordered[j];

    if (range.start > current.end + 1) {
      // next range
      ordered[++j] = range;
    } else if (range.end > current.end) {
      // extend range
      current.end = range.end;
      current.index = Math.min(current.index, range.index);
    }
  }

  // trim ordered array
  ordered.length = j + 1;

  return ordered.sort(sortByRangeIndex).map(mapWithoutIndex);
}

interface RangeWithIndex extends Range {
  index: number;
}

/**
 * Map function to add index value to ranges.
 * @private
 */
function mapWithIndex(range: Range, index: number): RangeWithIndex {
  return {
    start: range.start,
    end: range.end,
    index: index,
  };
}

/**
 * Map function to remove index value from ranges.
 * @private
 */
function mapWithoutIndex(range: Range): Range {
  return {
    start: range.start,
    end: range.end,
  };
}

/**
 * Sort function to sort ranges by index.
 * @private
 */
function sortByRangeIndex(a: RangeWithIndex, b: RangeWithIndex) {
  return a.index - b.index;
}

/**
 * Sort function to sort ranges by start position.
 * @private
 */
function sortByRangeStart(a: Range, b: Range) {
  return a.start - b.start;
}
