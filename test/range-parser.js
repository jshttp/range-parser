
var parse = require('..');

function arr(type, arr) {
  arr.type = type;
  return arr;
}

describe('parseRange(len, str)', function(){
  it('should parse range strings', function(){
    parse(1000, 'bytes=0-499').should.eql(arr('bytes', [{ start: 0, end: 499 }]));
    parse(1000, 'bytes=40-80').should.eql(arr('bytes', [{ start: 40, end: 80 }]));
    parse(1000, 'bytes=-500').should.eql(arr('bytes', [{ start: 500, end: 999 }]));
    parse(1000, 'bytes=-400').should.eql(arr('bytes', [{ start: 600, end: 999 }]));
    parse(1000, 'bytes=500-').should.eql(arr('bytes', [{ start: 500, end: 999 }]));
    parse(1000, 'bytes=400-').should.eql(arr('bytes', [{ start: 400, end: 999 }]));
    parse(1000, 'bytes=0-0').should.eql(arr('bytes', [{ start: 0, end: 0 }]));
    parse(1000, 'bytes=-1').should.eql(arr('bytes', [{ start: 999, end: 999 }]));
    parse(1000, 'items=0-5').should.eql(arr('items', [{ start: 0, end: 5 }]));
    parse(1000, 'bytes=40-80,-1').should.eql(arr('bytes', [{ start: 40, end: 80 }, { start: 999, end: 999 }]));
  })
})