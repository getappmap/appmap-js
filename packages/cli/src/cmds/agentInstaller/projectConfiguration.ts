import chalk from 'chalk';
import { promises as fs, constants as fsConstants } from 'fs';
import { readFile } from 'fs/promises';
import { exists } from '../../utils';

import { basename, join, resolve } from 'path';
import { glob } from 'glob';
import packages from '../../fingerprint/canonicalize/packages';
import { AbortError, InvalidPathError } from '../errors';
import UI from '../userInteraction';
import AgentInstaller from './agentInstaller';
import getAvailableInstallers from './installers';
import { YarnInstaller } from './javaScriptAgentInstaller';

export interface ProjectConfiguration {
  name: string;
  path: string;
  availableInstallers: AgentInstaller[];
  selectedInstaller?: AgentInstaller;
  writeAppMapYaml?: boolean;
}

async function resolveSelectedInstallers(
  projects: ProjectConfiguration[],
  userSpecifiedInstaller?: string
): Promise<void> {
  // Attempt to resolve selectedInstallers from the user's arg line input.
  if (userSpecifiedInstaller) {
    for (const project of projects) {
      const { availableInstallers } = project;
      let selectedInstaller: AgentInstaller | undefined;

      selectedInstaller = availableInstallers.find(
        (i) => i.name.toLowerCase() === userSpecifiedInstaller.toLowerCase()
      );

      if (!selectedInstaller) {
        const { willContinue } = await UI.prompt([
          {
            type: 'confirm',
            name: 'willContinue',
            prefix: chalk.yellow('!'),
            message: `${chalk.red(
              userSpecifiedInstaller
            )} is not a supported project type. However, installation may continue with: ${availableInstallers
              .map((i) => chalk.blue(i.name))
              .join(', ')}. Continue?`,
          },
        ]);

        if (!willContinue) {
          throw new AbortError(
            [
              `user attempted to install via \`${userSpecifiedInstaller}\` but aborted.`,
              `installers available: ${availableInstallers.map((i) => i.name).join(', ')}`,
            ].join('\n')
          );
        }
      }

      project.selectedInstaller = selectedInstaller;
    }
  }

  // Populate selected installer either by selecting the only one available or prompting the user
  // to make a selection.
  for (let i = 0; i < projects.length; ++i) {
    const project = projects[i];
    if (!project.selectedInstaller) {
      if (project.availableInstallers.length === 1) {
        project.selectedInstaller = project.availableInstallers[0];
      } else {
        const key = `installer${i}`;
        const result = await UI.prompt({
          type: 'list',
          name: key,
          message: `Multiple project types were found in ${chalk.blue(
            resolve(project.path)
          )}. Select one to continue.`,
          choices: project.availableInstallers.map((i) => i.name),
        });
        const installerName = result[key];
        project.selectedInstaller = project.availableInstallers.find(
          (i) => i.name === installerName
        );
      }
    }
  }

  // Sanity check. Verify everything resolved properly. This branch should never occur.
  if (projects.some(({ selectedInstaller }) => !selectedInstaller)) {
    throw new Error('Invalid selection');
  }
}

export async function getYarnPackages(availableInstallers: AgentInstaller[]): Promise<string[]> {
  let yarnPackages: string[] = [];
  for (const installer of availableInstallers) {
    if (installer.name === 'yarn') {
      const packageJsonFilename = join(installer.path, 'package.json');
      if (await exists(packageJsonFilename)) {
        const data = await readFile(packageJsonFilename, 'utf-8');
        const packageJson = JSON.parse(data);
        if ('workspaces' in packageJson) {
          const workspaces = packageJson['workspaces'];
          // process as glob because it could be something like
          // workspaces: [ 'packages/*' ]
          workspaces.forEach((workspace) => {
            const matches = glob.sync(workspace, {
              matchBase: true,
              cwd: installer.path,
              ignore: ['**/node_modules/**', '**/.git/**'],
              strict: false,
            });
            matches.forEach((yarnPackage) => {
              yarnPackages.push(yarnPackage);
            });
          });
        }
      }
    }
  }

  return yarnPackages;
}

/**
 * Identifies subprojects and returns an array of ProjectConfigurations if the user chooses to
 * install to them. If the user opts not to install to any subprojects, undefined is returned. This
 * is different from an empty array, which indicates the user opted to install to subprojects, but
 * selected nothing.
 * @param dir
 * @returns ProjectConfiguration[] if the user chooses to install to subprojects, otherwise
 *          undefined
 */
