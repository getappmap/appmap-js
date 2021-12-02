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
        :filters-root-objects="filters.rootObjects"
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
          <div class="trace-view">
            <div class="trace-view__search">
              <div class="trace-view__search-input-wrap">
                <span class="trace-view__search-input-prefix">
                  <SearchIcon />
                </span>
                <input
                  v-model="traceFilterValue"
                  class="trace-view__search-input-element"
                  type="text"
                  autocomplete="off"
                  placeholder="search events..."
                />
              </div>
              <div
                class="trace-view__search-arrows"
                v-if="highlightedNodes.length"
              >
                <div class="trace-view__search-arrow" @click="prevTraceFilter">
                  <ArrowSearchLeftIcon />
                </div>
                <div class="trace-view__search-arrows-text">
                  <b>{{ currentTraceFilterIndex + 1 }}</b
                  >/{{ highlightedNodes.length }} results
                </div>
                <div class="trace-view__search-arrow" @click="nextTraceFilter">
                  <ArrowSearchRightIcon />
                </div>
              </div>
            </div>
            <v-diagram-trace
              ref="diagramFlow"
              :events="filteredAppMap.rootEvents()"
              :selected-events="selectedEvent"
              :focused-event="focusedEvent"
              :highlighted-event-id="highlightedEventId"
              :highlighted-event-index="currentTraceFilterIndex + 1"
              :name="VIEW_FLOW"
              :zoom-controls="true"
              @clickEvent="onClickTraceEvent"
            />
          </div>
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
          <v-popper-menu :isHighlight="filtersChanged">
            <template v-slot:icon>
              <FilterIcon class="control-button__icon" />
            </template>
            <template v-slot:body>
              <div class="filters">
                <div class="filters__head">
                  <FilterIcon class="filters__head-icon" />
                  <h2 class="filters__head-text">Filters</h2>
                  <button class="filters__head-reset" @click="resetFilters()">
                    Reset all
                    <ResetIcon />
                  </button>
                </div>
                <div class="filters__block">
                  <div class="filters__block-head">
                    <h3 class="filters__block-title">Root</h3>
                    <v-filters-form
                      :onSubmit="addRootObject"
                      placeholder="add new root..."
                      :suggestions="rootObjectsSuggestions"
                    />
                  </div>
                  <div
                    class="filters__block-body filters__block-body--flex"
                    v-if="filters.rootObjects.length"
                  >
                    <div
                      class="filters__root"
                      v-for="(id, index) in filters.rootObjects"
                      :key="id"
                    >
                      {{ id }}
                      <CloseThinIcon
                        class="filters__root-icon"
                        @click="removeRootObject(index)"
                      />
                    </div>
                  </div>
                </div>
                <div class="filters__block">
                  <div class="filters__block-head">
                    <h3 class="filters__block-title">Declutter</h3>
                  </div>
                  <div class="filters__block-body">
                    <div class="filters__block-row">
                      <label class="filters__checkbox">
                        <input
                          type="checkbox"
                          v-model="filters.declutter.limitRootEvents.on"
                        />
                        <CheckIcon class="filters__checkbox-icon" />
                      </label>
                      <div class="filters__block-row-content">
                        Limit root events to HTTP
                      </div>
                    </div>
                    <div class="filters__block-row">
                      <label class="filters__checkbox">
                        <input
                          type="checkbox"
                          v-model="filters.declutter.hideMediaRequests.on"
                        />
                        <CheckIcon class="filters__checkbox-icon" />
                      </label>
                      <div class="filters__block-row-content">
                        Hide media HTTP requests
                      </div>
                    </div>
                    <div class="filters__block-row">
                      <label class="filters__checkbox">
                        <input
                          type="checkbox"
                          v-model="filters.declutter.hideUnlabeled.on"
                        />
                        <CheckIcon class="filters__checkbox-icon" />
                      </label>
                      <div class="filters__block-row-content">
                        Hide unlabeled
                      </div>
                    </div>
                    <div class="filters__block-row">
                      <label class="filters__checkbox">
                        <input
                          type="checkbox"
                          v-model="filters.declutter.hideElapsedTimeUnder.on"
                        />
                        <CheckIcon class="filters__checkbox-icon" />
                      </label>
                      <div class="filters__block-row-content">
                        Hide elapsed time under:
                        <div class="filters__elapsed">
                          <input
                            type="text"
                            class="filters__elapsed-input"
                            v-model="
                              filters.declutter.hideElapsedTimeUnder.time
                            "
                          />
                          <span class="filters__elapsed-ms">ms</span>
                        </div>
                      </div>
                    </div>
                    <div class="filters__block-row">
                      <label class="filters__checkbox">
                        <input
                          type="checkbox"
                          v-model="filters.declutter.hideName.on"
                        />
                        <CheckIcon class="filters__checkbox-icon" />
                      </label>
                      <div class="filters__block-row-content">
                        Hide name:
                        <v-filters-form
                          :onSubmit="addHiddenName"
                          placeholder="find names..."
                          :suggestions="hideNamesSuggestions"
                          suggestions-placement="top"
                        />
                        <div
                          class="filters__hide"
                          v-if="filters.declutter.hideName.names.length"
                        >
                          <div
                            class="filters__hide-item"
                            v-for="(name, index) in filters.declutter.hideName
                              .names"
                            :key="name"
                          >
                            {{ name }}
                            <CloseThinIcon
                              class="filters__hide-item-icon"
                              @click.stop="removeHiddenName(index)"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
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
import { CodeObjectType, Event, buildAppMap } from '@appland/models';
import ArrowSearchLeftIcon from '@/assets/arrow-search-left.svg';
import ArrowSearchRightIcon from '@/assets/arrow-search-right.svg';
import CheckIcon from '@/assets/check.svg';
import CloseThinIcon from '@/assets/close-thin.svg';
import ReloadIcon from '@/assets/reload.svg';
import ResetIcon from '@/assets/reset.svg';
import SearchIcon from '@/assets/search.svg';
import UploadIcon from '@/assets/upload.svg';
import FilterIcon from '@/assets/filter.svg';
import DiagramGray from '@/assets/diagram-empty.svg';
import VDetailsPanel from '../components/DetailsPanel.vue';
import VDetailsButton from '../components/DetailsButton.vue';
import VDiagramComponent from '../components/DiagramComponent.vue';
import VDiagramTrace from '../components/DiagramTrace.vue';
import VFiltersForm from '../components/FiltersForm.vue';
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
    ArrowSearchLeftIcon,
    ArrowSearchRightIcon,
    CheckIcon,
    CloseThinIcon,
    ReloadIcon,
    ResetIcon,
    SearchIcon,
    UploadIcon,
    FilterIcon,
    VDetailsPanel,
    VDetailsButton,
    VDiagramComponent,
    VDiagramTrace,
    VFiltersForm,
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
      filters: {
        rootObjects: [],
        declutter: {
          limitRootEvents: {
            on: true,
            default: true,
          },
          hideMediaRequests: {
            on: true,
            default: true,
          },
          hideUnlabeled: {
            on: false,
            default: false,
          },
          hideElapsedTimeUnder: {
            on: false,
            default: false,
            time: 100,
          },
          hideName: {
            on: false,
            default: false,
            names: [],
          },
        },
      },
      traceFilterValue: '',
      currentTraceFilterIndex: 0,
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
    highlightedNodes: {
      handler() {
        this.currentTraceFilterIndex = 0;
      },
    },
    filteredAppMap: {
      handler() {
        this.clearSelection();
      },
    },
  },

  computed: {
    classes() {
      return this.isLoading ? 'app--loading' : '';
    },
    filteredAppMap() {
      const { appMap } = this.$store.state;
      const { classMap } = appMap;
      let rootEvents = appMap.rootEvents();

      if (this.filters.declutter.limitRootEvents.on) {
        rootEvents = rootEvents.filter((e) => e.httpServerRequest);
      }

      let events = rootEvents.reduce((callTree, rootEvent) => {
        rootEvent.traverse((e) => callTree.push(e));
        return callTree;
      }, []);

      if (this.filters.rootObjects.length) {
        let eventBranches = [];

        classMap.codeObjects.forEach((codeObject) => {
          this.filters.rootObjects.forEach((id) => {
            if (this.codeObjectIsMatched(codeObject, id)) {
              eventBranches = eventBranches.concat(
                codeObject.allEvents.map((e) => [e.id, e.linkedEvent.id])
              );
            }
          });
        });

        if (eventBranches.length) {
          events = events.filter((e) =>
            eventBranches.some(
              (branch) => e.id >= branch[0] && e.id <= branch[1]
            )
          );
        }
      }

      if (this.filters.declutter.hideMediaRequests.on) {
        events = this.filterMediaRequests(events);
      }

      if (this.filters.declutter.hideUnlabeled.on) {
        events = events.filter(
          (e) =>
            e.labels.size > 0 || e.codeObject.type !== CodeObjectType.FUNCTION
        );
      }

      if (
        this.filters.declutter.hideElapsedTimeUnder.on &&
        this.filters.declutter.hideElapsedTimeUnder.time > 0
      ) {
        events = events.filter(
          (e) =>
            e.returnEvent &&
            e.returnEvent.elapsedTime &&
            e.returnEvent.elapsedTime >=
              this.filters.declutter.hideElapsedTimeUnder.time / 1000
        );
      }

      if (
        this.filters.declutter.hideName.on &&
        this.filters.declutter.hideName.names.length
      ) {
        classMap.codeObjects.forEach((codeObject) => {
          this.filters.declutter.hideName.names.forEach((fqid) => {
            if (this.codeObjectIsMatched(codeObject, fqid)) {
              events = events.filter((e) => !codeObject.allEvents.includes(e));
            }
          });
        });
      }

      const eventIds = new Set(
        events.filter((e) => e.isCall()).map((e) => e.id)
      );

      return buildAppMap({
        events: events.filter(
          (e) => eventIds.has(e.id) || eventIds.has(e.parent_id)
        ),
        classMap: classMap.roots.map((c) => ({ ...c.data })),
        metadata: appMap.metadata,
      }).build();
    },

    rootObjectsSuggestions() {
      return this.filteredAppMap.classMap.codeObjects
        .map((co) => co.fqid)
        .filter((fqid) => !this.filters.rootObjects.includes(fqid));
    },

    hideNamesSuggestions() {
      return this.filteredAppMap.classMap.codeObjects
        .map((co) => co.fqid)
        .filter(
          (fqid) => !this.filters.declutter.hideName.names.includes(fqid)
        );
    },

    highlightedNodes() {
      const nodes = new Set();

      if (this.traceFilterValue) {
        const knownEventIds = new Set(
          this.filteredAppMap.events.filter((e) => e.isCall()).map((e) => e.id)
        );
        const filterValue = this.traceFilterValue.trim().split(' ');
        if (filterValue.length) {
          filterValue.forEach((item) => {
            if (item.startsWith('event:')) {
              const eventId = parseInt(item.replace('event:', ''), 10);
              if (!Number.isNaN(eventId) && knownEventIds.has(eventId)) {
                nodes.add(eventId);
              }
            } else if (item.startsWith('label:')) {
              const labelName = item.replace('label:', '');
              this.filteredAppMap.events.forEach((event) => {
                if (event.isCall() && event.labels.has(labelName)) {
                  nodes.add(event.id);
                }
              });
            }
          });
        }
      }

      return Array.from(nodes);
    },

    highlightedEventId() {
      return this.highlightedNodes.length
        ? this.highlightedNodes[this.currentTraceFilterIndex]
        : null;
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

      return (
        !this.filtersChanged &&
        !this.traceFilterValue &&
        (!hasEvents || !hasClassMap)
      );
    },

    filtersChanged() {
      return (
        this.filters.rootObjects.length > 0 ||
        Object.values(this.filters.declutter).some(
          (f) =>
            (typeof f.on === 'boolean' && f.on !== f.default) ||
            (typeof on === 'function' && f.on() !== f.default)
        )
      );
    },
  },

  methods: {
    loadData(data) {
      this.$store.commit(SET_APPMAP_DATA, data);

      const rootEvents = this.$store.state.appMap.rootEvents();
      const hasHttpRoot = rootEvents.some((e) => e.httpServerRequest);
      this.filters.declutter.limitRootEvents.on = hasHttpRoot;
      this.filters.declutter.limitRootEvents.default = hasHttpRoot;

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

      if (this.traceFilterValue) {
        state.traceFilter = this.traceFilterValue;
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
      if (state.traceFilter) {
        this.traceFilterValue = state.traceFilter;
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
      this.resetFilters();

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

    resetFilters() {
      this.filters.rootObjects = [];
      Object.keys(this.filters.declutter).forEach((k) => {
        this.filters.declutter[k].on = this.filters.declutter[k].default;
      });
      this.filters.declutter.hideName.names = [];
    },

    addHiddenName(name) {
      const objectName = name.trim();

      if (
        !objectName ||
        this.filters.declutter.hideName.names.includes(objectName)
      ) {
        return;
      }

      this.filters.declutter.hideName.names.push(objectName);
      this.filters.declutter.hideName.on = true;
    },

    removeHiddenName(index) {
      this.filters.declutter.hideName.names.splice(index, 1);
      if (this.filters.declutter.hideName.names.length === 0) {
        this.filters.declutter.hideName.on = false;
      }
    },

    addRootObject(fqid) {
      const objectFqid = fqid.trim();

      if (!objectFqid || this.filters.rootObjects.includes(objectFqid)) {
        return;
      }

      this.filters.rootObjects.push(objectFqid);
    },

    removeRootObject(index) {
      this.filters.rootObjects.splice(index, 1);
    },

    filterMediaRequests(events) {
      const excludedEvents = [];
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
      const mediaFileExtensions = new Set([
        'aac',
        'avi',
        'bmp',
        'css',
        'flv',
        'gif',
        'htm',
        'html',
        'ico',
        'jpeg',
        'jpg',
        'js',
        'json',
        'jsonld',
        'mid',
        'midi',
        'mjs',
        'mov',
        'mp3',
        'mp4',
        'mpeg',
        'oga',
        'ogg',
        'ogv',
        'ogx',
        'opus',
        'otf',
        'png',
        'svg',
        'tif',
        'tiff',
        'ts',
        'ttf',
        'wav',
        'weba',
        'webm',
        'webp',
        'woff',
        'woff2',
        'xhtml',
        '3gp',
        '3g2',
      ]);

      events.forEach((e) => {
        if (e.requestMethod === 'GET' && e.requestPath) {
          const pathExt = e.requestPath.match(/.*\.([\S]*)$/);
          if (pathExt && mediaFileExtensions.has(pathExt[1])) {
            excludedEvents.push(e.id);
          }
        } else if (e.http_server_response) {
          let mimeType;

          if (e.http_server_response.headers) {
            const contentTypeKey = Object.keys(
              e.http_server_response.headers
            ).filter((k) => k.toLowerCase() === 'content-type')[0];

            mimeType = e.http_server_response.headers[contentTypeKey];
          } else if (e.http_server_response.mime_type) {
            mimeType = e.http_server_response.mime_type; // 'mime_type' is no longer supported in the AppMap data standard, but we should keep this code for backward compatibility
          }

          if (mimeType && mediaRegex.some((regex) => regex.test(mimeType))) {
            excludedEvents.push(e.parent_id);
          }
        }
      });

      return events.filter((e) => !excludedEvents.includes(e.id));
    },

    codeObjectIsMatched(object, query) {
      if (query.startsWith('label:')) {
        const labelRegExp = new RegExp(
          `^${query.replace('label:', '').replace('*', '.*')}$`,
          'ig'
        );
        return Array.from(object.labels).some((label) =>
          labelRegExp.test(label)
        );
      }
      if (query.includes('*')) {
        const filterRegExp = new RegExp(`^${query.replace('*', '.*')}$`, 'ig');
        if (filterRegExp.test(object.fqid)) {
          return true;
        }
      } else if (query === object.fqid) {
        return true;
      }
      return false;
    },

    prevTraceFilter() {
      if (this.currentTraceFilterIndex === 0) {
        this.currentTraceFilterIndex = this.highlightedNodes.length - 1;
      } else {
        this.currentTraceFilterIndex -= 1;
      }
    },

    nextTraceFilter() {
      if (this.currentTraceFilterIndex === this.highlightedNodes.length - 1) {
        this.currentTraceFilterIndex = 0;
      } else {
        this.currentTraceFilterIndex += 1;
      }
    },
  },

  mounted() {
    this.$root.$on('makeRoot', (codeObject) => {
      this.addRootObject(codeObject.fqid);
    });
    this.$root.$on('removeRoot', (fqid) => {
      this.removeRootObject(this.filters.rootObjects.indexOf(fqid));
    });
    this.$root.$on('addHiddenName', (objectId) => {
      this.addHiddenName(objectId);
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

  .trace-view {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;

    &__search {
      margin-bottom: 1.5rem;
      padding: 1rem 1.25rem;
      display: flex;
      justify-content: flex-start;
      align-items: center;
      font-family: $appland-text-font-family;

      &-input-wrap {
        flex: 1;
        position: relative;
        border-radius: $border-radius;
        border: 2px solid $light-purple;

        .details-search--empty & {
          border-radius: $gray3;
          pointer-events: none;
        }
      }

      &-input-prefix {
        position: absolute;
        top: 50%;
        left: 0;
        width: 2rem;
        display: flex;
        justify-content: center;
        align-items: center;
        transform: translateY(-50%);
        text-align: center;
        color: $base06;

        svg {
          position: relative;
          left: 3px;
          width: 14px;
          height: 14px;
          fill: $lightgray2;
        }
      }

      &-input-element {
        border: none;
        width: 100%;
        padding: 0.5rem 2rem;
        font: inherit;
        font-size: 0.75rem;
        color: $base03;
        background: transparent;
        outline: none;

        &::-webkit-placeholder,
        &::-moz-placeholder,
        &::placeholder {
          color: $gray4;
        }
      }

      &-arrows {
        display: flex;
        align-items: center;
        padding: 0 1.25rem;

        &-text {
          margin: 0 0.5rem;
          font-size: 0.75rem;
          color: $base06;
        }
      }

      &-arrow {
        padding: 0.25rem;
        font-size: 0;
        cursor: pointer;
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

  .filters {
    width: 390px;
    font-size: 0.75rem;

    &__head {
      margin-bottom: 1rem;
      display: flex;
      justify-content: flex-start;
      align-items: center;

      svg {
        width: 1em;
        height: 1em;
        fill: currentColor;
      }

      &-icon {
        margin-right: 0.75rem;
        color: $light-purple;
      }

      &-text {
        margin-bottom: 0;
        color: $base01;
        text-transform: uppercase;
        font-size: 0.75rem;
        font-weight: bold;
      }

      &-reset {
        margin-left: auto;
        border: none;
        display: inline-flex;
        align-items: center;
        padding: 0.25rem;
        background: transparent;
        color: $lightgray2;
        font: inherit;
        outline: none;
        line-height: 1;
        appearance: none;
        cursor: pointer;
        transition: color 0.3s ease-in;

        &:hover,
        &:active {
          color: $gray5;
          transition-timing-function: ease-out;
        }

        svg {
          margin-left: 0.5rem;
        }
      }
    }

    &__block {
      &:not(:last-child) {
        margin-bottom: 1rem;
      }

      &-head {
        border-radius: 0.25rem 0.25rem 0 0;
        margin-bottom: 1px;
        display: flex;
        padding: 0.5rem 0.75rem;
        line-height: 1.25rem;
        background: #2c2b32;
      }

      &-title {
        margin: 0 0.5rem 0 0;
        display: inline-block;
        font-size: 0.875rem;
        font-weight: bold;
        color: $base06;
      }

      &-body {
        border-radius: 0 0 0.25rem 0.25rem;
        padding: 1rem 0.75rem;
        background: #2c2b32;

        &--flex {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
      }

      &-row {
        display: flex;
        justify-content: flex-start;
        align-items: flex-start;

        &:not(:last-child) {
          margin-bottom: 1rem;
        }

        &-content {
          margin-left: 1rem;
          width: 100%;
          display: flex;
          flex-wrap: wrap;
          line-height: 22px;
        }
      }
    }

    &__root {
      border-radius: $border-radius;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem;
      background: $light-purple;
      color: $gray6;
      line-height: 1;

      &-icon {
        flex-shrink: 0;
        margin-left: 1rem;
        width: 1em;
        height: 1em;
        fill: currentColor;
        cursor: pointer;
      }
    }

    &__checkbox {
      flex-shrink: 0;
      margin: 3px 0;
      border-radius: 2px;
      display: inline-flex;
      justify-content: center;
      align-items: center;
      width: 1rem;
      height: 1rem;
      background: $light-purple;
      cursor: pointer;

      input {
        position: absolute;
        overflow: hidden;
        clip: rect(1px, 1px, 1px, 1px);
        height: 1px;
        width: 1px;
        margin: -1px;
        padding: 0;
        border: 0;

        &:checked + .filters__checkbox-icon {
          display: block;
        }
      }

      &-icon {
        display: none;
        width: 0.5rem;
        height: 0.5rem;
        fill: $base03;
      }
    }

    &__elapsed {
      margin-left: 0.5rem;
      border-radius: 0.25rem;
      display: inline-block;
      vertical-align: middle;
      height: 22px;
      padding: 0 0.25rem;
      background: #191919;

      &-input {
        display: inline-block;
        vertical-align: middle;
        width: 2rem;
        border: 0;
        border-radius: 0;
        box-shadow: none;
        background: transparent;
        font: inherit;
        text-align: right;
        color: inherit;
        outline: none;
      }

      &-ms {
        color: $lightgray2;
      }
    }

    &__hide {
      margin-top: 0.75rem;
      width: 100%;
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-start;
      align-items: flex-start;
      gap: 0.5rem;

      &-item {
        border-radius: 0.25rem;
        display: inline-flex;
        justify-content: flex-start;
        align-items: center;
        padding: 5px 10px;
        background: $light-purple;
        color: $gray6;
        line-height: 1;

        &-icon {
          flex-shrink: 0;
          margin-left: 1rem;
          width: 1em;
          height: 1em;
          fill: currentColor;
          cursor: pointer;
        }
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
