import * as d3 from 'd3';
import deepmerge from 'deepmerge';

import { EventSource } from '@/lib/models';
import { CodeObjectType } from '@/lib/models/codeObject';
import { getEventTarget } from '@/lib/diagrams/util';
import Container from '@/lib/diagrams/helpers/container/index';
import Graph from './graph/index';

export const DEFAULT_TARGET_COUNT = 1;

function codeObjectFromNode(node, classMap) {
  const { id, type } = node.dataset;
  return classMap.codeObjects.find((obj) => obj.id === id && obj.type === type);
}

function bindEvents(componentDiagram, classMap) {
  const svg = componentDiagram.element.node();

  svg.addEventListener('click', (event) => {
    const node = getEventTarget(event.target, svg, 'g.nodes g.node');
    if (!node) {
      componentDiagram.emit('click', null);
      return;
    }

    event.stopPropagation();
    const codeObject = codeObjectFromNode(node, classMap);
    componentDiagram.highlight(codeObject);
    componentDiagram.emit('click', codeObject);
  });

  svg.addEventListener('dblclick', (event) => {
    const node = getEventTarget(event.target, svg, 'g.nodes g.node');
    if (!node) {
      return;
    }

    event.stopPropagation();
    componentDiagram.focus(codeObjectFromNode(node, classMap));
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

    const { to, from } = edge.parentElement.dataset;
    const { codeObjectTo, codeObjectFrom } = componentDiagram.graph.edge(
      from,
      to,
    );

    componentDiagram.emit('edge', { to: codeObjectTo, from: codeObjectFrom });
  });
}

const expandableTypes = [CodeObjectType.PACKAGE, CodeObjectType.HTTP];
const COMPONENT_OPTIONS = {
  contextMenu(componentDiagram) {
    return [
      (item) =>
        item
          .text('Set as root')
          .selector('.nodes .node')
          .transform(
            (e) => componentDiagram.graph.node(e.dataset.id).codeObject,
          )
          .on('execute', (id) => componentDiagram.makeRoot(id)),
      (item) =>
        item
          .text('Expand')
          .selector('g.node')
          .transform(
            (e) => componentDiagram.graph.node(e.dataset.id).codeObject,
          )
          .condition((obj) => expandableTypes.includes(obj.type))
          .on('execute', (id) => componentDiagram.expand(id)),
      (item) =>
        item
          .text('Collapse')
          .selector('g.node')
          .transform(
            (e) => componentDiagram.graph.node(e.dataset.id).codeObject,
          )
          .condition((obj) => !expandableTypes.includes(obj.type))
          .on('execute', (id) => componentDiagram.collapse(id)),
      (item) =>
        item
          .text('View source')
          .selector('g.node.class')
          .transform((e) => {
            const node = componentDiagram.graph.node(e.dataset.id);
            return node.codeObject.locations[0];
          })
          .on('execute', (location) =>
            componentDiagram.emit('viewSource', location),
          ),
      (item) =>
        item.text('Reset view').on('execute', () => {
          componentDiagram.render(componentDiagram.classMap);
        }),
    ];
  },
};

// These functions clearly need an API abstraction, I'm just not sure what that is yet. -DB
function inboundEdges(...codeObjects) {
  return codeObjects
    .map((obj) =>
      obj.inboundConnections
        .map((connection) => [connection, ...connection.ancestors()])
        .flat()
        .map((connection) => ({
          from: connection,
          to: obj,
        })),
    )
    .flat()
    .filter((edge) => edge.to !== edge.from);
}

function outboundEdges(...codeObjects) {
  return codeObjects
    .map((obj) =>
      obj.outboundConnections
        .map((connection) => [connection, ...connection.ancestors()])
        .flat()
        .map((connection) => ({
          from: obj,
          to: connection,
        })),
    )
    .flat()
    .filter((edge) => edge.to !== edge.from);
}

