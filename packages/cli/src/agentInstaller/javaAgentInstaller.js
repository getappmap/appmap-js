// @ts-check

/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */
const { existsSync, promises: fsp } = require('fs');
const { JSDOM } = require('jsdom');
const xmlSerializer = require('w3c-xmlserializer');
const { join } = require('path');
const BuildToolInstaller = require('./buildToolInstallerBase');
const InstallAgentStep = require('./installAgentStep');
const CommandStruct = require('./commandStruct');
const ValidationError = require('../errors/validationError');

/**
 * @typedef {import('./types').AgentInstaller} AgentInstaller
 * @typedef {import('./types').Command} Command
 * @typedef {import('./types').InstallResult} InstallResult
 * @typedef {import('./types').InstallStep} InstallStep
 */

class Maven {
  /**
   * @param {string} path
   */
  constructor(path) {
    this.path = path;
  }

  /**
   * @returns {string}
   */
  runCommand() {
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
  /**
   * @param {string} path
   */
  constructor(path) {
    this.path = path;
  }

  /**
   * @returns {string}
   */
  runCommand() {
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

class MavenInstaller extends BuildToolInstaller {
  /**
   * @param {string} path
   */
  constructor(path) {
    super('pom.xml', path);
  }

  /**
   * @returns {string}
   */
  get assumptions() {
    return `Your project contains a pom.xml. Therefore, it looks like a Maven project,
so we will install the AppMap Maven plugin.`;
  }

  /**
   * @returns {string}
   */
  get postInstallMessage() {
    return `The AppMap plugin has been added to your pom.xml. You should open this file and check that
it looks clean and correct.

Once you've done that, you'll test the proper operation of the AppMap plugin by running the following command
in your terminal`;
  }

  /**
   * @returns {Command}
   */
  get verifyCommand() {
    return new CommandStruct(
      new Maven(this.path).runCommand(),
      ['-Dplugin=com.appland:appmap-maven-plugin', 'help:describe'],
      {}
    );
  }

  /**
   * @returns {Promise<InstallResult>}
   */
  async install() {
    const buildFileSource = (await fsp.readFile(this.buildFilePath)).toString();
    const jsdom = new JSDOM();
    const domParser = new jsdom.window.DOMParser();
    const doc = domParser.parseFromString(buildFileSource, 'text/xml');
    const ns = doc.getRootNode().childNodes[0].namespaceURI;

    const pluginString = `
      <plugin xmlns="${ns}">
          <groupId>com.appland</groupId>
          <artifactId>appmap-maven-plugin</artifactId>
          <version>1.1.2</version>
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

    const projectSection = doc.evaluate(
      '/project',
      doc,
      doc.createNSResolver(doc.getRootNode()),
      9 /* FIRST_ORDERED_NODE_TYPE */
    ).singleNodeValue;
    if (!projectSection) {
      doc.appendChild(doc.createElement('project'));
    }
    const buildSection = doc.evaluate(
      '/project/build',
      doc,
      doc.createNSResolver(doc.getRootNode()),
      9
    ).singleNodeValue;
    if (!buildSection) {
      projectSection?.appendChild(doc.createElement('build'));
    }
    const pluginsSection = doc.evaluate(
      '/project/build/plugins',
      doc,
      doc.createNSResolver(doc.getRootNode()),
      9
    ).singleNodeValue;
    if (!pluginsSection) {
      projectSection?.appendChild(doc.createElement('plugins'));
    }
    const appmapPlugin = doc.evaluate(
      `/project/build/plugins/plugin[groupId/text() = 'com.appland' and artifactId/text() = 'appmap-maven-plugin']`,
      doc,
      doc.createNSResolver(doc.getRootNode()),
      9
    ).singleNodeValue;
    if (!appmapPlugin) {
      const pluginNode = domParser
        .parseFromString(pluginString, 'application/xml')
        .getRootNode();
      while (pluginNode.childNodes.length > 0) {
        const node = pluginNode.childNodes[0];
        pluginsSection?.appendChild(node);
      }
      pluginsSection.appendChild(doc.createTextNode('\n'));

      await fsp.writeFile(this.buildFilePath, xmlSerializer(doc.getRootNode()));

      return 'installed';
    }

    return 'none';
  }
}

class GradleInstaller extends BuildToolInstaller {
  /**
   * @param {string} path
   */
  constructor(path) {
    super('build.gradle', path);
  }

  /**
   * @returns {string}
   */
  get assumptions() {
    return `Your project contains a build.gradle. Therefore, it looks like a Gradle project,
so we will install the AppMap Gradle plugin.`;
  }

  /**
   * @returns {string}
   */
  get postInstallMessage() {
    return `The AppMap plugin has been added to your build.gradle. You should open this file and check that
it looks clean and correct.

Once you've done that, you'll test the proper operation of the AppMap plugin by running the following command
in your terminal`;
  }

  /**
   * @returns {Command}
   */
  get verifyCommand() {
    return new CommandStruct(
      new Gradle(this.path).runCommand(),
      ['--help', 'appmap'],
      {}
    );
  }

  /**
   * @returns {Promise<InstallResult>}
   */
  async install() {
    const buildFileSource = (await fsp.readFile(this.buildFilePath)).toString();
    const pluginMatch = buildFileSource.match(/plugins\s*\{\s*([^}]*)\}/);
    let updatedBuildFileSource;
    if (pluginMatch) {
      const pluginMatchIndex = buildFileSource.indexOf(pluginMatch[0]);
      const plugins = pluginMatch[1]
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line !== '');
      const appmapPlugin = plugins.find(
        (line) => line.indexOf('com.appland.appmap') !== -1
      );
      if (!appmapPlugin) {
        plugins.push(`id 'com.appland.appmap' version '1.0.2'`);
        const pluginSection = `plugins {
${plugins.map((plugin) => `  ${plugin}`).join('\n')}
}`;
        updatedBuildFileSource = [
          buildFileSource.substring(0, pluginMatchIndex),
          pluginSection,
          buildFileSource.substring(
            pluginMatchIndex + pluginMatch[0].length,
            buildFileSource.length
          ),
        ].join('');
      }
    } else {
      const pluginSection = `plugins {
  id 'com.appland.appmap'
}`;
      updatedBuildFileSource = [buildFileSource, pluginSection].join('\n');
    }

    if (updatedBuildFileSource) {
      await fsp.writeFile(this.buildFilePath, updatedBuildFileSource);
      return 'installed';
    }

    return 'none';
  }
}

class JavaAgentInstaller {
  /**
   * @param {string} path
   */
  constructor(path) {
    this.path = path;
  }

  /**
   *
   * @returns {InstallStep[]}
   */
  installAgent() {
    const installers = [
      new GradleInstaller(this.path),
      new MavenInstaller(this.path),
    ].filter((installer) => installer.available);
    if (installers.length > 0) {
      return [new InstallAgentStep(installers[0])];
    }

    throw new ValidationError(
      'No Java installer available for the current project. Supported frameworks are: Maven, Gradle.'
    );
  }

  /**
   * @returns {InstallStep[]}
   */
  configureAgent() {
    return [];
  }

  /**
   * @returns {InstallStep[]}
   */
  runTests() {
    return [];
  }
}

module.exports = JavaAgentInstaller;
