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
      <v-trace-node-elapsed
        v-if="event.returnEvent.elapsed"
        :time="event.returnEvent.elapsed"
      />
      <v-trace-node-labels
        v-if="event.labels.size"
        :labels="Array.from(event.labels)"
      />
    </div>
  </div>
</template>

<script>
import { Event } from '@appland/models';
import { CLEAR_OBJECT_STACK, SELECT_OBJECT } from '@/store/vsCode';
import NodeConnection from '@/assets/node_connection.svg';
import VTraceNodeBodyDefault from './TraceNodeBodyDefault.vue';
import VTraceNodeBodyHttp from './TraceNodeBodyHttp.vue';
import VTraceNodeBodyHttpClient from './TraceNodeBodyHttpClient.vue';
import VTraceNodeBodySql from './TraceNodeBodySql.vue';
import VTraceNodeElapsed from './TraceNodeElapsed.vue';
import VTraceNodeLabels from './TraceNodeLabels.vue';

export default {
  name: 'v-trace-node',
  components: {
    NodeConnection,
    VTraceNodeBodyDefault,
    VTraceNodeBodyHttp,
    VTraceNodeBodyHttpClient,
    VTraceNodeBodySql,
    VTraceNodeElapsed,
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
      if (this.event.httpClientRequest) {
        return `External service call to ${this.event.codeObject.name}`;
      }

      return this.event.codeObject.prettyName;
    },
    eventType() {
      if (this.event.sql) {
        return 'sql';
      }

      if (this.event.httpClientRequest) {
        return 'http-client';
      }

      if (this.event.httpServerRequest) {
        return 'http';
      }

      return 'default';
    },
    classes() {
      return {
        'trace-node': true,
        highlight: this.highlight,
        focused: this.focused,
        exceptions: this.event.exceptions.length,
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
    animation: node-focused 2s ease-out 0.3s;
  }

  &.exceptions {
    .trace-node__header::before {
      content: '';
      position: relative;
      top: 1px;
      display: inline-block;
      width: 0.8em;
      height: 0.8em;
      background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="rgb(235,223,144)" d="M569.517 440.013C587.975 472.007 564.806 512 527.94 512H48.054c-36.937 0-59.999-40.055-41.577-71.987L246.423 23.985c18.467-32.009 64.72-31.951 83.154 0l239.94 416.028zM288 354c-25.405 0-46 20.595-46 46s20.595 46 46 46 46-20.595 46-46-20.595-46-46-46zm-43.673-165.346l7.418 136c.347 6.364 5.609 11.346 11.982 11.346h48.546c6.373 0 11.635-4.982 11.982-11.346l7.418-136c.375-6.874-5.098-12.654-11.982-12.654h-63.383c-6.884 0-12.356 5.78-11.981 12.654z"/></svg>')
        no-repeat center;
    }
  }

  &__header {
    text-align: center;
    font-weight: 800;
    padding: 0 2em;

    &--http {
      background-color: #471554;
    }
    &--http-client {
      color: $gray1;
      background-color: $yellow;
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
