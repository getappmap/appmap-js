<template>
  <v-trace-node-columns>
    <template v-slot:left>
      <v-trace-node-port
        v-for="(input, index) in inputs"
        :key="index"
        :value="input.value"
        :text="input.name"
      />
    </template>
    <template v-slot:right>
      <v-trace-node-port
        v-for="(output, index) in outputs"
        :key="index"
        :value="output.value"
        text="Return value"
        type="output"
      />
    </template>
  </v-trace-node-columns>
</template>

<script>
import { Event } from '@/lib/models';
import VTraceNodeColumns from './TraceNodeColumns.vue';
import VTraceNodePort from './TraceNodePort.vue';

export default {
  name: 'v-trace-node-body-default',
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
      return this.event.parameters;
    },
    outputs() {
      const outputObjects = [];
      const { returnValue } = this.event;
      if (returnValue) {
        outputObjects.push(returnValue);
      }
      return outputObjects;
    },
  },
};
</script>

<style scoped lang="scss"></style>
