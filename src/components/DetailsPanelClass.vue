<template>
  <div class="details-panel-class">
    <v-details-panel-header object-type="Class" :title="objectDescriptor.name">
      <template v-slot:links>
        <a href="#" @click.prevent="viewSource">View source</a>
      </template>
    </v-details-panel-header>

    <v-details-panel-list title="Functions" :items="functions" />
    <v-details-panel-list
      title="Inbound connections"
      :items="inboundConnections"
    />
    <v-details-panel-list
      title="Outbound connections"
      :items="outboundConnections"
    />
    <v-details-panel-list title="Queries" :items="queries" />
  </div>
</template>

<script>
import VDetailsPanelHeader from '@/components/DetailsPanelHeader.vue';
import VDetailsPanelList from '@/components/DetailsPanelList.vue';

function groupEvents(array) {
  const arr = Array.from(array);
  const firstItemIndex = {};

  arr.forEach((item, index) => {
    if (!firstItemIndex[item.kind]) {
      firstItemIndex[item.kind] = {};
    }

    /* eslint-disable */
    if (!~Object.keys(firstItemIndex[item.kind]).indexOf(item.text)) {
      firstItemIndex[item.kind][item.text] = index;
    } else {
      if (!arr[firstItemIndex[item.kind][item.text]]['count']) {
        arr[firstItemIndex[item.kind][item.text]]['count'] = 1;
      }

      arr[firstItemIndex[item.kind][item.text]]['count'] += 1;
      arr[index] = null;
    }
    /* eslint-enable */
  });

  return arr.filter(Boolean);
}

export default {
  name: 'v-details-panel-class',
  components: {
    VDetailsPanelHeader,
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
      const { events } = this.$store.state.appMap;
      const { id } = this.objectDescriptor;
      const functionCallsCount = events
        .filter(
          (e) => e.isCall() && e.codeObject && e.codeObject.parent.id === id,
        )
        .reduce((acc, e) => {
          acc[e.methodId] = acc[e.methodId] + 1 || 1;
          return acc;
        }, {});

      return this.objectDescriptor.children.map((obj) => ({
        kind: 'function',
        text: obj.name,
        object: obj,
        count: functionCallsCount[obj.name],
      }));
    },

    events() {
      return this.$store.state.appMap.events.filter(
        (e) => e.codeObject && e.codeObject.parent === this.objectDescriptor,
      );
    },

    inboundConnections() {
      const connections = this.events
        .map((e) => e.parent)
        .filter(Boolean)
        .map((parent) => ({
          kind: parent.codeObject.type,
          text: parent.toString(),
          count: 1,
          object: parent.codeObject,
        }));

      return groupEvents(connections);
    },

    outboundConnections() {
      const connections = this.events
        .map((e) => e.children || [])
        .flat()
        .map((child) => ({
          kind: child.codeObject.type,
          text: child.toString(),
          count: 1,
          object: child.codeObject,
        }));

      return groupEvents(connections);
    },

    queries() {
      return this.events
        .map((e) => e.children)
        .flat()
        .filter((e) => e && e.sql)
        .map((e) => ({
          kind: 'event',
          text: e.sql.sql,
          object: e,
        }));
    },
  },

  methods: {
    viewSource() {
      this.$root.$emit('viewSource', this.objectDescriptor.locations[0]);
    },
  },
};
</script>

<style scoped lang="scss">
.details-panel-class {
  h4 {
    margin: 0;
    padding: 0.5rem 2rem;
    font-size: 1.3rem;
    border-bottom: 1px solid $gray3;
  }
  ul {
    list-style-type: none;
    padding: 0;
    margin: 0 0 1rem 0;
    width: 100%;
    li {
      width: 100%;
      border-bottom: 1px solid $gray3;
      padding: 0.5rem 0;
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
