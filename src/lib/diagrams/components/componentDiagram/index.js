import * as d3 from 'd3';
import deepmerge from 'deepmerge';

import { hashify, getRepositoryUrl, getEventTarget } from '../../util';
import { EventSource } from '../../../models';
import Container from '../../helpers/container/index';
import Graph from './graph/index';

export const DEFAULT_TARGET_COUNT = 1;
const IDEAL_CHILD_COUNT = 1;

function setChildrenCount(obj, model) {
  /* eslint-disable no-param-reassign */
  const childrenCount = new Set(model.package_classes[obj.id]).size;
  if (childrenCount && childrenCount > 1) {
    obj.label = `${obj.id} (${childrenCount})`;
  }
  /* eslint-disable no-param-reassign */
}

function mixedDiagram(graphDefinition, targetNodeCount = DEFAULT_TARGET_COUNT) {
  if (
    !graphDefinition ||
    !graphDefinition.package_calls ||
    graphDefinition.package_calls.length === 0
  ) {
    return {};
  }

  /* eslint-disable camelcase */
  const {
    class_calls,
    class_callers,
    class_package,
    packages,
    package_calls,
    package_classes,
  } = graphDefinition;
  /* eslint-enable camelcase */

  const diagramCalls = { ...package_calls }; // eslint-disable-line camelcase
  const score = (packageName) => {
    let result = 0;
    // Other score factors can be added here.

    // Adjust for an 'ideal' number of children.
    const childCount = package_classes[packageName].length;
    const childrenFactor = Math.abs(IDEAL_CHILD_COUNT - childCount);
    result += childrenFactor;
    return result;
  };

  const sortedPackages = [...packages].sort((a, b) => score(b) - score(a));
  const diagramSize = () => new Set(Object.entries(diagramCalls).flat(2)).size;

  while (diagramSize() < targetNodeCount) {
    if (sortedPackages.length === 0) {
      break;
    }

    const pkg = sortedPackages.pop();
    const classes = package_classes[pkg];

    // 1. This package is being replaced with its classes, so remove the node
    // edges in which this package was the source
    delete diagramCalls[pkg];

    // 2. Remove all calls to this package as well
    Object.values(diagramCalls).forEach((set) => set.delete(pkg));

    // 3. Add all the calls to each class in this package. The parent should be
    // the package (if it's present in the call graph), or the class.
    classes.forEach((cls) => {
      const classCallers = class_callers[cls] || [];
      classCallers.forEach((caller) => {
        const parent = diagramCalls[caller] ? caller : class_package[caller];
        if (parent === pkg) {
          return;
        }

        if (!diagramCalls[parent]) {
          diagramCalls[parent] = new Set();
        }

        diagramCalls[parent].add(cls);
      });
    });

    // 4. Add the calls made by the classes in this package. If the calls are
    // made to a class which is collapsed into a package, call the package.
    // Later, if that package is expanded, step 2 will replace the call to the
    // package with a call to the class.
    classes.forEach((cls) => {
      const classCalls = class_calls[cls] || [];
      classCalls.forEach((callee) => {
        const calleePackage = class_package[callee];
        const child = diagramCalls[calleePackage] ? calleePackage : callee;
        if (child === pkg) {
          return;
        }

        if (!diagramCalls[cls]) {
          diagramCalls[cls] = new Set();
        }

        diagramCalls[cls].add(child);
      });
    });
  }

  const entries = Object.entries(diagramCalls).map(([k, vs]) => [k, [...vs]]);
  const edges = entries
    .map(([k, vs]) => vs.map((v) => [k, v]))
    .flat()
    .filter(([v, w]) => v !== w);
  const nodes = Object.values(
    edges.flat(2).reduce((obj, id) => {
      obj[id] = {
        id,
        type: packages.has(id) ? 'package' : 'class',
      };
      setChildrenCount(obj[id], graphDefinition);
      return obj;
    }, {}),
  );

  return { edges, nodes };
}

function activeNodes(graph, model, list, fn) {
  if (list) {
    list.forEach((classId) => {
      if (graph.node(classId)) {
        fn(classId);
        return;
      }

      const classPackage = model.class_package[classId];
      if (graph.node(classPackage)) {
        fn(classPackage);
      }
    });
  }
}

