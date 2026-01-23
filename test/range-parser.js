
var assert = require('assert')
var deepEqual = require('deep-equal')
var parse = require('..')

describe('parseRange(len, str)', function () {
  it('should reject non-string str', function () {
    assert.throws(parse.bind(null, 200, {}),
      /TypeError: argument str must be a string/)
  })

  it('should return -2 for invalid str', function () {
    assert.strictEqual(parse(200, 'malformed'), -2)
  })

  it('should return -2 for invalid start byte position', function () {
    assert.strictEqual(parse(200, 'bytes=x-100'), -2)
  })

  it('should return -2 for invalid end byte position', function () {
    assert.strictEqual(parse(200, 'bytes=100-x'), -2)
  })

  it('should return -2 for invalid range format', function () {
    assert.strictEqual(parse(200, 'bytes=--100'), -2)
    assert.strictEqual(parse(200, 'bytes=100--200'), -2)
    assert.strictEqual(parse(200, 'bytes=-'), -2)
    assert.strictEqual(parse(200, 'bytes= - '), -2)
  })

  it('should return -2 with multiple dashes in range', function () {
    assert.strictEqual(parse(200, 'bytes=100-200-300'), -2)
  })

  it('should return -2 for negative start byte position', function () {
    assert.strictEqual(parse(200, 'bytes=-100-150'), -2)
  })

  it('should return -2 for invalid number format', function () {
    assert.strictEqual(parse(200, 'bytes=01a-150'), -2)
    assert.strictEqual(parse(200, 'bytes=100-15b0'), -2)
  })

  it('should return -2 when all multiple ranges have invalid format', function () {
    assert.strictEqual(parse(200, 'bytes=y-v,x-'), -2)
    assert.strictEqual(parse(200, 'bytes=abc-def,ghi-jkl'), -2)
    assert.strictEqual(parse(200, 'bytes=x-,y-,z-'), -2)
  })

  it('should return -1 for unsatisfiable range', function () {
    assert.strictEqual(parse(200, 'bytes=500-600'), -1)
  })

  it('should return -1 for unsatisfiable range with multiple ranges', function () {
    assert.strictEqual(parse(200, 'bytes=500-600,601-700'), -1)
  })

  it('should return -1 if all specified ranges are invalid', function () {
    assert.strictEqual(parse(200, 'bytes=500-20'), -1)
    assert.strictEqual(parse(200, 'bytes=500-999'), -1)
    assert.strictEqual(parse(200, 'bytes=500-999,1000-1499'), -1)
  })

  it('should return -1 when invalid format mixed with unsatisfiable ranges', function () {
    assert.strictEqual(parse(200, 'bytes=500-600,x-'), -1)
    assert.strictEqual(parse(200, 'bytes=x-,500-600'), -1)
  })

  it('should parse str', function () {
    var range = parse(1000, 'bytes=0-499')
    assert.strictEqual(range.type, 'bytes')
    assert.strictEqual(range.length, 1)
    deepEqual(range[0], { start: 0, end: 499 })
  })

  it('should cap end at size', function () {
    var range = parse(200, 'bytes=0-499')
    assert.strictEqual(range.type, 'bytes')
    assert.strictEqual(range.length, 1)
    deepEqual(range[0], { start: 0, end: 199 })
  })

  it('should parse str', function () {
    var range = parse(1000, 'bytes=40-80')
    assert.strictEqual(range.type, 'bytes')
    assert.strictEqual(range.length, 1)
    deepEqual(range[0], { start: 40, end: 80 })
  })

  it('should parse str asking for last n bytes', function () {
    var range = parse(1000, 'bytes=-400')
    assert.strictEqual(range.type, 'bytes')
    assert.strictEqual(range.length, 1)
    deepEqual(range[0], { start: 600, end: 999 })
  })

  it('should parse str with only start', function () {
    var range = parse(1000, 'bytes=400-')
    assert.strictEqual(range.type, 'bytes')
    assert.strictEqual(range.length, 1)
    deepEqual(range[0], { start: 400, end: 999 })
  })

  it('should parse "bytes=0-"', function () {
    var range = parse(1000, 'bytes=0-')
    assert.strictEqual(range.type, 'bytes')
    assert.strictEqual(range.length, 1)
    deepEqual(range[0], { start: 0, end: 999 })
  })

  it('should parse str with no bytes', function () {
    var range = parse(1000, 'bytes=0-0')
    assert.strictEqual(range.type, 'bytes')
    assert.strictEqual(range.length, 1)
    deepEqual(range[0], { start: 0, end: 0 })
  })

  it('should parse str asking for last byte', function () {
    var range = parse(1000, 'bytes=-1')
    assert.strictEqual(range.type, 'bytes')
    assert.strictEqual(range.length, 1)
    deepEqual(range[0], { start: 999, end: 999 })
  })

  it('should ignore invalid format range when valid range exists', function () {
    var range = parse(1000, 'bytes=100-200,x-')
    assert.strictEqual(range.type, 'bytes')
    assert.strictEqual(range.length, 1)
    deepEqual(range[0], { start: 100, end: 200 })
  })

  it('should ignore invalid format ranges when some are valid', function () {
    var range = parse(1000, 'bytes=x-,0-100,y-')
    assert.strictEqual(range.type, 'bytes')
    assert.strictEqual(range.length, 1)
    deepEqual(range[0], { start: 0, end: 100 })
  })

  it('should ignore invalid format ranges at different positions', function () {
    var range = parse(1000, 'bytes=0-50,abc-def,100-150')
    assert.strictEqual(range.type, 'bytes')
    assert.strictEqual(range.length, 2)
    deepEqual(range[0], { start: 0, end: 50 })
    deepEqual(range[1], { start: 100, end: 150 })
  })

  it('should parse str with multiple ranges', function () {
    var range = parse(1000, 'bytes=40-80,81-90,-1')
    assert.strictEqual(range.type, 'bytes')
    assert.strictEqual(range.length, 3)
    deepEqual(range[0], { start: 40, end: 80 })
    deepEqual(range[1], { start: 81, end: 90 })
    deepEqual(range[2], { start: 999, end: 999 })
  })

  it('should parse str with some invalid ranges', function () {
    var range = parse(200, 'bytes=0-499,1000-,500-999')
    assert.strictEqual(range.type, 'bytes')
    assert.strictEqual(range.length, 1)
    deepEqual(range[0], { start: 0, end: 199 })
  })

  it('should parse str with whitespace', function () {
    var range = parse(1000, 'bytes=   40-80 , 81-90 , -1 ')
    assert.strictEqual(range.type, 'bytes')
    assert.strictEqual(range.length, 3)
    deepEqual(range[0], { start: 40, end: 80 })
    deepEqual(range[1], { start: 81, end: 90 })
    deepEqual(range[2], { start: 999, end: 999 })
  })

  it('should parse non-byte range', function () {
    var range = parse(1000, 'items=0-5')
    assert.strictEqual(range.type, 'items')
    assert.strictEqual(range.length, 1)
    deepEqual(range[0], { start: 0, end: 5 })
  })

  describe('when combine: true', function () {
    it('should combine overlapping ranges', function () {
      var range = parse(150, 'bytes=0-4,90-99,5-75,100-199,101-102', { combine: true })
      assert.strictEqual(range.type, 'bytes')
      assert.strictEqual(range.length, 2)
      deepEqual(range[0], { start: 0, end: 75 })
      deepEqual(range[1], { start: 90, end: 149 })
    })

    it('should retain original order', function () {
      var range = parse(150, 'bytes=-1,20-100,0-1,101-120', { combine: true })
      assert.strictEqual(range.type, 'bytes')
      assert.strictEqual(range.length, 3)
      deepEqual(range[0], { start: 149, end: 149 })
      deepEqual(range[1], { start: 20, end: 120 })
      deepEqual(range[2], { start: 0, end: 1 })
    })
  })
})
