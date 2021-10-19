<template>
  <div>
    <v-details-panel-header object-type="Database" />
    <v-details-panel-filters />
    <v-details-panel-list
      title="Inbound connections"
      :items="object.inboundConnections"
    />
    <v-details-panel-list title="Queries" :items="queryEvents" />
  </div>
</template>

<script>
import VDetailsPanelHeader from '@/components/DetailsPanelHeader.vue';
import VDetailsPanelFilters from '@/components/DetailsPanelFilters.vue';
import VDetailsPanelList from '@/components/DetailsPanelList.vue';

export default {
  name: 'v-details-panel-database',
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
  },
  computed: {
    queryEvents() {
      return this.object.children.map((obj) => obj.events).flat();
    },
  },
};
</script>

<style scoped lang="scss"></style>
