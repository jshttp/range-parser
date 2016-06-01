/*!
 * range-parser
 * Copyright(c) 2012-2014 TJ Holowaychuk
 * MIT Licensed
 */

'use strict'

/**
 * Module exports.
 * @public
 */

module.exports = rangeParser

/**
 * Parse "Range" header `str` relative to the given file `size`.
 *
 * @param {Number} size
 * @param {String} str
 * @return {Array}
 * @public
 */

function rangeParser (size, str) {
  var index = str.indexOf('=')

  if (index === -1) {
    return -2
  }

  // split the range string
  var arr = str.slice(index + 1).split(',')
  var ranges = []

  // add ranges type
  ranges.type = str.slice(0, index)

  // parse all ranges
  var lastBytePos = size - 1
  for (var i = 0; i < arr.length; i++) {
    var range = arr[i].split('-')
    var start = parseInt(range[0], 10)
    var end = parseInt(range[1], 10)

    // -nnn
    if (isNaN(start)) {
      start = size - end
      end = lastBytePos
    // nnn-
    } else if (isNaN(end)) {
      end = lastBytePos
    }

    // limit last-byte-pos to current length
    if (end > lastBytePos) {
      end = lastBytePos
    }

    // invalid or unsatisifiable
    if (isNaN(start) || isNaN(end) || start > end || start < 0) {
      continue
    }

    // add range
    ranges.push({
      start: start,
      end: end
    })
  }

  return ranges.length ? combineRanges(ranges) : -1
}

function combineRanges (ranges) {
  if (ranges.length <= 1) {
    return ranges
  }
  var type = ranges.type
  ranges = ranges.sort(byStart)
  var current = ranges[0]
  var combined = [current]
  for (var i = 1; i < ranges.length; i++) {
    var next = ranges[i]
    if (next.start - current.end > 1) {
      combined.push(next)
      current = next
    } else if (next.end > current.end) {
      current.end = next.end
    }
  }
  combined.type = type
  return combined
}

function byStart (a, b) {
  return a.start - b.start
}
