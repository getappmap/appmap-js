export default function isCustomWelcomeMessageEnabled(): boolean {
  // This behavior is DEFAULT ON, but can be disabled by setting the environment variable
  // NAVIE_CUSTOM_WELCOME_MESSAGE=false. Any other value will be treated as true.
  return process.env.NAVIE_CUSTOM_WELCOME_MESSAGE !== 'false';
}
