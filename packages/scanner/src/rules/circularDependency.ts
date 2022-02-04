import { Event } from '@appland/models';
import { MatchResult, Rule, RuleLogic, StringFilter } from '../types';
import GraphEdge from '../algorithms/dataStructures/graph/GraphEdge';
import GraphVertex from '../algorithms/dataStructures/graph/GraphVertex';
import Graph from '../algorithms/dataStructures/graph/Graph';
import detectDirectedCycle from '../algorithms/graph/detect-cycle';
import { isAbsolute } from 'path';
import * as types from './types';
import { verbose } from './lib/util';
import MatchPatternConfig from '../configuration/types/matchPatternConfig';
import { buildFilters } from './lib/matchPattern';
import { URL } from 'url';
import parseRuleDescription from './lib/parseRuleDescription';

type PackageName = string;

class Cycle {
  constructor(public packages: PackageName[], public events: Map<PackageName, Event[]>) {}
}

function ignorePackage(event: Event, ignoredPackages: StringFilter[]): boolean {
  const myPackage: string | null = event.codeObject.packageOf;
  return (
    myPackage === '' ||
    ignoredPackages.some((filter) => filter(myPackage)) ||
    !event.codeObject.location ||
    isAbsolute(event.codeObject.location)
  );
}

function detectCycles(root: Event, ignoredPackages: StringFilter[]): Cycle[] {
  const graph = new Graph(true);
  const vertices = new Map<PackageName, GraphVertex>();
  const edges = new Set<string>();
  const vertexEvents = new Map<PackageName, Event[]>();

  const makeVertex = (pkg: PackageName, event: Event): GraphVertex => {
    let result = vertices.get(pkg);
    if (!result) {
      result = new GraphVertex(pkg);
      vertices.set(pkg, result);
      vertexEvents.set(pkg, [event]);
    } else {
      vertexEvents.get(pkg)!.push(event);
    }
    return result;
  };

  const collectEvent = (
    event: Event,
    parentEvent: Event | null,
    parentPackage: PackageName | null
  ) => {
    let myPackage: PackageName | null = event.codeObject.packageOf;
    if (ignorePackage(event, ignoredPackages)) {
      myPackage = null;
    }

    if (myPackage) {
      const vertex = makeVertex(myPackage, event);
      if (parentPackage && parentPackage !== myPackage) {
        const edge = new GraphEdge(vertices.get(parentPackage)!, vertex);
        if (!edges.has(edge.getKey())) {
          if (verbose()) {
            console.warn(`New edge: ${parentPackage}/${parentEvent} -> ${myPackage}/${event}`);
          }
          edges.add(edge.getKey());
          graph.addEdge(edge);
        }
      }
      parentPackage = myPackage;
    }
    event.children.forEach((child) => collectEvent(child, event, parentPackage));
  };

  if (root.codeObject.packageOf !== '') {
    makeVertex(root.codeObject.packageOf, root);
  }
  collectEvent(root, null, null);

  return detectDirectedCycle(graph).map((cycle) => {
    return new Cycle(
      cycle.map((vertex) => vertex.getKey()),
      vertexEvents
    );
  });
}

/**
 * Given a list of package names which occur in a cycle,
 * search the event tree to find a list of specific events whose sequence and package names match the cycle.

 * @returns Sequence of events whose package names match the cyclePath.
 */
const searchForCycle = (cycle: Cycle, ignoredPackages: StringFilter[]): Event[] | null => {
  const traverseEvent = (
    event: Event,
    recordEvent: boolean,
    cyclePath: PackageName[],
    cyclePathIndex = 0,
    path: Event[] = []
  ): Event[] | null => {
    if (recordEvent) {
      if (verbose()) {
        console.warn(`${Array(path.length).fill('').join('  ')}push: ${event}`);
      }
      path.push(event);
    } else {
      if (verbose()) {
        console.warn(`${Array(path.length).fill('').join('  ')}traverse: ${event}`);
      }
    }

    if (cyclePathIndex === cyclePath.length - 1) {
      if (verbose()) {
        console.warn(`${Array(path.length).fill('').join('  ')}result: ${path}`);
      }
      return [...path];
    }

    const myPackage = event.codeObject.packageOf;

    if (verbose()) {
      console.warn(event.children.map((child) => child.codeObject.fqid));
    }

    // Traverse children of ignored or same package
    let result = event.children
      .filter(
        (child) => child.codeObject.packageOf === myPackage || ignorePackage(child, ignoredPackages)
      )
      .map((child) => traverseEvent(child, false, cyclePath, cyclePathIndex, path))
      .filter(Boolean);

    // Traverse children of the next package in the graph
    if (result.length === 0) {
      result = event.children
        .filter(
          (child) =>
            child.codeObject.packageOf !== myPackage &&
            !ignorePackage(child, ignoredPackages) &&
            cyclePath[cyclePathIndex + 1] === child.codeObject.packageOf
        )
        .map((child) => traverseEvent(child, true, cyclePath, cyclePathIndex + 1, path))
        .filter((path) => path);
    }

    if (result.length > 0) {
      return result[0];
    } else {
      if (recordEvent) {
        if (verbose()) {
          console.warn(
            `${Array(path.length - 1)
              .fill('')
              .join('  ')}pop`
          );
        }
        path.pop();
      } else {
        if (verbose()) {
          console.warn(
            `${Array(path.length - 1)
              .fill('')
              .join('  ')}untraverse`
          );
        }
      }
      return null;
    }
  };

  // Look for a cycle starting at each package name. For each package name, consider the
  // events that have that package.
  for (let i = 0; i < cycle.packages.length; i++) {
    const packageName = cycle.packages[i];
    const startEvents = cycle.events.get(packageName)!;
    const cyclePath = [];
    for (let k = 0; k < cycle.packages.length; k++) {
      cyclePath[k] = cycle.packages[(i + k) % cycle.packages.length];
    }
    cyclePath.push(packageName);
    if (verbose()) {
      console.warn(`Searching for event path for cycle ${cyclePath}`);
    }
    for (let j = 0; j < startEvents.length; j++) {
      const startEvent = startEvents[j];
      const path = traverseEvent(startEvent, true, cyclePath);
      if (path) {
        return path;
      }
    }
  }
  return null;
};

class Options implements types.CircularDependency.Options {
  public ignoredPackages: MatchPatternConfig[] = [];
  public depth = 4;
}

function build(options: Options): RuleLogic {
  const ignoredPackages = buildFilters(options.ignoredPackages);

  function matcher(event: Event): MatchResult[] {
    return detectCycles(event, ignoredPackages)
      .filter((cycle) => cycle.packages.length + 1 >= options.depth)
      .map((cycle) => searchForCycle(cycle, ignoredPackages))
      .filter((path) => path)
      .map((path) => {
        return {
          event: path![0],
          message: [
            'Cycle in package dependency graph',
            path!.map((event) => event.codeObject.packageOf).join(' -> '),
          ].join(': '),
          relatedEvents: path!,
        } as MatchResult;
      });
  }

  return {
    matcher,
  };
}

export default {
  id: 'circular-dependency',
  title: 'Circular package dependency',
  // scope: //*[@command]
  scope: 'command',
  Options,
  impactDomain: 'Maintainability',
  references: {
    'CWE-1047': new URL('https://cwe.mitre.org/data/definitions/1047.html'),
  },
  enumerateScope: false,
  description: parseRuleDescription('circularDependency'),
  url: 'https://appland.com/docs/analysis/rules-reference.html#circular-dependency',
  build,
} as Rule;
