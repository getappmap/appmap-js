import { promises as fsp } from 'fs';
import { join, sep } from 'path';
import moo from 'moo';
import chalk from 'chalk';
import CommandStruct from './commandStruct';
import AgentInstaller from './agentInstaller';
import { verbose, exists } from '../../utils';
import UI from './userInteraction';
import { getColumn, getWhitespace, Whitespace } from './sourceUtil';
import AbortError from './abortError';
import { JavaBuildToolInstaller } from "./javaBuildToolInstaller";


export class GradleInstaller
  extends JavaBuildToolInstaller
  implements AgentInstaller {
  constructor(readonly path: string) {
    super(path);
  }

  get name(): string {
    return 'Gradle';
  }

  get buildFile(): string {
    return 'build.gradle';
  }

  get buildFilePath(): string {
    return join(this.path, this.buildFile);
  }

  async printJarPathCommand(): Promise<CommandStruct> {
    return new CommandStruct(
      await this.runCommand(),
      ['appmap-print-jar-path'],
      this.path
    );
  }

  async postInstallMessage(): Promise<string> {
    let gradleBin = 'gradle';
    if (await exists(join(this.path, 'gradlew'))) {
      gradleBin = `.${sep}gradlew`;
    }

    return [
      `Record your tests by running ${chalk.blue(`${gradleBin} appmap test`)}`,
      `By default, AppMap files will be output to ${chalk.blue(
        'build/appmap'
      )}`,
    ].join('\n');
  }

  async available(): Promise<boolean> {
    return await exists(this.buildFilePath);
  }

  async runCommand(): Promise<string> {
    const wrapperExists = await exists(join(this.path, 'gradlew'));

    if (wrapperExists) {
      return `.${sep}gradlew`;
    } else if (verbose()) {
      console.warn(
        `${chalk.yellow(
          'gradlew wrapper'
        )} not located, falling back to ${chalk.yellow('gradle')}`
      );
    }

    return 'gradle';
  }

  async verifyCommand(): Promise<CommandStruct> {
    return new CommandStruct(
      await this.runCommand(),
      [
        'dependencyInsight',
        '--dependency',
        'com.appland:appmap-agent',
        '--configuration',
        'appmapAgent',
      ],
      this.path
    );
  }

  async modifyBlock(
    blockIdentifier: string,
    buildFileSource: string,
    whitespace: Whitespace,
    lineTransform: (lines: string[]) => string[] | Promise<string[]>,
    placementIndex?: () => number | undefined
  ) {
    const match = buildFileSource.match(
      new RegExp(`${blockIdentifier}\\s*\\{\\s*([^}]*)\\}`)
    );
    let updatedBuildFileSource;

    if (match) {
      const matchIndex = buildFileSource.indexOf(match[0]);
      let lines = match[1]
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line !== '');

      lines = await lineTransform(lines);
      const column = getColumn(buildFileSource, matchIndex);
      const newSection = [
        `${blockIdentifier} {`,
        lines
          .map((line) => whitespace.padLine(line, column + (whitespace.width || 0))
          )
          .join('\n'),
        whitespace.padLine('}', column),
      ].join('\n');

      updatedBuildFileSource = [
        buildFileSource.substring(0, matchIndex),
        newSection,
        buildFileSource.substring(
          matchIndex + match[0].length,
          buildFileSource.length
        ),
      ].join('');
    } else {
      const lines = await lineTransform([]);
      const newSection = [
        '',
        `${blockIdentifier} {`,
        lines.map((line) => whitespace.padLine(line)).join('\n'),
        '}',
      ].join('\n');

      let offset: number | undefined;
      if (placementIndex) {
        offset = placementIndex();
      }

      if (offset !== undefined) {
        updatedBuildFileSource = [
          buildFileSource.substring(0, offset + 1),
          '\n' + newSection,
          buildFileSource.substring(offset + 1, buildFileSource.length),
        ].join('');
      } else {
        const sourceChunks: string[] = [];
        if (['plugins', 'buildscript'].includes(blockIdentifier)) {
          sourceChunks.push(newSection, buildFileSource);
        } else {
          sourceChunks.push(buildFileSource, newSection);
        }
        updatedBuildFileSource = sourceChunks.join('\n');
      }
    }

    // We always want to update the source, so this shouldn't ever happen.
    if (updatedBuildFileSource === undefined) {
      throw new Error(`Failed to update ${this.buildFilePath}`);
    }

    return updatedBuildFileSource;
  }

  /**
   * Add Maven Central as a repository to build.gradle.
   */
  async insertRepository(
    buildFileSource: string,
    whitespace: Whitespace
  ): Promise<string> {
    return await this.modifyBlock(
      'repositories',
      buildFileSource,
      whitespace,
      async (lines) => {
        const exists = lines.some((line) => /mavenCentral\s*\(/.test(line));
        if (!exists) {
          const { addMavenCentral } = await UI.prompt({
            type: 'list',
            name: 'addMavenCentral',
            message: 'The Maven Central repository is required by the AppMap plugin to fetch the AppMap agent JAR. Add it now?',
            choices: ['Yes', 'No'],
          });

          if (addMavenCentral === 'Yes') {
            lines.push('mavenCentral()');
          }
        }

        return lines;
      },
      () => {
        const offsets = [
          GradleInstaller.findBlock(buildFileSource, 'buildscript'),
          GradleInstaller.findBlock(buildFileSource, 'plugins'),
        ].filter(Boolean) as number[];

        if (!offsets.length) {
          return undefined;
        }

        return Math.max(...offsets);
      }
    );
  }

  /**
   * Add the com.appland.appmap plugin to build.gradle.
   *
   * Start by looking for an existing plugins block. If found, add our plugin to
   * it. If there's no plugins block, look for a buildscript block. If found,
   * insert a new plugins block after it. (Gradle requires that the plugins
   * block appear after the buildscript block, and before any other blocks.)
   *
   * If there's no plugins block, and no buildscript block, append a new plugins
   * block.
   *
   * @returns {string}
   */
  async insertPluginSpec(
    buildFileSource: string,
    whitespace: Whitespace
  ): Promise<string> {
    const pluginSpec = `id 'com.appland.appmap' version '1.1.0'`;

    return await this.modifyBlock(
      'plugins',
      buildFileSource,
      whitespace,
      async (lines) => {
        const javaPresent = lines.some((line) => line.match(/^\s*id\s+["']\s*java/)
        );
        if (!javaPresent) {
          const { userWillContinue } = await UI.prompt({
            type: 'list',
            name: 'userWillContinue',
            message: `The ${chalk.red(
              "'java'"
            )} plugin was not found. This configuration is unsupported and is likely to fail. Continue?`,
            default: 'Abort',
            choices: ['Abort', 'Continue'],
          });

          if (userWillContinue === 'Abort') {
            throw new AbortError('no java plugin found');
          }
        }

        const existingIndex = lines.findIndex((line) => line.match(/com\.appland\.appmap/)
        );

        if (existingIndex !== -1) {
          lines[existingIndex] = pluginSpec;
        } else {
          lines.push(pluginSpec);
        }

        return lines;
      },
      () => GradleInstaller.findBlock(buildFileSource, 'buildscript')
    );
  }

  async installAgent(): Promise<void> {
    const buildFileSource = (await fsp.readFile(this.buildFilePath)).toString();
    const whitespace = getWhitespace(buildFileSource);
    let updatedBuildFileSource = await this.insertPluginSpec(
      buildFileSource,
      whitespace
    );
    updatedBuildFileSource = await this.insertRepository(
      updatedBuildFileSource,
      whitespace
    );
    await fsp.writeFile(this.buildFilePath, updatedBuildFileSource);
  }

  /**
   * Parse the given gradle source, looking for a block identified by
   * `blockIdentifier`. If found, return the offset in the source where
   * the block ends. It not found, return undefined.
   */
  static findBlock(
    gradleSrc: string,
    blockIdentifier: string
  ): number | undefined {
    const lexer = moo.compile({
      blockIdentifier,
      comment: /\/\/.*?$/,
      ident: /[\w.]+/,
      lbrace: '{',
      rbrace: '}',
      punct: /[()":'/.,$*+=<>[\]~?\\&!|-]/,
      space: { match: /\s+/, lineBreaks: true },
      NL: { match: /\n/, lineBreaks: true },
    });

    lexer.reset(gradleSrc);

    let token;
    let startBuildscript = false;
    let inBuildscript = false;
    let braceIdx = 0;

    // eslint-disable-next-line no-cond-assign
    while ((token = lexer.next())) {
      /* eslint-disable no-continue */
      /* eslint-disable no-plusplus */
      const t = token.type;
      if (t === 'comment' || t === 'space') {
        continue;
      }
      if (t === 'blockIdentifier') {
        startBuildscript = true;
        continue;
      }
      if (startBuildscript) {
        // The buildscript token can appear in multiple places in a gradle file.
        // We'll only be starting the buildscript block if it's immediately
        // followed by a left brace.
        if (t === 'lbrace') {
          braceIdx = 1;
          inBuildscript = true;
        }
        startBuildscript = false;
        continue;
      }

      if (inBuildscript) {
        if (t === 'lbrace') {
          braceIdx++;
        } else if (t === 'rbrace') {
          braceIdx--;
        }
        if (braceIdx === 0) {
          // We've found the right brace of the buildscript block, we're done.
          return token.offset;
        }
      }
    }

    return undefined; // no buildscript block
  }
}
