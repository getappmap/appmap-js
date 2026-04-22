import * as components from '@/componentExports';
import ReviewBackend from '@/lib/ReviewBackend';

const plugin = {
  install(app) {
    Object.entries(components).forEach(([componentName, component]) => {
      app.component(componentName, component);
    });
  },
};

export default plugin;
export * as FeatureFlags from '@/lib/featureFlags';
export * from '@/componentExports';
export * from '@/lib/PinFileRequest';
export { ReviewBackend };
