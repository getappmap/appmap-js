import * as d3 from 'd3';
import sqlFormatter from 'sql-formatter';
import {
  hasProp,
  tokenizeIdentifier,
  capitalizeString,
  lazyPanToElement,
  panToNode,
} from '../../util';

import { EventSource } from '../../../models';
import Container from '../../helpers/container';

const NodeType = {
  Event: 'event',
  Sql: 'sql',
  Static: 'static',
  Nonstatic: 'non-static',
};

const formatIdentifier = (id) =>
  tokenizeIdentifier(id)
    .map((t) => capitalizeString(t))
    .join(' ');
const formatParameter = (id) => formatIdentifier(id.match(/[^.|:]+$/)[0] || id);

function resolveType(strType) {
  // If you're adding any additional types to this, please consider migrating
  // this to a map lookup

  switch (strType) {
    case 'boolean':
    case 'TrueClass':
    case 'FalseClass':
    case 'java.lang.Boolean':
      return 'bool';

    case 'status':
    case 'byte':
    case 'short':
    case 'int':
    case 'long':
    case 'Number':
    case 'Integer':
    case 'java.lang.Byte':
    case 'java.lang.Short':
    case 'java.lang.Integer':
    case 'java.lang.Long':
      return 'int';

    case 'float':
    case 'double':
    case 'BigDecimal':
    case 'Float':
    case 'java.lang.Float':
    case 'java.lang.Double':
      return 'float';

    case 'mime_type':
    case 'char':
    case 'String':
    case 'java.lang.Char':
    case 'java.lang.String':
      return 'string';

    default:
      return 'object';
  }
}

function getNodeType(e) {
  if (hasProp(e.input, 'http_server_request')) {
    return NodeType.Event;
  }

  if (hasProp(e.input, 'sql_query')) {
    return NodeType.Sql;
  }

  return e.input.static ? NodeType.Static : NodeType.Nonstatic;
}

function buildCurveCommands(x1, y1, x2, y2) {
  const [x, y] = [x1 - x2, y1 - y2];
  const pathLength = Math.sqrt(x * x + y * y);
  const curveLength = Math.min(pathLength * 0.5, Math.abs(x));

  return `M${x1},${y1} C${x1 + curveLength},${y1} ${
    x2 - curveLength
  },${y2}, ${x2},${y2}`;
}

function getNodeElementPosition(nodeId, selector) {
  const node = document.getElementById(`traceNode${nodeId}`);
  const elem = node ? node.querySelector(`${selector}`) : null;

  if (!elem) return null;

  return {
    left: elem.offsetLeft,
    right: elem.offsetLeft + elem.offsetWidth,
    x: elem.offsetLeft + elem.offsetWidth / 2,
    y: elem.offsetTop + elem.offsetHeight / 2,
  };
}

function getConnectionPosition(nodeId, type) {
  return getNodeElementPosition(
    nodeId,
    `.connector[data-connection-type="${type}"]`,
  );
}

function getPortPosition(nodeId, portId) {
  return getNodeElementPosition(nodeId, `.item[data-port-id="${portId}"]`);
}

function recordScopedObjects(scopeMap, node) {
  /* eslint-disable no-param-reassign */
  if (!node || !node.behavior) {
    return;
  }

  const outputs = node.behavior.out;
  outputs.forEach((o) => {
    if (!o.value || !o.value.object_id) {
      return;
    }

    const objectId = o.value.object_id;
    if (scopeMap[objectId]) {
      // do not overwrite existing values
      return;
    }

    scopeMap[objectId] = {
      nodeId: node.behavior.id,
      outputId: objectId,
    };
  });
  /* eslint-enable no-param-reassign */
}

