<template>
  <v-trace-node-columns>
    <template v-slot:left>
      <template v-if="httpParameters.length">
        <h1 class="port-header">HTTP</h1>
        <v-trace-node-port
          v-for="param in httpParameters"
          :key="param.name"
          :parameterObject="param"
        />
      </template>
      <template v-if="requestHeaders.length">
        <h1 class="port-header">Headers</h1>
        <v-trace-node-port
          v-for="header in requestHeaders"
          :key="header.name"
          :parameterObject="header"
        />
      </template>
      <template v-if="parameters.length">
        <h1 class="port-header">Parameters</h1>
        <v-trace-node-port
          v-for="parameter in parameters"
          :key="parameter.name"
          :parameterObject="parameter"
        />
      </template>
    </template>
    <template v-slot:right>
      <template v-if="responseHeaders.length">
        <h1 class="port-header">Headers</h1>
        <v-trace-node-port
          v-for="header in responseHeaders"
          :key="header.name"
          :parameterObject="header"
          type="output"
        />
      </template>
      <template v-if="responseHeaders.length">
        <h1 class="port-header">Response</h1>
        <v-trace-node-port
          v-for="output in outputs"
          :key="output.name"
          :parameterObject="output"
          type="output"
        />
      </template>
    </template>
  </v-trace-node-columns>
</template>

<script>
import { Event } from '@appland/models';
import VTraceNodeColumns from './TraceNodeColumns.vue';
import VTraceNodePort from './TraceNodePort.vue';

export default {
  name: 'v-trace-node-body-http-client',
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
    parameters() {
      return this.event.message || [];
    },

    httpParameters() {
      const { httpClientRequest } = this.event;

      return [
        { name: 'method', value: httpClientRequest.request_method },
        { name: 'url', value: httpClientRequest.url },
      ];
    },

    requestHeaders() {
      const { httpClientRequest } = this.event;
      if (!httpClientRequest || !httpClientRequest.headers) {
        return [];
      }

      return Object.entries(httpClientRequest.headers).map(([name, value]) => ({
        name,
        value,
      }));
    },

    responseHeaders() {
      const { httpClientResponse } = this.event;
      if (!httpClientResponse || !httpClientResponse.headers) {
        return [];
      }

      return Object.entries(httpClientResponse.headers).map(
        ([name, value]) => ({
          name,
          value,
        })
      );
    },

    outputs() {
      const outputObjects = [];
      const { httpClientResponse } = this.event;
      if (httpClientResponse) {
        const { mime_type: mimeType, status } = httpClientResponse;
        if (mimeType) {
          outputObjects.push({
            name: 'mime_type',
            value: httpClientResponse.mime_type,
          });
        }

        if (status) {
          outputObjects.push({
            name: 'status',
            value: httpClientResponse.status,
          });
        }
      }
      return outputObjects;
    },
  },
};
</script>

<style scoped lang="scss">
.port-header {
  margin: 0.25rem 0;
  padding-left: 0rem;
  font-size: 0.7rem;
  color: lighten($gray2, 40);

  &:not(:first-child) {
    margin-top: 1rem;
  }
}
</style>
