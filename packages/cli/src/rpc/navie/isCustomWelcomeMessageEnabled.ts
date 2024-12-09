import INavie from '../explain/navie/inavie';

export default function isCustomWelcomeMessageEnabled(_navie: INavie): boolean {
  const disabledByEnvironmentVariable = () => process.env.NAVIE_CUSTOM_WELCOME_MESSAGE === 'false';
  const enabledByEnvironmentVariable = () => process.env.NAVIE_CUSTOM_WELCOME_MESSAGE === 'true';
  // TODO: This can be used to enable an incremental rollout of the feature.
  // For now, we will go with the environment variables only.
  // const disabledByUseOfLocalNavie = () => navie instanceof LocalNavie;
  if (disabledByEnvironmentVariable()) return false;

  if (enabledByEnvironmentVariable()) return true;

  // return !disabledByUseOfLocalNavie();
  return false;
}
