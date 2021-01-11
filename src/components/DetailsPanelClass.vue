<template>
  <div class="details-panel-class">
    <h4>Class {{objectDescriptor.name}}</h4>
    <ul>
      <li>
        <a :href="sourceUrl">View source</a>
      </li>
    </ul>
    
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
  h4, a {
    margin: 0 2rem;
  }
  h4 {
    margin: 0 2rem;
    padding: .5rem 0;
    font-size: 1.3rem;
  }
  ul {
    list-style-type: none;
    padding: 0;
    margin: 0;
    width: 100%;
    li {
      width: 100%;
      a {
        width: 100%;
        padding: .5rem 0;
        border-top: 1px solid $gray3;
        border-bottom: 1px solid $gray3;
      }
    }
  }
}
</style>
