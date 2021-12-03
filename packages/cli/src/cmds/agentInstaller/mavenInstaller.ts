import {existsSync} from 'fs';
import os from 'os';
import { join, sep, delimiter as pathDelimiter } from 'path';
import { JSDOM } from 'jsdom';
import xmlSerializer from 'w3c-xmlserializer';
import chalk from 'chalk';
import CommandStruct from './commandStruct';
import AgentInstaller from './agentInstaller';
import { verbose, exists } from '../../utils';
import JavaBuildToolInstaller from './javaBuildToolInstaller';
import EncodedFile from '../../encodedFile';

export default class MavenInstaller
  extends JavaBuildToolInstaller
{
  constructor(path: string) {
    super('Maven', path);
  }

  get buildFile(): string {
    return 'pom.xml';
  }

  get buildFilePath(): string {
    return join(this.path, this.buildFile);
  }

  async postInstallMessage(): Promise<string> {
    const mvn = this.runCommand();

    return [
      `The AppMap agent will automatically record your tests when you run ${chalk.blue(
        `${mvn} test`
      )}`,
      `By default, AppMap files will be output to ${chalk.blue(
        'target/appmap'
      )}`,
    ].join('\n');
  }

  async available(): Promise<boolean> {
    return await exists(this.buildFilePath);
  }

  runCommand(): string {
    const ext = os.platform() === 'win32' ? '.cmd' : '';
    const wrapperExists = existsSync(join(this.path, `mvnw${ext}`));

    if (wrapperExists) {
      return `.${sep}mvnw${ext}`;
    } else if (verbose()) {
      console.warn(
        `${chalk.yellow(
          `mvnw${ext} wrapper`
        )} not found, falling back to ${chalk.yellow(`mvn${ext}`)}`
      );
    }

    return `mvn${ext}`;
  }

  async verifyCommand(): Promise<CommandStruct> {
    return new CommandStruct(
      this.runCommand(),
      ['-Dplugin=com.appland:appmap-maven-plugin', 'help:describe'],
      this.path
    );
  }

  async printJarPathCommand(): Promise<CommandStruct> {
    return new CommandStruct(
      this.runCommand(),
      ['appmap:print-jar-path'],
      this.path
    );
  }

  async installAgent(): Promise<void> {
    const encodedFile: EncodedFile = new EncodedFile(this.buildFilePath);
    const buildFileSource = encodedFile.toString();
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
      projectSection.appendChild(doc.createTextNode(os.EOL));
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
      buildSection.appendChild(doc.createTextNode(os.EOL));
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
      pluginsSection.appendChild(doc.createTextNode(os.EOL));
    }
    const serialized = xmlSerializer(doc.getRootNode());
    encodedFile.write(serialized);
  }
}
