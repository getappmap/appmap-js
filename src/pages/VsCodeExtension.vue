<template>
  <div id="app">
    <div class="main-column main-column--left">
      <v-details-panel
        :selected-object="selectedObject"
        :selected-label="selectedLabel"
      >
        <template v-slot:buttons>
          <v-details-button
            icon="clear"
            v-if="selectedObject"
            @click.native="clearSelection"
          >
            Clear selection
          </v-details-button>
          <v-details-button icon="back" v-if="canGoBack" @click.native="goBack">
            Back to
            <b v-if="prevSelectedObject && prevSelectedObject.name">
              {{ prevSelectedObject.name }}
            </b>
            <span v-else>previous</span>
          </v-details-button>
        </template>
      </v-details-panel>
    </div>

    <div class="main-column main-column--right">
      <v-tabs @activateTab="onChangeTab" ref="tabs">
        <v-tab
          name="Dependency Map"
          :is-active="isViewingComponent"
          :ref="VIEW_COMPONENT"
        >
          <v-diagram-component ref="componentDiagram" />
        </v-tab>

        <v-tab name="Trace" :is-active="isViewingFlow" :ref="VIEW_FLOW">
          <v-diagram-trace
            ref="diagramFlow"
            :events="rootEvents"
            :name="VIEW_FLOW"
          />
        </v-tab>
      </v-tabs>
    </div>
  </div>
</template>

<script>
import { Event } from '@/lib/models';
import VDetailsPanel from '../components/DetailsPanel.vue';
import VDetailsButton from '../components/DetailsButton.vue';
import VDiagramComponent from '../components/DiagramComponent.vue';
import VDiagramTrace from '../components/DiagramTrace.vue';
import VTabs from '../components/Tabs.vue';
import VTab from '../components/Tab.vue';
import {
  store,
  SET_APPMAP_DATA,
  SET_VIEW,
  VIEW_COMPONENT,
  VIEW_FLOW,
  POP_OBJECT_STACK,
  CLEAR_OBJECT_STACK,
} from '../store/vsCode';

export default {
  name: 'VSCodeExtension',

  components: {
    VDetailsPanel,
    VDetailsButton,
    VDiagramComponent,
    VDiagramTrace,
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
    '$store.getters.selectedObject': {
      handler(selectedObject) {
        if (selectedObject && !(selectedObject instanceof Event)) {
          this.setView(VIEW_COMPONENT);
        }
      },
    },
  },

  computed: {
    rootEvents() {
      const { appMap } = this.$store.state;
      let events = appMap.events.filter(
        (e) => e.isCall() && e.httpServerRequest
      );
      if (events.length === 0) {
        events = appMap.events.filter((e) => e.isCall() && !e.parent);
      }
      return events;
    },

    selectedObject() {
      return this.$store.getters.selectedObject;
    },

    selectedLabel() {
      return this.$store.getters.selectedLabel;
    },

    callTree() {
      return this.$store.state.appMap.callTree;
    },

    currentView() {
      return this.$store.state.currentView;
    },

    isViewingComponent() {
      return this.currentView === VIEW_COMPONENT;
    },

    isViewingFlow() {
      return this.currentView === VIEW_FLOW;
    },

    prevSelectedObject() {
      return this.$store.getters.prevSelectedObject;
    },

    canGoBack() {
      return this.$store.getters.canPopStack;
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

      this.setView(Object.keys(this.$refs)[index]);
    },

    setView(view) {
      if (this.currentView !== view) {
        this.$store.commit(SET_VIEW, view);
      }
    },

    clearSelection() {
      this.$store.commit(CLEAR_OBJECT_STACK);
    },

    goBack() {
      this.$store.commit(POP_OBJECT_STACK);
    },
  },
};
</script>

<style lang="scss">
html,
body {
  width: 100%;
  height: 100%;
  margin: 0;
}

* {
  box-sizing: border-box;
}

code {
  color: $teal;
}

#app {
  display: grid;
  grid-template-columns: 25% auto;
  grid-template-rows: max(1fr, 100%);
  height: 100vh;
  color: $base11;

  .main-column {
    overflow-y: scroll;

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
      background-color: $vs-code-gray1;
    }
  }
}
</style>
