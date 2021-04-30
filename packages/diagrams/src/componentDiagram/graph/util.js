export function generateHash() {
  return Math.random().toString(16).slice(2, 10);
}

export function getAnimationStep(from, to, percent) {
  return percent < 1 ? from + (to - from) * percent : to;
}

export function createSVGElement(tagName, className = null) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tagName);

  if (className) {
    el.setAttribute('class', className);
  }

  return el;
}

// transform 'dagre' points into simple array which will be passed to 'd3-line' helper
export function transformPoints(points) {
  const result = [];

  points.forEach((p) => {
    result.push([p.x, p.y]);
  });

  return result;
}

// when we need to transition between 2 edges with different points length - fill smaller array with copies of it's first point
export function normalizePoints(points1, points2) {
  if (points1.length === points2.length) {
    return;
  }

  const smaller = points1.length < points2.length ? points1 : points2;
  const bigger = points2 === smaller ? points1 : points2;

  for (let i = 0, len = bigger.length - smaller.length; i < len; i += 1) {
    smaller.splice(0, 0, smaller[0]);
  }
}

export function findTraversableNodesAndEdges(graph, id) {
  const visitedNodes = new Set();
  const visitedEdges = new Set();
  const queue = [id];

  // traverse left from id
  while (queue.length > 0) {
    const currentId = queue.pop();
    if (!visitedNodes.has(currentId)) {
      graph.inEdges(currentId).forEach((e) => {
        visitedEdges.add(e);
        queue.push(e.v);
      });

      visitedNodes.add(currentId);
    }
  }

  // traverse right from id
  queue.push(id);
  visitedNodes.delete(id);

  while (queue.length > 0) {
    const currentId = queue.pop();
    if (!visitedNodes.has(currentId)) {
      graph.outEdges(currentId).forEach((e) => {
        visitedEdges.add(e);
        queue.push(e.w);
      });

      visitedNodes.add(currentId);
    }
  }
  return [visitedNodes, visitedEdges];
}

export function prepareNode(data) {
  const node = { ...data };
  node.label = node.label || node.id;
  node.class = node.class || node.type;

  if (node.id === 'HTTP') {
    node.label = 'HTTP server requests';
    node.shape = 'http';
    node.class = 'http';
  } else if (node.id === 'SQL') {
    node.label = 'Database';
    node.shape = 'database';
    node.class = 'database';
  }
  if (node.type === 'cluster') {
    node.label = '';
  }

  return node;
}
