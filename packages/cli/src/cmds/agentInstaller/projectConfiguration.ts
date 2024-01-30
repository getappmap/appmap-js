import chalk from 'chalk';
import { promises as fs, constants as fsConstants } from 'fs';

import { basename, join, resolve } from 'path';
import { AbortError, ChildProcessError, InvalidPathError } from '../errors';
import InstallerUI from './installerUI';
import AgentInstaller from './agentInstaller';
import getAvailableInstallers from './installers';

export interface ProjectConfiguration {
  name: string;
  path: string;
  availableInstallers: AgentInstaller[];
  selectedInstaller?: AgentInstaller;
  writeAppMapYaml?: boolean;
  noopOnly?: boolean;
}

async function resolveSelectedInstallers(
  ui: InstallerUI,
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
        const willContinue = await ui.attemptUnsupportedProjectType(
          `${chalk.red(
            userSpecifiedInstaller
          )} is not a supported project type. However, installation may continue with: ${availableInstallers
            .map((i) => chalk.blue(i.name))
            .join(', ')}. Continue?`
        );
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
        const installerName = await ui.selectProject(
          `Multiple project types were found in ${chalk.blue(
            resolve(project.path)
          )}. Select one to continue.`,
          key,
          project.availableInstallers.map((i) => i.name)
        );
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
  ui: InstallerUI,
  dir: string,
  rootHasInstaller: boolean
): Promise<ProjectConfiguration[] | undefined> {
  // read directory to detect sub-projects
  const ents = await fs.readdir(dir, { withFileTypes: true });
  const subprojects = (
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
          noopOnly: installers.every(({ isNoop }) => isNoop),
        };
      })
    )
  ).filter(Boolean) as ProjectConfiguration[];

  if (!subprojects.length) {
    // There's nothing that we can do here.
    return undefined;
  }

  // don't bother the user to select noop-only projects...
  const selectableSubprojects = subprojects.filter(({ noopOnly }) => !noopOnly);

  if (selectableSubprojects.length > 0 && !(await ui.chooseSubprojects(rootHasInstaller))) return;

  const subProjectConfigurations: ProjectConfiguration[] = [];

  const selectedSubprojects = await ui.selectSubprojects(
    selectableSubprojects.map(({ name }) => name)
  );
  if (selectedSubprojects.length > 0) {
    subProjectConfigurations.push(
      ...subprojects.filter(({ name }) => selectedSubprojects.includes(name))
    );
  }

  // ...but add them unconditionally so the caller sees them
  subProjectConfigurations.push(...subprojects.filter(({ noopOnly }) => noopOnly));

  return subProjectConfigurations;
}

export async function getProjects(
  ui: InstallerUI,
  installers: readonly AgentInstaller[],
  dir: string,
  allowMulti?: boolean,
  userSpecifiedInstaller?: string
): Promise<ProjectConfiguration[]> {
  let projectConfigurations: ProjectConfiguration[] = [];

  const availableInstallers = await getAvailableInstallers(dir);
  const rootHasInstaller = !!availableInstallers.find(({ isNoop }) => !isNoop);
  if (allowMulti) {
    const subprojects = await getSubprojects(ui, dir, rootHasInstaller);
    if (subprojects?.length) {
      projectConfigurations.push(...subprojects);
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
          noopOnly: !rootHasInstaller,
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

  await resolveSelectedInstallers(ui, projectConfigurations, userSpecifiedInstaller);

  return projectConfigurations;
}
