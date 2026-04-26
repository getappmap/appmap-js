const { compileTemplate } = require('@vue/compiler-sfc');
const { createHash } = require('crypto');

module.exports = {
  process(content, filename) {
    const id = createHash('md5').update(filename).digest('hex').slice(0, 8);
    const { code, errors } = compileTemplate({
      source: content,
      filename,
      id,
      transformAssetUrls: false,
    });

    if (errors.length) {
      throw errors[0];
    }

    // compileTemplate produces ESM; convert to CJS for Jest.
    const cjsCode = code
      // import { foo as _foo, bar } from "vue" → const { foo: _foo, bar } = require('vue')
      .replace(
        /^import\s+\{([^}]+)\}\s+from\s+["']vue["'];?/m,
        (_, imports) => {
          const specifiers = imports
            .split(',')
            .map((s) => s.trim().replace(/\s+as\s+/, ': '))
            .join(', ');
          return `const { ${specifiers} } = require('vue');`;
        }
      )
      // export function render → function render
      .replace(/^export function /m, 'function ')
      // export { render } → (removed)
      .replace(/^export\s+\{[^}]*\};?\s*$/m, '');

    return { code: cjsCode + '\nmodule.exports = { render };' };
  },
};
