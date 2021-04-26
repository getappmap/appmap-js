<template>
  <div :class="classes" :style="style" :data-event-id="event.id">
    <div :class="`trace-node__header trace-node__header--${eventType}`">
      {{ title }}
    </div>
    <div class="trace-node__body">
      <node-connection
        ref="flowIn"
        class="connection-icon connection-icon--connected"
      />
      <node-connection
        ref="flowOut"
        :class="outboundConnectionClasses"
        @click.stop="$emit('expandChildren')"
      />
      <component :is="`v-trace-node-body-${eventType}`" :event="event" />
      <v-trace-node-labels
        v-if="event.labels.size"
        :labels="Array.from(event.labels)"
      />
    </div>
  </div>
</template>

<script>
import { Event } from '@/lib/models';
import { CLEAR_OBJECT_STACK, SELECT_OBJECT } from '@/store/vsCode';
import NodeConnection from '@/assets/node_connection.svg';
import VTraceNodeBodyDefault from './TraceNodeBodyDefault.vue';
import VTraceNodeBodyHttp from './TraceNodeBodyHttp.vue';
import VTraceNodeBodySql from './TraceNodeBodySql.vue';
import VTraceNodeLabels from './TraceNodeLabels.vue';

export default {
  name: 'v-trace-node',
  components: {
    NodeConnection,
    VTraceNodeBodyDefault,
    VTraceNodeBodyHttp,
    VTraceNodeBodySql,
    VTraceNodeLabels,
  },
  props: {
    event: {
      type: Object,
      required: true,
      validator: (value) => value instanceof Event,
    },
    highlight: Boolean,
    highlightColor: {
      type: String,
      default: '#ff07aa',
    },
    highlightStyle: {
      type: String,
      default: 'solid',
      validator: (value) => ['solid', 'dashed', 'dotted'].indexOf(value) !== -1,
    },
    focused: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    title() {
      return this.event.codeObject.prettyName;
    },
    eventType() {
      if (this.event.httpServerRequest) {
        return 'http';
      }

      if (this.event.sql) {
        return 'sql';
      }

      return 'default';
    },
    classes() {
      return {
        'trace-node': true,
        highlight: this.highlight,
        focused: this.focused,
      };
    },
    style() {
      if (!this.highlight) {
        return {};
      }

      return {
        'outline-color': this.highlightColor,
        'outline-style': this.highlightStyle,
      };
    },
    outboundConnectionClasses() {
      return {
        'connection-icon': true,
        'connection-icon--right': true,
        'connection-icon--connected': this.event.children.length > 0,
      };
    },
    // selectedEvent() {
    //   return this.$selectedEvent();
    // },
  },

  methods: {
    selectNode() {
      if (this.$store) {
        this.$store.commit(CLEAR_OBJECT_STACK);
        this.$store.commit(SELECT_OBJECT, this.event);
      }
    },
  },
};
</script>

<style scoped lang="scss">
$bg-color: $gray2;

.trace-node {
  background-color: $bg-color;
  display: inline-block;
  box-shadow: 0.2em 0.2em 10px 0px rgb(0 0 0 / 60%);
  color: #bababa;
  user-select: none;
  -moz-user-select: none;
  -webkit-user-select: none;
  -ms-user-select: none;

  &.highlight {
    outline: 4px solid $hotpink;
  }

  &.focused {
    outline: 4px solid transparent;
    animation: node-focused 1s ease-out 0.3s;
  }

  &__header {
    text-align: center;
    font-weight: 800;
    padding: 0 2em;

    &--http {
      background-color: #471554;
    }
    &--sql {
      background-color: #113d80;
    }
    &--default {
      background-color: #525d7b;
    }
  }

  &__body {
    padding: 1em;
  }
}

.connection-icon {
  height: 1.25em;
  margin-bottom: 0.5em;
  fill: darken($bg-color, 7.5);

  &--right {
    float: right;
  }

  &--connected {
    fill: lighten($bg-color, 35);
  }
}

@keyframes node-focused {
  from {
    outline-color: $hotpink;
  }
  to {
    outline-color: transparent;
  }
}
</style>
