// Plugin to handle CSS output from rollup-plugin-vue v6.
// rollup-plugin-vue returns compiled CSS as a module, but rollup can only
// parse JS. This plugin intercepts those CSS modules and converts them to
// JS that injects a <style> element at runtime.
export default function cssInjectPlugin() {
  return {
    name: 'css-inject',
    transform(code, id) {
      if (!id.includes('?vue') || !id.includes('type=style')) {
        return null;
      }
      if (!code || !code.trim()) {
        return { code: 'export default null;', map: null };
      }
      const cssString = JSON.stringify(code);
      return {
        code: [
          `const css = ${cssString};`,
          `if (typeof document !== 'undefined') {`,
          `  const el = document.createElement('style');`,
          `  el.textContent = css;`,
          `  document.head.appendChild(el);`,
          `}`,
        ].join('\n'),
        map: null,
      };
    },
  };
}
