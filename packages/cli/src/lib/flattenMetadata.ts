import { Metadata } from '@appland/models';
import sanitizeURL from './repositoryInfo';

/** Flattens metadata into a string-string map suitable for use in telemetry.
 * Ignores git, exception and fingerprints.
 */
export default function flattenMetadata(metadata: Metadata): Map<string, string> {
  const result = new Map<string, string>();

  if (metadata.app) result.set('app', metadata.app);

  if (metadata.client) {
    result.set('client.name', metadata.client.name);
    result.set('client.url', metadata.client.url);
    if (metadata.client.version) result.set('client.version', metadata.client.version);
  }

  if (metadata.frameworks)
    for (const { name, version } of metadata.frameworks) result.set(`framework.${name}`, version);

  if (metadata.labels) result.set('labels', metadata.labels.join(', '));

  if (metadata.language) {
    result.set('language.name', metadata.language.name);
    result.set('language.version', metadata.language.version);
    if (metadata.language.engine) result.set('language.engine', metadata.language.engine);
  }

  if (metadata.git?.repository) {
    result.set('git.repository', sanitizeURL(metadata.git.repository));
  }

  if (metadata.name) result.set('name', metadata.name);
  if (metadata.recorder) {
    result.set('recorder.name', metadata.recorder.name);
    if (metadata.recorder.type) result.set('recorder.type', metadata.recorder.type);
  }

  if (metadata.test_status) result.set('test_status', metadata.test_status);
  // KEG For backwards compatibility, but I don't see how testStatus could be non-blank
  // since the appmap spec says it's called test_status.
  if ((metadata as any).testStatus) result.set('test_status', (metadata as any).testStatus);

  return result;
}
