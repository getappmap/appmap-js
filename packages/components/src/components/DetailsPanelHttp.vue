<template>
  <div>
    <v-details-panel-header :objectType="object.data.name" :object="object" />
    <v-details-panel-filters />
    <v-details-panel-list title="Routes" :items="object.children" />
  </div>
</template>

<script>
import VDetailsPanelHeader from '@/components/DetailsPanelHeader.vue';
import VDetailsPanelFilters from '@/components/DetailsPanelFilters.vue';
import VDetailsPanelList from '@/components/DetailsPanelList.vue';

export default {
  name: 'v-details-panel-http',
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
};
</script>

<style scoped lang="scss"></style>
