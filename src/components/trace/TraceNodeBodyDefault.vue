<template>
  <v-trace-node-columns>
    <template v-slot:left>
      <v-trace-node-port
        v-for="(input, index) in inputs"
        :key="index"
        :parameterObject="input"
      />
    </template>
    <template v-slot:right>
      <v-trace-node-port
        v-for="(output, index) in outputs"
        :key="index"
        :parameterObject="output"
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
      const inputArray = [];
      const { receiver } = this.event;
      if (receiver) {
        inputArray.push({
          ...receiver,
          name: 'self',
        });
      }

      if (Array.isArray(this.event.parameters)) {
        inputArray.push(...this.event.parameters);
      }

      return inputArray;
    },
    outputs() {
      const outputObjects = [];
      const { returnValue } = this.event;
      if (returnValue) {
        const tokens = returnValue.class.split(/[^\w\d]+/);
        let name = tokens[tokens.length - 1];
        if (!name) {
          name = returnValue.class;
        }

        outputObjects.push({ ...returnValue, name });
      }
      return outputObjects;
    },
  },
};
</script>

<style scoped lang="scss"></style>