function eventToBehavior(e) {
  const { input, displayName } = e;

  const behavior = {
    id: input.id,
    event_id: input.id,
    type: getNodeType(e),
    name: displayName,
    in: [],
    out: [],
    exceptions: [],
    x: 0,
    y: 0,
  };

  // Backward cyclic references shall not be enumerable
  Object.defineProperty(behavior, 'data', {
    enumerable: false,
    writable: true,
  });

  behavior.data = e;

  // add a reverse lookup as well
  e.behavior = behavior;

  if (behavior.type === NodeType.Sql) {
    behavior.value = sqlFormatter.format(e.input.sql_query.sql);
  }

  if (behavior.type === NodeType.Nonstatic) {
    // display 'self' as an input
    behavior.in.push({
      name: formatParameter(input.defined_class),
      type: resolveType(input.defined_class),
      value: input.receiver,
    });
  }

  if (input.parameters) {
    input.parameters.forEach((p) => {
      behavior.in.push({
        name: formatIdentifier(p.name),
        type: resolveType(p.class),
        value: p,
      });
    });
  }

  const returnValue = e.output.return_value;
  if (returnValue && returnValue.value) {
    const type = resolveType(returnValue.class);
    let id = type;
    if (type === 'object') {
      id = returnValue.class;
    }

    behavior.out.push({
      name: formatParameter(id),
      type,
      value: returnValue,
    });
  }

  const { exceptions } = e.output;
  if (exceptions) {
    behavior.exceptions = exceptions;
  }

  if (input.message) {
    input.message.forEach((msg) => {
      behavior.in.push({
        name: formatIdentifier(msg.name),
        type: resolveType(msg.class),
        value: msg,
      });
    });

    const output = e.output.http_server_response || {};
    Object.keys(output).forEach((key) => {
      behavior.out.push({
        name: formatIdentifier(key),
        type: resolveType(key),
        value: {
          value: output[key],
        },
      });
    });
  }

  return behavior;
}

function getScopedObjects(behaviorNode) {
  // objects in scope for this node include:
  // - the immediate parent
  // - the immediate parent's siblings with a lower index in the grandparent's children array
  // - all ancestors
  const objectsInScope = {};

  const parent = behaviorNode.data.caller;
  if (!parent) {
    return objectsInScope;
  }
  recordScopedObjects(objectsInScope, parent);

  const grandParent = parent.caller;
  if (!grandParent) {
    return objectsInScope;
  }

  if (!grandParent.caller) {
    // do not continue to traverse a root node, these siblings _are not_ in scope
    return objectsInScope;
  }

  const parentIndex = grandParent.children.findIndex((e) => e === parent);
  if (parentIndex > 0) {
    // iterate in reverse order (right to left) in order to guarantee the most recent output
    // is used in case of an object id collision. i.e., if two methods return the same object,
    // we want our 'scoped object' to reflect the latest output.
    for (let i = parentIndex - 1; i >= 0; i -= 1) {
      const parentSibling = grandParent.children[i];
      recordScopedObjects(objectsInScope, parentSibling);
    }
  }

  const ancestors = parent.ancestors();
  ancestors.forEach((ancestor) =>
    recordScopedObjects(objectsInScope, ancestor),
  );

  return objectsInScope;
}

function transformEvents(rootEvent) {
  const eventBehaviors = [];
  const nodeConnections = [];
  const portConnections = [];

  // transform raw events to behavior nodes
  rootEvent.preOrderForEach((e) => {
    if (!e.input.id) {
      return;
    }

    const behavior = eventToBehavior(e);
    eventBehaviors.push(behavior);
  });

  // link nodes
  eventBehaviors.forEach((behavior) => {
    const objectsInScope = getScopedObjects(behavior);
    behavior.in.forEach((i) => {
      if (!i.value || !i.value.object_id) {
        return;
      }

      const objectId = i.value.object_id;
      const outputInfo = objectsInScope[objectId];
      if (!outputInfo) {
        return;
      }

      portConnections.push({
        type: i.type,
        input: {
          nodeId: behavior.id,
          portId: objectId,
        },
        output: {
          nodeId: outputInfo.nodeId,
          portId: outputInfo.outputId,
        },
      });
    });

    const { caller } = behavior.data;
    if (!caller || !caller.behavior) {
      return;
    }

    nodeConnections.push({
      source: caller.behavior.id,
      target: behavior.id,
    });
  });

  return [nodeConnections, portConnections];
}

