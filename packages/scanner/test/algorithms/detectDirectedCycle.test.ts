import Graph from '../../src/algorithms/dataStructures/graph/Graph';
import GraphVertex from '../../src/algorithms/dataStructures/graph/GraphVertex';
import GraphEdge from '../../src/algorithms/dataStructures/graph/GraphEdge';
import detectDirectedCycle from '../../src/algorithms/graph/detect-cycle';

describe('detectDirectedCycle', () => {
  it('should detect directed cycle', () => {
    const vertexA = new GraphVertex('A');
    const vertexB = new GraphVertex('B');
    const vertexC = new GraphVertex('C');
    const vertexD = new GraphVertex('D');
    const vertexE = new GraphVertex('E');
    const vertexF = new GraphVertex('F');

    const edgeAB = new GraphEdge(vertexA, vertexB);
    const edgeBC = new GraphEdge(vertexB, vertexC);
    const edgeAC = new GraphEdge(vertexA, vertexC);
    const edgeCF = new GraphEdge(vertexC, vertexF);
    const edgeDA = new GraphEdge(vertexD, vertexA);
    const edgeDE = new GraphEdge(vertexD, vertexE);
    const edgeEF = new GraphEdge(vertexE, vertexF);
    const edgeFD = new GraphEdge(vertexF, vertexD);

    const graph = new Graph(true);
    // +--> E -> F
    // |
    // D -> A -> B -> C
    //      |         ^
    //      +----------
    graph
      .addEdge(edgeAB)
      .addEdge(edgeBC)
      .addEdge(edgeAC)
      .addEdge(edgeDA)
      .addEdge(edgeDE)
      .addEdge(edgeEF);

    expect(detectDirectedCycle(graph)).toEqual([]);

    graph.addEdge(edgeFD);

    expect(
      detectDirectedCycle(graph).map((cycle) => cycle.map((vertex) => vertex.getKey()))
    ).toEqual([['E', 'F', 'D']]);

    graph.addEdge(edgeCF);

    expect(
      detectDirectedCycle(graph).map((cycle) => cycle.map((vertex) => vertex.getKey()))
    ).toEqual([
      ['B', 'C', 'F', 'D', 'A'],
      ['D', 'E', 'F'],
    ]);
  });
});
