import { createSVGElement } from '../util';

export default function Cylinder(width, height) {
  const path = createSVGElement('path');

  const rx = width / 2;
  const ry = rx / (2.5 + width / 50);

  const shape = `M 0,${ry} a ${rx},${ry} 0,0,0 ${width} 0 a ${rx},${ry} 0,0,0 ${-width} 0 l 0,${height} a ${rx},${ry} 0,0,0 ${width} 0 l 0, ${-height}`;

  path.setAttribute('d', shape);
  path.setAttribute(
    'transform',
    `translate(${-width / 2}, ${-(height / 2 + ry)})`
  );

  return path;
}