async function getSubprojects(
  dir: string,
  rootHasInstaller: boolean,
  availableInstallers: AgentInstaller[]
): Promise<ProjectConfiguration[] | undefined> {
  const yarnPackages = await getYarnPackages(availableInstallers);

  let subprojects: ProjectConfiguration[] = [];
  if (yarnPackages.length > 0) {
    // detect yarn packages as sub-projects
    yarnPackages.forEach((yarnPackage) => {
      const subProjectPath = join(dir, yarnPackage);
      const subProjectName = basename(yarnPackage);
      subprojects.push({
        name: subProjectName,
        path: subProjectPath,
        // must set the new path in the installer
        availableInstallers: [new YarnInstaller(subProjectPath)],
      } as ProjectConfiguration);
    });
  } else {
    // read directory to detect sub-projects
    const ents = await fs.readdir(dir, { withFileTypes: true });
    subprojects = (
      await Promise.all(
        ents.map(async (ent): Promise<ProjectConfiguration | null> => {
          if (!ent.isDirectory()) {
            return null;
          }

          const subProjectPath = join(dir, ent.name);
          try {
            await fs.access(subProjectPath, fsConstants.R_OK);
          } catch {
            // This directory is not readable. Ignore it.
            return null;
          }

          const installers = await getAvailableInstallers(subProjectPath);
          if (!installers.length) {
            return null;
          }

          return {
            name: ent.name,
            path: subProjectPath,
            availableInstallers: installers,
          };
        })
      )
    ).filter(Boolean) as ProjectConfiguration[];
  }

  if (!subprojects.length) {
    // There's nothing that we can do here.
    return undefined;
  }

  const { addSubprojects } = await UI.prompt({
    type: 'confirm',
    default: !rootHasInstaller,
    name: 'addSubprojects',
    message:
      'This directory contains sub-projects. Would you like to choose sub-projects for installation?',
  });
  if (!addSubprojects) {
    // The user has opted not to continue by not selecting subprojects.
    return undefined;
  }

  const subProjectConfigurations: ProjectConfiguration[] = [];
  const { selectedSubprojects } = await UI.prompt({
    type: 'checkbox',
    name: 'selectedSubprojects',
    message: 'Select the projects to install AppMap to.',
    choices: subprojects.map(({ name }) => name),
  });

  if (selectedSubprojects.length > 0) {
    subProjectConfigurations.push(
      ...subprojects.filter(({ name }) => selectedSubprojects.includes(name))
    );
  }

  return subProjectConfigurations;
}

export async function getProjects(
  installers: readonly AgentInstaller[],
  dir: string,
  allowMulti?: boolean,
  userSpecifiedInstaller?: string
): Promise<ProjectConfiguration[]> {
  let projectConfigurations: ProjectConfiguration[] = [];

  const availableInstallers = await getAvailableInstallers(dir);
  const rootHasInstaller = !!availableInstallers.length;
  if (allowMulti) {
    const subprojects = await getSubprojects(dir, rootHasInstaller, availableInstallers);
    if (subprojects?.length) {
      projectConfigurations.push(...(subprojects as ProjectConfiguration[]));
    } else if (subprojects?.length === 0) {
      throw new InvalidPathError(
        'No sub-projects were chosen, so there is nothing to do. Exiting.',
        dir
      );
    }
  }

  // If there are no subprojects, we will continue by installing to the current directory.
  if (!projectConfigurations.length) {
    if (availableInstallers.length) {
      projectConfigurations = [
        {
          name: basename(dir),
          path: resolve(dir),
          availableInstallers,
        },
      ];
    } else {
      const longestInstallerName = Math.max(...installers.map((i) => i.name.length));

      throw new InvalidPathError(
        [
          `No supported project was found in ${chalk.red(resolve(dir))}.`,
          '',
          'The installation requirements for each project type are listed below:',
          installers
            .map(
              (i) =>
                `${chalk.blue(i.name.padEnd(longestInstallerName + 2, ' '))} ${chalk.yellow(
                  `${i.buildFile} not found`
                )}`
            )
            .filter(Boolean)
            .join('\n'),
          '',
          `At least one of the requirements above must be satisfied to continue.`,
          '',
          `Change the current directory or specify a different directory as the last argument to this command.`,
          `Use ${chalk.blue('--help')} for more information.`,
        ].join('\n'),
        dir
      );
    }
  }

  await resolveSelectedInstallers(projectConfigurations, userSpecifiedInstaller);

  return projectConfigurations;
}
