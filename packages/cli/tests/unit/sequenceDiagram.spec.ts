import { buildAppMap } from '@appland/models';
import { unparseDiagram } from '@appland/sequence-diagram';
import assert from 'assert';
import { existsSync, mkdirSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';

import { handler as buildDiagram } from '../../src/cmds/sequenceDiagram';

const AppMapDir = path.join('tests', 'unit', 'fixtures');
const OutputDir = path.join('tests', 'output', 'sequence-diagrams');

const appmapFile = path.join(AppMapDir, 'ruby', 'revoke_api_key.appmap.json');
const asyncReturnsFile = path.join(AppMapDir, 'node', 'async_returns.appmap.json');
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
  describe('a recording whose returns arrive out of order', () => {
    it('is drawn, with the later call inside the call it was made from', async () => {
      // appmap-node writes an async call's return when its promise settles, so `startStudio`
      // returns while `handle`, called from it, is still open. This used to fail with "failed
      // trying to compute event stack" (getappmap/appmap-js#2430).
      await buildDiagram({
        format: 'json',
        outputDir: OutputDir,
        appmap: [asyncReturnsFile],
      });

      const diagramFile = path.join(OutputDir, 'async_returns.sequence.json');
      expect(existsSync(diagramFile)).toBe(true);
      const diagramData = JSON.parse(await readFile(diagramFile, 'utf8'));
      expect(unparseDiagram(diagramData).rootActions).toHaveLength(1);
      expect(diagramData.rootActions.map((action: any) => action.name)).toEqual(['startStudio']);
      expect(diagramData.rootActions[0].children.map((action: any) => action.name)).toEqual([
        'handle',
      ]);
    });
  });

  describe('a batch with a file that cannot be drawn', () => {
    it('names the file that failed and draws the rest', async () => {
      const unreadableFile = path.join(OutputDir, 'not-an-appmap.appmap.json');
      await writeFile(unreadableFile, 'this is not an AppMap');
      const errors: string[] = [];
      const consoleError = jest.spyOn(console, 'error').mockImplementation((...args) => {
        errors.push(args.map(String).join(' '));
      });
      const exitCode = process.exitCode;

      try {
        await buildDiagram({
          format: 'json',
          outputDir: OutputDir,
          appmap: [unreadableFile, appmapFile],
        });

        expect(errors.join('\n')).toContain(`Failed to draw ${unreadableFile}`);
        expect(existsSync(sequenceDiagramFile)).toBe(true);
        expect(process.exitCode).toEqual(1);
      } finally {
        consoleError.mockRestore();
        process.exitCode = exitCode;
      }
    });
  });

  describe('an --expand that matches nothing', () => {
    it('is reported', async () => {
      const warnings: string[] = [];
      const consoleWarn = jest.spyOn(console, 'warn').mockImplementation((...args) => {
        warnings.push(args.map(String).join(' '));
      });

      try {
        await buildDiagram({
          format: 'json',
          outputDir: OutputDir,
          appmap: [appmapFile],
          expand: 'package:app/nonesuch',
        });

        expect(warnings.join('\n')).toContain('--expand package:app/nonesuch matches no package');
      } finally {
        consoleWarn.mockRestore();
      }
    });

    it('is not reported for a package that is there', async () => {
      const warnings: string[] = [];
      const consoleWarn = jest.spyOn(console, 'warn').mockImplementation((...args) => {
        warnings.push(args.map(String).join(' '));
      });

      try {
        await buildDiagram({
          format: 'json',
          outputDir: OutputDir,
          appmap: [appmapFile],
          expand: 'package:app/models',
        });

        expect(warnings.join('\n')).not.toContain('--expand');
      } finally {
        consoleWarn.mockRestore();
      }
    });
  });

  describe('--output-file', () => {
    it('names the diagram', async () => {
      const outputFile = path.join(OutputDir, 'named-by-hand.sequence.json');
      await buildDiagram({
        format: 'json',
        outputFile,
        appmap: [appmapFile],
      });

      expect(existsSync(outputFile)).toBe(true);
    });

    it('is refused for more than one AppMap', async () => {
      const exitCode = process.exitCode;
      try {
        await buildDiagram({
          format: 'json',
          outputFile: path.join(OutputDir, 'two-appmaps.sequence.json'),
          appmap: [appmapFile, asyncReturnsFile],
        });
        expect(process.exitCode).toEqual(1);
      } finally {
        process.exitCode = exitCode;
      }
    });
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
