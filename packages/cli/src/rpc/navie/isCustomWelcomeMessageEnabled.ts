import ModelRegistry from './models/registry';

export default function isCustomWelcomeMessageEnabled(): boolean {
  // This behavior is DEFAULT ON, but can be disabled by setting the environment variable
  // NAVIE_CUSTOM_WELCOME_MESSAGE=false.
  if (process.env.NAVIE_CUSTOM_WELCOME_MESSAGE === 'false') {
    return false;
  }

  // If the model selector is available, the custom message can only be rendered if a model is
  // selected.
  if (process.env.APPMAP_NAVIE_MODEL_SELECTOR) {
    return ModelRegistry.instance.selectedModel !== undefined;
  }

  // Otherwise, default on.
  return true;
}
