import { createSVGElement } from '../util';

const iconSize = 14;

function createSVGIcon(icon) {
  const svg = createSVGElement('svg', `label__icon label__icon--${icon}`);
  svg.setAttribute('viewBox', '0 0 512 512');
  svg.setAttribute('width', `${iconSize}px`);
  svg.setAttribute('height', `${iconSize}px`);

  const rect = createSVGElement('rect');
  rect.setAttribute('x', 0);
  rect.setAttribute('y', 0);
  rect.setAttribute('width', '100%');
  rect.setAttribute('height', '100%');
  rect.setAttribute('fill', 'transparent');
  svg.appendChild(rect);

  switch (icon) {
    case 'expand': {
      const path1 = createSVGElement('path');
      path1.setAttribute(
        'd',
        'm453.332031 512h-394.664062c-32.363281 0-58.667969-26.304688-58.667969-58.667969v-394.664062c0-32.363281 26.304688-58.667969 58.667969-58.667969h394.664062c32.363281 0 58.667969 26.304688 58.667969 58.667969v394.664062c0 32.363281-26.304688 58.667969-58.667969 58.667969zm-394.664062-480c-14.699219 0-26.667969 11.96875-26.667969 26.667969v394.664062c0 14.699219 11.96875 26.667969 26.667969 26.667969h394.664062c14.699219 0 26.667969-11.96875 26.667969-26.667969v-394.664062c0-14.699219-11.96875-26.667969-26.667969-26.667969zm0 0'
      );
      svg.appendChild(path1);

      const path2 = createSVGElement('path');
      path2.setAttribute(
        'd',
        'm368 272h-224c-8.832031 0-16-7.167969-16-16s7.167969-16 16-16h224c8.832031 0 16 7.167969 16 16s-7.167969 16-16 16zm0 0'
      );
      svg.appendChild(path2);

      const path3 = createSVGElement('path');
      path3.setAttribute(
        'd',
        'm256 384c-8.832031 0-16-7.167969-16-16v-224c0-8.832031 7.167969-16 16-16s16 7.167969 16 16v224c0 8.832031-7.167969 16-16 16zm0 0'
      );
      svg.appendChild(path3);
      break;
    }
    case 'collapse': {
      const path1 = createSVGElement('path');
      path1.setAttribute(
        'd',
        'm453.332031 512h-394.664062c-32.363281 0-58.667969-26.304688-58.667969-58.667969v-394.664062c0-32.363281 26.304688-58.667969 58.667969-58.667969h394.664062c32.363281 0 58.667969 26.304688 58.667969 58.667969v394.664062c0 32.363281-26.304688 58.667969-58.667969 58.667969zm-394.664062-480c-14.699219 0-26.667969 11.96875-26.667969 26.667969v394.664062c0 14.699219 11.96875 26.667969 26.667969 26.667969h394.664062c14.699219 0 26.667969-11.96875 26.667969-26.667969v-394.664062c0-14.699219-11.96875-26.667969-26.667969-26.667969zm0 0'
      );
      svg.appendChild(path1);

      const path2 = createSVGElement('path');
      path2.setAttribute(
        'd',
        'm368 272h-224c-8.832031 0-16-7.167969-16-16s7.167969-16 16-16h224c8.832031 0 16 7.167969 16 16s-7.167969 16-16 16zm0 0'
      );
      svg.appendChild(path2);

      svg.setAttribute('y', '5px');
      break;
    }
    default:
      break;
  }

  return svg;
}

export default class LabelGroup {
  constructor(label, icon = false, isHidden = false) {
    this.element = createSVGElement('g', 'label');

    if (icon) {
      const iconEl = createSVGIcon(icon);
      this.element.appendChild(iconEl);
    }

    if (isHidden) {
      this.element.setAttribute('opacity', 0);
    }

    const text = createSVGElement('text');
    const tspan = createSVGElement('tspan');
    tspan.setAttribute('space', 'preserve');
    tspan.setAttribute('dy', '1em');
    tspan.setAttribute('x', 1 + (icon ? iconSize + 6 : 0));
    tspan.textContent = label;
    text.appendChild(tspan);
    this.element.appendChild(text);
  }

  getBBox() {
    return this.element.getBBox();
  }
}
