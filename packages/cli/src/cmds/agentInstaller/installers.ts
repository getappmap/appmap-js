import AgentInstaller from './agentInstaller';
import GradleInstaller from './gradleInstaller';
import MavenInstaller from './mavenInstaller';
import { NpmInstaller, YarnInstaller } from './javaScriptAgentInstaller';
import { PipInstaller, PoetryInstaller } from './pythonAgentInstaller';
import { BundleInstaller } from './rubyAgentInstaller';

type AgentInstallerConstructor = new (...args: any[]) => AgentInstaller;
export const INSTALLERS: readonly AgentInstallerConstructor[] = [
  BundleInstaller,
  GradleInstaller,
  MavenInstaller,
  NpmInstaller,
  PipInstaller,
  PoetryInstaller,
  YarnInstaller
];

/**
 * Retrieve the installers available for a given path
 * @param path The path to check for available installers
 * @returns An array of installers available for the given path. May be empty.
 */
export default async function getAvailableInstallers(
  path: string
): Promise<AgentInstaller[]> {
  const allInstallers = INSTALLERS.map((constructor) => new constructor(path));

  // Results is an array lookup containing a boolean indicating whether the installer is available
  // e.g. [true, false, true, true]
  const results = await Promise.all(
    allInstallers.map(async (installer) => await installer.available())
  );

  // Index the results array to get the installers that are available
  return allInstallers.filter((_, i) => results[i]);
}
