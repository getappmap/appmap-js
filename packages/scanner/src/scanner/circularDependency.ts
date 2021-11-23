import { Event } from '@appland/models';
import Assertion from '../assertion';
import { AssertionSpec, MatchResult } from '../types';
import GraphEdge from '../algorithms/dataStructures/graph/GraphEdge';
import GraphVertex from '../algorithms/dataStructures/graph/GraphVertex';
import Graph from '../algorithms/dataStructures/graph/Graph';
import detectDirectedCycle from '../algorithms/graph/detect-cycle';
import { isAbsolute } from 'path';
import * as types from './types';

function detectCycles(root: Event, ignorePackages: string[]): string[] {
  const graph = new Graph(true);
  const vertices = new Map<string, GraphVertex>();
  const edges = new Set<string>();

  const makeVertex = (pkg: string): GraphVertex => {
    let result = vertices.get(pkg);
    if (!result) {
      result = new GraphVertex(pkg);
      vertices.set(pkg, result);
    }
    return result;
  };

  const collectEvent = (event: Event, parentPackage: string | null) => {
    let myPackage: string | null = event.codeObject.packageOf;
    if (
      myPackage === '' ||
      ignorePackages.includes(myPackage) ||
      !event.codeObject.location ||
      isAbsolute(event.codeObject.location)
    ) {
      myPackage = null;
    }

    if (myPackage) {
      if (parentPackage && parentPackage !== myPackage) {
        const edge = new GraphEdge(makeVertex(parentPackage), makeVertex(myPackage));
        if (!edges.has(edge.getKey())) {
          edges.add(edge.getKey());
          graph.addEdge(edge);
        }
      }
      parentPackage = myPackage;
    }
    event.children.forEach((child) => collectEvent(child, parentPackage));
  };

  collectEvent(root, null);

  return detectDirectedCycle(graph).map((cycle) => {
    const cycleDup = { ...cycle };
    let vertex = Object.values(cycleDup)[0];
    const message = [];
    while (vertex) {
      const vertexKey = vertex.getKey();
      message.push(vertexKey);
      vertex = cycleDup[vertexKey];
      delete cycleDup[vertexKey];
    }

    return message.reverse().join(' -> ');
  });
}

class Options implements types.CircularDependency.Options {
  public ignorePackages: string[] = ['app/helpers'];
}

function scanner(options: Options): Assertion {
  return Assertion.assert(
    'circular-dependency',
    'Circular package dependency',
    (event: Event): MatchResult[] => {
      return detectCycles(event, options.ignorePackages).map((cycle) => {
        return { event, message: cycle } as MatchResult;
      });
    },
    (assertion: Assertion): void => {
      assertion.description = `Code package dependency graph should not have cycles`;
    }
  );
}

export default { scanner, enumerateScope: false, Options } as AssertionSpec;
