// Returns [ r, g, b ]
function parseHexColor(hexColor) {
  const result = [];
  const match = hexColor.match(/^#([a-fA-F0-9]{3,6})/);

  if (match) {
    const hex = match[1];
    const charsPerNumber = Math.ceil(hex.length / 3);
    const numberCount = hex.length / charsPerNumber;

    for (let i = 0; i < numberCount; i += charsPerNumber) {
      const slice = hex.slice(i, i + charsPerNumber);
      let bytes = parseInt(slice, 16);

      if (charsPerNumber === 1) {
        bytes *= bytes;
      }

      result.push(bytes);
    }
  }

  const len = result.length;
  for (let i = 0; i < 3 - len; i += 1) {
    result.push(0.0);
  }

  return result;
}

// Shifts the next item off the array and coerces it to a number
function getNextNumber(arr) {
  const val = arr.shift();
  if (typeof val !== 'number') {
    return 0.0;
  }
  return val;
}

function clamp(val, min, max) {
  return Math.min(Math.max(min, val), max);
}

// Convenience class for converting and mutating colors
export default class Color {
  // Supports the following constructors:
  // new Color(127)               -> rgba(127, 127, 127, 1.0)
  // new Color(127, 0.5)          -> rgba(127, 127, 127, 0.5)
  // new Color(10, 60, 224)       -> rgba(10, 60, 224, 1.0)
  // new Color(10, 60, 224, 0.5)  -> rgba(10, 60, 224, 0.5)
  // new Color('#f0f')            -> rgba(255, 0, 255, 1.0)
  // new Color('#08ff00')         -> rgba(127, 255, 0, 1.0)
  // new Color('#08ff00', 0.5)    -> rgba(127, 255, 0, 1.0, 0.5)
  // new Color(color)             -> rgba(color.r, color.g, color.b, color.a)
  // new Color(color, 1.0)        -> rgba(color.r, color.g, color.b, 1.0)
  constructor(...vals) {
    Object.defineProperty(this, '$data', {
      writable: false,
      enumerable: false,
      value: {
        r: 0.0,
        g: 0.0,
        b: 0.0,
        a: 0.0,
      },
    });

    switch (vals.length) {
      case 1:
        {
          const color = vals[0];
          const colorType = typeof color;

          if (colorType === 'string') {
            const [r, g, b] = parseHexColor(color);
            this.r = r;
            this.g = g;
            this.b = b;
          } else if (colorType === 'number') {
            this.r = color;
            this.g = color;
            this.b = color;
          } else if (color instanceof Color) {
            this.r = color.r;
            this.g = color.g;
            this.b = color.b;
            this.a = color.a;
          }
        }
        break;

      case 2:
        {
          const color = vals[0];
          const colorType = typeof color;

          if (colorType === 'string') {
            const [r, g, b] = parseHexColor(color);
            this.r = r;
            this.g = g;
            this.b = b;
          } else if (colorType === 'number') {
            this.r = color;
            this.g = color;
            this.b = color;
          } else if (color instanceof Color) {
            this.r = color.r;
            this.g = color.g;
            this.b = color.b;
          }

          const alpha = vals[1];
          if (typeof alpha === 'number') {
            this.a = alpha;
          }
        }
        break;

      case 3:
        this.r = getNextNumber(vals);
        this.g = getNextNumber(vals);
        this.b = getNextNumber(vals);
        break;

      case 4:
        this.r = getNextNumber(vals);
        this.g = getNextNumber(vals);
        this.b = getNextNumber(vals);
        this.a = getNextNumber(vals);
        break;

      default:
    }

    if (this.a > 1) {
      this.a /= 0xff;
    }
  }

  set r(val) {
    this.$data.r = Math.floor(clamp(val, 0, 255));
  }

  set g(val) {
    this.$data.g = Math.floor(clamp(val, 0, 255));
  }

  set b(val) {
    this.$data.b = Math.floor(clamp(val, 0, 255));
  }

  set a(val) {
    this.$data.a = clamp(val, 0, 1);
  }

  get r() {
    return this.$data.r;
  }

  get g() {
    return this.$data.g;
  }

  get b() {
    return this.$data.b;
  }

  get a() {
    return this.$data.a;
  }

  get rgb() {
    return `rgb(${this.r}, ${this.g}, ${this.b})`;
  }

  get hex() {
    const r = this.r.toString(16).padStart(2, '0');
    const g = this.g.toString(16).padStart(2, '0');
    const b = this.b.toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
  }

  get rgba() {
    return `rgba(${this.r}, ${this.g}, ${this.b}, ${this.a})`;
  }

  static hex(...vals) {
    const color = new Color(...vals);
    return color.hex;
  }

  static rgb(...vals) {
    const color = new Color(...vals);
    return color.rgb;
  }

  static rgba(...vals) {
    const color = new Color(...vals);
    return color.rgba;
  }

  darken(val) {
    this.r *= val;
    this.g *= val;
    this.b *= val;
  }

  toString() {
    return this.hex;
  }
}
