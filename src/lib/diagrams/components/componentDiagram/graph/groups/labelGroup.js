import { createSVGElement } from '../util';

export default class LabelGroup {
  constructor(label, isHidden = false) {
    this.element = createSVGElement('g', 'label');

    if (isHidden) {
      this.element.setAttribute('opacity', 0);
    }

    const text = createSVGElement('text');
    const tspan = createSVGElement('tspan');
    tspan.setAttribute('space', 'preserve');
    tspan.setAttribute('dy', '1em');
    tspan.setAttribute('x', '1');
    tspan.textContent = label;
    text.appendChild(tspan);
    this.element.appendChild(text);
  }

  getBBox() {
    return this.element.getBBox();
  }
}
