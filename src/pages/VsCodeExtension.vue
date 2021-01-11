<template>
  <div id="app">
    <div class="column column--left">
      <v-details-panel :selected-object="selectedObject" />
    </div>

    <div class="column column--right">
    <v-tabs>
      <v-tab name="Component diagram">
        <v-diagram-component :component-data="components" />
      </v-tab>

      <v-tab name="Flow view">
        <v-diagram-flow :call-tree="callTree" />
      </v-tab>
    </v-tabs>
    </div>
  </div>
</template>

<script>
import { store, SET_APPMAP_DATA } from '../store/vsCode';
import VDetailsPanel from '../components/DetailsPanel.vue';
import VDiagramComponent from '../components/DiagramComponent.vue';
import VDiagramFlow from '../components/DiagramFlow.vue';
import VTabs from '../components/Tabs.vue';
import VTab from '../components/Tab.vue';

export default {
  name: 'VSCodeExtension',

  components: {
    VDetailsPanel,
    VDiagramComponent,
    VDiagramFlow,
    VTabs,
    VTab,
  },

  store,

  computed: {
    selectedObject() {
      return this.$store.getters.selectedObject;
    },

    components() {
      return this.$store.state.appMap.components;
    },

    callTree() {
      return this.$store.state.appMap.callTree;
    },
  },

  methods: {
    loadData(data) {
      this.$store.commit(SET_APPMAP_DATA, data);
    },
  },
};
</script>

<style lang="scss">
  html, body {
    width: 100%;
    height: 100%;
    margin: 0;
  }

  * {
    box-sizing: border-box;
  }

  #app {
    display: grid;
    grid-template-columns: 24em auto;
    grid-template-rows: max(1fr, 100%);
    height: 100vh;

    .column {
      &--left {
        grid-column: 1;
        width: 100%;
        overflow: scroll;
      }

      &--right {
        grid-column-start: 2;
        grid-column-end: 3;
        width: 100%;
        min-width: 250px;
        word-break: break-all;
        overflow: hidden;
      }
    }
  }
</style>
