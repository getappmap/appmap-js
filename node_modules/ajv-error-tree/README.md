# ajv-error-tree

Convert a list of [ajv](https://www.npmjs.com/package/ajv) errors into the logical tree it was always meant to be.

Requirement: `ajv@8.x.x`.

Example:

```js
const Ajv = require("ajv");
const YAML = require("yaml");
const { asTree } = require("treeify");
const {
  structureAJVErrorArray,
  summarizeAJVErrorTree,
} = require("ajv-error-tree");
const ajv = new Ajv({ verbose: true });
const validate = ajv.compile({
  type: "array",
  items: {
    anyOf: [
      {type: "number"},
      {type: "boolean"}
    ]
  }
});
console.assert(!validate([123, true, "foo"]));
const tree1 = structureAJVErrorArray(validate.errors);
const tree2 = summarizeAJVErrorTree(tree1);
console.log(asTree(tree2, true));
// ├─ .: /items/anyOf >> /2 must match a schema in anyOf
// └─ +
//    ├─ 0: /items/anyOf/0/type >> /2 must be number
//    └─ 1: /items/anyOf/1/type >> /2 must be boolean
```

See [sample](test/sample.js) for another example.