function bindEvents(componentDiagram) {
  const svg = componentDiagram.element.node();

  svg.addEventListener('click', (event) => {
    const node = getEventTarget(event.target, svg, 'g.nodes g.node');
    if (!node) {
      return;
    }

    event.stopPropagation();
    componentDiagram.highlight(node.dataset.id);
  });

  svg.addEventListener('dblclick', (event) => {
    const node = getEventTarget(event.target, svg, 'g.nodes g.node');
    if (!node) {
      return;
    }

    event.stopPropagation();
    componentDiagram.focus(node.dataset.id);
  });

  svg.addEventListener('click', (event) => {
    const edge = getEventTarget(event.target, svg, '.edgePath > path');
    if (!edge) {
      return;
    }

    event.stopPropagation();
    componentDiagram.clearHighlights(true);

    edge.parentNode.classList.add('highlight');
    d3.select(svg).selectAll('.edgePath.highlight').raise();

    componentDiagram.emit('edge', [
      edge.parentNode.dataset.from,
      edge.parentNode.dataset.to,
    ]);
  });
}

const COMPONENT_OPTIONS = {
  contextMenu(componentDiagram) {
    return [
      (item) =>
        item
          .text('Set as root')
          .selector('.nodes .node')
          .transform((e) => e.dataset.id)
          .on('execute', (id) => componentDiagram.makeRoot(id)),
      (item) =>
        item
          .text('Expand')
          .selector('g.node')
          .transform((e) => e.dataset.id)
          .condition((id) => componentDiagram.hasPackage(id))
          .on('execute', (id) => componentDiagram.expand(id)),
      (item) =>
        item
          .text('Collapse')
          .selector('g.node')
          .transform((e) => e.dataset.id)
          .condition((id) => !componentDiagram.hasPackage(id))
          .on('execute', (id) => componentDiagram.collapse(id)),
      (item) =>
        item
          .text('View source')
          .selector('g.node.class')
          .transform((e) => componentDiagram.sourceLocation(e.dataset.id))
          .on('execute', (repoUrl) => window.open(repoUrl)),
      (item) =>
        item.text('Reset view').on('execute', () => {
          componentDiagram.render(componentDiagram.initialModel);
        }),
    ];
  },
};

export default class ComponentDiagram extends EventSource {
  constructor(container, options = {}) {
    super();

    const componentDiagramOptions = deepmerge(COMPONENT_OPTIONS, options);

    this.container = new Container(container, componentDiagramOptions);
    this.container.containerController.setContextMenu(this);

    this.targetCount = DEFAULT_TARGET_COUNT;
    this.element = d3
      .select(this.container)
      .append('svg')
      .attr('class', 'appmap__component-diagram');

    this.on('postrender', () => {
      this.container.containerController.fitViewport(this.container);
    });

    this.container.containerController.element.addEventListener(
      'click',
      (event) => {
        if (!event.target.classList.contains('dropdown-item')) {
          this.clearHighlights();
        }

        if (this.container.containerController.contextMenu) {
          this.container.containerController.contextMenu.close();
        }
      },
    );

    this.container.containerController.element.addEventListener('move', () => {
      if (this.container.containerController.contextMenu) {
        this.container.containerController.contextMenu.close();
      }
    });

    this.container.containerController.element.addEventListener(
      'dblclick',
      () => {
        this.clearFocus();
      },
    );
  }

  render(data) {
    if (!data || typeof data !== 'object') {
      return;
    }

    if (!this.initialModel) {
      this.initialModel = { ...data };
    }

    this.currentDiagramModel = hashify(data);

    this.graph = new Graph(this.element.node(), {
      animation: {
        duration: 600,
      },
    });

    const { nodes, edges } = mixedDiagram(
      this.currentDiagramModel,
      this.targetCount,
    );
    nodes.forEach((node) => {
      this.graph.setNode(node);
    });
    edges.forEach(([start, end]) => this.graph.setEdge(start, end));

    this.graph.render();

    bindEvents(this);

    // expand nodes with 1 child
    Object.entries(this.currentDiagramModel.package_classes).forEach(
      ([nodeId, children]) => {
        const nodeChildren = new Set(children);
        if (nodeChildren.size === 1) {
          this.expand(nodeId, false);
        }
      },
    );

    this.emit('postrender');
  }

  clearHighlights(noEvent = false) {
    this.graph.clearHighlights();

    if (!noEvent) {
      this.emit('highlight', null);
    }
  }

