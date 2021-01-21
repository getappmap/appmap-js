import { ComponentDiagram } from '@/lib/diagrams';
import mockData from '../../fixtures/fullModel.json';
import DOMMatrix from '../../support/domMatrix';

SVGElement.prototype.getBBox = () => ({
  x: 0,
  y: 0,
  width: 0,
  height: 0,
});
SVGElement.prototype.getScreenCTM = () => new DOMMatrix();

describe('Component Diagram', () => {
  let componentDiagram;
  beforeEach(() => {
    const root = document.createElement('div');
    root.setAttribute('id', 'diagram');
    document.body.appendChild(root);

    componentDiagram = new ComponentDiagram(root);
    componentDiagram.render(mockData);
  });

  it('can highlight multiple nodes', () => {
    const highlightedNodes = ['POST /applications', 'SQL'];
    componentDiagram.highlight(highlightedNodes);

    highlightedNodes.forEach((id) =>
      expect(
        document.querySelector(`.highlight[data-id="${id}"`),
      ).not.toBeNull(),
    );
    expect(
      document.querySelector('.highlight[data-id="app/controllers"'),
    ).toBeNull();
  });
});
