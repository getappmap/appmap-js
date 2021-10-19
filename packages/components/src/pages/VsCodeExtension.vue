<template>
  <div
    id="app"
    :key="renderKey"
    :class="classes"
    @mousemove="makeResizing"
    @mouseup="stopResizing"
    @mouseleave="stopResizing"
  >
    <div class="loader"></div>
    <div class="main-column main-column--left" ref="mainColumnLeft">
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
              {{
                prevSelectedObject.type === 'query'
                  ? prevSelectedObject.prettyName
                  : prevSelectedObject.name
              }}
            </b>
            <span v-else>previous</span>
          </v-details-button>
        </template>
      </v-details-panel>
      <div class="main-column--drag" @mousedown="startResizing"></div>
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

        <v-tab name="Trace View" :is-active="isViewingFlow" :ref="VIEW_FLOW">
          <v-diagram-trace
            ref="diagramFlow"
            :events="filteredAppMap.rootEvents()"
            :selected-events="selectedEvent"
            :focused-event="focusedEvent"
            :name="VIEW_FLOW"
            :zoom-controls="true"
            @clickEvent="onClickTraceEvent"
          />
        </v-tab>
        <template v-slot:notification>
          <v-notification
            v-if="version"
            :version="version"
            :body="versionText"
            @openEvent="onNotificationOpen"
            @closeEvent="onNotificationClose"
          />
        </template>
        <template v-slot:controls>
          <v-popper-menu :showDot="filtersChanged">
            <template v-slot:icon>
              <FilterIcon class="control-button__icon" />
            </template>
            <template v-slot:body>
              <h2>Filters</h2>
              <div>
                <input
                  type="checkbox"
                  id="limit-root-events"
                  v-model="filters.limitRootEvents.on"
                  @change="setUserFiltered"
                />
                <label for="limit-root-events">Limit root events to HTTP</label>
              </div>
              <div>
                <input
                  type="checkbox"
                  id="unlabeled-events"
                  v-model="filters.unlabeledEvents.on"
                  @change="setUserFiltered"
                />
                <label for="unlabeled-events">Show unlabeled events</label>
              </div>
              <div>
                <input
                  type="checkbox"
                  id="hide-media-requests"
                  v-model="filters.hideMediaRequests.on"
                  @change="setUserFiltered"
                />
                <label for="hide-media-requests"
                  >Hide media HTTP requests</label
                >
              </div>
            </template>
          </v-popper-menu>
          <button
            class="control-button diagram-reload"
            @click="resetDiagram"
            title="Clear"
          >
            <ReloadIcon class="control-button__icon" />
          </button>
          <button
            v-if="appMapUploadable"
            class="control-button appmap-upload"
            @click="uploadAppmap"
            title="Upload"
          >
            <UploadIcon class="control-button__icon" />
          </button>
        </template>
      </v-tabs>
      <div class="diagram-instructions">
        <v-instructions ref="instructions" />
      </div>
    </div>

    <div class="no-data-notice" v-if="isEmptyAppMap && !isLoading">
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
import { CodeObjectType, ClassMap, Event, buildAppMap } from '@appland/models';
import ReloadIcon from '@/assets/reload.svg';
import UploadIcon from '@/assets/upload.svg';
import FilterIcon from '@/assets/filter.svg';
import DiagramGray from '@/assets/diagram-empty.svg';
import VDetailsPanel from '../components/DetailsPanel.vue';
import VDetailsButton from '../components/DetailsButton.vue';
import VDiagramComponent from '../components/DiagramComponent.vue';
import VDiagramTrace from '../components/DiagramTrace.vue';
import VInstructions from '../components/Instructions.vue';
import VNotification from '../components/Notification.vue';
import VPopperMenu from '../components/PopperMenu.vue';
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
    UploadIcon,
    FilterIcon,
    VDetailsPanel,
    VDetailsButton,
    VDiagramComponent,
    VDiagramTrace,
    VInstructions,
    VNotification,
    VPopperMenu,
    VTabs,
    VTab,
    DiagramGray,
  },

  store,

  data() {
    return {
      renderKey: 0,
      isLoading: true,
      isPanelResizing: false,
      initialPanelWidth: 0,
      initialClientX: 0,
      version: null,
      versionText: '',
      VIEW_COMPONENT,
      VIEW_FLOW,
      rootCodeObject: null,
      filters: {
        limitRootEvents: {
          on: true,
          default: true,
        },
        unlabeledEvents: {
          on: true,
          default: true,
        },
        hideMediaRequests: {
          on: true,
          default: true,
        },
      },
      isUserFiltered: false,
    };
  },

  props: {
    appMapUploadable: {
      type: Boolean,
      default: false,
    },
  },

  watch: {
    '$store.state.currentView': {
      handler(view) {
        this.onChangeTab(this.$refs[view]);
        this.$refs.tabs.activateTab(this.$refs[view]);
        this.$root.$emit('stateChanged', 'currentView');
      },
    },
    '$store.getters.selectedObject': {
      handler(selectedObject) {
        if (selectedObject && !(selectedObject instanceof Event)) {
          this.setView(VIEW_COMPONENT);
        }

        this.$root.$emit('stateChanged', 'selectedObject');
      },
    },
    '$store.getters.selectedLabel': {
      handler() {
        this.$root.$emit('stateChanged', 'selectedObject');
      },
    },
    '$store.getters.focusedEvent': {
      handler(event) {
        if (event) {
          this.setView(VIEW_FLOW);
          this.$nextTick(() => {
            this.$refs.diagramFlow.focusFocused();
          });
        }
      },
    },
  },

  computed: {
    classes() {
      return this.isLoading ? 'app--loading' : '';
    },
    filteredAppMap() {
      const { appMap } = this.$store.state;
      let { classMap } = appMap;
      let rootEvents = appMap.rootEvents();

      if (this.filters.limitRootEvents.on) {
        rootEvents = rootEvents.filter((e) => e.httpServerRequest);
      }

      let events = rootEvents.reduce((callTree, rootEvent) => {
        rootEvent.traverse((e) => callTree.push(e));
        return callTree;
      }, []);

      if (this.rootCodeObject) {
        const eventBranches = this.rootCodeObject.allEvents.map((e) => [
          e.id,
          e.linkedEvent.id,
        ]);

        events = events.filter((e) =>
          eventBranches.some((branch) => e.id >= branch[0] && e.id <= branch[1])
        );

        // it's necessary to remove package wrap in Component Diagram,
        // without this code package will be rendered in collapsed state
        if (
          this.rootCodeObject.type === 'class' &&
          this.rootCodeObject.packageObject
        ) {
          classMap = new ClassMap([
            classMap.codeObjects.filter(
              (co) => co.id !== this.rootCodeObject.packageObject.id
            ),
          ]);
        }
      }

      events = events.filter(
        (e) =>
          this.filters.unlabeledEvents.on ||
          e.labels.size > 0 ||
          e.codeObject.type !== CodeObjectType.FUNCTION
      );

      if (this.filters.hideMediaRequests.on) {
        const mediaRegex = [
          'application/javascript',
          'application/ecmascript',
          'audio/.+',
          'font/.+',
          'image/.+',
          'text/javascript',
          'text/ecmascript',
          'text/css',
          'video/.+',
        ].map((t) => new RegExp(t, 'i'));
        const excludedEvents = [];
        events.forEach((e) => {
          if (
            e.http_server_response &&
            e.http_server_response.mime_type &&
            mediaRegex.some((regex) =>
              regex.test(e.http_server_response.mime_type)
            )
          ) {
            excludedEvents.push(e.parent_id);
          }
        });
        events = events.filter((e) => !excludedEvents.includes(e.id));
      }

      return buildAppMap({
        events,
        classMap: classMap.roots.map((c) => ({ ...c.data })),
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

    focusedEvent() {
      return this.$store.getters.focusedEvent;
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

      return !this.isUserFiltered && (!hasEvents || !hasClassMap);
    },

    filtersChanged() {
      return Object.values(this.filters).some(
        (f) =>
          (typeof f.on === 'boolean' && f.on !== f.default) ||
          (typeof on === 'function' && f.on() !== f.default)
      );
    },
  },

  methods: {
    loadData(data) {
      this.$store.commit(SET_APPMAP_DATA, data);

      const rootEvents = this.$store.state.appMap.rootEvents();

      if (rootEvents.every((e) => !e.httpServerRequest)) {
        this.filters.limitRootEvents.on = false;
      }

      this.isLoading = false;
    },

    showInstructions() {
      this.$refs.instructions.open();
      this.$root.$emit('showInstructions');
    },

    showVersionNotification(version, versionText = '') {
      this.version = version;
      this.versionText = versionText;
    },

    onNotificationOpen() {
      this.$root.$emit('notificationOpen');
    },

    onNotificationClose() {
      this.version = null;
      this.versionText = '';
      this.$root.$emit('notificationClose');
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

    getState() {
      const state = {
        currentView: this.currentView,
      };

      if (this.selectedObject && this.selectedObject.fqid) {
        state.selectedObject = this.selectedObject.fqid;
      } else if (this.selectedLabel) {
        state.selectedObject = `label:${this.selectedLabel}`;
      }

      return JSON.stringify(state);
    },

    setState(serializedState) {
      const state = JSON.parse(serializedState);
      if (state.currentView) {
        this.setView(state.currentView);
      }
      if (state.selectedObject) {
        const fqid = state.selectedObject;
        const [match, type, object] = fqid.match(/^([a-z]+):(.+)/);

        if (!match) {
          return;
        }

        if (type === 'label') {
          this.$store.commit(SELECT_LABEL, object);
          return;
        }

        const { classMap, events } = this.filteredAppMap;
        let selectedObject = null;

        if (type === 'event') {
          const eventId = parseInt(object, 10);

          if (Number.isNaN(eventId)) {
            return;
          }

          selectedObject = events.find((e) => e.id === eventId);
        } else {
          selectedObject = classMap.codeObjects.find(
            (obj) => obj.fqid === fqid
          );
        }

        if (selectedObject) {
          this.$store.commit(SELECT_OBJECT, selectedObject);
        }
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
      this.rootCodeObject = null;
      this.clearSelection();

      this.renderKey += 1;
    },

    uploadAppmap() {
      this.$root.$emit('uploadAppmap');
    },

    onClickTraceEvent(e) {
      this.$store.commit(SELECT_OBJECT, e);
    },

    startResizing(event) {
      document.body.style.userSelect = 'none';
      this.isPanelResizing = true;
      this.initialPanelWidth = this.$refs.mainColumnLeft.offsetWidth;
      this.initialClientX = event.clientX;
    },

    makeResizing(event) {
      if (this.isPanelResizing) {
        const MIN_PANEL_WIDTH = 280;
        const MAX_PANEL_WIDTH = window.innerWidth * 0.75;

        let newWidth =
          this.initialPanelWidth + (event.clientX - this.initialClientX);
        newWidth = Math.max(MIN_PANEL_WIDTH, newWidth);
        newWidth = Math.min(MAX_PANEL_WIDTH, newWidth);

        this.$refs.mainColumnLeft.style.width = `${newWidth}px`;
      }
    },

    stopResizing() {
      document.body.style.userSelect = '';
      this.isPanelResizing = false;
    },

    setUserFiltered() {
      this.isUserFiltered = true;
    },
  },

  mounted() {
    this.$root.$on('makeRoot', (codeObject) => {
      this.rootCodeObject = codeObject;
    });
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

body.sb-show-main.sb-main-padded {
  padding: 0;
}

* {
  box-sizing: border-box;
}

code {
  color: $teal;
}

#app {
  position: relative;
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-rows: 100%;
  min-width: 800px;
  height: 100vh;
  color: $base11;
  background-color: $vs-code-gray1;

  &.app--loading {
    .loader {
      display: block;
    }
    .main-column {
      opacity: 0;
      pointer-events: none;
    }
  }

  .loader {
    display: none;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 80px;
    height: 80px;

    &:after {
      content: '';
      display: block;
      width: 64px;
      height: 64px;
      margin: 8px;
      border-radius: 50%;
      border: 6px solid transparent;
      border-color: $hotpink transparent $hotpink transparent;
      animation: loader-animation 1.2s linear infinite;
    }
  }

  .main-column {
    &--left {
      position: relative;
      grid-column: 1;
      width: 420px;
      background-color: $gray2;
    }

    &--right {
      position: relative;
      grid-column-start: 2;
      grid-column-end: 3;
      width: 100%;
      min-width: 400px;
      word-break: break-all;
      overflow: hidden;

      .control-button {
        border: none;
        display: inline-flex;
        align-items: center;
        padding: 0.25rem;
        background: transparent;
        color: $lightgray2;
        font: inherit;
        font-family: $appland-text-font-family;
        font-size: 0.75rem;
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

        &__icon {
          width: 0.75rem;
          height: 0.75rem;
          fill: currentColor;
        }
      }

      .diagram-instructions {
        position: absolute;
        right: 1.3rem;
        bottom: 1.3rem;
      }
    }

    .main-column--drag {
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      width: 1px;
      background: transparent;
      cursor: col-resize;
      z-index: 100;

      &:hover {
        background: $gray5;
      }

      &::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: -8px;
        bottom: 0;
        background-position: 4px 49%;
        background-repeat: no-repeat;
        background-image: url("data:image/svg+xml,%3Csvg width='2' height='14' viewBox='0 0 2 14' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23808b98' fill-rule='evenodd'%3E%3Ccircle cx='1' cy='1' r='1'/%3E%3Ccircle cx='1' cy='5' r='1'/%3E%3Ccircle cx='1' cy='9' r='1'/%3E%3Ccircle cx='1' cy='13' r='1'/%3E%3C/g%3E%3C/svg%3E");
        touch-action: none;
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

@keyframes loader-animation {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-button {
  width: 0px;
  height: 0px;
}
::-webkit-scrollbar-thumb {
  background: $gray4;
  border: 0;
  border-radius: 50px;
}
::-webkit-scrollbar-thumb:hover,
::-webkit-scrollbar-thumb:active {
  background: $gray5;
}
::-webkit-scrollbar-track {
  background: $gray3;
  border: 0;
  border-radius: 50px;
}
::-webkit-scrollbar-corner {
  background: transparent;
}
</style>
