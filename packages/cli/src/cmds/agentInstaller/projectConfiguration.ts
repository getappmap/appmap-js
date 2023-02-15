import assert from 'assert';
import chalk from 'chalk';
import { promises as fs, constants as fsConstants } from 'fs';

import { basename, join, resolve } from 'path';
import { AbortError, InvalidPathError } from '@appland/common/src/errors';
import UI from '../userInteraction';
import AgentInstaller from './agentInstaller';
import getAvailableInstallers from './installers';
import { YarnInstaller } from './javaScriptAgentInstaller';
import CommandStruct from '@appland/common/src/commandStruct';
import { run } from '@appland/common/src/commandRunner';

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

function yarn1Workspaces(info: unknown): [string, string][] {
  assert(info && typeof info === 'object');
  return Object.entries(info).map(([name, data]: [string, unknown]) => {
    assert(data && typeof data === 'object');
    assert('location' in data);
    assert(typeof data['location'] === 'string');
    return [name, data['location']];
  });
}
// With yarn 1:
// - if there's no "workspaces" key in package.json we get the following error:
//   $ yarn workspaces info --json
//   yarn workspaces v1.22.19
//   error Cannot find the root of your workspace - are you sure you're currently in a workspace?
//   info Visit https://yarnpkg.com/en/docs/cli/workspaces for documentation about this command.
// - if there is a "workspaces" key in package.json the output contains text
//   outside of json. Remove it:
//   $ yarn workspaces info --json
//   yarn workspaces v1.22.19
//   {
//    "workspace-a": {
//      "location": "workspace-a",
//      "workspaceDependencies": [],
//      "mismatchedWorkspaceDependencies": []
//    }
//   }
//   Done in 0.02s.
async function getYarnSubprojectsVersionOne(
  dir: string,
  installer: YarnInstaller,
  subprojects: ProjectConfiguration[]
) {
  const cmd = new CommandStruct('yarn', ['workspaces', 'info', '--json'], installer.path);
  const output = await run(cmd);

  // Remove any text before and after JSON
  let lines = output.stdout.split('\n');
  let outputClean = '';
  for (const line of lines) {
    if (line.startsWith('error')) return;
    if (!(line.startsWith('yarn workspaces v') || line.startsWith('Done in '))) outputClean += line;
  }

  for (const [name, location] of yarn1Workspaces(JSON.parse(outputClean))) {
    const subProjectPath = join(dir, location);
    const subProjectName = basename(name);
    const projectConfiguration: ProjectConfiguration = {
      name: subProjectName,
      path: subProjectPath,
      // must set the new path in the installer
      availableInstallers: [new YarnInstaller(subProjectPath)],
    };
    subprojects.push(projectConfiguration);
  }
}

async function getYarnSubprojectsVersionAboveOne(
  dir: string,
  installer: YarnInstaller,
  subprojects: ProjectConfiguration[]
) {
  const cmd = new CommandStruct('yarn', ['workspaces', 'list', '--json'], installer.path);
  const output = await run(cmd);

  for (const line of output.stdout.split('\n')) {
    if (line !== '') {
      const yarnWorkspace = JSON.parse(line);
      const subProjectPath = join(dir, yarnWorkspace['location']);
      const subProjectName = basename(yarnWorkspace['name']);
      const projectConfiguration: ProjectConfiguration = {
        name: subProjectName,
        path: subProjectPath,
        // must set the new path in the installer
        availableInstallers: [new YarnInstaller(subProjectPath)],
      };
      subprojects.push(projectConfiguration);
    }
  }
}

export async function getYarnSubprojects(
  dir: string,
  availableInstallers: AgentInstaller[]
): Promise<ProjectConfiguration[]> {
  let subprojects: ProjectConfiguration[] = [];

  for (const installer of availableInstallers) {
    if (installer.name === 'yarn') {
      const yarnInstaller = installer as YarnInstaller;
      if (await yarnInstaller.isYarnVersionOne()) {
        await getYarnSubprojectsVersionOne(dir, yarnInstaller, subprojects);
      } else {
        await getYarnSubprojectsVersionAboveOne(dir, yarnInstaller, subprojects);
      }
    }
  }

  return subprojects;
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
  let subprojects: ProjectConfiguration[] = [];
  const yarnSubprojects: ProjectConfiguration[] = await getYarnSubprojects(
    dir,
    availableInstallers
  );

  if (yarnSubprojects.length > 0) {
    // detect yarn packages as sub-projects
    subprojects = yarnSubprojects;
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
