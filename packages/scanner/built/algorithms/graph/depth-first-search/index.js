"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.depthFirstSearch = void 0;
/**
 * @param {Callbacks} [callbacks]
 * @returns {Callbacks}
 */
function initCallbacks(callbacks) {
    const initiatedCallback = Object.assign({}, callbacks);
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const stubCallback = () => { };
    const allowTraversalCallback = (() => {
        const seen = {};
        return (_previousVertex, _currentVertex, nextVertex) => {
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
function depthFirstSearchRecursive(graph, currentVertex, previousVertex, callbacks) {
    if (!callbacks.enterVertex(currentVertex, previousVertex)) {
        return;
    }
    graph.getNeighbors(currentVertex).forEach((nextVertex) => {
        if (callbacks.allowTraversal(previousVertex, currentVertex, nextVertex)) {
            depthFirstSearchRecursive(graph, nextVertex, currentVertex, callbacks);
        }
    });
    callbacks.leaveVertex(currentVertex, previousVertex);
}
function depthFirstSearch(graph, startVertex, callbacks) {
    const previousVertex = null;
    depthFirstSearchRecursive(graph, startVertex, previousVertex, initCallbacks(callbacks));
}
exports.depthFirstSearch = depthFirstSearch;
