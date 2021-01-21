import * as d3 from 'd3';

import { createSVGElement } from '../util';

const line = d3.line().curve(d3.curveBasis);

export default class Path {
  constructor(points) {
    this.element = createSVGElement('path');
    this.element.setAttribute('d', line(points));
  }

  setPoints(points) {
    this.element.setAttribute('d', line(points));
  }
}
