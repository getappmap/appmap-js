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

    return { code: code + '\nmodule.exports = { render };' };
  },
};
