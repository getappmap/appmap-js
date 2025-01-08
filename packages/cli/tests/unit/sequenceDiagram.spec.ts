import { buildAppMap } from '@appland/models';
import { unparseDiagram } from '@appland/sequence-diagram';
import assert from 'assert';
import { existsSync, mkdirSync } from 'fs';
import { readFile } from 'fs/promises';
import path from 'path';

import { handler as buildDiagram } from '../../src/cmds/sequenceDiagram';

const AppMapDir = path.join('tests', 'unit', 'fixtures');
const OutputDir = path.join('tests', 'output', 'sequence-diagrams');

const appmapFile = path.join(AppMapDir, 'ruby', 'revoke_api_key.appmap.json');
const sequenceDiagramFile = path.join(OutputDir, 'revoke_api_key.sequence.json');
const sequenceDiagramImage = path.join(OutputDir, 'revoke_api_key.sequence.png');

describe('sequence diagram command', () => {
  describe('JSON format', () => {
    it('is valid', async () => {
      await buildDiagram({
        format: 'json',
        outputDir: OutputDir,
        appmap: [appmapFile],
      });

      expect(existsSync(sequenceDiagramFile)).toBe(true);
      const diagramData = JSON.parse(await readFile(sequenceDiagramFile, 'utf8'));
      const diagram = unparseDiagram(diagramData);
      expect(diagram.rootActions).toHaveLength(3);
      expect(diagram.actors).toHaveLength(5);
    });
    it(
      'can apply a filter',
      async () => {
        await buildDiagram({
          format: 'json',
          filter:
            // hide root actions that are not HTTP server requests
            'eyJjdXJyZW50VmlldyI6InZpZXdTZXF1ZW5jZSIsImZpbHRlcnMiOnsiaGlkZU5hbWUiOlsicGFja2FnZTphY3Rpb25wYWNrIl19fQ',
          outputDir: OutputDir,
          appmap: [appmapFile],
        });

        const diagramData = JSON.parse(await readFile(sequenceDiagramFile, 'utf8'));
        const diagram = unparseDiagram(diagramData);
        expect(diagram.rootActions).toHaveLength(2);
      },
      30 * 1000 // Allow time to install and run the headless browser
    );
  });
  describe('PNG format', () => {
    // TODO: Chromium is failing to run in CI
    it.skip(
      'is generated',
      async () => {
        await buildDiagram({
          format: 'png',
          outputDir: OutputDir,
          appmap: [appmapFile],
        });

        expect(existsSync(sequenceDiagramImage)).toBe(true);
      },
      30 * 1000 // Allow time to install and run the headless browser
    );
  });
  describe('PlantUML format', () => {
    it('is generated', async () => {
      await buildDiagram({
        format: 'plantuml',
        outputDir: OutputDir,
        appmap: [appmapFile],
      });

      const pumlFile = path.join(OutputDir, 'revoke_api_key.sequence.uml');
      expect(existsSync(pumlFile)).toBe(true);
      const puml = (await readFile(pumlFile, 'utf8')).split('\n');
      expect(puml).toContain(`participant app_models as "app/models"`);
      expect(puml).toContain(`participant app_controllers as "app/controllers"`);
      expect(puml).not.toContain(`participant ApiKey as "ApiKey"`);
      expect(puml).not.toContain(`participant APIKeysController as "APIKeysController"`);
    });

    it('package can be expanded', async () => {
      await buildDiagram({
        format: 'plantuml',
        outputDir: OutputDir,
        appmap: [appmapFile],
        expand: 'package:app/models',
      });
      const pumlFile = path.join(OutputDir, 'revoke_api_key.sequence.uml');
      expect(existsSync(pumlFile)).toBe(true);
      const puml = (await readFile(pumlFile, 'utf8')).split('\n');
      expect(puml).not.toContain(`participant app_models as "app/models"`);
      expect(puml).toContain(`participant app_controllers as "app/controllers"`);
      expect(puml).toContain(`participant ApiKey as "ApiKey"`);
      expect(puml).not.toContain(`participant APIKeysController as "APIKeysController"`);
    });
    it('package names can be expanded', async () => {
      await buildDiagram({
        format: 'plantuml',
        outputDir: OutputDir,
        appmap: [appmapFile],
        expand: ['package:app/models', 'package:app/controllers'],
      });
      const pumlFile = path.join(OutputDir, 'revoke_api_key.sequence.uml');
      expect(existsSync(pumlFile)).toBe(true);
      const puml = (await readFile(pumlFile, 'utf8')).split('\n');
      expect(puml).not.toContain(`participant app_models as "app/models"`);
      expect(puml).not.toContain(`participant app_controllers as "app/controllers"`);
      expect(puml).toContain(`participant ApiKey as "ApiKey"`);
      expect(puml).toContain(`participant APIKeysController as "APIKeysController"`);
    });
  });
});

let cwd: string | undefined;

beforeEach(() => {
  cwd = process.cwd();
  mkdirSync(OutputDir, { recursive: true });
});
afterEach(() => {
  if (cwd) process.chdir(cwd);
});
