import { line, curveBasis } from 'd3-shape';
import { createSVGElement } from '../util';

const lineGenerator = line().curve(curveBasis);

export default class Path {
  constructor(points) {
    this.element = createSVGElement('path');
    this.element.setAttribute('d', lineGenerator(points));
  }

  setPoints(points) {
    this.element.setAttribute('d', lineGenerator(points));
  }
}
