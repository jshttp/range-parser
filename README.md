# range-parser

[![NPM Version][npm-version-image]][npm-url]
[![NPM Downloads][npm-downloads-image]][npm-url]
[![Node.js Version][node-image]][node-url]
[![Build Status][ci-image]][ci-url]
[![Test Coverage][codecov-image]][codecov-url]

Range header field parser.

## Installation

```sh
npm install range-parser
```

## API

```js
import { parse, format, combineRanges } from "range-parser";
```

### `parse(size, header)`

Parse the given `header` string where `size` is the size of the selected representation that is to be partitioned into subranges. Always returns an object with `code`, `type`, and `ranges` properties.

- `code: 0` means all ranges were parsed successfully.
- `code: 1` means the header was malformed.
- `code: 2` means one or more ranges were unsatisfiable.
- `code: 3` means both malformed and unsatisfiable ranges were encountered (`1 | 2`).

Type is always lower case and is not validated against RFC token syntax, make sure to validate before using (e.g. `type === "bytes"`).

Ranges contain all valid and satisfiable ranges with inclusive `start` and `end` positions.

```js
parse(200, "bytes=0-99,x-,500-");
// => {
//      code: 3,
//      type: "bytes",
//      ranges: [{ start: 0, end: 99 }]
//    }
```

**Note:** `size` must be a safe integer or a `TypeError` is thrown. The maximum supported file size is `Number.MAX_SAFE_INTEGER` (9,007,199,254,740,991 bytes), about 9 PB.

**Empty files:** Ranges for a zero-length representation return `code: 2`. Some clients send a `Range` header on every request to limit response size. Callers can ignore unsatisfiable ranges for empty files and serve an empty `200 OK` response instead of `416 Range Not Satisfiable`:

```js
const header = req.headers.range;
const subranges = header ? parse(size, header) : null;
let ranges = [];

if (subranges && subranges.type === "bytes") {
  if (subranges.code & 1) {
    res.statusCode = 400;
    res.end();
    return;
  }

  if (subranges.ranges.length === 0) {
    if (size === 0) {
      res.statusCode = 200;
      res.setHeader("Content-Length", "0");
      res.end();
      return;
    }

    res.setHeader("Content-Range", `bytes */${size}`);
    res.statusCode = 416;
    res.end();
    return;
  }

  ranges = combineRanges(subranges.ranges);
}

if (ranges.length === 0) {
  // Send 200 OK.
} else if (ranges.length === 1) {
  // Send 206 with `Content-Range` header.
} else {
  // Send 206 with `Content-Type: multipart/byteranges; boundary=...`.
}
```

**Security:** Callers should limit the `Range` header length before parsing and the number of ranges they serve. Use `combineRanges()` to merge overlapping and adjacent ranges, and limit total response bytes and multipart overhead to reduce denial-of-service risk. Rejecting requests whose total requested bytes exceed the representation size is a useful additional safeguard, but does not catch many small ranges with excessive multipart overhead.

### `format(obj)`

Format an object containing a range unit `type` and an array of `ranges` with inclusive `start` and `end` positions as a `Range` header.

```js
format({
  type: "bytes",
  ranges: [
    { start: 0, end: 99 },
    { start: 200, end: 299 },
  ],
});
// => "bytes=0-99,200-299"

format({ type: "items", ranges: [{ start: 0, end: 5 }] });
// => "items=0-5"

format(parse(1000, "bytes=900-,-10"));
// => "bytes=900-999,990-999"
```

Throws a `TypeError` if the object contains an invalid type or range.

### `combineRanges(ranges)`

Overlapping and adjacent ranges will be combined and returned.
Returned ranges include the `index` used to preserve their original order.

```js
const subranges = parse(100, "bytes=50-55,0-10,5-10,56-60");
if (subranges.ranges.length) {
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
