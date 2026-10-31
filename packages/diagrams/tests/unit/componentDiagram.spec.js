import { buildAppMap } from '@appland/models';
import ComponentDiagram from '../../src/componentDiagram';
import Graph from '../../src/componentDiagram/graph';
import mockData from './fixtures/many_requests_scenario.json';
import DOMMatrix from './support/domMatrix';

SVGElement.prototype.getBBox = () => ({
  x: 0,
  y: 0,
  width: 0,
  height: 0,
});
SVGElement.prototype.getScreenCTM = () => new DOMMatrix();

describe('GIVEN a real Dagre component graph', () => {
  let svg;
  let graph;

  beforeEach(() => {
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    graph = new Graph(svg, { animation: { enable: false } });
  });

  const expectEmptyViewport = (element, layout) => {
    expect(layout.graph.graph()).toMatchObject({ width: 0, height: 0 });
    expect(element.getAttribute('width')).toBe('0');
    expect(element.getAttribute('height')).toBe('0');
    expect(element.querySelectorAll('.node, .edgePath, .cluster')).toHaveLength(0);
    expect(element.outerHTML).not.toMatch(/Infinity|NaN|undefined/);
  };

  const expectPopulatedViewport = (element, layout) => {
    const { width, height } = layout.graph.graph();
    expect(Number.isFinite(width)).toBe(true);
    expect(Number.isFinite(height)).toBe(true);
    expect(width).toBeGreaterThan(0);
    expect(height).toBeGreaterThan(0);
    expect(Number(element.getAttribute('width'))).toBe(width);
    expect(Number(element.getAttribute('height'))).toBe(height);
  };

  it('Given a connected layout, when all nodes are removed, then edges and dimensions are cleared', () => {
    const from = { id: 'from', type: 'function' };
    const to = { id: 'to', type: 'function' };
    [from, to].forEach((obj) =>
      graph.setNode({
        id: obj.id,
        label: obj.id,
        class: obj.type,
        codeObject: obj,
      })
    );
    graph.setEdge(from, to);
    graph.render();
    expectPopulatedViewport(svg, graph);
    expect(svg.querySelectorAll('.node')).toHaveLength(2);
    expect(svg.querySelectorAll('.edgePath')).toHaveLength(1);
    graph.removeNode('from');
    graph.removeNode('to');
    graph.render();
    expectEmptyViewport(svg, graph);
  });

  it('Given no nodes, when the real Graph renders, then the viewport is defined and empty', () => {
    graph.render();
    expectEmptyViewport(svg, graph);
    graph.render();
    expectEmptyViewport(svg, graph);
  });

  it('Given an empty graph, when populated → emptied → repopulated, then the same SVG has no stale content or dimensions', () => {
    graph.render();
    expectEmptyViewport(svg, graph);
    graph.setNode({ id: 'one', label: 'One', class: 'function', codeObject: { type: 'function' } });
    graph.render();
    expectPopulatedViewport(svg, graph);
    expect(svg.querySelectorAll('.node')).toHaveLength(1);
    graph.removeNode('one');
    graph.render();
    expectEmptyViewport(svg, graph);
    graph.setNode({ id: 'two', label: 'Two', class: 'function', codeObject: { type: 'function' } });
    graph.render();
    expect(svg.querySelectorAll('.node')).toHaveLength(1);
    expectPopulatedViewport(svg, graph);
  });
});

describe('Component Diagram', () => {
  let componentDiagram;
  const appMap = buildAppMap(mockData).normalize().build();
  beforeEach(() => {
    const root = document.createElement('div');
    root.setAttribute('id', 'diagram');
    document.body.appendChild(root);

    componentDiagram = new ComponentDiagram(root);
    componentDiagram.render(appMap.classMap);
  });

  it('can highlight multiple nodes', () => {
    const nodes = ['POST /applications', 'SQL'];
    const highlightedNodes = appMap.classMap.codeObjects.filter((obj) => nodes.includes(obj.name));
    componentDiagram.highlight(highlightedNodes);

    highlightedNodes.forEach((id) =>
      expect(document.querySelector(`.highlight[data-id="${id}"`)).not.toBeNull()
    );
    expect(document.querySelector('.highlight[data-id="app/controllers"')).toBeNull();
  });
});
