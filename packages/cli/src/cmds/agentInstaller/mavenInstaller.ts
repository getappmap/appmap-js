import { existsSync } from 'fs';
import os from 'os';
import { join, sep, delimiter as pathDelimiter } from 'path';
import {
  DOMParser,
  XMLSerializer,
  Node as XMLNode,
  type Document as XMLDocument,
  type Element as XMLElement,
} from '@xmldom/xmldom';
import chalk from 'chalk';
import CommandStruct from './commandStruct';
import { verbose, exists } from '../../utils';
import JavaBuildToolInstaller from './javaBuildToolInstaller';
import EncodedFile from '../../encodedFile';
import InstallerUI from './installerUI';

const PLUGIN_VERSION = '1.3.0';
const PLUGIN_GROUP_ID = 'com.appland';
const PLUGIN_ARTIFACT_ID = 'appmap-maven-plugin';
const DEFAULT_NAMESPACE = 'http://maven.apache.org/POM/4.0.0';
const DEFAULT_INDENT = '  ';

function isWhitespace(node: XMLNode | null): boolean {
  return node?.nodeType === XMLNode.TEXT_NODE && !node.nodeValue?.trim();
}

/** The indentation of `element` itself, i.e. of its start and end tags. */
function indentOf(element: XMLNode, unit: string): string {
  let depth = 0;
  for (let parent = element.parentNode; parent?.parentNode; parent = parent.parentNode) depth += 1;
  return unit.repeat(depth);
}

const pluginXml = (ns: string) => `<plugin xmlns="${ns}">
  <groupId>${PLUGIN_GROUP_ID}</groupId>
  <artifactId>${PLUGIN_ARTIFACT_ID}</artifactId>
  <version>${PLUGIN_VERSION}</version>
  <executions>
    <execution>
      <phase>process-test-classes</phase>
      <goals>
        <goal>prepare-agent</goal>
      </goals>
    </execution>
  </executions>
</plugin>`;

/** Re-indent an XML fragment written with two-space nesting to use `unit`, offset by `base`. */
function reindent(xml: string, unit: string, base: string): string {
  return xml
    .split('\n')
    .map((line) => {
      const text = line.trimStart();
      return base + unit.repeat((line.length - text.length) / 2) + text;
    })
    .join(os.EOL);
}

/** Guess the file's indentation from the whitespace preceding the first indented line. */
function detectIndent(element: XMLElement): string {
  for (const child of Array.from(element.childNodes)) {
    const indent = isWhitespace(child) ? /\n([ \t]+)$/.exec(child.nodeValue ?? '') : undefined;
    if (indent) return indent[1];
  }
  return DEFAULT_INDENT;
}

function childElements(parent: XMLNode, localName: string): XMLElement[] {
  return Array.from(parent.childNodes).filter(
    (node): node is XMLElement =>
      node.nodeType === XMLNode.ELEMENT_NODE && (node as XMLElement).localName === localName
  );
}

function childElement(parent: XMLNode, localName: string): XMLElement | undefined {
  return childElements(parent, localName)[0];
}

export default class MavenInstaller extends JavaBuildToolInstaller {
  static identifier = 'Maven';

  constructor(path: string) {
    super(MavenInstaller.identifier, path);
  }

  get language(): string {
    return 'java';
  }

  get appmap_dir(): string {
    return 'tmp/appmap';
  }

  get buildFile(): string {
    return 'pom.xml';
  }

  get buildFilePath(): string {
    return join(this.path, this.buildFile);
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
        `${chalk.yellow(`mvnw${ext} wrapper`)} not found, falling back to ${chalk.yellow(
          `mvn${ext}`
        )}`
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
    return new CommandStruct(this.runCommand(), ['appmap:print-jar-path'], this.path);
  }

  // TODO: validate the user's project before adding AppMap
  async checkConfigCommand(_ui: InstallerUI): Promise<CommandStruct | undefined> {
    return undefined;
  }

