<template>
  <div id="app" :key="renderKey">
    <div class="main-column main-column--left">
      <v-details-panel
        :selected-object="selectedObject"
        :selected-label="selectedLabel"
      >
        <template v-slot:buttons>
          <v-details-button
            icon="clear"
            v-if="selectedObject || selectedLabel"
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
            :selected-events="selectedEvent"
            :name="VIEW_FLOW"
            @clickEvent="onClickTraceEvent"
          />
        </v-tab>
      </v-tabs>
      <button class="diagram-reload" @click="resetDiagram">
        <span class="diagram-reload__text">Clear</span>
        <ReloadIcon class="diagram-reload__icon" />
      </button>
      <div class="diagram-instructions">
        <v-instructions ref="instructions" />
      </div>
    </div>
  </div>
</template>

<script>
import { Event } from '@/lib/models';
import ReloadIcon from '@/assets/reload.svg';
import VDetailsPanel from '../components/DetailsPanel.vue';
import VDetailsButton from '../components/DetailsButton.vue';
import VDiagramComponent from '../components/DiagramComponent.vue';
import VDiagramTrace from '../components/DiagramTrace.vue';
import VInstructions from '../components/Instructions.vue';
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
  SELECT_OBJECT,
} from '../store/vsCode';

export default {
  name: 'VSCodeExtension',

  components: {
    ReloadIcon,
    VDetailsPanel,
    VDetailsButton,
    VDiagramComponent,
    VDiagramTrace,
    VInstructions,
    VTabs,
    VTab,
  },

  store,

  data() {
    return {
      renderKey: 0,
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

    selectedEvent() {
      return this.selectedObject instanceof Event ? [this.selectedObject] : [];
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

    showInstructions() {
      this.$refs.instructions.open();
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

    resetDiagram() {
      this.clearSelection();

      this.renderKey += 1;
    },

    onClickTraceEvent(e) {
      this.$store.commit(SELECT_OBJECT, e);
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
    overflow-y: auto;

    &--left {
      grid-column: 1;
      width: 100%;
      background-color: $gray2;
    }

    &--right {
      position: relative;
      grid-column-start: 2;
      grid-column-end: 3;
      width: 100%;
      min-width: 250px;
      word-break: break-all;
      overflow: hidden;
      background-color: $vs-code-gray1;

      .diagram-reload {
        position: absolute;
        top: 1.8rem;
        right: 1.3rem;
        border: none;
        display: inline-flex;
        align-items: center;
        padding: 0.2rem;
        background: transparent;
        color: $gray4;
        font: inherit;
        font-family: $appland-text-font-family;
        font-size: 0.8rem;
        outline: none;
        line-height: 0;
        appearance: none;
        cursor: pointer;
        transition: color 0.3s ease-in;

        &:hover,
        &:active {
          color: $gray5;
          transition-timing-function: ease-out;
        }

        &__text {
          margin-right: 0.5rem;
          letter-spacing: 0.5px;
          opacity: 0;
          transition: opacity 0.3s ease-in;
          text-transform: uppercase;
        }

        &:hover .diagram-reload__text,
        &:active .diagram-reload__text {
          opacity: 1;
          transition-timing-function: ease-out;
        }

        &__icon {
          width: 1rem;
          height: 1rem;
          fill: currentColor;
        }
      }

      .diagram-instructions {
        position: absolute;
        right: 1.3rem;
        bottom: 1.3rem;
      }
    }
  }
}
</style>
