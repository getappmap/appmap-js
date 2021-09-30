import { promises as fsp } from 'fs';
import { JSDOM } from 'jsdom';
import xmlSerializer from 'w3c-xmlserializer';
import { join, sep } from 'path';
import chalk from 'chalk';
import CommandStruct from './commandStruct';
import AgentInstaller from './agentInstaller';
import { verbose, exists } from '../../utils';
import JavaBuildToolInstaller from './javaBuildToolInstaller';

export default class MavenInstaller
  extends JavaBuildToolInstaller
  implements AgentInstaller
{
  constructor(readonly path: string) {
    super(path);
  }

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
      )}`,
      `By default, AppMap files will be output to ${chalk.blue(
        'target/appmap'
      )}`,
    ].join('\n');
  }

  async available(): Promise<boolean> {
    return await exists(this.buildFilePath);
  }

  async runCommand(): Promise<string> {
    const wrapperExists = await exists(join(this.path, 'mvnw'));

    if (wrapperExists) {
      return `.${sep}mvnw`;
    } else if (verbose()) {
      console.warn(
        `${chalk.yellow(
          'mvnw wrapper'
        )} not located, falling back to ${chalk.yellow('mvn')}`
      );
    }

    return 'mvn';
  }

  async verifyCommand(): Promise<CommandStruct> {
    return new CommandStruct(
      await this.runCommand(),
      ['-Dplugin=com.appland:appmap-maven-plugin', 'help:describe'],
      this.path
    );
  }

  async printJarPathCommand(): Promise<CommandStruct> {
    return new CommandStruct(
      await this.runCommand(),
      ['appmap:print-jar-path'],
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
    ).singleNodeValue as Element | null;
    if (appmapPlugin) {
      let version = appmapPlugin.querySelector('version');
      if (!version) {
        version = doc.createElementNS(ns, 'version');
        appmapPlugin.appendChild(version);
      }
      version.textContent = pluginVersion;
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