  /** Parse the pom, failing if it doesn't have a <project> root element. */
  private parseBuildFile(source: string, domParser: DOMParser): XMLDocument {
    let doc: XMLDocument | undefined;
    try {
      doc = domParser.parseFromString(source, 'text/xml');
    } catch {
      // A document without a root element is a fatal parse error; report it the same way as a
      // document whose root isn't <project>.
    }

    // Doesn't make sense to be missing the <project> section
    if (doc?.documentElement?.localName !== 'project')
      throw new Error(`No project section found in ${this.buildFilePath}`);

    return doc;
  }

  async installAgent(_ui: InstallerUI): Promise<void> {
    const encodedFile: EncodedFile = new EncodedFile(this.buildFilePath);
    const domParser = new DOMParser();
    const source = encodedFile.toString();
    const doc = this.parseBuildFile(source, domParser);
    const projectSection = doc.documentElement!;
    const ns = projectSection.namespaceURI || DEFAULT_NAMESPACE;
    const indentUnit = detectIndent(projectSection);

    // Append `child` as the last element of `parent`, on its own line and indented one level
    // deeper than `parent`. Any whitespace closing out `parent` stays put, so its end tag keeps
    // the indentation it already had.
    const appendElement = (parent: XMLElement, child: XMLElement): XMLElement => {
      const parentIndent = indentOf(parent, indentUnit);
      const closingWhitespace = isWhitespace(parent.lastChild) ? parent.lastChild : null;
      parent.insertBefore(
        doc.createTextNode(os.EOL + parentIndent + indentUnit),
        closingWhitespace
      );
      parent.insertBefore(child, closingWhitespace);
      // `parent` was written as <plugins></plugins>, so give its end tag a line of its own too.
      if (!closingWhitespace) parent.appendChild(doc.createTextNode(os.EOL + parentIndent));
      return child;
    };

    // Parse an XML fragment into a node owned by `doc` — for a subtree of any size that's easier
    // to read than a pile of createElementNS calls. The fragment has to declare the POM namespace
    // to be parsed into it, but the declaration is redundant once the node is grafted under
    // <project>, which declares it already.
    const parseFragment = (xml: string): XMLElement => {
      const fragment = domParser.parseFromString(xml, 'text/xml').documentElement;
      if (!fragment) throw new Error(`Failed to parse XML fragment: ${xml}`);

      const imported = doc.importNode(fragment, true);
      imported.removeAttribute('xmlns');
      return imported;
    };

    // Return the named child section of `parent`, appending an empty one if it doesn't exist yet.
    const section = (parent: XMLElement, tag: string): XMLElement => {
      const existing = childElement(parent, tag);
      if (existing) return existing;

      const created = appendElement(parent, doc.createElementNS(ns, tag));
      // Put the end tag on its own line, lined up with the start tag.
      created.appendChild(doc.createTextNode(os.EOL + indentOf(created, indentUnit)));
      return created;
    };

    const pluginsSection = section(section(projectSection, 'build'), 'plugins');
    const appmapPlugin = childElements(pluginsSection, 'plugin').find(
      (plugin) =>
        childElement(plugin, 'groupId')?.textContent?.trim() === PLUGIN_GROUP_ID &&
        childElement(plugin, 'artifactId')?.textContent?.trim() === PLUGIN_ARTIFACT_ID
    );

    if (appmapPlugin) {
      const version =
        childElement(appmapPlugin, 'version') ??
        appendElement(appmapPlugin, doc.createElementNS(ns, 'version'));
      version.textContent = PLUGIN_VERSION;
    } else {
      const indent = indentOf(pluginsSection, indentUnit) + indentUnit;
      appendElement(pluginsSection, parseFragment(reindent(pluginXml(ns), indentUnit, indent)));
    }

    // The parser drops whitespace following the root element, so put it back — otherwise every
    // install strips the pom's trailing newline.
    const trailing = /\s*$/.exec(source)?.[0] ?? '';
    encodedFile.write(new XMLSerializer().serializeToString(doc) + trailing);
  }
}
