<template>
  <v-popper :placement="'bottom'" :text="popperContent" class="flamegraph-popper">
    <div ref="inner" class="flamegraph-common flamegraph-item" :style="style" @click="selectEvent">
      {{ content }}
    </div>
  </v-popper>
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
import VPopper from '@/components/Popper.vue';
const options = { padding: PADDING, border: BORDER };
export default {
  name: 'v-flamegraph-item',
  emits: ['selectEvent'],
  components: {
    VPopper,
  },
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
    // hasOverflow() {
    //   // Not sure why this.$refs is empty here...
    //   return this.$refs.inner.scrollWidth > this.$refs.inner.clientWidth;
    // },
    style() {
      return {
        ...styleDimension({ width: this.budget, height: HEIGHT }, options),
        'border-color': this.focused ? '#ff07aa' : '#6FDDD6',
        // 'border-color': this.focused ? '#ff07aa' : '#010306',
        'font-size': `${FONT_SIZE}px`,
      };
    },
    popperContent() {
      return this.event.toString();
      // return this.hasOverflow ? this.event.toString() : '';
    },
    content() {
      return this.budget < CONTENT_THRESHOLD ? '' : this.event.toString();
    },
  },
  methods: {
    selectEvent() {
      this.$emit('selectEvent', this.event);
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
