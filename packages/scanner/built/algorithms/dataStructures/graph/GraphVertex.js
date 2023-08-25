"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const LinkedList_1 = __importDefault(require("../linked-list/LinkedList"));
class GraphVertex {
    /**
     * @param {*} value
     */
    constructor(value) {
        if (value === '') {
            throw new Error('Graph vertex must have a non-empty value');
        }
        const edgeComparator = (edgeA, edgeB) => {
            if (edgeA.getKey() === edgeB.getKey()) {
                return 0;
            }
            return edgeA.getKey() < edgeB.getKey() ? -1 : 1;
        };
        // Normally you would store string value like vertex name.
        // But generally it may be any object as well
        this.value = value;
        this.edges = new LinkedList_1.default(edgeComparator);
    }
    addEdge(edge) {
        this.edges.append(edge);
        return this;
    }
    deleteEdge(edge) {
        this.edges.delete(edge);
    }
    getNeighbors() {
        const edges = this.edges.toArray();
        const neighborsConverter = (node) => {
            return node.value.startVertex === this ? node.value.endVertex : node.value.startVertex;
        };
        // Return either start or end vertex.
        // For undirected graphs it is possible that current vertex will be the end one.
        return edges.map(neighborsConverter);
    }
    getEdges() {
        return this.edges.toArray().map((linkedListNode) => linkedListNode.value);
    }
    getDegree() {
        return this.edges.toArray().length;
    }
    hasEdge(requiredEdge) {
        const edgeNode = this.edges.find(undefined, (edge) => edge === requiredEdge);
        return !!edgeNode;
    }
    hasNeighbor(vertex) {
        const vertexNode = this.edges.find(undefined, (edge) => edge.startVertex === vertex || edge.endVertex === vertex);
        return !!vertexNode;
    }
    findEdge(vertex) {
        const edgeFinder = (edge) => {
            return edge.startVertex === vertex || edge.endVertex === vertex;
        };
        const edge = this.edges.find(undefined, edgeFinder);
        return edge ? edge.value : null;
    }
    getKey() {
        return this.value;
    }
    deleteAllEdges() {
        this.getEdges().forEach((edge) => this.deleteEdge(edge));
        return this;
    }
    toString(callback = undefined) {
        return callback ? callback(this.value) : `${this.value}`;
    }
}
exports.default = GraphVertex;
