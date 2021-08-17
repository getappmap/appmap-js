import Geometry from './helpers/geometry';

export function getEventTarget(target, container = document, selector = false) {
  let el = target;
  let selectedElements;

  if (selector) {
    selectedElements = Array.from(container.querySelectorAll(selector));
  } else {
    selectedElements = [container];
  }

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

export function nodeFullyVisible(container, node) {
  if (!node) return false;
  return Geometry.inContainer(
    container.getBoundingClientRect(),
    node.getBoundingClientRect()
  );
}

export function getParentRelativeOffset(element, parent) {
  const offset = {
    left: 0,
    top: 0,
  };

  let child = element;
  while (child && child !== parent) {
    offset.left += child.offsetLeft;
    offset.top += child.offsetTop;
    child = child.offsetParent;
  }

  return offset;
}

function getParentOffset(element, parent) {
  const offset = {
    left: 0,
    top: 0,
  };

  let child = element;
  while (child && child !== parent) {
    offset.left += child.offsetLeft;
    offset.top += child.offsetTop;
    child = child.parentNode;
  }

  return offset;
}

// Pan the scenario view to given HTMLElement node.
export function panToNode(viewport, node) {
  // To minimize panning do not move the view if the node is already fully visible.
  if (!node || nodeFullyVisible(viewport.element, node)) {
    return;
  }

  const offset = getParentOffset(node, viewport.element);
  const nodeRect = node.getBoundingClientRect();

  viewport.translateTo(
    offset.left + nodeRect.width / 2,
    offset.top + nodeRect.height / 2
  );
}

export function getElementCenter(node) {
  return {
    x: node.offsetLeft + node.clientWidth * 0.5,
    y: node.offsetTop + node.clientHeight * 0.5,
  };
}
