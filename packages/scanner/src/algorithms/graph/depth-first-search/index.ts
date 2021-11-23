import Graph from 'src/algorithms/dataStructures/graph/Graph';
import GraphVertex from 'src/algorithms/dataStructures/graph/GraphVertex';

/**
 * @param {Callbacks} [callbacks]
 * @returns {Callbacks}
 */
function initCallbacks(callbacks: Callbacks): Callbacks {
  const initiatedCallback: Callbacks = Object.assign({}, callbacks);

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const stubCallback = () => {};

  const allowTraversalCallback = (() => {
    const seen: Record<string, boolean> = {};
    return (_previousVertex: GraphVertex, _currentVertex: GraphVertex, nextVertex: GraphVertex) => {
      if (!seen[nextVertex.getKey()]) {
        seen[nextVertex.getKey()] = true;
        return true;
      }
      return false;
    };
  })();

  initiatedCallback.allowTraversal = callbacks.allowTraversal || allowTraversalCallback;
  initiatedCallback.enterVertex = callbacks.enterVertex || stubCallback;
  initiatedCallback.leaveVertex = callbacks.leaveVertex || stubCallback;

  return initiatedCallback;
}

/**
 * @param {Graph} graph
 * @param {GraphVertex} currentVertex
 * @param {GraphVertex} previousVertex
 * @param {Callbacks} callbacks
 */
function depthFirstSearchRecursive(
  graph: Graph,
  currentVertex: GraphVertex,
  previousVertex: GraphVertex | null,
  callbacks: Callbacks
) {
  if ( !callbacks.enterVertex(currentVertex, previousVertex) ) {
    return;
  }

  graph.getNeighbors(currentVertex).forEach((nextVertex: GraphVertex) => {
    if (callbacks.allowTraversal(previousVertex, currentVertex, nextVertex)) {
      depthFirstSearchRecursive(graph, nextVertex, currentVertex, callbacks);
    }
  });

  callbacks.leaveVertex(currentVertex, previousVertex);
}

export interface Callbacks {
  // Determines whether DFS should traverse from the vertex to its neighbor
  // (along the edge). By default prohibits visiting the same vertex again.
  allowTraversal: (
    previousVertex: GraphVertex | null,
    currentVertex: GraphVertex,
    nextVertex: GraphVertex
  ) => boolean;
  // Called when DFS enters the vertex.
  enterVertex: (currentVertex: GraphVertex, previousVertex: GraphVertex | null) => boolean;
  // Called when DFS leaves the vertex
  leaveVertex: (currentVertex: GraphVertex, previousVertex: GraphVertex | null) => void;
}

export function depthFirstSearch(
  graph: Graph,
  startVertex: GraphVertex,
  callbacks: Callbacks
): void {
  const previousVertex = null;
  depthFirstSearchRecursive(graph, startVertex, previousVertex, initCallbacks(callbacks));
}
