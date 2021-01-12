<template>
  <div class="details-panel-event">
    <div class="details-panel-header">
      <h4 class="details-type">Event</h4>
      <h4>{{name}}</h4>
    </div>

    <div class="sql-code" v-if="hasSql">
      <code>{{this.objectDescriptor.sql.sql}}</code>
    </div>

    <div class="event-params" v-if="hasParameters">
      <h5>Parameters</h5>
      <ul class="table-01">
        <li v-for="(param, index) in objectDescriptor.parameters" :key="index">
          <strong>{{param.name}}</strong>
          <code>{{param.value}}</code>
        </li>
      </ul>
    </div>

    <div class="event-params" v-if="hasMessage">
      <h5>Parameters</h5>
      <ul class="table-01">
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
  .sql-code {
    padding: 0 2rem;
  }
  .event-params {
    padding: 0 2rem;
    color: $gray4;
    h5 {
      color: lighten($gray4,15);
      font-size: 1.1rem;
      font-weight: 500;
      line-height: 1.2;
      margin: 0 0 .25rem 0;
    }
    .table-01 {
      font-size: 14px;
      font-family: sans-serif;
      font-weight: 500;
    }
  }
  ul {
    list-style-type: none;
    padding: 0;
    margin: 0 0 1.5rem 0;
    width: 100%;
    li {
      width: 100%;
      border-bottom: 1px solid $gray3;
      padding: .5rem 0;
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
