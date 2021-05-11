<template>
  <div>
    <v-details-panel-header
      object-type="HTTP server requests"
      :object="object"
    />
    <v-details-panel-list title="Routes" :items="object.children" />
  </div>
</template>

<script>
import VDetailsPanelHeader from '@/components/DetailsPanelHeader.vue';
import VDetailsPanelList from '@/components/DetailsPanelList.vue';

export default {
  name: 'v-details-panel-http',
  components: {
    VDetailsPanelList,
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
