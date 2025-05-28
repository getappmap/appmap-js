import { existsSync } from 'fs';
import { join, parse } from 'path';

export const PROJECT_FILES_BY_LANGUAGE: Record<string, string[]> = {
  javascript: ['package.json'],
  ruby: ['Gemfile'],
  python: ['setup.py', 'requirements.txt', 'pyproject.toml', 'Pipfile', 'tox.ini'],
  java: ['pom.xml', 'build.gradle', 'build.gradle.kts'],
};

/**
 * When running a test, we need to run the test file from the proper project directory.
 * In a multi-file / monorepo style project, that means searching up from the test file
 * directory until we find a project file (like package.json, pom.xml, etc).
 */
export default function rebaseTestFileToProjectFile(
  languageName: string,
  filePath: string
): {
  rebasedFilePath: string;
  projectDirectory?: string;
  projectFilePath?: string;
} {
  const projectFiles = PROJECT_FILES_BY_LANGUAGE[languageName];
  if (!projectFiles) {
    console.warn(`No project files defined for language: ${languageName}`);
    return { rebasedFilePath: filePath };
  }

  let rebasedFilePath = filePath;
  let projectDirectory = '.';
  let projectFilePath: string | undefined;

  let searchDirectory = parse(filePath);
  const MAX_ITERATIONS = 20;
  let iterations = 0;

  while (
    searchDirectory.dir !== searchDirectory.root &&
    !projectFilePath &&
    iterations < MAX_ITERATIONS
  ) {
    iterations++;
    for (const projectFile of projectFiles) {
      const projectFilePathCandidate = join(searchDirectory.dir, projectFile);
      if (existsSync(projectFilePathCandidate)) {
        rebasedFilePath = filePath.slice(searchDirectory.dir.length + 1);
        projectDirectory = searchDirectory.dir;
        projectFilePath = projectFilePathCandidate;
        break;
      }
    }

    const newSearchDirectory = parse(searchDirectory.dir);
    if (newSearchDirectory.dir === '.' || newSearchDirectory.dir === searchDirectory.dir) {
      break; // Prevent infinite loop
    }
    searchDirectory = newSearchDirectory;
  }

  if (iterations === MAX_ITERATIONS) {
    console.warn(
      `Maximum directory search depth (${MAX_ITERATIONS}) reached while searching for project files`
    );
  }

  console.log(
    `Closest ancestor directory from ${filePath} for ${languageName} test containing ${projectFiles.join(
      ', '
    )}: ${projectDirectory}`
  );

  return {
    rebasedFilePath,
    projectDirectory,
    projectFilePath,
  };
}
