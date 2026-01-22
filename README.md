# range-parser

[![NPM Version][npm-version-image]][npm-url]
[![NPM Downloads][npm-downloads-image]][npm-url]
[![Node.js Version][node-image]][node-url]
[![Build Status][ci-image]][ci-url]
[![Test Coverage][coveralls-image]][coveralls-url]

Range header field parser.

## Installation

```sh
$ npm install range-parser
```

## API

```js
import { parse, combineRanges } from "range-parser";
```

### `parse(size, header)`

Parse the given `header` string where `size` is the size of the selected
representation that is to be partitioned into subranges. A type and an array of
subranges will be returned or negative numbers indicating an error parsing.

- `-2` signals a malformed header string
- `-1` signals an unsatisfiable range

```js
// parse header from request
var subranges = parse(size, req.headers.range);

// the type of the subranges
if (subranges.type === "bytes") {
  // the ranges
  subranges.ranges.forEach(function (r) {
    // do something with r.start and r.end
  });
}
```

### `combineRanges(ranges)`

Overlapping & adjacent ranges will be combined and returned.

```js
const { ranges } = parseRange(100, "bytes=50-55,0-10,5-10,56-60");
combineRanges(ranges);
// => [
//      { start: 0,  end: 10 },
//      { start: 50, end: 60 }
//    ]
```

## License

[MIT](LICENSE)

[ci-image]: https://badgen.net/github/checks/jshttp/range-parser/master?label=ci
[ci-url]: https://github.com/jshttp/range-parser/actions/workflows/ci.yml
[coveralls-image]: https://badgen.net/coveralls/c/github/jshttp/range-parser/master
[coveralls-url]: https://coveralls.io/r/jshttp/range-parser?branch=master
[node-image]: https://badgen.net/npm/node/range-parser
[node-url]: https://nodejs.org/en/download
[npm-downloads-image]: https://badgen.net/npm/dm/range-parser
[npm-url]: https://npmjs.org/package/range-parser
[npm-version-image]: https://badgen.net/npm/v/range-parser
