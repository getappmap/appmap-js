<template>
  <div :class="classes" :style="style" @click="onClick" @mouseenter="onEnter" @mouseleave="onLeave">
    {{ content }}
  </div>
</template>

<script>
import { formatDurationMillisecond, getEventDuration } from '../../lib/flamegraph';
import { Event } from '@appland/models';
const MIN_BORDER_WIDTH = 2;
const MIN_TEXT_WIDTH = 50;
const statuses = new Set(['trunk', 'crown', 'branch', 'pruned']);
export default {
  name: 'v-flamegraph-item',
  emits: ['select', 'hover'],
  props: {
    event: {
      type: Object,
      required: true,
      validator: (value) => value instanceof Event,
    },
    factor: {
      type: Number,
      required: true,
      validator: (value) => value >= 0 && value <= 1,
    },
    status: {
      type: String,
      default: null,
      validator: (value) => statuses.has(value),
    },
    baseBudget: {
      type: Number,
      required: true,
      validator: (value) => value >= 0,
    },
    zoomBudget: {
      type: Number,
      required: true,
      validator: (value) => value >= 0,
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
    dimension() {
      if (this.width < MIN_BORDER_WIDTH) {
        return 'borderless';
      } else if (this.width < MIN_TEXT_WIDTH) {
        return 'textless';
      } else {
        return 'normal';
      }
    },
    classes() {
      return [
        'flamegraph-item',
        `flamegraph-item-${this.eventType}`,
        `flamegraph-item-${this.status}`,
        `flamegraph-item-${this.dimension}`,
      ];
    },
    width() {
      if (this.status === 'pruned') {
        return 0;
      } else if (this.status === 'branch') {
        return this.factor * this.zoomBudget;
      } else {
        return this.baseBudget;
      }
    },
    style() {
      return { width: `${this.width}px` };
    },
    content() {
      if (this.dimension === 'normal') {
        const duration = getEventDuration(this.event);
        if (duration > 0) {
          return `[${formatDurationMillisecond(duration, 3)}] ${this.event.toString()}`;
        } else {
          return this.event.toString();
        }
      } else {
        return '';
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
.flamegraph-item {
  cursor: pointer;
  border-style: solid;
  box-sizing: border-box;
}

//////////
// Text //
//////////

$text-color: #e3e5e8;
$font-size: 12px;
.flamegraph-item-text {
  font-size: $font-size;
  line-height: 1;
  cursor: pointer;
  border-style: solid;
  box-sizing: border-box;
  text-align: left;
  font-family: 'IBM Plex Mono', monospace;
  box-sizing: border-box;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: $text-color;
  &:hover {
    color: darken($text-color, 20%);
  }
}

///////////////
// dimension //
///////////////

$padding: 10px;
$border: 1px;
$height: $font-size + 2 * ($border + $padding);

.flamegraph-item-borderless {
  height: $height;
  border-width: 0px;
}

.flamegraph-item-textless {
  height: $height;
  border-width: $border;
}

.flamegraph-item-normal {
  @extend .flamegraph-item-text;
  height: $height;
  border-width: $border;
  padding: $padding;
}

//////////
// type //
//////////

$sql-color: #9c2fba;
$sql-border-color: darken($sql-color, 10%);
$http-color: #542168;
$http-border-color: darken($http-color, 10%);
$default-color: #4362b1;
$default-border-color: darken($default-color, 10%);

.flamegraph-item-sql {
  background-color: $sql-color;
  border-color: $sql-border-color;
}

.flamegraph-item-http {
  background-color: $http-color;
  border-color: $http-border-color;
}

.flamegraph-item-default {
  background-color: $default-color;
  border-color: $default-border-color;
}

.flamegraph-item-sql.flamegraph-item-borderless {
  background-color: $sql-border-color;
}

.flamegraph-item-http.flamegraph-item-borderless {
  background-color: $http-border-color;
}

.flamegraph-item-default.flamegraph-item-borderless {
  background-color: $default-border-color;
}

////////////
// status //
////////////

.flamegraph-item-crown {
  position: sticky;
  left: 0px;
  border-color: #ff07aa;
}

.flamegraph-item-trunk {
  position: sticky;
  left: 0px;
  opacity: 0.5;
}
</style>
