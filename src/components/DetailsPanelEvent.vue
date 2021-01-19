<template>
  <div class="details-panel-event">
    <v-details-panel-header object-type="Event" :title="name">
      <template v-slot:links>
        <a
          href="#"
          @click.prevent="viewEvent"
          v-if="shouldDisplayViewEvent"
          class="details-panel-event__view-event"
        >
          Show in flow view
        </a>
        <a
          href="#"
          v-if="location !== null"
          @click.prevent="viewSource"
          ref="viewSource"
        >
          View source
        </a>
      </template>
    </v-details-panel-header>

    <div class="sql-code" v-if="hasSql">
      <pre>{{ formattedSQL }}</pre>
    </div>

    <div class="event-params" v-if="hasParameters">
      <h5>Parameters</h5>
      <ul class="table-01">
        <li v-for="(param, index) in objectDescriptor.parameters" :key="index">
          <strong>{{ param.name }}</strong>
          <code>{{ param.value }}</code>
        </li>
      </ul>
    </div>

    <div class="event-params" v-if="hasMessage">
      <h5>Parameters</h5>
      <ul class="table-01">
        <li v-for="(param, index) in objectDescriptor.message" :key="index">
          <i>{{ param.class }}</i>
          <strong>{{ param.name }}</strong>
          <code>{{ param.value }}</code>
        </li>
      </ul>
    </div>

    <div class="event-params" v-if="hasReturnValue">
      <h5>Return value</h5>
      <ul class="table-01">
        <li>
          <i>{{ objectDescriptor.returnValue.class }}</i>
          <code>{{ objectDescriptor.returnValue.value }}</code>
        </li>
      </ul>
    </div>

    <v-details-panel-list title="Caller" :items="caller" />
    <v-details-panel-list title="Children" :items="children" />
  </div>
</template>

<script>
import sqlFormatter from 'sql-formatter';
import VDetailsPanelHeader from '@/components/DetailsPanelHeader.vue';
import VDetailsPanelList from '@/components/DetailsPanelList.vue';
import { SET_VIEW, VIEW_FLOW } from '@/store/vsCode';

export default {
  name: 'v-details-panel-event',
  components: {
    VDetailsPanelList,
    VDetailsPanelHeader,
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
        const {
          request_method,
          path_info,
        } = this.objectDescriptor.http_server_request;
        return `${request_method} ${path_info}`;
        /* eslint-enable camelcase */
      }

      if (this.objectDescriptor.sql) {
        const event = this.$store.state.appMap.rootEvent.find(
          (e) => e.input.id === this.objectDescriptor.id,
        );
        return event && event.displayName ? event.displayName : 'SQL';
      }

      const { methodId, definedClass, isStatic } = this.objectDescriptor;
      return `${definedClass}${isStatic ? '#' : '.'}${methodId}`;
    },

    hasParameters() {
      return (
        this.objectDescriptor.parameters &&
        this.objectDescriptor.parameters.length
      );
    },

    hasMessage() {
      return (
        this.objectDescriptor.message && this.objectDescriptor.message.length
      );
    },

    hasSql() {
      return Boolean(this.objectDescriptor.sql);
    },

    hasReturnValue() {
      return Boolean(this.objectDescriptor.returnValue);
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
      return [
        ...new Set(
          this.objectDescriptor.children
            .filter((e) => e.codeObject)
            .map((e) => ({
              kind: 'event',
              text: `${e.codeObject.id} (${e.id})`,
              object: e,
            })),
        ),
      ];
    },

    shouldDisplayViewEvent() {
      return this.$store.state.currentView !== VIEW_FLOW;
    },

    location() {
      let loc = null;
      if (this.objectDescriptor.codeObject) {
        loc = this.objectDescriptor.codeObject.location || null;
      }
      return loc;
    },

    formattedSQL() {
      return sqlFormatter.format(this.objectDescriptor.sql.sql);
    },
  },

  methods: {
    viewEvent() {
      this.$store.commit(SET_VIEW, VIEW_FLOW);
    },

    viewSource() {
      this.$root.$emit('viewSource', this.location);
    },
  },
};
</script>

<style scoped lang="scss">
.details-panel-event {
  &__view-event {
    display: inline-block;
    padding: 0 2rem;
    margin-bottom: 1rem;
  }

  h3 {
    padding: 0 2rem;
  }
  .sql-code {
    margin-bottom: 1.5rem;
    padding: 0 2rem;
  }
  .event-params {
    padding: 0;
    color: $base11;
    h5 {
      color: $base03;
      font-size: 1.1rem;
      font-weight: 500;
      line-height: 1.2;
      margin: 0 0 0.25rem 0;
      padding: 0 2rem;
    }
    .table-01 {
      font-size: 14px;
      font-family: sans-serif;
      font-weight: 500;
      li {
        padding: 0.5rem 2rem;
      }
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
      padding: 0.5rem 0;
      transition: $transition;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      a {
        margin: 0 2rem;
        width: 100%;
      }
    }
  }
}
</style>
