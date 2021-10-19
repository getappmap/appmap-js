<template>
  <div>
    <v-details-panel-header
      object-type="External service"
      :object="object"
      :title="object.name"
    />
    <v-details-panel-filters />
    <v-details-panel-list
      title="Events"
      :items="object.events"
      :event-quickview="true"
    />
  </div>
</template>

<script>
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
  },
  computed: {},
};
</script>

<style scoped lang="scss"></style>