  highlight(nodes) {
    this.clearHighlights(true);

    let nodesIds = [];

    if (Array.isArray(nodes)) {
      nodesIds = nodes;
    } else if (typeof nodes === 'string') {
      nodesIds = [nodes];
    }

    let wasHighlighted = false;

    nodesIds.forEach((id) => {
      if (!this.graph.highlightNode(id)) {
        return;
      }

      wasHighlighted = true;
    });

    if (wasHighlighted) {
      this.scrollTo(nodes);
      this.emit('highlight', nodesIds);
    } else {
      this.emit('highlight', null);
    }

    return wasHighlighted;
  }

  clearFocus() {
    this.graph.clearFocus();

    this.emit('focus', null);
  }

  focus(id) {
    this.graph.clearFocus();
    this.graph.focus(id);

    this.scrollTo(id);

    this.emit('focus', id);
  }

  scrollTo(nodes) {
    let nodesIds = [];

    if (Array.isArray(nodes)) {
      nodesIds = nodes;
    } else if (typeof nodes === 'string') {
      nodesIds = [nodes];
    }

    const { containerController } = this.container;

    const scrollOptions = this.graph.scrollToNodes(
      containerController.element,
      nodesIds,
    );

    if (scrollOptions) {
      containerController.scaleTo(scrollOptions.scale);

      setTimeout(() => {
        containerController.translateTo(scrollOptions.x, scrollOptions.y);
      }, 200);

      this.emit('scrollTo', nodesIds);
    }
  }

  expand(nodeId, scrollToSubclasses = true) {
    const subclasses = Array.from(
      new Set(this.currentDiagramModel.package_classes[nodeId]),
    );
    if (subclasses.length === 0 || subclasses[0] === nodeId) {
      return;
    }

    const clusterId = `${nodeId}-cluster`;
    const clusterNode = {
      id: clusterId,
      type: 'cluster',
      children: subclasses.length,
    };

    this.graph.setNode(clusterNode);

    subclasses.forEach((cls) => {
      this.graph.setNode({ id: cls, type: 'class' }, clusterId);

      const model = this.currentDiagramModel;
      activeNodes(this.graph.graph, model, model.class_calls[cls], (id) => {
        if (cls !== id) {
          this.graph.setEdge(cls, id);
        }
      });

      activeNodes(this.graph.graph, model, model.class_callers[cls], (id) => {
        if (cls !== id) {
          this.graph.setEdge(id, cls);
        }
      });
    });

    this.graph.expand(nodeId, clusterId);

    if (scrollToSubclasses) {
      this.scrollTo(subclasses);
    }

    this.emit('expand', nodeId);
  }

  collapse(nodeId, scrollToPackage = true) {
    const pkg = this.currentDiagramModel.class_package[nodeId];
    if (!pkg) {
      return;
    }

    const pkgClasses = this.currentDiagramModel.package_classes[pkg];
    if (!pkgClasses) {
      return;
    }

    this.graph.removeNode(`${pkg}-cluster`);

    const obj = { id: pkg, type: 'package' };
    setChildrenCount(obj, this.currentDiagramModel);
    this.graph.setNode(obj);

    pkgClasses.forEach((id) => {
      this.graph.removeNode(id);

      const model = this.currentDiagramModel;
      activeNodes(this.graph.graph, model, model.class_calls[id], (cls) => {
        if (cls !== pkg) {
          this.graph.setEdge(pkg, cls);
        }
      });

      activeNodes(this.graph.graph, model, model.class_callers[id], (cls) => {
        if (cls !== pkg) {
          this.graph.setEdge(cls, pkg);
        }
      });
    });

    this.graph.collapse();

    if (scrollToPackage) {
      this.scrollTo(pkg);
    }

    this.emit('collapse', pkg);
  }

  makeRoot(nodeId) {
    this.graph.makeRoot(nodeId);
    this.scrollTo(nodeId);
  }

  sourceLocation(nodeId) {
    const path = this.currentDiagramModel.class_locations[nodeId];
    if (!path) {
      return null;
    }

    const { url, commit } = this.currentDiagramModel.source_control;
    return getRepositoryUrl(url, path, commit);
  }

  hasPackage(packageId) {
    return this.currentDiagramModel.packages.has(packageId);
  }
}
