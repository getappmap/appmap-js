/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */
import { existsSync, promises as fsp } from 'fs';
import { JSDOM } from 'jsdom';
import xmlSerializer from 'w3c-xmlserializer';
import { join } from 'path';
import moo from 'moo';
import BuildToolInstaller from './buildToolInstallerBase';
import CommandStruct from './commandStruct';
import ValidationError from './validationError';
import AgentInstaller from './agentInstallerBase';
import * as CommandRunnerImpl from './commandRunner';

type CommandRunner = {
  run: (cmd: CommandStruct) => Promise<number>;
  runSync: (cmd: CommandStruct) => string;
};

class Maven {
  /**
   * @param {string} path
   */
  constructor(protected readonly path: string) {}

  runCommand(): string {
    if (
      process.platform === 'win32' &&
      existsSync(join(this.path, 'mvnw.cmd'))
    ) {
      return 'mvnw.cmd';
    }

    if (process.platform !== 'win32' && existsSync(join(this.path, 'mvnw'))) {
      return './mvnw';
    }

    // Pray
    return 'mvn';
  }
}

class Gradle {
  constructor(protected readonly path: string) {}

  runCommand(): string {
    if (
      process.platform === 'win32' &&
      existsSync(join(this.path, 'gradlew.bat'))
    ) {
      return 'gradlew.bat';
    }

    if (
      process.platform !== 'win32' &&
      existsSync(join(this.path, 'gradlew'))
    ) {
      return './gradlew';
    }

    // Pray
    return 'gradle';
  }
}

export class MavenInstaller extends BuildToolInstaller {
  constructor(
    protected readonly path: string,
    protected readonly commandRunner = CommandRunnerImpl as unknown as CommandRunner
  ) {
    super('pom.xml', path, commandRunner);
  }

  get assumptions(): string {
    return `Your project contains a pom.xml. Therefore, it looks like a Maven project,
so we will install the AppMap Maven plugin.`;
  }

  get postInstallMessage(): string {
    return `The AppMap plugin has been added to your pom.xml. You should open this file and check that
it looks clean and correct.

Once you've done that, we'll test the proper operation of the AppMap plugin by running the following command
in your terminal`;
  }

  get verifyCommand(): CommandStruct {
    return new CommandStruct(
      new Maven(this.path).runCommand(),
      ['-Dplugin=com.appland:appmap-maven-plugin', 'help:describe'],
      this.path
    );
  }

  get agentInitCommand(): CommandStruct {
    const cmd = new CommandStruct(
      new Maven(this.path).runCommand(),
      ['appmap:print-jar-path'],
      this.path
    );

    const out = this.commandRunner.runSync(cmd);
    const appmapPath = out
      .split('\n')
      .filter((l) => l.match(/^com\.appland:appmap-agent\.jar.path/))[0]
      .split('=')[1];

    return new CommandStruct(
      'java',
      ['-jar', appmapPath, '-d', this.path, 'init'],
      this.path
    );
  }

  async install(): Promise<void> {
    const buildFileSource = (
      await fsp.readFile(super.buildFilePath)
    ).toString();
    const jsdom = new JSDOM();
    const domParser = new jsdom.window.DOMParser();
    const doc = domParser.parseFromString(buildFileSource, 'text/xml');
    const pluginVersion = '1.2.0';
    const defaultns = 'http://maven.apache.org/POM/4.0.0';

    const createEmptySection = (tag, ns) => {
      const xmlString = `<${tag} xmlns="${ns}">
  </${tag}>
`;
      const xmlNode = domParser
        .parseFromString(xmlString, 'application/xml')
        .getRootNode();
      return xmlNode.childNodes[0];
    };

    const projectSection = doc.evaluate(
      '/project',
      doc,
      doc.createNSResolver(doc.getRootNode()),
      9 /* FIRST_ORDERED_NODE_TYPE */
    ).singleNodeValue;
    if (!projectSection) {
      // Doesn't make sense to be missing the <project> section
      throw new Error(`No project section found in ${super.buildFilePath}`);
    }

    const ns = projectSection.namespaceURI || defaultns;

    const pluginString = `
      <plugin xmlns="${ns}">
          <groupId>com.appland</groupId>
          <artifactId>appmap-maven-plugin</artifactId>
          <version>${pluginVersion}</version>
          <executions>
              <execution>
                  <phase>process-test-classes</phase>
                  <goals>
                      <goal>prepare-agent</goal>
                  </goals>
              </execution>
          </executions>
      </plugin>
`;

    let buildSection = doc.evaluate(
      '/project/build',
      doc,
      doc.createNSResolver(doc.getRootNode()),
      9
    ).singleNodeValue;
    if (!buildSection) {
      buildSection = createEmptySection('build', ns);
      projectSection.appendChild(buildSection);
      projectSection.appendChild(doc.createTextNode('\n'));
    }
    let pluginsSection = doc.evaluate(
      '/project/build/plugins',
      doc,
      doc.createNSResolver(doc.getRootNode()),
      9
    ).singleNodeValue;
    if (!pluginsSection) {
      pluginsSection = createEmptySection('plugins', ns);
      buildSection.appendChild(pluginsSection);
      buildSection.appendChild(doc.createTextNode('\n'));
    }
    const appmapPlugin = doc.evaluate(
      `/project/build/plugins/plugin[groupId/text() = 'com.appland' and artifactId/text() = 'appmap-maven-plugin']`,
      doc,
      doc.createNSResolver(doc.getRootNode()),
      9
    ).singleNodeValue;
    if (appmapPlugin) {
      // @ts-ignore
      appmapPlugin.querySelector('version').textContent = pluginVersion;
    } else {
      const pluginNode = domParser
        .parseFromString(pluginString, 'application/xml')
        .getRootNode();
      while (pluginNode.childNodes.length > 0) {
        const node = pluginNode.childNodes[0];
        pluginsSection.appendChild(node);
      }
      pluginsSection.appendChild(doc.createTextNode('\n'));
    }
    const serialized = xmlSerializer(doc.getRootNode());
    await fsp.writeFile(super.buildFilePath, serialized);
  }
}

