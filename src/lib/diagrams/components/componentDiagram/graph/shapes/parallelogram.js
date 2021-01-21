import { createSVGElement } from '../util';

export default function Parallelogram(width, height) {
  const polygon = createSVGElement('polygon');
  const w = width;
  const h = height;
  const points = [
    { x: (-2 * h) / 6, y: 0 },
    { x: w - h / 6, y: 0 },
    { x: w + (2 * h) / 6, y: -h },
    { x: h / 6, y: -h },
  ];

  polygon.setAttribute('points', points.map((d) => `${d.x},${d.y}`).join());
  polygon.setAttribute('transform', `translate(${-w * 0.5}, ${h * 0.5})`);

  return polygon;
}
