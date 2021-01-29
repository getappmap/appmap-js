import * as d3 from 'd3';
import { flamegraph } from 'd3-flame-graph';
import deepmerge from 'deepmerge';
import { getLabel, fullyQualifiedFunctionName } from '../../util';
import { EventSource } from '../../../models';
import Container from '../../helpers/container';

// really just a magic number
const FONT_SIZE = 9;
const has = Object.prototype.hasOwnProperty;

function positionFromTransform(e) {
  const transformMatrix = e.node().transform.baseVal.getItem(0).matrix;
  return { x: transformMatrix.e, y: transformMatrix.f };
}

function buildName(d) {
  const { input } = d;

  const label = getLabel(input);
  if (label) {
    return label;
  }

  if (d.isRoot()) {
    return 'Main.main';
  }

  const classTokens = (input.defined_class || '<unknown>')
    .split(/_|\/|\$|\(.*\)/)
    .filter((x) => x);

  const event = {
    defined_class: classTokens.pop(),
    method_id: input.method_id,
    static: input.static,
  };

  return fullyQualifiedFunctionName(event);
}

function getPoints(viewSelector, node) {
  const transformMatrix = node.node().transform.baseVal.getItem(0).matrix;
  const width = node.attr('width');
  const height = node.attr('height');
  const nodeX = transformMatrix.e;
  const nodeY = transformMatrix.f;
  const { clientWidth, clientHeight } = viewSelector.node();
  const { data } = node.data()[0];

  let xOffset = data.value * FONT_SIZE * 0.5;
  if (xOffset * 2 > clientWidth) {
    xOffset = data.label.length * FONT_SIZE * 0.5;
  }

  const x = nodeX + xOffset - clientWidth * 0.5;
  const y = nodeY - clientHeight * 0.5;
  const labelLength = data.label.length;

  return {
    node: {
      top: nodeY,
      left: nodeX,
      right: nodeX + width,
      bottom: nodeY + height,
      center: { x, y },
    },
    label: {
      top: nodeY,
      left: nodeX,
      right: nodeX + labelLength * FONT_SIZE,
      bottom: nodeY + FONT_SIZE,
      center: {
        x: nodeX + labelLength * FONT_SIZE * 0.5,
        y: nodeY + FONT_SIZE * 0.5,
      },
    },
  };
}

const COMPONENT_OPTIONS = {
  zoom: false,
};

export default class Timeline extends EventSource {
  constructor(container, options = {}) {
    super();

    const timelineOptions = deepmerge(COMPONENT_OPTIONS, options);

    this.container = new Container(container, timelineOptions);

    this.container.style.display = 'block';

    this.timelineGroup = d3
      .select(this.container)
      .append('div')
      .classed('appmap__timeline', true);

    this.timelineSelection = this.timelineGroup
      .append('svg')
      .classed('appmap__timiline-graph', true);
  }

  setCallTree(callTree) {
    this.callTree = callTree;

    this.callTree.on('selectedEvent', (event) => {
      this.highlight(event, this.callTree.rootEvent);
    });

    this.callTree.on('rootEvent', () => {
      this.render();
    });
  }

  render() {
    const { rootEvent } = this.callTree;

    rootEvent.postOrderForEach((d) => {
      /* eslint-disable no-param-reassign */
      d.label = buildName(d);
      d.value = d.label.length;
      d.valueChildren = d.children.reduce((total, child) => {
        const valueChildren = child.valueChildren || 0;
        if (child.value > valueChildren) {
          return total + child.value;
        }
        return total + valueChildren;
      }, 0);
      /* eslint-enable no-param-reassign */
    });

    // grow children to fit their parents
    rootEvent.preOrderForEach((d) => {
      /* eslint-disable no-param-reassign */
      d.value = Math.max(d.value, d.valueChildren);

      const parent = d.caller;
      if (d !== rootEvent && parent && parent.value > parent.valueChildren) {
        d.value *= parent.value / parent.valueChildren;
      }
      /* eslint-enable no-param-reassign */
    });

    const display = flamegraph()
      .width(rootEvent.value * FONT_SIZE)
      .cellHeight(22)
      .minFrameSize(3)
      .tooltip(false)
      .getName((d) => d.data.label)
      .setColorMapper((d) => {
        if (d.highlight) {
          return '#4175ea';
        }

        if (has.call(d.data.input, 'http_server_request')) {
          return '#471553'; // 'rgba(63, 89, 193, 1)';
        }

        if (has.call(d.data.input, 'sql_query')) {
          return 'rgba(17, 61, 128, 1)'; // sql data
        }

        return 'rgb(59, 72, 107)'; // static & non-static data
      });

    this.timelineSelection.html('');
    this.timelineSelection.datum(rootEvent).call(display);

    this.timelineSelection
      .attr('height', display.height())
      .attr('width', display.width());

    this.timelineSelection.selectAll('.frame').on('click', (d) => {
      this.callTree.selectedEvent = d.data;
    });

    return this;
  }

