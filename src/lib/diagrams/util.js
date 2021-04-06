import * as d3 from 'd3';
import Geometry from './helpers/geometry';

export * from '../util';

export function getEventTarget(target, container = document, selector = '') {
  const selectedElements = Array.from(container.querySelectorAll(selector));
  let el = target;

  while (el) {
    if (selectedElements.includes(el)) {
      break;
    }

    el = el.parentNode;
  }

  return el;
}

// Move the minimum amount to put the element into view
export function lazyPanToElement(viewport, element, padding = 0) {
  if (!element) {
    return;
  }

  let { x, y } = Geometry.delta(
    viewport.element.getBoundingClientRect(),
    element.getBoundingClientRect()
  );

  // Apply padding
  x += Math.sign(x) * padding;
  y += Math.sign(y) * padding;

  // Scale the offset using the current transform. This is necessary to put the
  // element in view at different scales.
  const { k } = viewport.transform;
  x /= k;
  y /= k;

  viewport.translateBy(x, y);
}

function nodeFullyVisible(viewport, node) {
  if (!node) return false;
  return Geometry.contains(
    viewport.element.getBoundingClientRect(),
    node.getBoundingClientRect()
  );
}

// Pan the scenario view to given HTMLElement node.
export function panToNode(viewport, node) {
  // To minimize panning do not move the view if the node is already fully visible.
  if (!node || nodeFullyVisible(viewport, node)) {
    return;
  }

  let target;
  // If a node is already selected and visible, pan so that
  // the new selection will be in the same place.
  const highlightedNode = viewport.element.querySelector(
    '.trace-node.highlight'
  );
  if (nodeFullyVisible(viewport, highlightedNode)) {
    const xform = d3.zoomTransform(highlightedNode);

    // we'll have to offset for the border
    const style = getComputedStyle(highlightedNode);
    target = xform.apply([
      highlightedNode.offsetLeft + Number.parseInt(style.borderLeftWidth, 10),
      highlightedNode.offsetTop + Number.parseInt(style.borderTopWidth, 10),
    ]);
  }

  viewport.translateTo(
    node.offsetLeft + node.clientWidth * 0.5,
    node.offsetTop + node.clientHeight * 0.5,
    target
  );
}

export function getElementCenter(node) {
  return {
    x: node.offsetLeft + node.clientWidth * 0.5,
    y: node.offsetTop + node.clientHeight * 0.5,
  };
}
