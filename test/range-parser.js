
var assert = require('assert')
var parse = require('..')

function arr(type, arr) {
  arr.type = type;
  return arr;
}

describe('parseRange(len, str)', function(){
  it('should return -2 for invalid str', function(){
    assert.strictEqual(parse(200, 'malformed'), -2)
  })

  it('should return -1 for invalid range', function(){
    assert.strictEqual(parse(200, 'bytes=500-20'), -1)
  })

  it('should parse str', function(){
    var range = parse(1000, 'bytes=0-499')
    assert.strictEqual(range.type, 'bytes')
    assert.strictEqual(range.length, 1)
    assert.deepEqual(range[0], { start: 0, end: 499 })
  })

  it('should cap end at size', function(){
    var range = parse(200, 'bytes=0-499')
    assert.strictEqual(range.type, 'bytes')
    assert.strictEqual(range.length, 1)
    assert.deepEqual(range[0], { start: 0, end: 199 })
  })

  it('should parse str', function(){
    var range = parse(1000, 'bytes=40-80')
    assert.strictEqual(range.type, 'bytes')
    assert.strictEqual(range.length, 1)
    assert.deepEqual(range[0], { start: 40, end: 80 })
  })

  it('should parse str asking for last n bytes', function(){
    var range = parse(1000, 'bytes=-400')
    assert.strictEqual(range.type, 'bytes')
    assert.strictEqual(range.length, 1)
    assert.deepEqual(range[0], { start: 600, end: 999 })
  })

  it('should parse str with only start', function(){
    var range = parse(1000, 'bytes=400-')
    assert.strictEqual(range.type, 'bytes')
    assert.strictEqual(range.length, 1)
    assert.deepEqual(range[0], { start: 400, end: 999 })
  })

  it('should parse str with no bytes', function(){
    var range = parse(1000, 'bytes=0-0')
    assert.strictEqual(range.type, 'bytes')
    assert.strictEqual(range.length, 1)
    assert.deepEqual(range[0], { start: 0, end: 0 })
  })

  it('should parse str asking for last byte', function(){
    var range = parse(1000, 'bytes=-1')
    assert.strictEqual(range.type, 'bytes')
    assert.strictEqual(range.length, 1)
    assert.deepEqual(range[0], { start: 999, end: 999 })
  })

  it('should parse str with multiple ranges', function(){
    var range = parse(1000, 'bytes=40-80,-1')
    assert.strictEqual(range.type, 'bytes')
    assert.strictEqual(range.length, 2)
    assert.deepEqual(range[0], { start: 40, end: 80 })
    assert.deepEqual(range[1], { start: 999, end: 999 })
  })

  it('should parse non-byte range', function(){
    var range = parse(1000, 'items=0-5')
    assert.strictEqual(range.type, 'items')
    assert.strictEqual(range.length, 1)
    assert.deepEqual(range[0], { start: 0, end: 5 })
  })
})
