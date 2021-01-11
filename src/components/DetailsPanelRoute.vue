<template>
  <div class="details-panel-route">
    <v-details-panel-list title="Events" :items="events"/>
  </div>
</template>

<script>
import VDetailsPanelList from '@/components/DetailsPanelList.vue';
import { SELECT_OBJECT } from '@/store/vsCode';

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
  },
};
</script>

<style scoped lang="scss">
.details-route {
}
</style>
