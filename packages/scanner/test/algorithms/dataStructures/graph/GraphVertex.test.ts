import GraphVertex from '../../../../src/algorithms/dataStructures/graph/GraphVertex';
import GraphEdge from '../../../../src/algorithms/dataStructures/graph/GraphEdge';

describe('GraphVertex', () => {
  it('should throw an error when trying to create vertex without value', () => {
    let vertex = null;

    function createEmptyVertex() {
      vertex = new GraphVertex('');
    }

    expect(vertex).toBeNull();
    expect(createEmptyVertex).toThrow();
  });

  it('should create graph vertex', () => {
    const vertex = new GraphVertex('A');

    expect(vertex).toBeDefined();
    expect(vertex.value).toBe('A');
    expect(vertex.toString()).toBe('A');
    expect(vertex.getKey()).toBe('A');
    expect(vertex.edges.toString()).toBe('');
    expect(vertex.getEdges()).toEqual([]);
  });

  it('should add edges to vertex and check if it exists', () => {
    const vertexA = new GraphVertex('A');
    const vertexB = new GraphVertex('B');

    const edgeAB = new GraphEdge(vertexA, vertexB);
    vertexA.addEdge(edgeAB);

    expect(vertexA.hasEdge(edgeAB)).toBeTruthy();
    expect(vertexB.hasEdge(edgeAB)).toBeFalsy();
    expect(vertexA.getEdges().length).toBe(1);
    expect(vertexA.getEdges()[0].toString()).toBe('A - B');
  });

  it('should delete edges from vertex', () => {
    const vertexA = new GraphVertex('A');
    const vertexB = new GraphVertex('B');
    const vertexC = new GraphVertex('C');

    const edgeAB = new GraphEdge(vertexA, vertexB);
    const edgeAC = new GraphEdge(vertexA, vertexC);
    vertexA.addEdge(edgeAB).addEdge(edgeAC);

    expect(vertexA.hasEdge(edgeAB)).toBeTruthy();
    expect(vertexB.hasEdge(edgeAB)).toBeFalsy();

    expect(vertexA.hasEdge(edgeAC)).toBeTruthy();
    expect(vertexC.hasEdge(edgeAC)).toBeFalsy();

    expect(vertexA.getEdges().length).toBe(2);

    expect(vertexA.getEdges()[0].toString()).toBe('A - B');
    expect(vertexA.getEdges()[1].toString()).toBe('A - C');

    vertexA.deleteEdge(edgeAB);
    expect(vertexA.hasEdge(edgeAB)).toBeFalsy();
    expect(vertexA.hasEdge(edgeAC)).toBeTruthy();
    expect(vertexA.getEdges()[0].toString()).toBe('A - C');

    vertexA.deleteEdge(edgeAC);
    expect(vertexA.hasEdge(edgeAB)).toBeFalsy();
    expect(vertexA.hasEdge(edgeAC)).toBeFalsy();
    expect(vertexA.getEdges().length).toBe(0);
  });

  it('should delete all edges from vertex', () => {
    const vertexA = new GraphVertex('A');
    const vertexB = new GraphVertex('B');
    const vertexC = new GraphVertex('C');

    const edgeAB = new GraphEdge(vertexA, vertexB);
    const edgeAC = new GraphEdge(vertexA, vertexC);
    vertexA.addEdge(edgeAB).addEdge(edgeAC);

    expect(vertexA.hasEdge(edgeAB)).toBeTruthy();
    expect(vertexB.hasEdge(edgeAB)).toBeFalsy();

    expect(vertexA.hasEdge(edgeAC)).toBeTruthy();
    expect(vertexC.hasEdge(edgeAC)).toBeFalsy();

    expect(vertexA.getEdges().length).toBe(2);

    vertexA.deleteAllEdges();

    expect(vertexA.hasEdge(edgeAB)).toBeFalsy();
    expect(vertexB.hasEdge(edgeAB)).toBeFalsy();

    expect(vertexA.hasEdge(edgeAC)).toBeFalsy();
    expect(vertexC.hasEdge(edgeAC)).toBeFalsy();

    expect(vertexA.getEdges().length).toBe(0);
  });

  it('should return vertex neighbors in case if current node is start one', () => {
    const vertexA = new GraphVertex('A');
    const vertexB = new GraphVertex('B');
    const vertexC = new GraphVertex('C');

    const edgeAB = new GraphEdge(vertexA, vertexB);
    const edgeAC = new GraphEdge(vertexA, vertexC);
    vertexA.addEdge(edgeAB).addEdge(edgeAC);

    expect(vertexB.getNeighbors()).toEqual([]);

    const neighbors = vertexA.getNeighbors();

    expect(neighbors.length).toBe(2);
    expect(neighbors[0]).toEqual(vertexB);
    expect(neighbors[1]).toEqual(vertexC);
  });

  it('should return vertex neighbors in case if current node is end one', () => {
    const vertexA = new GraphVertex('A');
    const vertexB = new GraphVertex('B');
    const vertexC = new GraphVertex('C');

    const edgeBA = new GraphEdge(vertexB, vertexA);
    const edgeCA = new GraphEdge(vertexC, vertexA);
    vertexA.addEdge(edgeBA).addEdge(edgeCA);

    expect(vertexB.getNeighbors()).toEqual([]);

    const neighbors = vertexA.getNeighbors();

    expect(neighbors.length).toBe(2);
    expect(neighbors[0]).toEqual(vertexB);
    expect(neighbors[1]).toEqual(vertexC);
  });

  it('should check if vertex has specific neighbor', () => {
    const vertexA = new GraphVertex('A');
    const vertexB = new GraphVertex('B');
    const vertexC = new GraphVertex('C');

    const edgeAB = new GraphEdge(vertexA, vertexB);
    vertexA.addEdge(edgeAB);

    expect(vertexA.hasNeighbor(vertexB)).toBeTruthy();
    expect(vertexA.hasNeighbor(vertexC)).toBeFalsy();
  });

  it('should edge by vertex', () => {
    const vertexA = new GraphVertex('A');
    const vertexB = new GraphVertex('B');
    const vertexC = new GraphVertex('C');

    const edgeAB = new GraphEdge(vertexA, vertexB);
    vertexA.addEdge(edgeAB);

    expect(vertexA.findEdge(vertexB)).toEqual(edgeAB);
    expect(vertexA.findEdge(vertexC)).toBeNull();
  });

  it('should calculate vertex degree', () => {
    const vertexA = new GraphVertex('A');
    const vertexB = new GraphVertex('B');

    expect(vertexA.getDegree()).toBe(0);

    const edgeAB = new GraphEdge(vertexA, vertexB);
    vertexA.addEdge(edgeAB);

    expect(vertexA.getDegree()).toBe(1);

    const edgeBA = new GraphEdge(vertexB, vertexA);
    vertexA.addEdge(edgeBA);

    expect(vertexA.getDegree()).toBe(2);

    vertexA.addEdge(edgeAB);
    expect(vertexA.getDegree()).toBe(3);

    expect(vertexA.getEdges().length).toEqual(3);
  });
});
