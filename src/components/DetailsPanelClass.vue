<template>
  <div class="details-panel-class">
    <h4>Class {{objectDescriptor.name}}</h4>
    <a :href="sourceUrl">View source</a>
    <v-details-panel-list title="Functions"/>
  </div>
</template>

<script>
import VDetailsPanelList from '@/components/DetailsPanelList.vue';

export default {
  name: 'v-details-panel-class',
  components: {
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
      return this.objectDescriptor.children;
    },
  },
};
</script>

<style scoped lang="scss">
.details-panel {
}
</style>
