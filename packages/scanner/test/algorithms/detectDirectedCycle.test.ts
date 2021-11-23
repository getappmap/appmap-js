import Graph from '../../src/algorithms/dataStructures/graph/Graph';
import GraphVertex from '../../src/algorithms/dataStructures/graph/GraphVertex';
import GraphEdge from '../../src/algorithms/dataStructures/graph/GraphEdge';
import detectDirectedCycle from '../../src/algorithms/graph/detect-cycle';
import { inspect } from 'util';

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

    expect(detectDirectedCycle(graph)).toEqual([
      {
        D: vertexF,
        F: vertexE,
        E: vertexD,
      },
    ]);

    graph.addEdge(edgeCF);

    const cycles = detectDirectedCycle(graph).map((cycle) => {
      return Object.keys(cycle).reduce((memo, key) => {
        memo[key] = cycle[key].value;
        return memo;
      }, {} as Record<string, string>);
    });

    expect(cycles).toEqual([
      {
        A: 'D',
        D: 'F',
        F: 'C',
        C: 'B',
        B: 'A',
      },
      {
        F: 'E',
        E: 'D',
        D: 'F',
      },
    ]);
  });
});