  select(event) {
    const events = this.timelineSelection.selectAll('g.frame');

    events.selectAll('rect').style('opacity', '0.4');

    events.selectAll('div.d3-flame-graph-label').style('color', '#404040');

    const selectedIds = events
      .filter((d) => d.data === event)
      .datum()
      .descendants()
      .map((child) => child.data.id);

    const selectedEvents = events.filter((d) =>
      selectedIds.includes(d.data.id)
    );

    selectedEvents.selectAll('rect').style('opacity', null);

    selectedEvents.selectAll('div.d3-flame-graph-label').style('color', null);
  }

  highlight(event, rootEvent, smoothScroll = true) {
    this.timelineSelection.select('polyline').remove();

    if (this.highlighted) {
      this.highlighted.remove();
    }

    if (!event) {
      return;
    }

    let callStack = [event, ...event.ancestors()].reverse();
    const rootIndex = callStack.indexOf(rootEvent);
    callStack = callStack.slice(rootIndex);

    const line = this.timelineSelection
      .append('polyline')
      .classed('highlight', true);

    // Aggregate vertices by separating lines on the left and right of a particular event.
    // The first vertex is the bottom left of the root node and winds clockwise to the
    // bottom right of the same root node.
    const left = [];
    const right = [];
    callStack.forEach((e) => {
      const element = this.timelineSelection
        .selectAll('g.frame')
        .filter((d) => d && d.data === e);
      const { x, y } = positionFromTransform(element);
      const width = Number(element.attr('width'));
      const height = Number(element.attr('height'));

      left.push(x, y + height, x, y);

      right.unshift(x + width, y, x + width, y + height);
    });

    line.attr('points', `${left.join(' ')} ${right.join(' ')}`);

    const currentElement = this.timelineSelection
      .selectAll('g')
      .filter((d) => d && d.data === event);

    // put a colored highlight on the selected event
    this.highlighted = currentElement
      .insert('rect', ':last-child')
      .attr('class', 'highlight')
      .attr('width', function width() {
        return d3.select(this.parentElement).attr('width');
      })
      .attr('height', function height() {
        return d3.select(this.parentElement).attr('height');
      });

    if (currentElement.node()) {
      const { node, label } = getPoints(this.timelineGroup, currentElement);
      const timelineElement = this.timelineGroup.node();
      const { scrollLeft, clientWidth } = timelineElement;
      const deadZoneSize = 0.1;
      const deadZoneLeft = scrollLeft + deadZoneSize;
      const deadZoneRight = scrollLeft + clientWidth - deadZoneSize;

      if (node.left < deadZoneLeft || label.right > deadZoneRight) {
        const scrollOptions = { left: node.center.x };
        if (smoothScroll) {
          scrollOptions.behavior = 'smooth';
        }
        timelineElement.scrollTo(scrollOptions);
      }
    }
  }

  nearestNeighbor(event, direction) {
    const node = this.timelineSelection
      .selectAll('g')
      .filter((d) => d && d.data && d.data.id === event.id)
      .datum();

    const neighbors = this.timelineSelection
      .selectAll('g')
      .filter(
        (d) =>
          d &&
          d.data &&
          d.depth === node.depth &&
          (direction < 0 ? node.x0 > d.x0 : node.x0 < d.x0)
      )
      .data();

    let neighbor;
    let bestDistance;
    neighbors.forEach((d) => {
      const distance = Math.abs(d.x0 - node.x0);
      if (!neighbor || (distance && distance < bestDistance)) {
        neighbor = d;
        bestDistance = distance;
      }
    });

    return neighbor ? neighbor.data : null;
  }
}
