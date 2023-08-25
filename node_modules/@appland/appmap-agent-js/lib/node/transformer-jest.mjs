// https://github.com/facebook/jest/blob/ee63afcbe7904d18558d3cc40e0940804df3deb7/packages/jest-transform/src/ScriptTransformer.ts#L261

import "./global.mjs";
import "./error.mjs";
import { configuration } from "./configuration.mjs";

const { compileCreateTransformer } = await import(
  "../../dist/bundles/transformer-jest.mjs"
);

export default {
  createTransformer: compileCreateTransformer(configuration),
};
