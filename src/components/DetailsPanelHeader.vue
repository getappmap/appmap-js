<template>
  <div class="details-panel-header">
    <v-details-panel-list title="Events" :items="events" />
  </div>
</template>

<script>
import VDetailsPanelList from '@/components/DetailsPanelList.vue';

export default {
  name: 'v-details-panel-header',
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
    events() {
      return this.$store.state.appMap.events
        .filter((e) => e.isCall() && e.codeObject === this.objectDescriptor)
        .map((e) => ({
          kind: 'event',
          text: e.codeObject.id,
          object: e,
        }));
    },
  },
};
</script>

<style scoped lang="scss">
.details-function {
}
</style>
