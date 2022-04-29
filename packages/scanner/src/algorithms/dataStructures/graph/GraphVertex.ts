import GraphEdge from './GraphEdge';
import LinkedList from '../linked-list/LinkedList';
import LinkedListNode from '../linked-list/LinkedListNode';

export default class GraphVertex {
  value: string;
  edges: LinkedList<GraphEdge>;

  /**
   * @param {*} value
   */
  constructor(value: string) {
    if (value === '') {
      throw new Error('Graph vertex must have a non-empty value');
    }

    const edgeComparator = (edgeA: GraphEdge, edgeB: GraphEdge) => {
      if (edgeA.getKey() === edgeB.getKey()) {
        return 0;
      }

      return edgeA.getKey() < edgeB.getKey() ? -1 : 1;
    };

    // Normally you would store string value like vertex name.
    // But generally it may be any object as well
    this.value = value;
    this.edges = new LinkedList<GraphEdge>(edgeComparator);
  }

  addEdge(edge: GraphEdge): GraphVertex {
    this.edges.append(edge);

    return this;
  }

  deleteEdge(edge: GraphEdge): void {
    this.edges.delete(edge);
  }

  getNeighbors(): GraphVertex[] {
    const edges = this.edges.toArray();

    const neighborsConverter = (node: LinkedListNode<GraphEdge>) => {
      return node.value.startVertex === this ? node.value.endVertex : node.value.startVertex;
    };

    // Return either start or end vertex.
    // For undirected graphs it is possible that current vertex will be the end one.
    return edges.map(neighborsConverter);
  }

  getEdges(): GraphEdge[] {
    return this.edges.toArray().map((linkedListNode) => linkedListNode.value);
  }

  getDegree(): number {
    return this.edges.toArray().length;
  }

  hasEdge(requiredEdge: GraphEdge): boolean {
    const edgeNode = this.edges.find(undefined, (edge: GraphEdge) => edge === requiredEdge);

    return !!edgeNode;
  }

  hasNeighbor(vertex: GraphVertex): boolean {
    const vertexNode = this.edges.find(
      undefined,
      (edge: GraphEdge) => edge.startVertex === vertex || edge.endVertex === vertex
    );

    return !!vertexNode;
  }

  findEdge(vertex: GraphVertex): GraphEdge | null {
    const edgeFinder = (edge: GraphEdge) => {
      return edge.startVertex === vertex || edge.endVertex === vertex;
    };

    const edge = this.edges.find(undefined, edgeFinder);

    return edge ? edge.value : null;
  }

  getKey(): string {
    return this.value;
  }

  deleteAllEdges(): GraphVertex {
    this.getEdges().forEach((edge) => this.deleteEdge(edge));

    return this;
  }

  toString(callback: undefined | ((value: string) => string) = undefined): string {
    return callback ? callback!(this.value) : `${this.value}`;
  }
}
