<template>
  <span class="connection">
    <svg xlmns="http://www.w3.org/2000/svg" class="connection__svg" ref="svg">
      <path
        :transform="`translate(${x}, ${y})`"
        class="connection__path"
        :d="pathCommand"
      />
    </svg>
  </span>
</template>

<script>
function curveCommands(x, y, w, h) {
  return `m${x - w} ${y - h} c0 ${h} 0 ${h} ${w} ${h}`;
}

export default {
  name: 'v-trace-path',
  props: {
    elementFrom: {
      required: true,
    },
    align: {
      type: String,
      default: 'top left',
      validator: (value) => {
        const [v, h] = value.split(/\s+?/);
        return (
          ['top', 'center', 'bottom'].indexOf(v) !== -1 &&
          ['left', 'center', 'right'].indexOf(h) !== -1
        );
      },
    },
    shape: {
      type: String,
      default: 'hook',
      validator: (value) => ['hook', 'line-v', 'line-h'].indexOf(value) !== -1,
    },
    width: {
      type: Number,
      default: 50,
    },
    height: {
      type: Number,
      default: 50,
    },
    x: {
      type: Number,
      default: 0,
    },
    y: {
      type: Number,
      default: 0,
    },
  },
  data() {
    return {
      pathCommand: '',
      vAlign: this.align.split(/\s+?/)[0],
      hAlign: this.align.split(/\s+?/)[1],
    };
  },
  methods: {
    transformPoint(point) {
      const { svg } = this.$refs;
      const p = svg.createSVGPoint();
      p.x = point.x;
      p.y = point.y;
      return p.matrixTransform(svg.getScreenCTM().inverse());
    },
    async renderPaths() {
      const { x: originX, y: originY } = this.transformPoint(
        this.$el.getBoundingClientRect()
      );
      let element = await this.elementFrom;
      if (!this.$refs.svg) {
        // because this is an async method, it's possible the ref
        // is removed from underneath us
        return;
      }

      element = element.$el || element;
      console.assert(element);

      const { x, y } = this.transformPoint(element.getBoundingClientRect());
      const w = element.clientWidth;
      const h = element.clientHeight;

      let offsetX = originX;
      let offsetY = originY;
      if (this.vAlign === 'bottom') {
        offsetY -= h;
      } else if (this.vAlign === 'center') {
        offsetY -= h * 0.5;
      }

      if (this.hAlign === 'right') {
        offsetX -= w;
      } else if (this.hAlign === 'center') {
        offsetX -= w * 0.5;
      }

      const fX = x - offsetX;
      const fY = y - offsetY;
      if (this.shape === 'hook') {
        this.pathCommand = curveCommands(fX, fY, this.width, this.height);
      } else if (this.shape === 'line-v') {
        // HACK.
        // Beware of magic number 75
        const scale = 1 / this.$refs.svg.getScreenCTM().a;
        this.pathCommand = `m${fX} ${fY} v${this.height * scale - 75}`;
      } else if (this.shape === 'line-h') {
        this.pathCommand = `m${fX} ${fY} h${this.width}`;
      }
    },
  },
  mounted() {
    this.$nextTick(() => {
      this.renderPaths();
    });
  },
};
</script>

<style scoped lang="scss">
.connection {
  overflow: visible;
  position: relative;
  pointer-events: none;
  z-index: -1;

  &__svg {
    position: absolute;
    overflow: visible;
  }

  &__path {
    fill: none;
    stroke: $gray4;
    stroke-width: 4px;
  }
}
</style>