function displayValue(flowView, port, data, placement) {
  flowView.valuePopper
    .text(data && data.value ? data.value : 'null')
    .attr('data-show', '')
    .attr('data-placement', placement)
    .append('div')
    .attr('id', 'arrow');

  const popperElement = flowView.valuePopper.node();
  const { offsetWidth, offsetHeight } = popperElement;
  let x = 0;
  if (placement === 'left') {
    x = port.offsetLeft - offsetWidth;
  } else {
    // right
    x = port.offsetLeft + port.offsetWidth;
  }

  const y = port.offsetTop + (port.offsetHeight - offsetHeight) * 0.5;

  flowView.valuePopper.style('transform', `translate3d(${x}px, ${y}px, 0px)`);
  flowView.emit('popper', popperElement);
}

export default class FlowView extends EventSource {
  constructor(container, options = {}) {
    super();

    this.container = new Container(container, options);

    this.element = document.createElement('div');
    this.element.className = 'appmap__flow-view';
    this.container.appendChild(this.element);

    this.svg = d3
      .select(this.element)
      .append('svg')
      .attr('width', window.innerWidth)
      .attr('height', window.innerHeight);

    this.nodeGroup = d3.select(this.element).append('ul').attr('id', 'nodes');

    this.linkGroup = this.svg.append('g').attr('id', 'links');

    this.valuePopper = d3
      .select(this.element)
      .append('div')
      .attr('class', 'appmap__flow-view-popper');

    document.addEventListener('click', () => this.hidePopper());

    this.on('popper', (element) =>
      lazyPanToElement(this.container.containerController, element, 10),
    );
  }

  setCallTree(callTree) {
    this.callTree = callTree;

    this.callTree.on('selectedEvent', (event) => {
      panToNode(this.container.containerController, event.element);
      this.highlight(event ? event.id : null);
    });

    this.callTree.on('rootEvent', () => {
      this.render();
    });
  }

