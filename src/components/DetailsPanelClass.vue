<template>
  <div class="details-panel-class">
    <v-details-panel-header object-type="Class" :title="objectDescriptor.name">
      <template v-slot:links>
        <a href="#" @click.prevent="viewSource">View source</a>
      </template>
    </v-details-panel-header>

    <v-details-panel-list title="Functions" :items="functions" />
    <v-details-panel-list
      title="Inbound connections"
      :items="inboundConnections"
    />
    <v-details-panel-list
      title="Outbound connections"
      :items="outboundConnections"
    />
    <v-details-panel-list title="Queries" :items="queries" />
  </div>
</template>

<script>
import VDetailsPanelHeader from '@/components/DetailsPanelHeader.vue';
import VDetailsPanelList from '@/components/DetailsPanelList.vue';

export default {
  name: 'v-details-panel-class',
  components: {
    VDetailsPanelHeader,
    VDetailsPanelList,
  },

  props: {
    objectDescriptor: {
      type: Object,
      required: true,
    },
  },

  computed: {
    sourceUrl() {
      const [location] = this.objectDescriptor.classLocations();
      return `vscode://${location}`;
    },

    functions() {
      const { events } = this.$store.state.appMap;
      const { id } = this.objectDescriptor;
      const functionCallsCount = events
        .filter(
          (e) => e.isCall() && e.codeObject && e.codeObject.parent.id === id,
        )
        .reduce((acc, e) => {
          acc[e.methodId] = acc[e.methodId] + 1 || 1;
          return acc;
        }, {});

      return this.objectDescriptor.children.map((obj) => ({
        kind: 'function',
        text: obj.name,
        object: obj,
        count: functionCallsCount[obj.name],
      }));
    },

    events() {
      return this.$store.state.appMap.events.filter(
        (e) => e.codeObject && e.codeObject.parent === this.objectDescriptor,
      );
    },

    inboundConnections() {
      const parentObjects = this.events
        .map((e) => (e.parent ? e.parent.codeObject : null))
        .filter(Boolean);

      const connections = [...new Set(this.events.map((e) => e.parent))]
        .filter((e) => e && e.http_server_request)
        .map((e) => {
          /* eslint-disable camelcase */
          const { path_info, request_method } = e.http_server_request;

          return {
            kind: 'route',
            text: `${request_method} ${path_info}`,
            object: e,
          };
          /* eslint-enable camelcase */
        });

      [...new Set(parentObjects)]
        .map((obj) => ({
          kind: 'function',
          text: obj.id,
          object: obj,
        }))
        .forEach((obj) => connections.push(obj));

      return connections;
    },

    outboundConnections() {
      return this.events
        .map((e) => e.children)
        .flat()
        .filter(Boolean)
        .map((e) => e.codeObject)
        .filter(Boolean)
        .map((obj) => ({
          kind: 'function',
          text: obj.id,
          object: obj,
        }));
    },

    queries() {
      return this.events
        .map((e) => e.children)
        .flat()
        .filter((e) => e && e.sql)
        .map((e) => ({
          kind: 'event',
          text: e.sql.sql,
          object: e,
        }));
    },
  },

  methods: {
    viewSource() {
      this.$root.$emit('viewSource', this.objectDescriptor.locations[0]);
    },
  },
};
</script>

<style scoped lang="scss">
.details-panel-class {
  h4 {
    margin: 0;
    padding: 0.5rem 2rem;
    font-size: 1.3rem;
    border-bottom: 1px solid $gray3;
  }
  ul {
    list-style-type: none;
    padding: 0;
    margin: 0 0 1rem 0;
    width: 100%;
    li {
      width: 100%;
      border-bottom: 1px solid $gray3;
      padding: 0.5rem 0;
      transition: $transition;
      a {
        margin: 0 2rem;
        width: 100%;
      }
      &:hover {
        background-color: $blue;
        border-color: $blue;
        a {
          color: $white;
        }
      }
    }
  }
}
</style>
