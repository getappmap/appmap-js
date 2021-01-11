<template>
  <div class="details-panel-event">
    <h3>{{name}}</h3>

    <div class="sql-code" v-if="hasSql">
      <code>{{this.objectDescriptor.sql.sql}}</code>
    </div>

    <div v-if="hasParameters">
      <h4>Parameters</h4>
      <ul>
        <li v-for="(param, index) in objectDescriptor.parameters" :key="index">
          <strong>{{param.name}}</strong>
          <code>{{param.value}}</code>
        </li>
      </ul>
    </div>

    <div v-if="hasMessage">
      <h4>Parameters</h4>
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
.details-panel-event {
  h3 {
    padding: 0 2rem;
  }
  h4 {
    margin: 0;
    padding: .5rem 2rem;
    font-size: 1.3rem;
    border-bottom: 1px solid $gray3;
  }
  .sql-code {
    padding: 0 2rem;
  }
  ul {
    list-style-type: none;
    padding: 0;
    margin: 0 0 1rem 0;
    width: 100%;
    li {
      width: 100%;
      border-bottom: 1px solid $gray3;
      padding: .5rem 2rem;
      transition: $transition;
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      a {
        margin: 0 2rem;
        width: 100%;
      }
    }
  }
}
</style>
