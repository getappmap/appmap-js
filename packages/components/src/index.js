import * as components from '@/componentExports';
import ReviewStream from '@/lib/reviewStream';

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
export * as FeatureFlags from '@/lib/featureFlags';
export * from '@/componentExports';
export * from '@/lib/PinFileRequest';
export { ReviewStream };
