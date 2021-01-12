<template>
  <div class="details-panel-class">
    <div class="panel-heading">
      <ul>
        <h4>Class {{objectDescriptor.name}}</h4>
        <li>
           <a :href="sourceUrl">View source</a>
        </li>
      </ul>
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
  h4 {
    margin: 0;
    padding: .5rem 2rem;
    font-size: 1.3rem;
    border-bottom: 1px solid $gray3;
    font-weight: 400;
    letter-spacing: .5px;
  }
  ul {
    list-style-type: none;
    padding: 0;
    margin: 0 0 1rem 0;
    width: 100%;
    li {
      width: 100%;
      border-bottom: 1px solid $gray3;
      padding: .5rem 0;
      transition: $transition;
      a {
        margin: 0 2rem;
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
