<template>
  <span class="connection">
    <svg xlmns="http://www.w3.org/2000/svg" class="connection__svg">
      <path class="connection__path" :d="pathCommand" />
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
    async renderPaths() {
      const { x: originX, y: originY } = this.$el.getBoundingClientRect();
      let element = await this.elementFrom;
      element = element.$el || element;
      console.assert(element);
      console.log(element);
      const { x, y, width: w, height: h } = element.getBoundingClientRect();

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

      const fX = x - offsetX + this.x;
      const fY = y - offsetY + this.y;
      if (this.shape === 'hook') {
        this.pathCommand = curveCommands(fX, fY, this.width, this.height);
      } else if (this.shape === 'line-v') {
        this.pathCommand = `m${fX} ${fY} v${this.height}`;
      } else if (this.shape === 'line-h') {
        this.pathCommand = `m${fX} ${fY} h${this.width}`;
      }
    },
  },
  mounted() {
    this.renderPaths();
  },
  updated() {
    this.renderPaths();
  },
};
</script>

<style scoped lang="scss">
.connection {
  overflow: visible;
  position: relative;
  pointer-events: none;

  &__svg {
    position: absolute;
    overflow: visible;
  }

  &__path {
    fill: none;
    stroke: $gray2;
    stroke-width: 4px;
  }
}
</style>
