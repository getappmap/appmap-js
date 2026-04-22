import { extname } from 'path';
import { createFilter } from '@rollup/pluginutils';
import { compileTemplate } from '@vue/compiler-sfc';
import { createHash } from 'crypto';

// Transform an SVG to a Vue 3 component using @vue/compiler-sfc
export default function plugin(options = {}) {
  const filter = createFilter(options.include, options.exclude);
  return {
    async transform(content, id) {
      if (extname(id) !== '.svg' || !filter(id)) {
        return null;
      }

      const scopeId = createHash('md5').update(id).digest('hex').slice(0, 8);
      const { code, errors } = compileTemplate({
        source: content,
        filename: id,
        id: scopeId,
        transformAssetUrls: false,
      });

      if (errors.length) {
        this.error(errors[0]);
        return null;
      }

      return {
        code: code + '\nexport default { render };',
        map: null,
      };
    },
  };
}
