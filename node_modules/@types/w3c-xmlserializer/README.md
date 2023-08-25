# Installation
> `npm install --save @types/w3c-xmlserializer`

# Summary
This package contains type definitions for w3c-xmlserializer (https://github.com/jsdom/w3c-xmlserializer#readme).

# Details
Files were exported from https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/w3c-xmlserializer.
## [index.d.ts](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/w3c-xmlserializer/index.d.ts)
````ts
// Type definitions for w3c-xmlserializer 2.0
// Project: https://github.com/jsdom/w3c-xmlserializer#readme
// Definitions by: ExE Boss <https://github.com/ExE-Boss>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

declare namespace serialize {
    interface Options {
        /**
         * Whether the serialization algorithm will throw an `Error`
         * when the `Node` can't be serialized to well-formed XML.
         *
         * @default false
         */
        requireWellFormed?: boolean | undefined;
    }
}

declare function serialize(root: Node, options?: serialize.Options): string;
export = serialize;

````

### Additional Details
 * Last updated: Fri, 02 Jul 2021 18:05:13 GMT
 * Dependencies: none
 * Global values: none

# Credits
These definitions were written by [ExE Boss](https://github.com/ExE-Boss).
