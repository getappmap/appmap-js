<template>
  <div id="app">
    <div class="column column--left">
      <v-details-panel :selected-object="selectedObject" />
    </div>

    <div class="column column--right">
    <v-tabs @activateTab="onChangeTab" ref="tabs">
        <v-tab name="Component diagram" :is-active="isViewingComponent" :ref="VIEW_COMPONENT">
          <v-diagram-component :component-data="components" />
        </v-tab>

        <v-tab name="Flow view" :is-active="isViewingFlow" :ref="VIEW_FLOW">
          <v-diagram-flow :call-tree="callTree" />
        </v-tab>
    </v-tabs>
    </div>
  </div>
</template>

<script>
import VDetailsPanel from '../components/DetailsPanel.vue';
import VDiagramComponent from '../components/DiagramComponent.vue';
import VDiagramFlow from '../components/DiagramFlow.vue';
import VTabs from '../components/Tabs.vue';
import VTab from '../components/Tab.vue';
import {
  store,
  SET_APPMAP_DATA,
  SET_VIEW,
  VIEW_COMPONENT,
  VIEW_FLOW,
} from '../store/vsCode';

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

  data() {
    return {
      VIEW_COMPONENT,
      VIEW_FLOW,
    };
  },

  watch: {
    '$store.state.currentView': {
      handler(view) {
        this.onChangeTab(this.$refs[view]);
        this.$refs.tabs.activateTab(this.$refs[view]);
      },
    },
  },

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

    isViewingComponent() {
      return this.$store.state.currentView === VIEW_COMPONENT;
    },

    isViewingFlow() {
      return this.$store.state.currentView === VIEW_FLOW;
    },
  },

  methods: {
    loadData(data) {
      this.$store.commit(SET_APPMAP_DATA, data);
    },

    onChangeTab(tab) {
      // tabs are referenced by their view key
      const index = Object.values(this.$refs).findIndex((ref) => ref === tab);
      if (index === -1) {
        // There's no ref set up for this tab
        return;
      }

      const viewKey = Object.keys(this.$refs)[index];
      this.$store.commit(SET_VIEW, viewKey);
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
    grid-template-columns: 25% auto;
    grid-template-rows: max(1fr, 100%);
    height: 100vh;

    .column {
      &--left {
        grid-column: 1;
        width: 100%;
        background-color: $gray2;
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
