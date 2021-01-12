<template>
  <div class="details-panel-http">
    <div class="details-panel-header">
      <h4 class="details-type">HTTP</h4>
    </div>
    <v-details-panel-list title="Routes" :items="routes" />
  </div>
</template>

<script>
import VDetailsPanelList from '@/components/DetailsPanelList.vue';

export default {
  name: 'v-details-panel-http',
  components: {
    VDetailsPanelList,
  },
  computed: {
    routes() {
      const routeEvents = this.$store.state.appMap.events
        .filter((e) => e.isCall() && e.http_server_request)
        .reduce((map, e) => {
          /* eslint-disable camelcase */
          /* eslint-disable no-param-reassign */
          const { request_method, path_info } = e.http_server_request;
          const key = `${request_method} ${path_info}`;
          let events = map[key];

          if (!events) {
            events = [];
            map[key] = events;
          }

          events.push(e);
          return map;
          /* eslint-enable no-param-reassign */
          /* eslint-enable camelcase */
        }, {});

      return Object.entries(routeEvents)
        .map(([route, events]) => ({
          kind: 'route',
          text: route,
          object: events,
        }));
    },
  },
};
</script>

<style scoped lang="scss">
.details-http {
}
</style>
