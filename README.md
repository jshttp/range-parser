# range-parser

[![NPM Version][npm-version-image]][npm-url]
[![NPM Downloads][npm-downloads-image]][npm-url]
[![Node.js Version][node-image]][node-url]
[![Build Status][ci-image]][ci-url]
[![Test Coverage][codecov-image]][codecov-url]

Range header field parser.

## Installation

Requires Node.js 22 or later. This package uses ES modules.

```sh
npm install range-parser
```

## API

```js
import { parse, combineRanges } from "range-parser";
```

### `parse(size, header)`

Parse the given `header` string where `size` is the size of the selected representation that is to be partitioned into subranges. A type and an array of subranges will be returned or negative numbers indicating an error parsing.

- `-2` signals a malformed header string
- `-1` signals an unsatisfiable range

**Note:** `size` must be a safe integer or a `TypeError` is thrown. The maximum supported file size is `Number.MAX_SAFE_INTEGER` (9,007,199,254,740,991 bytes), about 9 PB.

```js
// parse header from request
var header = req.headers.range;
var subranges = typeof header === "string" ? parse(size, header) : -2;

// the type of the subranges
if (typeof subranges === "object" && subranges.type === "bytes") {
  // the ranges
  subranges.ranges.forEach(function (r) {
    // do something with r.start and r.end
  });
}
```

### `combineRanges(ranges)`

Overlapping and adjacent ranges will be combined and returned.
Returned ranges include the `index` used to preserve their original order.

```js
const subranges = parse(100, "bytes=50-55,0-10,5-10,56-60");
if (typeof subranges === "object") {
  combineRanges(subranges.ranges);
  // => [
  //      { start: 50, end: 60, index: 0 },
  //      { start: 0,  end: 10, index: 1 }
  //    ]
}
```

## License

[MIT](LICENSE)

[ci-image]: https://img.shields.io/github/actions/workflow/status/jshttp/range-parser/ci.yml?branch=master&label=ci
[ci-url]: https://github.com/jshttp/range-parser/actions/workflows/ci.yml
[codecov-image]: https://img.shields.io/codecov/c/github/jshttp/range-parser/master
[codecov-url]: https://app.codecov.io/gh/jshttp/range-parser
[node-image]: https://img.shields.io/node/v/range-parser
[node-url]: https://nodejs.org/en/download
[npm-downloads-image]: https://img.shields.io/npm/dm/range-parser
[npm-url]: https://npmjs.org/package/range-parser
[npm-version-image]: https://img.shields.io/npm/v/range-parser
