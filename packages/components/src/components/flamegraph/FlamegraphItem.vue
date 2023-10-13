<template>
  <div
    :class="classes"
    :style="style"
    @mousedown="handleMouseDown"
    @mouseup="handleMouseUp"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    {{ content }}
  </div>
</template>

<script>
import { formatDurationMillisecond, getEventDuration } from '../../lib/flamegraph';

const MIN_BORDER_WIDTH = 2;
const MIN_TEXT_WIDTH = 50;

export default {
  name: 'v-flamegraph-item',
  emits: ['select', 'hover'],
  props: {
    event: {
      type: Object,
      required: true,
    },
    factor: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      default: null,
    },
    baseBudget: {
      type: Number,
      required: true,
    },
    zoomBudget: {
      type: Number,
      required: true,
    },
  },
  data() {
    return { timer: 0 };
  },
  computed: {
    eventType() {
      const type =
        this.event.codeObject && this.event.codeObject.data && this.event.codeObject.type;

      return type ? type : 'default';
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
      const result = [
        'flamegraph-item',
        `flamegraph-item-${this.eventType}`,
        `flamegraph-item-${this.status}`,
        `flamegraph-item-${this.dimension}`,
      ];

      if (this.isHighlighted) result.push('highlighted');
      return result;
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
    isHighlighted() {
      return this.$store.state.highlightedEvents.some(
        (highlightedEvent) => highlightedEvent.id === this.event.id
      );
    },
  },
  methods: {
    handleMouseDown() {
      this.timer = Date.now();
    },
    handleMouseUp() {
      // We want to differentiate between clicking and dragging
      if (Date.now() - this.timer < 200) {
        this.$emit('select', this.event);
      }
    },
    handleMouseEnter() {
      this.$emit('hover', { type: 'enter', target: this.event });
    },
    handleMouseLeave() {
      this.$emit('hover', { type: 'leave', target: this.event });
    },
  },
};
</script>

<style scoped lang="scss">
//////////
// Text //
//////////

$text-color: #d3d3d3;
$font-size: 12px;
.flamegraph-item-text {
  user-select: none;
  font-size: $font-size;
  line-height: 1;
  border-style: solid;
  box-sizing: border-box;
  text-align: left;
  font-family: 'IBM Plex Mono', monospace;
  box-sizing: border-box;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: $text-color;
}

///////////////
// Clickable //
///////////////

.flamegraph-item-clickable {
  cursor: pointer;
  &:hover {
    color: white;
  }
}

.flamegraph-item-clickable.flamegraph-item-external-route {
  cursor: pointer;
  &:hover {
    color: $gray4;
  }
}

///////////////
// Dimension //
///////////////

$padding: 10px;
$border: 1px;
$height: $font-size + 2 * ($border + $padding);

.flamegraph-item-borderless {
  box-sizing: border-box;
  height: $height;
  border-width: 0px;
}

.flamegraph-item-textless {
  box-sizing: border-box;
  height: $height;
  border-style: solid;
  border-width: $border;
}

.flamegraph-item-normal {
  @extend .flamegraph-item-text;
  box-sizing: border-box;
  height: $height;
  border-style: solid;
  border-width: $border;
  padding: $padding;
}

////////////////
// Event Type //
////////////////

$sql-color: #9c2fba;
$sql-border-color: darken($sql-color, 10%);
$http-color: #542168;
$http-border-color: darken($http-color, 10%);
$external-route-color: #ebdf90;
$external-route-border-color: darken($external-route-color, 10%);
$default-color: #4362b1;
$default-border-color: darken($default-color, 10%);

.flamegraph-item-query {
  background-color: $sql-color;
  border-color: $sql-border-color;
}

.flamegraph-item-external-route {
  color: black;
  background-color: $external-route-color;
  border-color: $external-route-border-color;
}

.flamegraph-item-route {
  background-color: $http-color;
  border-color: $http-border-color;
}

.flamegraph-item-default,
.flamegraph-item-function {
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
// Status //
////////////

.flamegraph-item-branch {
  @extend .flamegraph-item-clickable;
}

.flamegraph-item-crown {
  position: sticky;
  left: 0px;
  border-color: #ff07aa;
}

.flamegraph-item-trunk {
  @extend .flamegraph-item-clickable;
  position: sticky;
  left: 0px;
  opacity: 0.5;
}

.highlighted {
  border-color: white;
}
</style>
