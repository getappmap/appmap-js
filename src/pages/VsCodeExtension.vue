<template>
  <div id="app" :key="renderKey">
    <div class="main-column main-column--left">
      <v-details-panel
        :appMap="filteredAppMap"
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
          <v-diagram-component
            ref="componentDiagram"
            :class-map="filteredAppMap.classMap"
          />
        </v-tab>

        <v-tab name="Trace" :is-active="isViewingFlow" :ref="VIEW_FLOW">
          <v-diagram-trace
            ref="diagramFlow"
            :events="filteredAppMap.rootEvents()"
            :selected-events="selectedEvent"
            :name="VIEW_FLOW"
            :zoom-controls="true"
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

    <div class="no-data-notice" v-if="isEmptyAppMap">
      <div class="notice">
        <p class="no-data-notice__title">
          Sorry, but there's no data to display :(
        </p>
        <ul class="why-me">
          <strong>Top 3 reasons why this appmap is empty:</strong>
          <li>
            appmap.yml did not list packages/modules/folders of your application
            logic
          </li>
          <li>
            If this AppMap was recorded from a test, the test did not provide
            sufficient coverage for good data
          </li>
          <li>
            If other manual method was used to record this AppMap, the
            instrumented code objects were not executed during the recording.
          </li>
        </ul>
        <p class="no-data-notice__text">
          Check our
          <a
            href="https://github.com/applandinc/appmap"
            target="_blank"
            rel="noopener noreferrer"
          >
            documentation</a
          >,<br />
          or ask for help in
          <a
            href="https://discord.com/invite/N9VUap6"
            target="_blank"
            rel="noopener noreferrer"
          >
            Discord</a
          >.
        </p>
      </div>
      <DiagramGray class="empty-state-diagram" />
    </div>
  </div>
</template>

<script>
import { Event, buildAppMap } from '@/lib/models';
import ReloadIcon from '@/assets/reload.svg';
import DiagramGray from '@/assets/diagram-empty.svg';
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
  SELECT_OBJECT,
  SELECT_LABEL,
  POP_OBJECT_STACK,
  CLEAR_OBJECT_STACK,
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
    DiagramGray,
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

        if (selectedObject && selectedObject.fqid) {
          this.emitSelectedObject(selectedObject.fqid);
        } else {
          this.emitSelectedObject(null);
        }
      },
    },
    '$store.getters.selectedLabel': {
      handler(selectedLabel) {
        this.emitSelectedObject(
          selectedLabel ? `label:${selectedLabel}` : null
        );
      },
    },
  },

  computed: {
    filteredAppMap() {
      const { appMap } = this.$store.state;
      const events = appMap.rootEvents().reduce((callTree, rootEvent) => {
        rootEvent.traverse((e) => callTree.push(e));
        return callTree;
      }, []);

      return buildAppMap({
        events,
        classMap: appMap.classMap.roots.map((c) => ({ ...c.data })),
        metadata: appMap.metadata,
      }).build();
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

    isEmptyAppMap() {
      const appMap = this.filteredAppMap;
      const hasEvents = Array.isArray(appMap.events) && appMap.events.length;
      const hasClassMap =
        Array.isArray(appMap.classMap.codeObjects) &&
        appMap.classMap.codeObjects.length;

      return !hasEvents || !hasClassMap;
    },
  },

  methods: {
    loadData(data) {
      this.$store.commit(SET_APPMAP_DATA, data);
    },

    showInstructions() {
      this.$refs.instructions.open();
      this.$root.$emit('showInstructions');
    },

    onChangeTab(tab) {
      // tabs are referenced by their view key
      const index = Object.values(this.$refs).findIndex((ref) => ref === tab);
      if (index === -1) {
        // There's no ref set up for this tab
        return;
      }

      const viewKey = Object.keys(this.$refs)[index];
      this.setView(viewKey);
      this.$root.$emit('changeTab', viewKey);
    },

    setView(view) {
      if (this.currentView !== view) {
        this.$store.commit(SET_VIEW, view);
      }
    },

    emitSelectedObject(fqid) {
      this.$root.$emit('selectedObject', fqid);
    },

    setSelectedObject(fqid) {
      const [match, type, object] = fqid.match(/^([a-z]+):(.+)/);
      if (!match) {
        return;
      }

      if (type === 'label') {
        this.$store.commit(SELECT_LABEL, object);
        return;
      }

      const { classMap, events } = this.$store.state.appMap;
      let selectedObject = null;

      if (type === 'event') {
        const eventId = parseInt(object, 10);

        if (Number.isNaN(eventId)) {
          return;
        }

        selectedObject = events.find((e) => e.id === eventId);
      } else {
        selectedObject = classMap.codeObjects.find((obj) => obj.fqid === fqid);
      }

      if (selectedObject) {
        this.$store.commit(SELECT_OBJECT, selectedObject);
      }
    },

    clearSelection() {
      this.$store.commit(CLEAR_OBJECT_STACK);
      this.$root.$emit('clearSelection');
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
  background-color: $vs-code-gray1;

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

  .no-data-notice {
    display: flex;
    position: absolute;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    font-family: $appland-text-font-family;
    line-height: 1.5;
    color: $base03;
    background-color: $vs-code-gray1;
    z-index: 2147483647;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;

    &__title,
    &__text {
      margin: 0;
    }

    &__title {
      margin-bottom: 1rem;
      font-size: 2rem;
      font-weight: 700;
      background: linear-gradient(to right, $royal, $hotpink);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    &__text {
      a {
        color: $blue;
        text-decoration: none;

        &:hover,
        &:active {
          color: $lightblue;
        }
      }
    }

    .empty-state-diagram {
      margin-top: 4rem;
    }

    .why-me {
      padding: 1rem;
      strong {
        margin-left: -1rem;
        color: $royal;
        margin-bottom: 0.5rem;
      }
    }
  }
}
</style>
