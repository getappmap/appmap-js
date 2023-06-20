<template>
  <div class="flamegraph-common flamegraph-root" :style="style" @click="clearSelectEvent">
    {{ sanitizedTitle }}
  </div>
</template>

<script>
import { BORDER, PADDING, HEIGHT, FONT_SIZE, styleDimension } from '../../lib/flamegraph';
const options = { padding: PADDING, border: BORDER };
export default {
  name: 'v-flamegraph-root',
  emits: ['clearSelectEvent'],
  props: {
    budget: {
      type: Number,
      required: true,
    },
    title: {
      type: String,
      default: 'root',
    },
  },
  methods: {
    clearSelectEvent() {
      this.$emit('clearSelectEvent');
    },
  },
  computed: {
    sanitizedTitle() {
      return typeof this.title === 'string' ? this.title : 'root';
    },
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
.flamegraph-root {
  background: #9c2fba;
  color: #eaeaea;
  border-color: #681f7c;
  cursor: pointer;
  transition: all 1s ease;
  &:hover {
    color: #ffffff;
  }
}
</style>
