<template>
  <div
    ref="inner"
    class="flamegraph-common flamegraph-item"
    :style="style"
    @click="onClick"
    @mouseenter="onEnter"
    @mouseleave="onLeave"
  >
    {{ content }}
  </div>
</template>

<script>
import {
  PADDING,
  BORDER,
  CONTENT_THRESHOLD,
  FONT_SIZE,
  HEIGHT,
  styleDimension,
} from '../../lib/flamegraph';
import { Event } from '@appland/models';
const options = { padding: PADDING, border: BORDER };
export default {
  name: 'v-flamegraph-item',
  emits: ['selectEvent', 'hoverEvent'],
  props: {
    event: {
      type: Object,
      required: true,
      validator: (value) => value instanceof Event,
    },
    budget: {
      type: Number,
      required: true,
    },
    focused: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    style() {
      return {
        ...styleDimension({ width: this.budget, height: HEIGHT }, options),
        'border-color': this.focused ? '#ff07aa' : '#6FDDD6',
        // 'border-color': this.focused ? '#ff07aa' : '#010306',
        'font-size': `${FONT_SIZE}px`,
      };
    },
    content() {
      return this.budget < CONTENT_THRESHOLD ? '' : this.event.toString();
    },
  },
  methods: {
    onClick() {
      this.$emit('selectEvent', this.event);
    },
    onEnter() {
      this.$emit('hoverEvent', { type: 'enter', event: this.event });
    },
    onLeave() {
      this.$emit('hoverEvent', { type: 'leave', event: this.event });
    },
  },
};
</script>

<style scoped lang="scss">
@import '@/scss/flamegraph.scss';
.flamegraph-item {
  background: #4362b1;
  color: #eaeaea;
  cursor: pointer;
  transition: all 1s linear;
  &:hover {
    color: #fc8cd5;
  }
}
</style>
