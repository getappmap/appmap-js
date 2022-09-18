/* eslint-disable no-underscore-dangle */
/* eslint-disable new-cap */

import 'geometry-interfaces';
import { matrix, inv } from 'mathjs';

function fromDOM(dm) {
  const dmm = [].slice.call(dm._matrix);
  return new matrix([dmm.slice(0, 4), dmm.slice(4, 8), dmm.slice(8, 12), dmm.slice(12, 16)]);
}

function toDOM(m) {
  return new DOMMatrix(m._data.flat());
}

DOMMatrixReadOnly.prototype.inverse = function inverse() {
  return toDOM(inv(fromDOM(this)));
};

export default DOMMatrix;
