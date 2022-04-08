import { select } from 'd3-selection';
import deepmerge from 'deepmerge';

import { EventSource, CodeObjectType } from '@appland/models';
import { getEventTarget } from '../util';
import Container from '../helpers/container/index';
import Graph from './graph/index';

export const DEFAULT_TARGET_COUNT = 1;

function codeObjectFromElement(element, classMap) {
  const { id, type } = element.dataset;
  return classMap.codeObjects.find((obj) => obj.id === id && obj.type === type);
}

function bindEvents(componentDiagram, classMap) {
  const svg = componentDiagram.element.node();

  svg.addEventListener('click', (event) => {
    const expandIcon = getEventTarget(
      event.target,
      svg,
      'g.label .label__icon--expand'
    );
    if (!expandIcon) {
      return;
    }

    event.stopImmediatePropagation();

    const codeObject = codeObjectFromElement(
      expandIcon.closest('.node'),
      classMap
    );
    componentDiagram.expand(codeObject);
  });

  svg.addEventListener('click', (event) => {
    const collapseIcon = getEventTarget(
      event.target,
      svg,
      'g.label .label__icon--collapse'
    );
    if (!collapseIcon) {
      return;
    }

    event.stopImmediatePropagation();

    const codeObject = codeObjectFromElement(
      collapseIcon.closest('.cluster'),
      classMap
    );
    componentDiagram.collapse(codeObject);
  });

  svg.addEventListener('click', (event) => {
    const node = getEventTarget(event.target, svg, 'g.nodes g.node');
    if (!node) {
      return;
    }

    event.stopPropagation();
    const codeObject = codeObjectFromElement(node, classMap);
    componentDiagram.highlight(codeObject);
    componentDiagram.emit('click', codeObject);
  });

  svg.addEventListener('dblclick', (event) => {
    const node = getEventTarget(event.target, svg, 'g.nodes g.node');
    if (!node) {
      return;
    }

    event.stopPropagation();
    componentDiagram.focus(codeObjectFromElement(node, classMap));
  });

  svg.addEventListener('click', (event) => {
    const edge = getEventTarget(event.target, svg, '.edgePath > path');
    if (!edge) {
      return;
    }

    event.stopPropagation();
    componentDiagram.clearHighlights(true);

    edge.parentNode.classList.add('highlight');
    select(svg).selectAll('.edgePath.highlight').raise();

    const { to, from } = edge.parentElement.dataset;
    const { codeObjectTo, codeObjectFrom } = componentDiagram.graph.edge(
      from,
      to
    );

    componentDiagram.emit('edge', { to: codeObjectTo, from: codeObjectFrom });
  });

  svg.addEventListener('click', (event) => {
    const cluster = getEventTarget(event.target, svg, 'g.cluster');
    if (!cluster) {
      return;
    }

    event.stopPropagation();
    const codeObject = codeObjectFromElement(cluster, classMap);
    componentDiagram.highlight(codeObject);
    componentDiagram.emit('click', codeObject);
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
            (e) => componentDiagram.graph.node(e.dataset.id).codeObject
          )
          .on('execute', (id) => componentDiagram.emit('makeRoot', id)),
      (item) =>
        item
          .text('Expand')
          .selector('g.node')
          .transform(
            (e) => componentDiagram.graph.node(e.dataset.id).codeObject
          )
          .condition((obj) => expandableTypes.includes(obj.type))
          .on('execute', (id) => componentDiagram.expand(id)),
      (item) =>
        item
          .text('Collapse')
          .selector('g.node')
          .transform(
            (e) => componentDiagram.graph.node(e.dataset.id).codeObject
          )
          .condition(
            (obj) =>
              !expandableTypes.includes(obj.type) &&
              obj.type !== CodeObjectType.DATABASE
          )
          .on('execute', (id) => componentDiagram.collapse(id)),
      (item) =>
        item
          .text('Collapse')
          .selector('g.cluster')
          .transform(
            (e) => componentDiagram.graph.node(e.dataset.id).codeObject
          )
          .on('execute', (obj) => componentDiagram.collapse(obj)),
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
        }))
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
        }))
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
    this.container.setContextMenu(this);

    this.targetCount = DEFAULT_TARGET_COUNT;
    this.element = select(this.container.contentElement)
      .append('svg')
      .attr('class', 'appmap__component-diagram');

    this.on('postrender', () => {
      this.container.fitViewport(this.container.contentElement);
    });

    this.container.element.addEventListener('click', (event) => {
      if (!event.target.classList.contains('dropdown-item')) {
        this.emit('click', null);
        this.clearHighlights();
      }

      if (this.container.contextMenu) {
        this.container.contextMenu.close();
      }
    });

    this.container.element.addEventListener('move', () => {
      if (this.container.contextMenu) {
        this.container.contextMenu.close();
      }
    });

    this.container.element.addEventListener('dblclick', () => {
      this.clearFocus();
    });
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

    const codeObjects = classMap.roots
      .map((root) => root.leafs())
      .flat()
      .reduce((objects, obj) => {
        const children = obj.childLeafs();

        if (
          children.length === 1 &&
          children[0].type !== CodeObjectType.QUERY &&
          children[0].type !== CodeObjectType.FUNCTION
        ) {
          // Make sure this object isn't empty
          const eventCount = obj.allEvents.length;
          if (eventCount > 0) {
            objects.push(children[0]);
          }
        } else {
          objects.push(obj);
        }

        return objects;
      }, []);
    const edges = outboundEdges(...codeObjects);

    codeObjects.forEach((codeObject) =>
      this.graph.setNodeFromCodeObject(codeObject)
    );
    edges.forEach((edge) => this.graph.setEdge(edge.from, edge.to));

    this.graph.render();
    bindEvents(this, classMap);
    this.emit('postrender');
  }

  clearHighlights(noEvent = false) {
    this.graph.clearHighlights();

    this.container.scaleTarget = false;

    if (!noEvent) {
      this.emit('highlight', null);
    }
  }

  highlight(...codeObjects) {
    this.clearHighlights(true);

    const highlightedCodeObjects = codeObjects
      .filter(Boolean)
      .map((obj) => this.graph.highlightNode(obj.id ?? obj.name))
      .filter(Boolean);

    if (highlightedCodeObjects.length) {
      this.scrollTo(highlightedCodeObjects);
    }

    const hlBox = this.graph.getNodesBox(
      highlightedCodeObjects.map((obj) => obj.id ?? obj.name)
    );
    this.container.scaleTarget = {
      x: hlBox.width / 2 + hlBox.offsetLeft,
      y: hlBox.height / 2 + hlBox.offsetTop,
    };

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
    const scrollOptions = this.graph.scrollToNodes(
      this.container.element,
      codeObjects.map((obj) => obj.id)
    );

    if (scrollOptions) {
      this.container.scaleTo(scrollOptions.scale);

      setTimeout(() => {
        this.container.translateTo(scrollOptions.x, scrollOptions.y);
      }, 200);

      this.emit('scrollTo', codeObjects);
    }
  }

  expand(codeObject, scrollToSubclasses = true) {
    const nodeWasHighlighted = this.isHighlighted(codeObject);
    const children = codeObject.children.map((child) => child.leafs()).flat();

    this.graph.expand(codeObject, children);
    allEdges(...children).forEach(({ from, to }) =>
      this.graph.setEdge(from, to)
    );

    // HACK.
    // The child graph should really be doing this, but there's no way to add the edges before
    // rendering without bloating the API any further.
    this.graph.render();

    if (scrollToSubclasses) {
      this.scrollTo(children);
    }

    if (nodeWasHighlighted) {
      this.graph.highlightNode(codeObject.id);
    }

    this.emit('expand', codeObject);
  }

  collapse(codeObject, scrollToPackage = true) {
    const codeObjectPackage =
      codeObject.packageObject || codeObject.parent || codeObject;
    const nodeWasHighlighted = this.isHighlighted(codeObjectPackage);
    const { id } = codeObjectPackage;

    this.graph.removeNode(id);

    codeObjectPackage
      .childLeafs()
      .forEach((child) => this.graph.removeNode(child.id));

    this.graph.setNodeFromCodeObject(codeObjectPackage);

    allEdges(codeObjectPackage).forEach(({ to, from }) =>
      this.graph.setEdge(from, to)
    );

    this.graph.collapse();

    if (scrollToPackage) {
      this.scrollTo(codeObjectPackage);
    }

    if (nodeWasHighlighted) {
      this.graph.highlightNode(id);
    }

    this.emit('collapse', codeObjectPackage);
  }

  hasPackage(packageId) {
    return this.currentDiagramModel.packages.has(packageId);
  }

  hasObject(codeObject) {
    return Boolean(this.graph.node(codeObject.id));
  }

  isHighlighted(codeObject) {
    const { id } = codeObject;
    const element = this.element.node().querySelector(`[data-id="${id}"]`);
    return element && element.classList.contains('highlight');
  }
}
