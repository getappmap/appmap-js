export type InstallResult = 'none' | 'upgraded' | 'installed';

// A command to run in the project directory.
export interface Command {
  // Program executable name.
  readonly program: string;

  // Program arguments.
  readonly args: string[];

  // Key-value pairs of required environment variables.
  readonly environment?: NodeJS.ProcessEnv;
}

export interface BuildToolInstaller {
  available: boolean;

  assumptions: string;

  buildFilePath: string;

  install(): Promise<InstallResult>;

  postInstallMessage: string;

  verifyCommand: Command;
}

/**
 * One step performed during Agent installation and configuration.
 *
 * Each step presents:
 *
 * * Assumptions that are being made about the user's environment, based on things like detected files.
 * * A command that the user is expected to run and confirm OR a function that will perform the installation
 * task automatically.
 * * A post-install message.
 * * (Optional) A command that the user is expected to run in order to verify that the install step
 * is successful.
 *
 * When the user is asked to run a command, the command should run in a Terminal that's been prepared by the user.
 * Environment variables, PATH, etc should be setup the way the user likes it. The code editor installer doesn't have
 * any knowledge of, or control over, these factors.
 */
export interface InstallStep {
  /**
   * A message to the user describing what's about to happen.
   */
  readonly assumptions: string;

  /**
   * A command - either a command string, or a function.
   */
  readonly installCommand: (() => Promise<InstallResult>) | Command;

  /**
   * A message to the user about what happened.
   */
  readonly postInstallMessage: string;

  /**
   * A command for the user to run in the terminal to verify that the installation step was successful.
   */
  readonly verifyCommand: Command | null;
}

/**
 * Multi-step process to install the agent, configure it, and generate some AppMaps.
 */
export interface AgentInstaller {
  installAgent(path: string): InstallStep[];

  configureAgent(path: string): InstallStep[];

  runTests(path: string): InstallStep[];
}
