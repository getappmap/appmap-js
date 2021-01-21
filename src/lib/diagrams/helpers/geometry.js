class Transform {
  constructor(x = 0, y = 0, k = 1) {
    this.x = x;
    this.y = y;
    this.k = k;
  }

  toString() {
    return [
      this.x !== 0 ? `translateX(${this.x}px)` : null,
      this.y !== 0 ? `translateY(${this.y}px)` : null,
      this.k !== 1 ? `scale(${this.k}` : null,
    ].join(' ');
  }
}

export default {
  // Checks if a rect (such as a DOMRect) fully contains another.
  contains(outer, inner) {
    return (
      outer.top <= inner.top &&
      outer.bottom >= inner.bottom &&
      outer.left <= inner.left &&
      outer.right >= inner.right
    );
  },

  // delta returns the shortest relative translation to place inner within
  // outer
  delta(outer, inner) {
    let x = 0;
    let y = 0;

    if (outer.left >= inner.left) {
      x = outer.left - inner.left;
    } else if (outer.right <= inner.right) {
      x = outer.right - inner.right;
    }

    if (outer.top >= inner.top) {
      y = outer.top - inner.top;
    } else if (outer.bottom <= inner.bottom) {
      y = outer.bottom - inner.bottom;
    }

    return { x, y };
  },

  // calculates a transform that shifts from one position to another
  shift(from, to) {
    return new Transform(from.x - to.x, from.y - to.y);
  },

  Transform,
};
