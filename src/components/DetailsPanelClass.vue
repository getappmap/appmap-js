<template>
  <div class="details-panel-class">
    <h4>Class {{objectDescriptor.name}}</h4>
    <a :href="sourceUrl">View source</a>
    <v-details-panel-list title="Functions" :items="functions"/>
    <v-details-panel-list title="Inbound connections" :items="inboundConnections"/>
    <v-details-panel-list title="Outbound connections" :items="outboundConnections"/>
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
      return this.objectDescriptor.children.map((obj) => ({
        text: obj.name,
      }));
    },

    events() {
      return this.$store.state.appMap.events
        .filter((e) => e.codeObject && e.codeObject.parent === this.objectDescriptor);
    },

    inboundConnections() {
      const parentObjects = this.events
        .map((e) => (e.parent ? e.parent.codeObject : null))
        .filter(Boolean);

      return [...new Set(parentObjects)]
        .map((obj) => ({
          text: obj.id,
        }));
    },

    outboundConnections() {
      const childrenObjects = this.events
        .map((e) => e.children)
        .flat()
        .filter(Boolean)
        .map((e) => e.codeObject)
        .filter(Boolean);

      return [...new Set(childrenObjects)]
        .map((obj) => ({
          text: obj.id,
        }));
    },
  },
};
</script>

<style scoped lang="scss">
.details-panel {
}
</style>
