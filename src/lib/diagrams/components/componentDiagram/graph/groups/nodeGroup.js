import LabelGroup from './labelGroup';
import Cylinder from '../shapes/cylinder';
import Parallelogram from '../shapes/parallelogram';
import Rect from '../shapes/rect';
import { getAnimationStep, createSVGElement } from '../util';

function setElementPosition(nodeGroup, x, y) {
  /* eslint-disable no-param-reassign */
  nodeGroup.element.setAttribute('transform', `translate(${x},${y})`);
  nodeGroup.position = { x, y };
  /* eslint-enable no-param-reassign */
}

export default class NodeGroup {
  constructor(node, animationOptions = {}) {
    this.element = createSVGElement('g', `node ${node.class}`);
    this.element.dataset.id = node.id;
    this.element.dataset.type = node.codeObject.type;
    this.element.setAttribute('opacity', 0);

    setElementPosition(this, node.x, node.y);

    this.animationOptions = animationOptions;

    let shape;

    switch (node.shape) {
      case 'http':
        shape = Parallelogram(node.width, node.height);
        break;
      case 'database':
        shape = Cylinder(node.width, node.height);
        break;
      default:
        shape = Rect(node.width, node.height);
        break;
    }

    this.element.appendChild(shape);

    const labelGroup = new LabelGroup(node.label);
    labelGroup.element.setAttribute(
      'transform',
      `translate(-${node.labelWidth / 2},-${node.labelHeight / 2})`
    );
    this.element.appendChild(labelGroup.element);
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

  remove() {
    const { element } = this;
    element.parentNode.removeChild(element);
  }
}
