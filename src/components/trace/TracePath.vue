<template>
  <svg
    xlmns="http://www.w3.org/2000/svg"
    class="connections"
    :width="1"
    :height="1"
  >
    <path class="edge" v-for="(path, i) in paths" :key="i" :d="path" />
  </svg>
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
        window.console.log(v, h);
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
      paths: [],
      vAlign: this.align.split(/\s+?/)[0],
      hAlign: this.align.split(/\s+?/)[1],
    };
  },
  methods: {
    async renderPaths() {
      const { x: originX, y: originY } = this.$el.getBoundingClientRect();
      const element = await this.elementFrom;
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
        this.paths.push(curveCommands(fX, fY, this.width, this.height));
      } else if (this.shape === 'line-v') {
        this.paths.push(`m${fX} ${fY} v${this.height}`);
      } else if (this.shape === 'line-h') {
        this.paths.push(`m${fX} ${fY} h${this.width}`);
      }
    },
  },
  mounted() {
    this.renderPaths();
  },
};
</script>

<style scoped lang="scss">
.connections {
  overflow: visible;
  position: relative;
}

.edge {
  fill: none;
  stroke: $gray2;
  stroke-width: 3px;
  position: absolute;
}
</style>
