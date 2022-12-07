import { AppMap, buildAppMap } from '@appland/models';
import assert from 'assert';
import { readFileSync } from 'fs';
import path, { join } from 'path';
import buildDiagram from '../src/buildDiagram';
import Specification from '../src/specification';
import { Action, Actor, Diagram, isFunction } from '../src/types';
import { SequenceDiagramOptions } from '../src/specification';
import { readFile } from 'fs/promises';

export const VERBOSE = process.env.DEBUG === 'true';

export const FIXTURE_DIR = path.join(__dirname, 'fixtures');
export const APP_APPMAP_DIR = path.join(FIXTURE_DIR, 'app', 'tmp', 'appmap');

export type AppMapDiagram = {
  appmap: AppMap;
  diagram: Diagram;
};

export const SHOW_USER_APPMAP_FILE = 'show_user.appmap.json';
export const SHOW_USER_APPMAP = buildAppMap()
  .source(JSON.parse(readFileSync(join(APP_APPMAP_DIR, SHOW_USER_APPMAP_FILE), 'utf-8')))
  .build();

export const USER_NOT_FOUND_APPMAP_FILE = 'user_not_found.appmap.json';
export const USER_NOT_FOUND_APPMAP = buildAppMap()
  .source(JSON.parse(readFileSync(join(APP_APPMAP_DIR, USER_NOT_FOUND_APPMAP_FILE), 'utf-8')))
  .build();

export const LIST_USERS_APPMAP_FILE = 'list_users.appmap.json';
export const LIST_USERS_APPMAP = buildAppMap()
  .source(JSON.parse(readFileSync(join(APP_APPMAP_DIR, LIST_USERS_APPMAP_FILE), 'utf-8')))
  .build();

export const LIST_USERS_PREFETCH_APPMAP_FILE = 'list_users_prefetch.appmap.json';
export const LIST_USERS_PREFETCH_APPMAP = buildAppMap()
  .source(JSON.parse(readFileSync(join(APP_APPMAP_DIR, LIST_USERS_PREFETCH_APPMAP_FILE), 'utf-8')))
  .build();

export const APPMAPS: Record<string, AppMap> = {};
APPMAPS[SHOW_USER_APPMAP_FILE] = SHOW_USER_APPMAP;
APPMAPS[USER_NOT_FOUND_APPMAP_FILE] = USER_NOT_FOUND_APPMAP;
APPMAPS[LIST_USERS_APPMAP_FILE] = LIST_USERS_APPMAP;
APPMAPS[LIST_USERS_PREFETCH_APPMAP_FILE] = LIST_USERS_PREFETCH_APPMAP;

function normalizeFile(data: string): string {
  return data.split(/\r?\n/g).join('\n');
}

function normalizeTiming(diagram: string): string {
  return diagram.replace(/<size:8><:1F551:><\/size><color:gray> \d+[mμn]?s<\/color>/g, '$timing');
}

export async function checkPlantUMLEqual(
  actualData: string,
  expectedFileName: string
): Promise<void> {
  assert.strictEqual(
    normalizeTiming(normalizeFile(actualData)),
    normalizeTiming(normalizeFile(await readFile(expectedFileName, 'utf-8')))
  );
}

export function loadDiagram(appmap: AppMap, options: SequenceDiagramOptions = {}): Diagram {
  const specification = Specification.build(appmap, options);
  return buildDiagram(SHOW_USER_APPMAP_FILE, appmap, specification);
}

export function findActor(diagram: Diagram, id: string): Actor {
  const actor = diagram.actors.find((actor) => actor.id === id);
  assert(actor, `Expecting actor ${id}`);
  return actor;
}

export function findAction(
  diagram: AppMap | Diagram,
  test: (action: Action) => boolean
): Action | undefined {
  if (diagram.constructor === AppMap) diagram = loadDiagram(diagram);

  const matchAction = (action: Action): Action | undefined => {
    if (test(action)) return action;

    for (const child of action.children) {
      const match = matchAction(child);
      if (match) return match;
    }

    return (action.children || []).find((child) => matchAction(child));
  };

  for (const root of (diagram as Diagram).rootActions) {
    const match = matchAction(root);
    if (match) return match;
  }
}

export function findActionById(diagram: AppMap | Diagram, id: string): Action {
  const action = findAction(
    diagram,
    (action: Action) => isFunction(action) && action.stableProperties['id'] === id
  );
  assert(action, `Action ${id} not found`);
  return action;
}
