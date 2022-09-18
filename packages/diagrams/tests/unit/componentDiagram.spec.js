import { buildAppMap } from '@appland/models';
import ComponentDiagram from '../../src/componentDiagram';
import mockData from './fixtures/many_requests_scenario.json';
import DOMMatrix from './support/domMatrix';

SVGElement.prototype.getBBox = () => ({
  x: 0,
  y: 0,
  width: 0,
  height: 0,
});
SVGElement.prototype.getScreenCTM = () => new DOMMatrix();

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
