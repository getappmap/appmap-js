import GraphEdge from './GraphEdge';
import GraphVertex from './GraphVertex';

export default class Graph {
  vertices: Record<string, GraphVertex> = {};
  edges: Record<string, GraphEdge> = {};
  isDirected: boolean;

  /**
   * @param {boolean} isDirected
   */
  constructor(isDirected = false) {
    this.vertices = {};
    this.edges = {};
    this.isDirected = isDirected;
  }

  get vertexCount(): number {
    return Object.keys(this.vertices).length;
  }

  addVertex(newVertex: GraphVertex): Graph {
    this.vertices[newVertex.getKey()] = newVertex;

    return this;
  }

  getVertexByKey(vertexKey: string): GraphVertex | null {
    return this.vertices[vertexKey];
  }

  getNeighbors(vertex: GraphVertex): GraphVertex[] {
    return vertex.getNeighbors();
  }

  getAllVertices(): GraphVertex[] {
    return Object.values(this.vertices);
  }

  getAllEdges(): GraphEdge[] {
    return Object.values(this.edges);
  }

  addEdge(edge: GraphEdge): Graph {
    // Try to find and end start vertices.
    let startVertex = this.getVertexByKey(edge.startVertex.getKey());
    let endVertex = this.getVertexByKey(edge.endVertex.getKey());

    // Insert start vertex if it wasn't inserted.
    if (!startVertex) {
      this.addVertex(edge.startVertex);
      startVertex = this.getVertexByKey(edge.startVertex.getKey());
    }

    // Insert end vertex if it wasn't inserted.
    if (!endVertex) {
      this.addVertex(edge.endVertex);
      endVertex = this.getVertexByKey(edge.endVertex.getKey());
    }

    // Check if edge has been already added.
    if (this.edges[edge.getKey()]) {
      throw new Error('Edge has already been added before');
    } else {
      this.edges[edge.getKey()] = edge;
    }

    // Add edge to the vertices.
    if (this.isDirected) {
      // If graph IS directed then add the edge only to start vertex.
      startVertex!.addEdge(edge);
    } else {
      // If graph ISN'T directed then add the edge to both vertices.
      startVertex!.addEdge(edge);
      endVertex!.addEdge(edge);
    }

    return this;
  }

  deleteEdge(edge: GraphEdge): void {
    // Delete edge from the list of edges.
    if (this.edges[edge.getKey()]) {
      delete this.edges[edge.getKey()];
    } else {
      throw new Error('Edge not found in graph');
    }

    // Try to find and end start vertices and delete edge from them.
    const startVertex = this.getVertexByKey(edge.startVertex.getKey());
    const endVertex = this.getVertexByKey(edge.endVertex.getKey());

    if (startVertex) {
      startVertex.deleteEdge(edge);
    }
    if (endVertex) {
      endVertex.deleteEdge(edge);
    }
  }

  findEdge(startVertex: GraphVertex, endVertex: GraphVertex): GraphEdge | null {
    const vertex = this.getVertexByKey(startVertex.getKey());
    if (!vertex) {
      return null;
    }
    return vertex.findEdge(endVertex);
  }

  findVertexByKey(vertexKey: string): GraphVertex | null {
    if (this.vertices[vertexKey]) {
      return this.vertices[vertexKey];
    }

    return null;
  }

  getWeight(): number {
    return this.getAllEdges().reduce((weight, graphEdge) => {
      return weight + graphEdge.weight;
    }, 0);
  }

  /**
   * Reverse all the edges in directed graph.
   */
  reverse(): Graph {
    this.getAllEdges().forEach((edge: GraphEdge): void => {
      // Delete straight edge from graph and from vertices.
      this.deleteEdge(edge);

      // Reverse the edge.
      edge.reverse();

      // Add reversed edge back to the graph and its vertices.
      this.addEdge(edge);
    });

    return this;
  }

  getVerticesIndices(): Record<string, number> {
    const verticesIndices: Record<string, number> = {};
    this.getAllVertices().forEach((vertex, index) => {
      verticesIndices[vertex.getKey()] = index;
    });

    return verticesIndices;
  }

  getAdjacencyMatrix(): number[][] {
    const vertices = this.getAllVertices();
    const verticesIndices = this.getVerticesIndices();

    // Init matrix with infinities meaning that there is no ways of
    // getting from one vertex to another yet.
    const adjacencyMatrix = Array(vertices.length)
      .fill(null)
      .map(() => {
        return Array(vertices.length).fill(Infinity);
      });

    // Fill the columns.
    vertices.forEach((vertex, vertexIndex) => {
      vertex.getNeighbors().forEach((neighbor) => {
        const neighborIndex = verticesIndices[neighbor.getKey()];
        adjacencyMatrix[vertexIndex][neighborIndex] = this.findEdge(vertex, neighbor)!.weight;
      });
    });

    return adjacencyMatrix;
  }

  toString(): string {
    return Object.keys(this.vertices).toString();
  }
}
