<template>
  <div
    ref="inner"
    :class="class_"
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
    eventType() {
      if (this.event.sql) {
        return 'sql';
      } else if (
        this.event.httpClientRequest ||
        this.event.httpClientResponse ||
        this.event.httpServerRequest ||
        this.event.httpServerResponse
      ) {
        return 'http';
      } else {
        return 'default';
      }
    },
    class_() {
      return ['flamegraph-item', `flamegraph-item-${this.eventType}`];
    },
    style() {
      return {
        ...styleDimension({ width: this.budget, height: HEIGHT }, options),
        ...(this.focused ? { 'border-color': '#ff07aa' } : {}),
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
$sql-color: #9c2fba;
$http-color: #542168;
$default-color: #4362b1;
$text-color: #e3e5e8;

.flamegraph-item {
  text-align: left;
  font-family: 'IBM Plex Mono', monospace;
  border-style: solid;
  box-sizing: border-box;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: $text-color;
  cursor: pointer;
  transition: all 1s linear;
  &:hover {
    color: darken($text-color, 20%);
  }
}

.flamegraph-item-sql {
  background-color: $sql-color;
  border-color: darken($sql-color, 10%);
}

.flamegraph-item-http {
  background-color: $http-color;
  border-color: darken($http-color, 10%);
}

.flamegraph-item-default {
  background-color: $default-color;
  border-color: darken($default-color, 10%);
}
</style>
