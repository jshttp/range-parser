
# range-parser

[![NPM version][npm-image]][npm-url]
[![Build status][travis-image]][travis-url]
[![Test coverage][coveralls-image]][coveralls-url]
[![Dependency Status][david-image]][david-url]
[![License][license-image]][license-url]
[![Downloads][downloads-image]][downloads-url]

  Range header field parser.

## Example:

```js
assert(-1 == parse(200, 'bytes=500-20'));
assert(-2 == parse(200, 'bytes=malformed'));
parse(200, 'bytes=0-499').should.eql(arr('bytes', [{ start: 0, end: 199 }]));
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
```

## Installation

```
$ npm install range-parser
```

[npm-image]: https://img.shields.io/npm/v/range-parser.svg?style=flat-square
[npm-url]: https://npmjs.org/package/range-parser
[github-tag]: http://img.shields.io/github/tag/jshttp/range-parser.svg?style=flat-square
[github-url]: https://github.com/jshttp/range-parser/tags
[travis-image]: https://img.shields.io/travis/jshttp/range-parser.svg?style=flat-square
[travis-url]: https://travis-ci.org/jshttp/range-parser
[coveralls-image]: https://img.shields.io/coveralls/jshttp/range-parser.svg?style=flat-square
[coveralls-url]: https://coveralls.io/r/jshttp/range-parser?branch=master
[david-image]: http://img.shields.io/david/jshttp/range-parser.svg?style=flat-square
[david-url]: https://david-dm.org/jshttp/range-parser
[license-image]: http://img.shields.io/npm/l/range-parser.svg?style=flat-square
[license-url]: LICENSE
[downloads-image]: http://img.shields.io/npm/dm/range-parser.svg?style=flat-square
[downloads-url]: https://npmjs.org/package/range-parser
[gittip-image]: https://img.shields.io/gittip/jonathanong.svg?style=flat-square
[gittip-url]: https://www.gittip.com/jonathanong/
