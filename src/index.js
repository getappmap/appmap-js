import * as components from '@/componentExports';

// install function executed by Vue.use()
const install = function installComponents(Vue) {
  if (install.installed) return;
  install.installed = true;
  Object.entries(components).forEach(([componentName, component]) => {
    Vue.component(componentName, component);
  });
};

// Create module definition for Vue.use()
const plugin = {
  install,
};

export default plugin;
export * from '@/componentExports';
export * from '@/lib/models';
export * from '@/lib/diagrams';
export * from '@/lib/fingerprint';