export class GradleInstaller extends BuildToolInstaller {
  constructor(
    protected readonly path: string,
    protected readonly commandRunner = CommandRunnerImpl as unknown as CommandRunner
  ) {
    super('build.gradle', path, commandRunner);
  }

  get assumptions(): string {
    return `Your project contains a build.gradle. Therefore, it looks like a Gradle project,
so we will install the AppMap Gradle plugin.`;
  }

  get postInstallMessage(): string {
    return `The AppMap plugin has been added to your build.gradle. You should open this file and check that
it looks clean and correct.

Once you've done that, we'll test the proper configuration of the AppMap plugin by running the following command
in your terminal`;
  }

  get verifyCommand(): CommandStruct {
    return new CommandStruct(
      new Gradle(this.path).runCommand(),
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

  get agentInitCommand(): CommandStruct {
    const cmd = new CommandStruct(
      new Gradle(this.path).runCommand(),
      ['-q', 'appmap-print-jar-path'],
      this.path
    );

    const out = this.commandRunner.runSync(cmd);
    const appmapPath = out
      .split('\n')
      .filter((l) => l.match(/^com\.appland:appmap-agent\.jar.path/))[0]
      .split('=')[1];

    return new CommandStruct(
      'java',
      ['-jar', appmapPath, '-d', this.path, 'init'],
      this.path
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
   */
  insertPluginSpec(buildFileSource: string): string {
    const pluginSpec = `id 'com.appland.appmap' version '1.1.0'`;
    const pluginMatch = buildFileSource.match(/plugins\s*\{\s*([^}]*)\}/);
    let updatedBuildFileSource;
    if (pluginMatch) {
      const pluginMatchIndex = buildFileSource.indexOf(pluginMatch[0]);
      const plugins = pluginMatch[1]
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line !== '');
      let found = false;
      let updatedPlugins = plugins.map((plugin) => {
        if (plugin.indexOf('com.appland.appmap') !== -1) {
          found = true;
          return `  ${pluginSpec}`;
        }
        return `  ${plugin}`;
      });
      if (!found) {
        updatedPlugins = updatedPlugins.concat([`  ${pluginSpec}`]);
      }
      const pluginSection = `plugins {
${updatedPlugins.join('\n')}
}`;
      updatedBuildFileSource = [
        buildFileSource.substring(0, pluginMatchIndex),
        pluginSection,
        buildFileSource.substring(
          pluginMatchIndex + pluginMatch[0].length,
          buildFileSource.length
        ),
      ].join('');
    } else {
      const pluginSection = `
plugins {
  ${pluginSpec}
}
`;
      const buildscriptOffset =
        GradleInstaller.findBuildscriptBlock(buildFileSource);
      if (buildscriptOffset !== undefined) {
        updatedBuildFileSource = [
          buildFileSource.substring(0, buildscriptOffset + 1),
          pluginSection,
          buildFileSource.substring(
            buildscriptOffset + 2,
            buildFileSource.length
          ),
        ].join('');
      } else {
        updatedBuildFileSource = [buildFileSource, pluginSection].join('\n');
      }
    }

    // We always want to update the source, so this shouldn't ever happen.
    if (updatedBuildFileSource === undefined) {
      throw new Error(`Failed to update ${super.buildFilePath}`);
    }

    return updatedBuildFileSource;
  }

  async install(): Promise<void> {
    const buildFileSource = (
      await fsp.readFile(super.buildFilePath)
    ).toString();
    const updatedBuildFileSource = this.insertPluginSpec(buildFileSource);
    await fsp.writeFile(super.buildFilePath, updatedBuildFileSource);
  }

  /**
   * Parse the given gradle source, looking for the buildscript block. If found,
   * return the offset in the source where the block ends. It not found, return
   * undefined.
   */
  static findBuildscriptBlock(gradleSrc: string): number | undefined {
    const lexer = moo.compile({
      buildscript: 'buildscript',
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
      if (t === 'buildscript') {
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
          // We've found the right brace of the buildcript block, we're done.
          return token.offset;
        }
      }
    }

    return undefined; // no buildscript block
  }
}

export default class JavaAgentInstaller extends AgentInstaller {
  constructor(
    path: string,
    commandRunner = CommandRunnerImpl as unknown as CommandRunner
  ) {
    const installers = [
      new GradleInstaller(path, commandRunner),
      new MavenInstaller(path, commandRunner),
    ].filter((installer) => installer.available);
    if (installers.length === 0) {
      throw new ValidationError(
        'No Java installer available for the current project. Supported frameworks are: Maven, Gradle.'
      );
    }

    super(installers[0], path);
  }
}
