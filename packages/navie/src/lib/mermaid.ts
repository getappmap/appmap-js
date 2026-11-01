/* Mermaid's parsers, without mermaid.

navie only needs syntax validation (see mermaid-filter.ts), so instead of the
full `mermaid` package it uses `mermaid-parser-bundle`: a zero-dependency
bundle of mermaid's own Jison/Langium parsers with all renderer code stripped
out. That removes mermaid, d3, cytoscape, katex, dompurify — and the JSDOM
window shim mermaid's DOMPurify instance forced us to install into `global`
at require time — from navie entirely.

The bundle is ESM-only, and @yao-pkg/pkg cannot pull an ESM package out of
node_modules into the native-binary snapshot (it reports MODULE_NOT_FOUND for
/snapshot/.../node_modules/<pkg>). So we require a pre-bundled CJS copy from
`vendor/` rather than the package itself, which keeps this loadable from the
CJS `dist/` build, from ts-jest, and from the pkg binary alike. The relative
path resolves to packages/navie/vendor from both `src/lib` and `dist/lib`.

Regenerate the vendored copy with `yarn vendor:mermaid` after bumping
mermaid-parser-bundle.
*/

/** Result of a successful parse. `db` contents depend on the diagram type. */
export interface ParseResult {
  type: string;
  db: unknown;
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
const bundle = require('../../vendor/mermaid-parser.cjs') as {
  parse(text: string): Promise<ParseResult>;
};

/**
 * Parse a mermaid diagram. Rejects on invalid syntax or an unknown diagram
 * type; the rejection message is mermaid's own parser output.
 */
export function parse(text: string): Promise<ParseResult> {
  return bundle.parse(text);
}
