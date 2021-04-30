import { createSVGElement } from '../util';

export default function Rect(width, height) {
  const rect = createSVGElement('rect');
  rect.setAttribute('rx', 0);
  rect.setAttribute('ry', 0);
  rect.setAttribute('x', -(width / 2));
  rect.setAttribute('y', -(height / 2));
  rect.setAttribute('width', width);
  rect.setAttribute('height', height);
  return rect;
}
