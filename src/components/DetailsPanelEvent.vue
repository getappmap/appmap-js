<template>
  <div class="details-panel-event">
    <h3>{{name}}</h3>

    <div v-if="hasSql">
      <code>{{this.objectDescriptor.sql.sql}}</code>
    </div>

    <div v-if="hasParameters">
      <h3>Parameters</h3>
      <ul>
        <li v-for="(param, index) in objectDescriptor.parameters" :key="index">
          <strong>{{param.name}}</strong>
          <code>{{param.value}}</code>
        </li>
      </ul>
    </div>

    <div v-if="hasMessage">
      <h3>Parameters</h3>
      <ul>
        <li v-for="(param, index) in objectDescriptor.message" :key="index">
          <i>[{{param.class}}]</i>
          <strong>{{param.name}}</strong>
          <code>{{param.value}}</code>
        </li>
      </ul>
    </div>

    <v-details-panel-list title="Caller" :items="caller" />
    <v-details-panel-list title="Children" :items="children" />
  </div>
</template>

<script>
import VDetailsPanelList from '@/components/DetailsPanelList.vue';

export default {
  name: 'v-details-panel-event',
  components: {
    VDetailsPanelList,
  },
  props: {
    objectDescriptor: {
      type: Object,
      required: true,
    },
  },
  computed: {
    name() {
      if (this.objectDescriptor.codeObject) {
        return this.objectDescriptor.codeObject.id;
      }

      if (this.objectDescriptor.http_server_request) {
        /* eslint-disable camelcase */
        const { request_method, path_info } = this.objectDescriptor.http_server_request;
        return `${request_method} ${path_info}`;
        /* eslint-enable camelcase */
      }

      if (this.objectDescriptor.sql) {
        return 'SQL';
      }

      const { methodId, definedClass, isStatic } = this.objectDescriptor;
      return `${definedClass}${isStatic ? '#' : '.'}${methodId}`;
    },

    hasParameters() {
      return this.objectDescriptor.parameters && this.objectDescriptor.parameters.length;
    },

    hasMessage() {
      return this.objectDescriptor.message && this.objectDescriptor.message.length;
    },

    hasSql() {
      return Boolean(this.objectDescriptor.sql);
    },

    caller() {
      const { parent } = this.objectDescriptor;
      const val = [];

      if (parent && parent.codeObject) {
        val.push({
          kind: 'event',
          text: parent.codeObject.id,
          object: parent,
        });
      }

      return val;
    },

    children() {
      return [...new Set(this.objectDescriptor.children
        .filter((e) => e.codeObject)
        .map((e) => ({
          kind: 'event',
          text: `${e.codeObject.id} (${e.id})`,
          object: e,
        })))];
    },
  },
};
</script>

<style scoped lang="scss">
.details-event {
}
</style>
