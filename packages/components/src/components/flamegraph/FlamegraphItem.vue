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
  formatDurationMillisecond,
  getEventDuration,
} from '../../lib/flamegraph';
import { Event } from '@appland/models';
const options = { padding: PADDING, border: BORDER };
export default {
  name: 'v-flamegraph-item',
  emits: ['select', 'hover'],
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
    status: {
      type: String,
      required: true,
      validator: (value) => ['trunc', 'crown', 'branch'].includes(value),
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
      return [
        'flamegraph-item',
        `flamegraph-item-${this.eventType}`,
        `flamegraph-item-${this.status}`,
      ];
    },
    style() {
      return {
        ...styleDimension({ width: this.budget, height: HEIGHT }, options),
        'font-size': `${FONT_SIZE}px`,
      };
    },
    content() {
      if (this.budget < CONTENT_THRESHOLD) {
        return '';
      } else {
        const duration = getEventDuration(this.event);
        if (duration > 0) {
          return `[${formatDurationMillisecond(duration, 3)}] ${this.event.toString()}`;
        } else {
          return this.event.toString();
        }
      }
    },
  },
  methods: {
    onClick() {
      this.$emit('select', this.event);
    },
    onEnter() {
      this.$emit('hover', { type: 'enter', target: this.event });
    },
    onLeave() {
      this.$emit('hover', { type: 'leave', target: this.event });
    },
  },
};
</script>

<style scoped lang="scss">
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

//////////
// type //
//////////

$sql-color: #9c2fba;
$http-color: #542168;
$default-color: #4362b1;

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

////////////
// status //
////////////

.flamegraph-item-crown {
  border-color: #ff07aa;
}

.flamegraph-item-trunc {
  opacity: 0.5;
}
</style>