  render() {
    const { rootEvent } = this.callTree;
    const [nodeConnections, portConnections] = transformEvents(rootEvent);

    // Maps for forward and reverse lookups of node links
    const outboundConnections = nodeConnections.reduce((map, link) => {
      /* eslint-disable no-param-reassign */
      map[link.source] = link.target;
      return map;
      /* eslint-enable no-param-reassign */
    }, {});

    const inboundConnections = nodeConnections.reduce((map, link) => {
      /* eslint-disable no-param-reassign */
      map[link.target] = link.source;
      return map;
      /* eslint-enable no-param-reassign */
    }, {});

    const mapNode = (layer) => {
      const node = layer
        .filter((d) => d.data.behavior)
        .append('div')
        .datum((d) => d.data.behavior)
        .classed('node', true)
        .classed('exception', (d) => d.exceptions.length > 0)
        .attr('id', (d) => `traceNode${d.id}`)
        .attr('data-event-id', (d) => d.event_id)
        .on('dblclick', (d) => this.emit('dblclick', d.data))
        .on('click', (d) => {
          this.callTree.selectedEvent = d.data;
        })
        .on('contextmenu', (d) => {
          this.callTree.selectedEvent = d.data;
        });

      const header = node
        .append('div')
        .attr('data-type', (d) => d.type)
        .classed('header', true)
        .attr('draggable', true);

      header
        .append('p')
        .html((e) => e.name)
        .attr('draggable', true);

      const ioTable = node.append('div').classed('io', true);

      const inputs = ioTable.append('div').classed('column left', true);

      inputs
        .append('div')
        .attr('data-connection-type', 'input')
        .classed('connector', true)
        .classed('in-use', (d) => hasProp(inboundConnections, d.id));

      inputs
        .selectAll(null)
        .data((d) => d.in.map((x) => ({ ...x, id: d.id })))
        .enter()
        .append('div')
        .classed('item', true)
        .classed('has-data', (d) => d && d.value && d.value.value)
        .attr('data-type', (d) => d.type)
        .attr('data-port-type', 'input')
        .attr('data-port-id', (d) => d && d.value && d.value.object_id)
        .text((d) => d.name)
        .on('click', (d, i, elements) => {
          this.callTree.selectedEvent = rootEvent.find((e) => e.id === d.id);
          displayValue(this, elements[i], d.value, 'left');
          d3.event.stopPropagation();
        });

      const outputs = ioTable.append('div').classed('column right', true);

      outputs
        .append('div')
        .attr('data-connection-type', 'output')
        .classed('connector', true)
        .classed('in-use', (d) => hasProp(outboundConnections, d.id));

      outputs
        .selectAll(null)
        .data((d) => d.out.map((x) => ({ ...x, id: d.id })))
        .enter()
        .append('div')
        .classed('item', true)
        .classed('has-data', (d) => d && d.value && d.value.value)
        .attr('data-type', (d) => d.type)
        .attr('data-port-type', 'output')
        .attr('data-port-id', (d) => d && d.value && d.value.object_id)
        .text((d) => d.name)
        .on('click', (d, i, elements) => {
          this.callTree.selectedEvent = rootEvent.find((e) => e.id === d.id);
          displayValue(this, elements[i], d.value, 'right');
          d3.event.stopPropagation();
        });

      node
        .filter((d) => d.type === 'sql')
        .append('div')
        .classed('sql', true)
        .text((d) => d.value);
    };

    function bind(nodes) {
      if (nodes.empty()) return;

      nodes
        .append('li')
        .call(mapNode)
        .append('ul')
        .selectAll(':scope > li')
        .data(
          (d) => d.children || [],
          (d) => d.data.behavior.id,
        )
        .join(bind);
    }

    // Clear contents first.
    // Changing root (even within the same tree)
    // would require rebuilding the tree anyway
    // (or convoluted grafting), and the connectors have
    // to be moved too.
    this.nodeGroup.text(null);
    this.linkGroup.text(null);

    this.nodeGroup.datum(d3.hierarchy(rootEvent)).call(bind);
    this.nodeGroup.selectAll('.node').each((behavior, i, elements) => {
      /* eslint-disable no-param-reassign */
      behavior.data.element = elements[i];
      /* eslint-enable no-param-reassign */
    });

    let linkGroupBody = '';

    nodeConnections.forEach((conn) => {
      const output = getConnectionPosition(conn.source, 'output');
      const input = getConnectionPosition(conn.target, 'input');

      if (!(output && input)) {
        return;
      }

      linkGroupBody += `<path class="connection node-connection" d="${buildCurveCommands(
        output.right,
        output.y,
        input.left,
        input.y,
      )}"/>`;
    });

    portConnections.forEach((conn) => {
      const output = getPortPosition(conn.output.nodeId, conn.output.portId);
      const input = getPortPosition(conn.input.nodeId, conn.input.portId);

      if (!(output && input)) {
        return;
      }

      const typeClass = `type-${conn.type}`;
      linkGroupBody += `<path class="connection port-connection type-${typeClass}" d="${buildCurveCommands(
        output.right,
        output.y,
        input.left,
        input.y,
      )}"/>`;
    });

    this.linkGroup.html(linkGroupBody);
  }

  highlight(eventId) {
    this.nodeGroup
      .selectAll('.node')
      .classed('highlight', false)
      .filter((d) => d.id === eventId)
      .classed('highlight', true);
  }

  hidePopper() {
    this.valuePopper.attr('data-show', null);
  }
}
