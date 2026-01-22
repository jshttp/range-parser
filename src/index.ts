/*!
 * range-parser
 * Copyright(c) 2012-2014 TJ Holowaychuk
 * Copyright(c) 2015-2016 Douglas Christopher Wilson
 * MIT Licensed
 */

"use strict";

/**
 * Module exports.
 * @public
 */

export = rangeParser;

namespace rangeParser {
  export interface Range {
    start: number;
    end: number;
  }

  export interface Result extends Array<Range> {
    type: string;
  }

  export interface Options {
    combine?: boolean;
  }
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

function rangeParser(size: number, str: string, options?: rangeParser.Options) {
  if (typeof str !== "string") {
    throw new TypeError("argument str must be a string");
  }

  var index = str.indexOf("=");

  if (index === -1) {
    return -2;
  }

  // split the range string
  var arr = str.slice(index + 1).split(",");
  var ranges: rangeParser.Result = Object.assign([], {
    type: str.slice(0, index),
  });

  // parse all ranges
  for (var i = 0; i < arr.length; i++) {
    var indexOf = arr[i].indexOf("-");
    if (indexOf === -1) {
      return -2;
    }

    var startStr = arr[i].slice(0, indexOf).trim();
    var endStr = arr[i].slice(indexOf + 1).trim();

    var start = parsePos(startStr);
    var end = parsePos(endStr);

    if (startStr.length === 0) {
      start = size - end;
      end = size - 1;
    } else if (endStr.length === 0) {
      end = size - 1;
    }

    // limit last-byte-pos to current length
    if (end > size - 1) {
      end = size - 1;
    }

    if (isNaN(start) || isNaN(end)) {
      return -2;
    }

    // invalid or unsatisifiable
    if (start > end || start < 0) {
      continue;
    }

    // add range
    ranges.push({
      start: start,
      end: end,
    });
  }

  if (ranges.length < 1) {
    // unsatisifiable
    return -1;
  }

  return options && options.combine ? combineRanges(ranges) : ranges;
}

/**
 * Parse string to integer.
 * @private
 */

function parsePos(str: string) {
  if (/^\d+$/.test(str)) return Number(str);
  return NaN;
}

/**
 * Combine overlapping & adjacent ranges.
 * @private
 */

function combineRanges(ranges: rangeParser.Result): rangeParser.Result {
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

  // generate combined range
  var combined = Object.assign(
    ordered.sort(sortByRangeIndex).map(mapWithoutIndex),
    { type: ranges.type },
  );

  return combined;
}

interface RangeWithIndex extends rangeParser.Range {
  index: number;
}

/**
 * Map function to add index value to ranges.
 * @private
 */

function mapWithIndex(range: rangeParser.Range, index: number): RangeWithIndex {
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

function mapWithoutIndex(range: rangeParser.Range): rangeParser.Range {
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

function sortByRangeStart(a: rangeParser.Range, b: rangeParser.Range) {
  return a.start - b.start;
}
