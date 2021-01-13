<template>
  <div>
    <v-details-panel-header object-type="Route" :title="routeName" />
    <v-details-panel-list title="Events" :items="events"/>
  </div>
</template>

<script>
import VDetailsPanelHeader from '@/components/DetailsPanelHeader.vue';
import VDetailsPanelList from '@/components/DetailsPanelList.vue';

export default {
  name: 'v-details-panel-route',
  props: {
    objectDescriptor: {
      type: Array,
      required: true,
    },
  },

  components: {
    VDetailsPanelList,
    VDetailsPanelHeader,
  },

  computed: {
    events() {
      return this.objectDescriptor.map((e) => {
        /* eslint-disable camelcase */
        const {
          path_info,
          request_method,
        } = e.http_server_request;

        return {
          kind: 'event',
          text: `${request_method} ${path_info}`,
          object: e,
        };
        /* eslint-enable camelcase */
      });
    },

    routeName() {
      if (!this.events.length) {
        return '';
      }

      return this.events[0].text;
    },
  },
};
</script>

<style scoped lang="scss">
</style>
