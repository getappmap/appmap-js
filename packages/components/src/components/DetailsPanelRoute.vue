<template>
  <div>
    <v-details-panel-header object-type="Route" :object="object" :title="object.name" />
    <v-details-panel-filters :object="object" :is-root-object="isRootObject" />
    <v-details-panel-list title="Events" :items="object.events" :event-quickview="true" />
    <v-details-panel-list title="Outbound connections" :items="outboundConnections" />
    <v-details-panel-list title="Queries" :items="queryEvents" />
  </div>
</template>

<script>
import { CodeObjectType } from '@appland/models';
import VDetailsPanelHeader from '@/components/DetailsPanelHeader.vue';
import VDetailsPanelFilters from '@/components/DetailsPanelFilters.vue';
import VDetailsPanelList from '@/components/DetailsPanelList.vue';

export default {
  name: 'v-details-panel-route',
  components: {
    VDetailsPanelList,
    VDetailsPanelFilters,
    VDetailsPanelHeader,
  },
  props: {
    object: {
      type: Object,
      required: true,
    },
    isRootObject: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  computed: {
    outboundConnections() {
      // Queries will appear in outbound connections, but we have a separate section for queries so
      // filter them out of this list
      return this.object.outboundConnections.filter((obj) => obj.type !== CodeObjectType.QUERY);
    },
    queryEvents() {
      return this.object.sqlQueries.map((obj) => obj.events).flat();
    },
  },
};
</script>

<style scoped lang="scss"></style>