function allEdges(...codeObjects) {
  // Grab all the connections and build edges for every ancestor of that connection.
  return [...outboundEdges(...codeObjects), ...inboundEdges(...codeObjects)];
}

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

  render(classMap) {
    if (!classMap) {
      return;
    }

    this.classMap = classMap;
    this.graph = new Graph(this.element.node(), {
      animation: {
        duration: 600,
      },
    });

    const codeObjects = classMap.roots.reduce((objects, obj) => {
      const children = [
        ...obj.classes,
        ...obj.children.filter((child) => child.type === CodeObjectType.ROUTE),
      ];
      if (children.length === 1) {
        objects.push(children[0]);
      } else {
        objects.push(obj);
      }

      return objects;
    }, []);
    const edges = outboundEdges(...codeObjects);

    codeObjects.forEach((codeObject) =>
      this.graph.setNodeFromCodeObject(codeObject),
    );
    edges.forEach((edge) => this.graph.setEdge(edge.from, edge.to));

    this.graph.render();
    bindEvents(this, classMap);
    this.emit('postrender');
  }

  clearHighlights(noEvent = false) {
    this.graph.clearHighlights();

    if (!noEvent) {
      this.emit('highlight', null);
    }
  }

  highlight(...codeObjects) {
    this.clearHighlights(true);

    const highlightedCodeObjects = codeObjects
      .map((obj) => this.graph.highlightNode(obj.id))
      .filter(Boolean);

    if (highlightedCodeObjects.length) {
      this.scrollTo(highlightedCodeObjects);
    }

    this.emit('highlight', highlightedCodeObjects);

    return highlightedCodeObjects.length > 0;
  }

  clearFocus() {
    this.graph.clearFocus();

    this.emit('focus', null);
  }

  focus(codeObject) {
    this.graph.clearFocus();
    this.graph.focus(codeObject.id);

    this.scrollTo(codeObject);

    this.emit('focus', codeObject);
  }

  scrollTo(...codeObjects) {
    const { containerController } = this.container;

    const scrollOptions = this.graph.scrollToNodes(
      containerController.element,
      codeObjects.map((obj) => obj.id),
    );

    if (scrollOptions) {
      containerController.scaleTo(scrollOptions.scale);

      setTimeout(() => {
        containerController.translateTo(scrollOptions.x, scrollOptions.y);
      }, 200);

      this.emit('scrollTo', codeObjects);
    }
  }

  expand(codeObject, scrollToSubclasses = true) {
    const { id } = codeObject;
    const children = [
      ...codeObject.classes,
      ...codeObject.children.filter((obj) => obj.type === CodeObjectType.ROUTE),
    ];

    // TODO.
    // This cluster logic feels misplaced. Are we missing an abstraction in Graph?
    const clusterId = `${id}-cluster`;
    const clusterNode = {
      id: clusterId,
      type: 'cluster',
      label: id,
      children: children.length,
      class: codeObject.type,
    };

    this.graph.setNode(clusterNode);
    children.forEach((obj) => this.graph.setNodeFromCodeObject(obj, clusterId));

    allEdges(...children).forEach(({ from, to }) =>
      this.graph.setEdge(from, to),
    );

    this.graph.expand(id, clusterId);

    if (scrollToSubclasses) {
      this.scrollTo(children);
    }

    this.emit('expand', codeObject);
  }

  collapse(codeObject, scrollToPackage = true) {
    const codeObjectPackage = codeObject.packageObject || codeObject.parent;
    const { id } = codeObjectPackage;
    this.graph.removeNode(`${id}-cluster`);

    [
      ...codeObjectPackage.classes,
      ...codeObjectPackage.children.filter(
        (obj) => obj.type === CodeObjectType.ROUTE,
      ),
    ].forEach((child) => this.graph.removeNode(child.id));

    this.graph.setNodeFromCodeObject(codeObjectPackage);

    allEdges(codeObjectPackage).forEach(({ to, from }) =>
      this.graph.setEdge(from, to),
    );

    this.graph.collapse();

    if (scrollToPackage) {
      this.scrollTo(codeObjectPackage);
    }

    this.emit('collapse', codeObjectPackage);
  }

  makeRoot(codeObject) {
    this.graph.makeRoot(codeObject);
    this.scrollTo(codeObject);
  }

  hasPackage(packageId) {
    return this.currentDiagramModel.packages.has(packageId);
  }
}
