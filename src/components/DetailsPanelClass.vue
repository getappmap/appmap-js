<template>
  <div class="details-panel-class">
    <div class="details-panel-header">
      <h4 class="details-type">Class</h4>
      <h4>{{objectDescriptor.name}}</h4>
      <div class="ghost-link">
        <a :href="sourceUrl">View source</a>
      </div>
    </div>

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
        kind: 'function',
        text: obj.name,
        object: obj,
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
          kind: 'function',
          text: obj.id,
          object: obj,
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
          kind: 'function',
          text: obj.id,
          object: obj,
        }));
    },
  },
};
</script>

<style scoped lang="scss">
.details-panel-class {
  ul {
    list-style-type: none;
    padding: 0;
    margin: 0 0 1rem 0;
    width: 100%;
    li {
      width: 100%;
      padding: .5rem 0;
      transition: $transition;
      a {
        width: 100%;
      }
      &:hover {
        background-color: $blue;
        border-color: $blue;
        a {
          color: $white;
        }
      }
    }
  }
}
</style>
