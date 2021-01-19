<template>
  <div>
    <v-details-panel-header object-type="Database" />
    <v-details-panel-list
      title="Inbound connections"
      :items="inboundConnections"
    />
    <v-details-panel-list title="Queries" :items="queries" />
  </div>
</template>

<script>
import VDetailsPanelHeader from '@/components/DetailsPanelHeader.vue';
import VDetailsPanelList from '@/components/DetailsPanelList.vue';

export default {
  name: 'v-details-panel-database',
  components: {
    VDetailsPanelList,
    VDetailsPanelHeader,
  },
  computed: {
    events() {
      return this.$store.state.appMap.events.filter((e) => e.isCall() && e.sql);
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

    queries() {
      return this.events
        .filter((e) => e.isCall() && e.sql)
        .map((e) => ({
          kind: 'event',
          text: e.sql.sql,
          object: e,
        }));
    },
  },
};
</script>

<style scoped lang="scss"></style>
