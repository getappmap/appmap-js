<template>
  <div class="details-panel-function">
    <div class="details-panel-header">
      <h4 class="details-type">Function</h4>
      <h4>{{objectDescriptor.name}}</h4>
    </div>
    <v-details-panel-list title="Events" :items="events" />
  </div>
</template>

<script>
import VDetailsPanelList from '@/components/DetailsPanelList.vue';

export default {
  name: 'v-details-panel-function',
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
.details-panel-function {
  
}
</style>
