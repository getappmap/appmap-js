/* eslint-disable import/no-extraneous-dependencies */

import { extname } from 'path';
import { createFilter } from 'rollup-pluginutils';
import svgToVue from 'svg-to-vue';

// Transform an SVG to a Vue component
export default function plugin(options = {}) {
  const filter = createFilter(options.include, options.exclude);
  return {
    async transform(content, id) {
      console.log(extname(id), id);
      if (extname(id) !== '.svg' || !filter(id)) {
        return null;
      }

      const code = await (await svgToVue(content))
        .toString()
        .replace(/^\s+module.exports\s+=/, 'export default');

      return { code };
    },
  };
}
