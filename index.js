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
  var i = str.indexOf('=')

  if (i === -1) {
    return -2
  }

  var arr = str.slice(i + 1).split(',').reduce(function eachRange (memo, range) {
    var parts = range.split('-')
    var start = parseInt(parts[0], 10)
    var end = parseInt(parts[1], 10)

    // -nnn
    if (isNaN(start)) {
      start = size - end
      end = size - 1
    // nnn-
    } else if (isNaN(end)) {
      end = size - 1
    }

    // limit last-byte-pos to current length
    if (end > size - 1) {
      end = size - 1
    }

    // invalid
    if (isNaN(start) || isNaN(end) || start > end || start < 0) {
      return memo
    }

    memo.push({
      start: start,
      end: end
    })

    return memo
  }, [])

  arr.type = str.slice(0, i)

  return arr.length ? arr : -1
}
