import Rect from '../shapes/rect';
import { getAnimationStep, createSVGElement } from '../util';

function setElementPosition(nodeGroup, x, y) {
  /* eslint-disable no-param-reassign */
  nodeGroup.element.setAttribute('transform', `translate(${x},${y})`);
  nodeGroup.position = { x, y };
  /* eslint-enable no-param-reassign */
}

export default class ClusterGroup {
  constructor(node) {
    const classes = ['cluster'];
    if (node.children > 1) {
      classes.push(`cluster--${node.class}`, 'cluster--bordered');
    }

    this.element = createSVGElement('g', classes.join(' '));
    this.element.dataset.id = node.id;

    setElementPosition(this, node.x, node.y);

    this.element.appendChild(Rect(node.width, node.height));
  }

  move(x, y) {
    if (this.animationOptions && this.animationOptions.enable) {
      const initialX = this.position.x;
      const initialY = this.position.y;
      const start = +new Date();
      const { duration } = this.animationOptions;

      const tick = () => {
        const now = +new Date();
        const percent = (now - start) / duration;

        const newX = getAnimationStep(initialX, x, percent);
        const newY = getAnimationStep(initialY, y, percent);

        setElementPosition(this, newX, newY);

        if (percent < 1) {
          window.requestAnimationFrame(tick);
        } else {
          setElementPosition(this, x, y);
        }
      };
      tick();
    } else {
      setElementPosition(this, x, y);
    }
  }

  resize(width, height) {
    const rect = this.element.querySelector('rect');
    rect.setAttribute('x', -(width / 2));
    rect.setAttribute('y', -(height / 2));
    rect.setAttribute('width', width);
    rect.setAttribute('height', height);
  }

  remove() {
    const { element } = this;
    element.parentNode.removeChild(element);
  }
}
