import * as RangeParser from "../index.js";
import { expectTypeOf } from "expect-type"

expectTypeOf(RangeParser).toBeFunction();
expectTypeOf(RangeParser).toEqualTypeOf<(
    size: number,
    str: string,
    options?: RangeParser.Options,
) => RangeParser.Result | RangeParser.Ranges>();
