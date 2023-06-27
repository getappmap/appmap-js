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
import { formatDurationMillisecond, getEventDuration } from '../../lib/flamegraph';
import { Event } from '@appland/models';
const PADDING = 10;
const BORDER = 1;
const FONT_SIZE = 12;
const TEXT_MIN_WIDTH = 30;
const HEIGHT = FONT_SIZE + 2 * (BORDER + PADDING);
const CONTENT_THRESHOLD = TEXT_MIN_WIDTH + 2 * (BORDER + PADDING);
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
      validator: (value) => value >= 0,
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
      if (this.status === 'branch') {
        if (this.budget === 0) {
          return {
            display: 'none',
          };
        } else if (this.budget <= 2 * BORDER) {
          return {
            'border-left-width': `${this.budget}px`,
            width: `${this.budget}px`,
            height: `${HEIGHT}px`,
          };
        } else if (this.budget < CONTENT_THRESHOLD) {
          return {
            'border-width': `${BORDER}px`,
            width: `${this.budget}px`,
            height: `${HEIGHT}px`,
          };
        } else {
          return {
            'border-width': `${BORDER}px`,
            width: `${this.budget}px`,
            height: `${HEIGHT}px`,
            padding: `${PADDING}px`,
            'font-size': `${FONT_SIZE}px`,
          };
        }
      } else {
        return {
          padding: `${PADDING}px`,
          width: `${this.budget}px`,
          height: `${HEIGHT}px`,
          'border-width': `${BORDER}px`,
          'font-size': `${FONT_SIZE}px`,
        };
      }
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
