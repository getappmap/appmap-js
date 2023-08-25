"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const depth_first_search_1 = require("../depth-first-search");
/**
 * Detect cycle in directed graph using Depth First Search.
 *
 * @returns the cycle of vertexes, not including the final vertex which is the same as the first.
 */
function detectDirectedCycle(graph) {
    const cycles = [];
    // Will store parents (previous vertices) for all visited nodes.
    // This will be needed in order to specify what path exactly is a cycle.
    const dfsParentMap = new Map();
    // White set (UNVISITED) contains all the vertices that haven't been visited at all.
    const whiteSet = new Map();
    // Gray set (VISITING) contains all the vertices that are being visited right now
    // (in current path).
    const graySet = new Map();
    // Black set (VISITED) contains all the vertices that has been fully visited.
    // Meaning that all children of the vertex has been visited.
    const blackSet = new Map();
    // If we encounter vertex in gray set it means that we've found a cycle.
    // Because when vertex in gray set it means that its neighbors or its neighbors
    // neighbors are still being explored.
    // Init white set and add all vertices to it.
    graph.getAllVertices().forEach((vertex) => {
        whiteSet.set(vertex.getKey(), vertex);
    });
    // Describe BFS callbacks.
    const callbacks = {
        enterVertex: (currentVertex, previousVertex) => {
            if (graySet.has(currentVertex.getKey())) {
                // If current vertex already in grey set it means that cycle is detected.
                // Let's detect cycle path.
                const cycle = [];
                let currentCycleVertex = currentVertex;
                let previousCycleVertex = previousVertex;
                while (previousCycleVertex.getKey() !== currentVertex.getKey()) {
                    cycle.push(currentCycleVertex);
                    currentCycleVertex = previousCycleVertex;
                    previousCycleVertex = dfsParentMap.get(previousCycleVertex.getKey());
                }
                cycle.push(currentCycleVertex);
                cycles.push(cycle.reverse());
                return false;
            }
            else {
                // Otherwise let's add current vertex to gray set and remove it from white set.
                graySet.set(currentVertex.getKey(), currentVertex);
                whiteSet.delete(currentVertex.getKey());
                // Update DFS parents list.
                dfsParentMap.set(currentVertex.getKey(), previousVertex);
                return true;
            }
        },
        leaveVertex: (currentVertex) => {
            // If all node's children has been visited let's remove it from gray set
            // and move it to the black set meaning that all its neighbors are visited.
            blackSet.set(currentVertex.getKey(), currentVertex);
            graySet.delete(currentVertex.getKey());
        },
        allowTraversal: (_previousVertex, _currentVertex, nextVertex) => {
            // Allow traversal only for the vertices that are not in black set
            // since all black set vertices have been already visited.
            return !blackSet.has(nextVertex.getKey());
        },
    };
    // Start exploring vertices.
    while (whiteSet.size > 0) {
        const startVertex = whiteSet.values().next().value;
        // Do Depth First Search.
        (0, depth_first_search_1.depthFirstSearch)(graph, startVertex, callbacks);
    }
    return cycles;
}
exports.default = detectDirectedCycle;
