import * as components from '@/componentExports';

// install function executed by Vue.use()
const install = function installComponents(app) {
  if (install.installed) return;
  install.installed = true;
  Object.entries(components).forEach(([componentName, component]) => {
    app.component(componentName, component);
  });
};

// Create module definition for Vue.use()
const plugin = {
  install,
};

export default plugin;
export * as FeatureFlags from '@/lib/featureFlags';
export * from '@/componentExports';
export * from '@/lib/PinFileRequest';
