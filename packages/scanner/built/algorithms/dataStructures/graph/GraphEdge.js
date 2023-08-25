"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class GraphEdge {
    constructor(startVertex, endVertex, weight = 0) {
        this.startVertex = startVertex;
        this.endVertex = endVertex;
        this.weight = weight;
    }
    getKey() {
        const startVertexKey = this.startVertex.getKey();
        const endVertexKey = this.endVertex.getKey();
        return `${startVertexKey} - ${endVertexKey}`;
    }
    reverse() {
        const tmp = this.startVertex;
        this.startVertex = this.endVertex;
        this.endVertex = tmp;
        return this;
    }
    toString() {
        return this.getKey();
    }
}
exports.default = GraphEdge;
