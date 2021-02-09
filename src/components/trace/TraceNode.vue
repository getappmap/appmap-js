<template>
  <div class="trace-node">
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
        @click.prevent="$emit('expandChildren')"
      />
      <component :is="`v-trace-node-body-${eventType}`" :event="event" />
    </div>
  </div>
</template>

<script>
import { Event } from '@/lib/models';
import NodeConnection from '@/assets/node_connection.svg';
import VTraceNodeBodyDefault from './TraceNodeBodyDefault.vue';
import VTraceNodeBodyHttp from './TraceNodeBodyHttp.vue';
import VTraceNodeBodySql from './TraceNodeBodySql.vue';

export default {
  name: 'v-trace-node',
  components: {
    VTraceNodeBodyDefault,
    VTraceNodeBodyHttp,
    VTraceNodeBodySql,
    NodeConnection,
  },
  props: {
    event: {
      type: Object,
      required: true,
      validator: (value) => value instanceof Event,
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
    outboundConnectionClasses() {
      return {
        'connection-icon': true,
        'connection-icon--right': true,
        'connection-icon--connected': this.event.children.length > 0,
      };
    },
  },
};
</script>

<style scoped lang="scss">
@font-face {
  font-family: 'IBM Plex Mono';
  src: local('IBM Plex Mono'),
    url(../../assets/fonts/IBM_Plex_Mono/IBMPlexMono-Regular.ttf)
      format('truetype');
}

$bg-color: $gray2;

.trace-node {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.8rem;
  background-color: $bg-color;
  display: inline-block;
  box-shadow: 0.2em 0.2em 10px 0px rgb(0 0 0 / 60%);
  color: #bababa;
  user-select: none;
  -moz-user-select: none;
  -webkit-user-select: none;
  -ms-user-select: none;

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
</style>
