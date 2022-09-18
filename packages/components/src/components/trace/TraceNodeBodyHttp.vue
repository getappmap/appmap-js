<template>
  <v-trace-node-columns>
    <template v-slot:left>
      <v-trace-node-port v-for="input in inputs" :key="input.name" :parameterObject="input" />
    </template>
    <template v-slot:right>
      <v-trace-node-port
        v-for="output in outputs"
        :key="output.name"
        :parameterObject="output"
        type="output"
      />
    </template>
  </v-trace-node-columns>
</template>

<script>
import { Event } from '@appland/models';
import VTraceNodeColumns from './TraceNodeColumns.vue';
import VTraceNodePort from './TraceNodePort.vue';

export default {
  name: 'v-trace-node-body-http',
  components: {
    VTraceNodeColumns,
    VTraceNodePort,
  },
  props: {
    event: {
      type: Object,
      required: true,
      validator: (value) => value instanceof Event,
    },
  },
  computed: {
    inputs() {
      return this.event.message;
    },
    outputs() {
      const outputObjects = [];
      const { httpServerResponse } = this.event;
      if (httpServerResponse) {
        const { mime_type: mimeType, status } = httpServerResponse;
        if (mimeType) {
          outputObjects.push({
            name: 'mime_type',
            value: httpServerResponse.mime_type,
          });
        }

        if (status) {
          outputObjects.push({
            name: 'status',
            value: httpServerResponse.status,
          });
        }
      }
      return outputObjects;
    },
  },
};
</script>

<style scoped lang="scss"></style>
