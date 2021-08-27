/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */
import { promises as fsp } from 'fs';
import { JSDOM } from 'jsdom';
import xmlSerializer from 'w3c-xmlserializer';
import { join, sep } from 'path';
import moo from 'moo';
import chalk from 'chalk';
import CommandStruct from './commandStruct';
import AgentInstaller from './agentInstaller';
import { run } from './commandRunner';
import { exists } from '../../utils';

export class MavenInstaller implements AgentInstaller {
  constructor(readonly path: string) {}

  get name(): string {
    return 'Maven';
  }

  get buildFile(): string {
    return 'pom.xml';
  }

  get buildFilePath(): string {
    return join(this.path, this.buildFile);
  }

  async postInstallMessage(): Promise<string> {
    let mvnBin = 'mvn';
    if (await exists(join(this.path, 'mvnw'))) {
      mvnBin = `.${sep}mvnw`;
    }

    return [
      `The AppMap agent will automatically record your tests when you run ${chalk.blue(
        `${mvnBin} test`
      )}.`,
      `By default, AppMap files will be output to ${chalk.blue(
        'target/appmap'
      )}.`,
    ].join('\n');
  }

  async available(): Promise<boolean> {
    return await exists(this.buildFilePath);
  }

  async runCommand(): Promise<string> {
    if (
      process.platform === 'win32' &&
      (await exists(join(this.path, 'mvnw.cmd')))
    ) {
      return 'mvnw.cmd';
    }

    if (
      process.platform !== 'win32' &&
      (await exists(join(this.path, 'mvnw')))
    ) {
      return './mvnw';
    }

    // Pray
    return 'mvn';
  }

  async verifyCommand(): Promise<CommandStruct> {
    return new CommandStruct(
      await this.runCommand(),
      ['-Dplugin=com.appland:appmap-maven-plugin', 'help:describe'],
      this.path
    );
  }

  async initCommand(): Promise<CommandStruct> {
    const cmd = new CommandStruct(
      await this.runCommand(),
      ['appmap:print-jar-path'],
      this.path
    );

    const { stdout } = await run(cmd);
    const appmapPath = stdout
      .split('\n')
      .filter((l) => l.match(/^com\.appland:appmap-agent\.jar.path/))[0]
      .split('=')[1];

    return new CommandStruct(
      'java',
      ['-jar', appmapPath, '-d', this.path, 'init'],
      this.path
    );
  }

  async installAgent(): Promise<void> {
    const buildFileSource = (await fsp.readFile(this.buildFilePath)).toString();
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
      throw new Error(`No project section found in ${this.buildFilePath}`);
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
    await fsp.writeFile(this.buildFilePath, serialized);
  }
}

export class GradleInstaller implements AgentInstaller {
  constructor(readonly path: string) {}

  get name(): string {
    return 'Gradle';
  }

  get buildFile(): string {
    return 'build.gradle';
  }

  get buildFilePath(): string {
    return join(this.path, this.buildFile);
  }

  async postInstallMessage(): Promise<string> {
    let gradleBin = 'gradle';
    if (await exists(join(this.path, 'gradlew'))) {
      gradleBin = `.${sep}gradlew`;
    }

    return [
      `Record your tests by running ${chalk.blue(`${gradleBin} appmap test`)}.`,
      `By default, AppMap files will be output to ${chalk.blue(
        'target/appmap'
      )}.`,
    ].join('\n');
  }

  async available(): Promise<boolean> {
    return await exists(this.buildFilePath);
  }

  async runCommand(): Promise<string> {
    if (
      process.platform === 'win32' &&
      (await exists(join(this.path, 'gradlew.bat')))
    ) {
      return 'gradlew.bat';
    }

    if (
      process.platform !== 'win32' &&
      (await exists(join(this.path, 'gradlew')))
    ) {
      return './gradlew';
    }

    // Pray
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

  async initCommand(): Promise<CommandStruct> {
    const cmd = new CommandStruct(
      await this.runCommand(),
      ['-q', 'appmap-print-jar-path'],
      this.path
    );

    const { stdout } = await run(cmd);
    const appmapPath = stdout
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
  async insertPluginSpec(buildFileSource: string): Promise<string> {
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
        updatedBuildFileSource = [pluginSection, buildFileSource].join('\n');
      }
    }

    // We always want to update the source, so this shouldn't ever happen.
    if (updatedBuildFileSource === undefined) {
      throw new Error(`Failed to update ${this.buildFilePath}`);
    }

    return updatedBuildFileSource;
  }

  async installAgent(): Promise<void> {
    const buildFileSource = (await fsp.readFile(this.buildFilePath)).toString();
    let updatedBuildFileSource = await this.insertPluginSpec(buildFileSource);
    await fsp.writeFile(this.buildFilePath, updatedBuildFileSource);
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

const JavaAgentInstaller = {
  name: 'Java',
  documentation: 'https://appland.com/docs/reference/appmap-java',
  installers: [MavenInstaller, GradleInstaller],
};

export default JavaAgentInstaller;
