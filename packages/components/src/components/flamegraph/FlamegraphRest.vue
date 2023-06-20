<template>
  <div class="flamegraph-common flamegraph-rest" :style="style"></div>
</template>

<script>
import { BORDER, PADDING, HEIGHT, styleDimension, FONT_SIZE } from '../../lib/flamegraph';
const options = { padding: PADDING, border: BORDER };
export default {
  name: 'v-flamegraph-rest',
  props: {
    budget: {
      type: Number,
      required: true,
    },
  },
  computed: {
    style() {
      return {
        ...styleDimension({ width: this.budget, height: HEIGHT }, options),
        'font-size': `${FONT_SIZE}px`,
      };
    },
  },
};
</script>

<style scoped lang="scss">
@import '@/scss/flamegraph.scss';
.flamegraph-rest {
  background: #ebdf90;
  border-color: #beaf4e;
  transition: all 1s ease;
}
</style>
