import {
  generateHash,
  createSVGElement,
  transformPoints,
  normalizePoints,
  getAnimationStep,
} from '../util';

import Path from '../shapes/path';
import Marker from '../shapes/marker';

function setPathPoints(edgeGroup, points) {
  /* eslint-disable no-param-reassign */
  edgeGroup.points = points;
  edgeGroup.path.setPoints(points);
  /* eslint-enable no-param-reassign */
}

export default class EdgeGroup {
  constructor(points, animationOptions = {}) {
    this.animationOptions = animationOptions;
    this.points = transformPoints(points);

    this.element = createSVGElement('g', 'edgePath');
    this.element.setAttribute('opacity', 0);
    this.path = new Path(this.points);

    const defs = createSVGElement('defs');
    const marker = Marker();

    const arrowId = `arrowhead${generateHash()}`;
    marker.setAttribute('id', arrowId);
    this.path.element.setAttribute('marker-end', `url(#${arrowId})`);

    defs.appendChild(marker);

    this.element.appendChild(this.path.element);
    this.element.appendChild(defs);
  }

  show() {
    if (this.animationOptions && this.animationOptions.enable) {
      const start = +new Date();
      const { duration } = this.animationOptions;

      const tick = () => {
        const now = +new Date();
        const percent = (now - start) / duration;

        this.element.setAttribute('opacity', percent);

        if (percent < 1) {
          window.requestAnimationFrame(tick);
        } else {
          this.element.setAttribute('opacity', 1);
        }
      };
      tick();
    } else {
      this.element.setAttribute('opacity', 1);
    }
  }

  move(points) {
    if (this.animationOptions && this.animationOptions.enable) {
      const startPoints = Array.from(this.points);
      const endPoints = transformPoints(points);
      normalizePoints(startPoints, endPoints);

      const start = +new Date();
      const { duration } = this.animationOptions;

      const tick = () => {
        const now = +new Date();
        const percent = (now - start) / duration;

        const currentPoints = [];

        startPoints.forEach((item, index) => {
          currentPoints.push([
            getAnimationStep(item[0], endPoints[index][0], percent),
            getAnimationStep(item[1], endPoints[index][1], percent),
          ]);
        });

        setPathPoints(this, currentPoints);

        if (percent < 1) {
          window.requestAnimationFrame(tick);
        } else {
          setPathPoints(this, endPoints);
        }
      };
      tick();
    } else {
      setPathPoints(this, points);
    }
  }

  remove() {
    const { element } = this;
    element.parentNode.removeChild(element);
  }
}
