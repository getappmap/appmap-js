<template>
  <div class="flamegraph-rest" :style="style"></div>
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
$color: #ebdf90;

.flamegraph-rest {
  background: $color;
  border-color: darken($color, 10%);
  transition: all 1s ease;
}
</style>
