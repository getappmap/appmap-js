import { createSVGElement } from '../util';

export default function Marker() {
  const marker = createSVGElement('marker');
  marker.setAttribute('viewBox', '0 0 10 10');
  marker.setAttribute('refX', '10');
  marker.setAttribute('refY', '5');
  marker.setAttribute('markerUnits', 'strokeWidth');
  marker.setAttribute('markerWidth', '4');
  marker.setAttribute('markerHeight', '4');
  marker.setAttribute('orient', 'auto');

  const path = createSVGElement('path');
  path.setAttribute('d', 'M 0 0 L 10 5 L 0 10 z');
  marker.appendChild(path);

  return marker;
}
