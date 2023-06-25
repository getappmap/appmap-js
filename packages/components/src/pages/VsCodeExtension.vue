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
        :findings="findings"
        :wasAutoPruned="wasAutoPruned"
        :isGiantAppMap="isGiantAppMap"
        :flamegraphEnabled="flamegraphEnabled"
        @onChangeFilter="
          (value) => {
            this.eventFilterText = value;
          }
        "
        @openStatsPanel="
          () => {
            this.showStatsPanel = true;
          }
        "
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
            <b
              v-if="prevSelectedObject && (prevSelectedObject.shortName || prevSelectedObject.name)"
            >
              {{
                prevSelectedObject.type === 'query'
                  ? prevSelectedObject.prettyName
                  : prevSelectedObject.shortName || prevSelectedObject.name
              }}
            </b>
            <span v-else>previous</span>
          </v-details-button>
        </template>
      </v-details-panel>
      <div class="main-column--drag" @mousedown="startResizing"></div>
    </div>

    <div class="main-column main-column--right">
      <v-tabs @activateTab="onChangeTab" ref="tabs" :initial-tab="defaultView">
        <v-tab
          name="Dependency Map"
          :is-active="isViewingComponent"
          :tabName="VIEW_COMPONENT"
          :ref="VIEW_COMPONENT"
        >
          <v-diagram-component :class-map="filteredAppMap.classMap" />
        </v-tab>

        <v-tab
          name="Sequence Diagram"
          :is-active="isViewingSequence"
          :ref="VIEW_SEQUENCE"
          :tabName="VIEW_SEQUENCE"
          :allow-scroll="true"
        >
          <v-diagram-sequence
            ref="viewSequence_diagram"
            :app-map="filteredAppMap"
            :focused-event="focusedEvent"
            :selected-events="selectedEvent"
          />
        </v-tab>

        <v-tab name="Trace View" :is-active="isViewingFlow" :tabName="VIEW_FLOW" :ref="VIEW_FLOW">
          <div class="trace-view">
            <v-trace-filter
              ref="traceFilter"
              :nodesLength="eventFilterMatches.length"
              :currentIndex="eventFilterMatchIndex"
              :suggestions="eventsSuggestions"
              :initialFilterValue="eventFilterText"
              @onChange="
                (value) => {
                  this.eventFilterText = value;
                }
              "
              @onPrevArrow="prevTraceFilter"
              @onNextArrow="nextTraceFilter"
            />
            <v-diagram-trace
              ref="viewFlow_diagram"
              :events="filteredAppMap.rootEvents()"
              :selected-events="selectedEvent"
              :focused-event="focusedEvent"
              :event-filter-matches="new Set(eventFilterMatches)"
              :event-filter-match="eventFilterMatch"
              :event-filter-match-index="eventFilterMatchIndex + 1"
              :name="VIEW_FLOW"
              :zoom-controls="true"
              @clickEvent="onClickTraceEvent"
            />
          </div>
        </v-tab>

        <v-tab
          v-if="flamegraphEnabled"
          name="Flame Graph"
          :is-active="isViewingFlamegraph"
          :ref="VIEW_FLAMEGRAPH"
          :tabName="VIEW_FLAMEGRAPH"
          :allow-scroll="false"
        >
          <v-diagram-flamegraph
            ref="viewFlamegraph_diagram"
            :events="filteredAppMap.rootEvents()"
            :selected-events="selectedEvent"
            :title="filteredAppMap.name"
            @select="onFlamegraphSelect"
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
          <v-popper
            v-if="appMapUploadable && !isGiantAppMap"
            class="hover-text-popper"
            text="Create a link to this AppMap"
            placement="left"
            text-align="left"
          >
            <button
              class="control-button"
              data-cy="share-button"
              @click="toggleShareModal"
              title=""
            >
              <UploadIcon class="control-button__icon" />
            </button>
          </v-popper>
          <v-popper
            v-if="showDownload && !isGiantAppMap"
            class="hover-text-popper"
            text="Export in SVG format"
            placement="left"
            text-align="left"
          >
            <v-download-sequence-diagram ref="export">
              <button class="control-button" @click="$refs.export.download()" title="">
                <ExportIcon class="control-button__icon" />
              </button>
            </v-download-sequence-diagram>
          </v-popper>
          <v-popper
            v-if="hasStats"
            class="hover-text-popper"
            text="Show statistics about this AppMap"
            placement="left"
            text-align="left"
          >
            <button
              class="control-button"
              data-cy="stats-button"
              @click="toggleStatsPanel"
              title=""
            >
              <StatsIcon class="control-button__icon" />
            </button>
          </v-popper>
          <v-popper-menu v-if="!isGiantAppMap" :isHighlight="filtersChanged">
            <template v-slot:icon>
              <v-popper
                class="hover-text-popper"
                text="Filter your view"
                placement="left"
                text-align="left"
              >
                <FilterIcon
                  class="control-button__icon"
                  data-cy="filter-button"
                  @click="openFilterModal"
                />
              </v-popper>
            </template>
            <template v-slot:body>
              <v-filter-menu
                :filteredAppMap="filteredAppMap"
                :initialSavedFilters="savedFilters"
                @setState="(stateString) => setState(stateString)"
              ></v-filter-menu>
            </template>
          </v-popper-menu>
          <v-popper class="hover-text-popper" text="Reload map" placement="left" text-align="left">
            <button
              v-if="!isGiantAppMap"
              data-cy="reload-button"
              class="control-button diagram-reload"
              @click="resetDiagram"
              title="Clear"
            >
              <ReloadIcon class="control-button__icon" />
            </button>
          </v-popper>
        </template>
      </v-tabs>

      <div v-if="showShareModal" class="share-appmap">
        <div class="heading">
          <h1>Share this AppMap</h1>
          <CloseIcon class="close-me" @click.stop="closeShareModal" />
        </div>
        <div class="content">
          <p>
            This link can be used to view this AppMap in a browser. You can share it with other
            collaborators, or put it into a Pull Request.
          </p>
          <div class="share-url">
            <div class="share-link">
              <span class="url">{{ shareURLmessage }}</span>
              <span class="icon copy" @click="copyToClipboard(shareURL)">
                <CopyIcon />
              </span>
            </div>
            <p>This link has been copied to your clipboard.</p>
          </div>
        </div>
      </div>

      <div v-if="showStatsPanel" class="appmap-stats">
        <v-stats-panel
          :stats="stats"
          :appMap="filteredAppMap"
          :pruneFilter="pruneFilter"
          @closeStatsPanel="closeStatsPanel"
        >
          <template v-slot:notification>
            <div
              v-if="isGiantAppMap"
              class="notification blocked"
              data-cy="giant-map-stats-notification"
            >
              <div class="content">
                <p class="notification-head">
                  <ExclamationIcon /><strong>This AppMap is too large to open.</strong>
                </p>
                <p>
                  To learn more about making your AppMaps smaller, please see our
                  <a href="https://appmap.io/docs/reference/handling-large-appmaps.html">
                    documentation
                  </a>
                  .
                </p>
              </div>
            </div>
            <div
              v-if="wasAutoPruned"
              class="notification trimmed"
              data-cy="pruned-map-stats-notification"
            >
              <div class="content">
                <p class="notification-head">
                  <ScissorsIcon /><strong>This AppMap has been automatically pruned.</strong>
                </p>
                <p>
                  This AppMap is too large, so we removed the highlighted functions below. Please
                  see our
                  <a href="https://appmap.io/docs/reference/handling-large-appmaps.html">
                    documentation
                  </a>
                  for more information on how to optimize your AppMaps.
                </p>
              </div>
            </div>
          </template>
        </v-stats-panel>
      </div>

      <div class="diagram-instructions">
        <v-instructions ref="instructions" :currentView="currentView" />
      </div>
    </div>

    <div class="no-data-notice" v-if="isEmptyAppMap && !isLoading && !hasStats">
      <div class="notice">
        <p class="no-data-notice__title">Sorry, but there's no data to display :(</p>
        <ul class="why-me">
          <strong>Top 3 reasons why this appmap is empty:</strong>
          <li>appmap.yml did not list packages/modules/folders of your application logic</li>
          <li>
            If this AppMap was recorded from a test, the test did not provide sufficient coverage
            for good data
          </li>
          <li>
            If other manual method was used to record this AppMap, the instrumented code objects
            were not executed during the recording.
          </li>
        </ul>
        <p class="no-data-notice__text">
          Check our
          <a href="https://appmap.io/docs" target="_blank" rel="noopener noreferrer">
            documentation</a
          >,<br />
          or ask for help in
          <a href="https://appmap.io/slack" target="_blank" rel="noopener noreferrer"> Slack</a>.
        </p>
      </div>
      <DiagramGray class="empty-state-diagram" />
    </div>
  </div>
</template>

<script>
import {
  Event,
  serializeFilter,
  deserializeFilter,
  filterStringToFilterState,
  base64UrlEncode,
} from '@appland/models';
import CopyIcon from '@/assets/copy-icon.svg';
import CloseIcon from '@/assets/close.svg';
import ReloadIcon from '@/assets/reload.svg';
import UploadIcon from '@/assets/link-icon.svg';
import ExportIcon from '@/assets/export.svg';
import FilterIcon from '@/assets/filter.svg';
import DiagramGray from '@/assets/diagram-empty.svg';
import StatsIcon from '@/assets/stats-icon.svg';
import ExclamationIcon from '@/assets/exclamation-circle.svg';
import ScissorsIcon from '@/assets/scissors-icon.svg';
import VDetailsPanel from '../components/DetailsPanel.vue';
import VDetailsButton from '../components/DetailsButton.vue';
import VDiagramComponent from '../components/DiagramComponent.vue';
import VDiagramSequence from '../components/DiagramSequence.vue';
import VDiagramFlamegraph from '../components/DiagramFlamegraph.vue';
import VDiagramTrace from '../components/DiagramTrace.vue';
import VDownloadSequenceDiagram from '../components/sequence/DownloadSequenceDiagram.vue';
import VFilterMenu from '../components/FilterMenu.vue';
import VInstructions from '../components/Instructions.vue';
import VNotification from '../components/Notification.vue';
import VPopperMenu from '../components/PopperMenu.vue';
import VPopper from '../components/Popper.vue';
import VStatsPanel from '../components/StatsPanel.vue';
import VTabs from '../components/Tabs.vue';
import VTab from '../components/Tab.vue';
import VTraceFilter from '../components/trace/TraceFilter.vue';
import {
  store,
  SET_APPMAP_DATA,
  SET_VIEW,
  VIEW_COMPONENT,
  VIEW_SEQUENCE,
  VIEW_FLOW,
  VIEW_FLAMEGRAPH,
  SELECT_CODE_OBJECT,
  SELECT_LABEL,
  POP_SELECTION_STACK,
  CLEAR_SELECTION_STACK,
  SET_EXPANDED_PACKAGES,
  CLEAR_EXPANDED_PACKAGES,
  SET_FILTER,
  SET_DECLUTTER_ON,
  RESET_FILTERS,
  ADD_ROOT_OBJECT,
  REMOVE_ROOT_OBJECT,
  SET_SAVED_FILTERS,
  SET_SELECTED_SAVED_FILTER,
} from '../store/vsCode';

export default {
  name: 'VSCodeExtension',

  components: {
    CloseIcon,
    CopyIcon,
    ReloadIcon,
    UploadIcon,
    ExportIcon,
    FilterIcon,
    VDetailsPanel,
    VDetailsButton,
    VDiagramComponent,
    VDiagramSequence,
    VDiagramTrace,
    VDiagramFlamegraph,
    VDownloadSequenceDiagram,
    VFilterMenu,
    VInstructions,
    VNotification,
    VPopperMenu,
    VPopper,
    VStatsPanel,
    VTabs,
    VTab,
    VTraceFilter,
    DiagramGray,
    StatsIcon,
    ExclamationIcon,
    ScissorsIcon,
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
      VIEW_SEQUENCE,
      VIEW_FLOW,
      VIEW_FLAMEGRAPH,
      eventFilterText: '',
      eventFilterMatchIndex: 0,
      showShareModal: false,
      showStatsPanel: false,
      shareURL: undefined,
      seqDiagramTimeoutId: undefined,
      isActive: true,
    };
  },

  props: {
    defaultView: {
      type: String,
      default: VIEW_COMPONENT,
    },
    appMapUploadable: {
      type: Boolean,
      default: false,
    },
    flamegraphEnabled: {
      type: Boolean,
      default: false,
    },
    savedFilters: {
      type: Array,
      default: () => [],
    },
  },

  watch: {
    '$store.state.currentView': {
      handler(view) {
        this.$refs.tabs.activateTab(this.$refs[view]);
        this.$root.$emit('stateChanged', 'currentView');
      },
    },
    '$store.getters.selectedObject': {
      handler(selectedObject) {
        if (selectedObject) {
          if (selectedObject instanceof Event) {
            const highlightedIndex = this.eventFilterMatches.findIndex((e) => e === selectedObject);

            this.eventFilterMatchIndex = highlightedIndex >= 0 ? highlightedIndex : undefined;
          }
        } else {
          this.eventFilterMatchIndex = undefined;
        }

        this.$root.$emit('stateChanged', 'selectedObject');
      },
    },
    '$store.state.selectedLabel': {
      handler() {
        this.$root.$emit('stateChanged', 'selectedObject');
      },
    },
    '$store.state.focusedEvent': {
      handler(event) {
        if (event) {
          if (this.currentView === VIEW_COMPONENT) {
            this.setView(this.defaultView === VIEW_SEQUENCE ? VIEW_SEQUENCE : VIEW_FLOW);
          }
          this.$nextTick(() => {
            Object.keys(this.$refs)
              .filter((ref) => ref.endsWith('_diagram'))
              .forEach((ref) => this.$refs[ref].showFocusEffect());
          });
        }
      },
    },
    highlightedNodes: {
      handler() {
        this.eventFilterMatchIndex = 0;
        this.selectCurrentHighlightedEvent();
      },
    },
    eventFilterMatchIndex: {
      handler() {
        this.selectCurrentHighlightedEvent();
      },
    },
    filteredAppMap: {
      handler() {
        if (this.selectedObject) {
          this.setSelectedObject(this.selectedObject.fqid);
        }
      },
    },
    isActive: {
      handler() {
        clearTimeout(this.seqDiagramTimeoutId);
        if (this.isActive && this.isViewingSequence) {
          this.startSeqDiagramTimer();
        }
      },
    },
  },

  computed: {
    classes() {
      return this.isLoading ? 'app--loading' : '';
    },

    pruneFilter() {
      const { appMap } = this.$store.state;
      const {
        data: { pruneFilter },
      } = appMap;
      return pruneFilter || {};
    },

    wasAutoPruned() {
      return this.pruneFilter.auto;
    },

    findings() {
      const { appMap } = this.$store.state;
      const {
        data: { findings },
      } = appMap;
      return this.uniqueFindings(findings);
    },

    stats() {
      const { appMap } = this.$store.state;
      const {
        data: { stats },
      } = appMap;
      return stats;
    },

    filters() {
      return this.$store.state.filters;
    },

    filteredAppMap() {
      const { appMap } = this.$store.state;
      return this.filters.filter(appMap, this.findings);
    },

    rootObjectsSuggestions() {
      return this.$store.state.appMap.classMap.codeObjects
        .map((co) => co.fqid)
        .filter((fqid) => !this.filters.rootObjects.includes(fqid));
    },

    hideNamesSuggestions() {
      return this.filteredAppMap.classMap.codeObjects
        .map((co) => co.fqid)
        .filter((fqid) => !this.filters.declutter.hideName.names.includes(fqid));
    },

    eventsSuggestions() {
      const highlightedIds = new Set(this.eventFilterMatches.map((e) => e.id));
      const uniqueEventNames = new Set(
        this.filteredAppMap.events
          .filter((e) => e.isCall() && !highlightedIds.has(e.id))
          .map((e) => e.toString())
      );
      return Array.from(uniqueEventNames);
    },

    eventsById() {
      return this.filteredAppMap.events.reduce((map, e) => {
        map[e.id] = e.callEvent;
        return map;
      }, {});
    },

    eventsByLabel() {
      return this.filteredAppMap.events
        .filter((e) => e.isCall())
        .reduce((map, e) => {
          e.labels.forEach((label) => {
            map[label] = map[label] || [];
            map[label].push(e.callEvent);
          });
          return map;
        }, {});
    },

    eventFilterMatches() {
      const nodes = new Set();

      if (this.eventFilterText) {
        const queryTerms = this.eventFilterText.match(/(?:[^\s"]+|"[^"]*"|"[^"]*)+/g);

        if (queryTerms) {
          if (!this.eventFilterText.endsWith(' ')) {
            queryTerms.pop();
          }

          queryTerms.forEach((term) => {
            // search for event name
            if (/^".+"$/g.test(term)) {
              const eventName = term.slice(1, -1);

              this.filteredAppMap.events.forEach((e) => {
                if (e.isCall() && e.toString() === eventName) {
                  nodes.add(e);
                }
              });

              return;
            }

            const [query, text] = term.split(':');
            switch (query) {
              case 'id': {
                const eventId = parseInt(text, 10);
                if (Number.isNaN(eventId)) {
                  break;
                }

                const event = this.eventsById[eventId];
                if (event) {
                  nodes.add(event);
                } else if (this.filters.declutter.limitRootEvents.on) {
                  // when event is not present in filtered AppMap, but it's a root event - disable "Limit root events to HTTP" filter
                  const rootEvents = this.$store.state.appMap.rootEvents();
                  if (rootEvents.some((e) => e.id === eventId)) {
                    this.$nextTick(() => {
                      this.$store.commit(SET_DECLUTTER_ON, {
                        declutterProperty: 'limitRootEvents',
                        value: false,
                      });
                    });
                  }
                }

                break;
              }

              case 'label': {
                const events = this.eventsByLabel[text];

                if (events) {
                  events.forEach((e) => nodes.add(e));
                }

                break;
              }

              default: {
                // Perform a full text search using query
                if (term.length < 3) {
                  break;
                }
                this.filteredAppMap.events.forEach((e) => {
                  if (
                    e.isCall() &&
                    e.toString().toLowerCase().includes(term.toString().toLowerCase())
                  ) {
                    nodes.add(e);
                  }
                });
              }
            }
          });
        }
      }

      return Array.from(nodes).sort((a, b) => a.id - b.id);
    },

    eventFilterMatch() {
      return this.eventFilterMatches[this.eventFilterMatchIndex];
    },

    selectedObject() {
      return this.$store.getters.selectedObject;
    },

    selectedEvent() {
      return this.selectedObject instanceof Event ? [this.selectedObject] : [];
    },

    selectedLabel() {
      return this.$store.state.selectedLabel;
    },

    focusedEvent() {
      return this.$store.state.focusedEvent;
    },

    currentView() {
      return this.$store.state.currentView;
    },

    expandedPackages() {
      return this.$store.state.expandedPackages;
    },

    baseActors() {
      return this.$store.state.baseActors;
    },

    isViewingComponent() {
      return this.currentView === VIEW_COMPONENT;
    },

    isViewingSequence() {
      return this.currentView === VIEW_SEQUENCE;
    },

    isViewingFlow() {
      return this.currentView === VIEW_FLOW;
    },

    isViewingFlamegraph() {
      return this.currentView === VIEW_FLAMEGRAPH;
    },

    showDownload() {
      return this.isViewingSequence;
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
        Array.isArray(appMap.classMap.codeObjects) && appMap.classMap.codeObjects.length;

      return !this.filtersChanged && !this.eventFilterText && (!hasEvents || !hasClassMap);
    },

    isGiantAppMap() {
      return this.isEmptyAppMap && this.hasStats;
    },

    filtersChanged() {
      return (
        this.filters.rootObjects.length > 0 ||
        Object.keys(this.filters.declutter).some((declutterPropertyName) => {
          // This might get set to a non-default value if the map does not have an HTTP root
          if (declutterPropertyName === 'limitRootEvents') return false;

          const declutterProperty = this.filters.declutter[declutterPropertyName];
          const on = declutterProperty.on;

          return (
            (typeof on === 'boolean' && on !== declutterProperty.default) ||
            (typeof on === 'function' && on() !== declutterProperty.default)
          );
        })
      );
    },

    shareURLmessage() {
      if (this.shareURL) return this.shareURL;
      return 'Retrieving link...';
    },

    hasStats() {
      return this.stats && this.stats.functions && this.stats.functions.length > 0;
    },
  },

  methods: {
    loadData(data) {
      this.$store.commit(SET_APPMAP_DATA, data);
      this.initializeSavedFilters();

      const rootEvents = this.$store.state.appMap.rootEvents();
      const hasHttpRoot = rootEvents.some((e) => e.httpServerRequest);
      const isUsingAppMapDefault = this.$store.state.savedFilters.some(
        (savedFilter) => savedFilter.filterName === 'AppMap default' && savedFilter.default
      );

      if (isUsingAppMapDefault && !hasHttpRoot) {
        this.$store.commit(SET_DECLUTTER_ON, {
          declutterProperty: 'limitRootEvents',
          value: hasHttpRoot,
        });
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
      // 'tab' can be the tab name or the actual tab.
      let index = Object.values(this.$refs).findIndex((ref) => ref === tab);
      if (index === -1) index = Object.keys(this.$refs).findIndex((ref) => ref === tab);
      if (index === -1) {
        // There's no ref set up for this tab
        return;
      }

      const viewKey = Object.keys(this.$refs)[index];
      this.setView(viewKey);
      this.$root.$emit('changeTab', viewKey);

      if (viewKey === VIEW_SEQUENCE) {
        this.startSeqDiagramTimer();
      } else {
        clearTimeout(this.seqDiagramTimeoutId);
      }
    },

    startSeqDiagramTimer() {
      // prompt for feedback after viewing a sequence diagram for 1 minute
      this.seqDiagramTimeoutId = setTimeout(() => {
        this.$root.$emit('seq-diagram-feedback');
      }, 60 * 1000);
    },

    setView(view) {
      if (this.currentView !== view) {
        this.$store.commit(SET_VIEW, view);
      }
    },

    getState() {
      const state = {};

      state.currentView = this.currentView;
      if (this.expandedPackages.length > 0)
        state.expandedPackages = this.expandedPackages.map((expandedPackage) => expandedPackage.id);

      if (this.selectedObject && this.selectedObject.fqid) {
        state.selectedObject = this.selectedObject.fqid;
      } else if (this.selectedLabel) {
        state.selectedObject = `label:${this.selectedLabel}`;
      }

      if (this.eventFilterText) {
        state.traceFilter = this.eventFilterText;
      }

      state.filters = serializeFilter(this.filters);

      if (Object.keys(state.filters).length === 0) {
        delete state.filters;
      }

      if (Object.keys(state).length === 0) {
        return '';
      }

      return base64UrlEncode(JSON.stringify(state));
    },

    openFilterModal() {
      this.$root.$emit('clickFilterButton');
    },

    setSelectedObject(fqid) {
      const matchResult = fqid.match(/^([a-z\-]+):(.+)/);

      if (!matchResult) {
        return;
      }

      const [, type, object] = matchResult;

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
        selectedObject = classMap.codeObjects.find((obj) => obj.fqid === fqid);
      }

      this.$store.commit(SELECT_CODE_OBJECT, selectedObject);
    },

    setState(serializedState) {
      return new Promise((resolve) => {
        if (!serializedState) {
          resolve();
          return;
        }

        const state = filterStringToFilterState(serializedState);
        if (state.selectedObject) {
          do {
            const fqid = state.selectedObject;
            const [match, type, object] = fqid.match(/^([a-z]+):(.+)/);

            if (!match) {
              break;
            }

            if (type === 'label') {
              this.$store.commit(SELECT_LABEL, object);
              break;
            }

            const { classMap, events } = this.filteredAppMap;
            let selectedObject = null;

            if (type === 'event') {
              const eventId = parseInt(object, 10);

              if (Number.isNaN(eventId)) {
                break;
              }

              selectedObject = events.find((e) => e.id === eventId);

              // It's possible that we're trying to select an object that does not exist in the filtered
              // set. If we're unable to find an object, we'll look for it in the unfiltered set.
              if (!selectedObject) {
                selectedObject = this.$store.state.appMap.events.find((e) => e.id === eventId);

                if (selectedObject) {
                  Object.keys(this.filters.declutter).forEach((declutterProperty) => {
                    this.$store.commit(SET_DECLUTTER_ON, { declutterProperty, value: false });
                  });
                }
              }
            } else {
              selectedObject = classMap.codeObjects.find((obj) => obj.fqid === fqid);
            }

            if (selectedObject) {
              this.$store.commit(SELECT_CODE_OBJECT, selectedObject);
            }
          } while (false);
        }

        const { filters, expandedPackages } = state;
        if (filters) this.$store.commit(SET_FILTER, deserializeFilter(filters));

        const base64EncodedFilters = base64UrlEncode(JSON.stringify({ filters }));
        const selectedFilter =
          this.$store.state.savedFilters &&
          this.$store.state.savedFilters.find(
            (savedFilter) => savedFilter.state === base64EncodedFilters
          );
        if (selectedFilter) this.$store.commit(SET_SELECTED_SAVED_FILTER, selectedFilter);

        if (expandedPackages) {
          const codeObjects = expandedPackages.map((expandedPackageId) =>
            this.filteredAppMap.classMap.codeObjectFromId(expandedPackageId)
          );
          this.$store.commit(SET_EXPANDED_PACKAGES, codeObjects);
        }

        this.$nextTick(() => {
          if (state.currentView) {
            this.setView(state.currentView);
          }

          if (state.traceFilter) {
            this.$nextTick(() => {
              if (!state.traceFilter.endsWith(' ')) {
                state.traceFilter += ' ';
              }

              this.$refs.traceFilter.setValue(state.traceFilter);
              resolve();
            });
          } else {
            resolve();
          }
        });
      });
    },

    clearSelection() {
      this.eventFilterMatchIndex = 0;
      this.$store.commit(CLEAR_SELECTION_STACK);
      this.$root.$emit('clearSelection');
    },

    goBack() {
      this.$store.commit(POP_SELECTION_STACK);
    },

    resetDiagram() {
      this.$store.commit(CLEAR_EXPANDED_PACKAGES);
      this.clearSelection();
      this.$store.commit(RESET_FILTERS);
      this.$root.$emit('resetDiagram');

      this.renderKey += 1;
    },

    toggleShareModal() {
      this.showShareModal = !this.showShareModal;
      this.$root.$emit('uploadAppmap');
      if (this.showShareModal && this.showStatsPanel) this.showStatsPanel = false;
    },

    toggleStatsPanel() {
      this.showStatsPanel = !this.showStatsPanel;
      if (this.showShareModal && this.showStatsPanel) this.showShareModal = false;
    },

    closeStatsPanel() {
      this.showStatsPanel = false;
    },

    uniqueFindings(findings) {
      if (!findings) return undefined;

      return Object.values(
        findings.reduce((unique, finding) => {
          unique[finding.finding.hash_v2] = finding;
          return unique;
        }, {})
      );
    },

    closeShareModal() {
      this.showShareModal = false;
    },

    setShareURL(url) {
      this.shareURL = url;
    },

    copyToClipboard(input) {
      this.$root.$emit('copyToClipboard', input);
    },

    onFlamegraphSelect(event) {
      if (event) {
        this.onClickTraceEvent(event);
      } else {
        this.clearSelection();
      }
    },

    onClickTraceEvent(e) {
      this.$store.commit(SELECT_CODE_OBJECT, e);
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

        let newWidth = this.initialPanelWidth + (event.clientX - this.initialClientX);
        newWidth = Math.max(MIN_PANEL_WIDTH, newWidth);
        newWidth = Math.min(MAX_PANEL_WIDTH, newWidth);

        this.$refs.mainColumnLeft.style.width = `${newWidth}px`;
      }
    },

    stopResizing() {
      document.body.style.userSelect = '';
      this.isPanelResizing = false;
    },

    prevTraceFilter() {
      if (this.eventFilterMatches.length === 0) {
        return;
      }

      if (Number.isFinite(this.eventFilterMatchIndex)) {
        this.eventFilterMatchIndex -= 1;
      } else {
        const [selectedEvent] = this.selectedEvent;
        if (selectedEvent) {
          const previousEvent = this.eventFilterMatches
            .filter((e) => e.id < selectedEvent.id)
            .pop();
          this.eventFilterMatchIndex = this.eventFilterMatches.findIndex(
            (e) => e === previousEvent
          );
        } else {
          this.eventFilterMatchIndex = -1;
        }
      }

      if (this.eventFilterMatchIndex < 0) {
        this.eventFilterMatchIndex = this.eventFilterMatches.length - 1;
      }
    },

    nextTraceFilter() {
      if (this.eventFilterMatches.length === 0) {
        return;
      }

      if (Number.isFinite(this.eventFilterMatchIndex)) {
        this.eventFilterMatchIndex += 1;
      } else {
        const [selectedEvent] = this.selectedEvent;
        if (selectedEvent) {
          const previousEvent = this.eventFilterMatches
            .filter((e) => e.id > selectedEvent.id)
            .shift();
          this.eventFilterMatchIndex = this.eventFilterMatches.findIndex(
            (e) => e === previousEvent
          );
        } else {
          this.eventFilterMatchIndex = 0;
        }
      }

      if (
        this.eventFilterMatchIndex >= this.eventFilterMatches.length ||
        this.eventFilterMatchIndex < 0
      ) {
        this.eventFilterMatchIndex = 0;
      }
    },

    selectCurrentHighlightedEvent() {
      if (this.eventFilterMatch) {
        this.$store.commit(SELECT_CODE_OBJECT, this.eventFilterMatch);
      }
    },

    initializeSavedFilters() {
      const savedFilters = this.savedFilters;
      this.$store.commit(SET_SAVED_FILTERS, savedFilters);

      const defaultFilter = savedFilters.find((savedFilter) => savedFilter.default);
      if (defaultFilter) {
        this.$store.commit(SET_SELECTED_SAVED_FILTER, defaultFilter);
        this.setState(defaultFilter.state);
      }
    },

    updateFilters(updatedFilters) {
      this.$store.commit(SET_SAVED_FILTERS, updatedFilters);
    },
  },

  mounted() {
    this.$root.$on('makeRoot', (codeObject) => {
      this.$store.commit(ADD_ROOT_OBJECT, codeObject.fqid);
    });

    this.$root.$on('removeRoot', (fqid) => {
      this.$store.commit(REMOVE_ROOT_OBJECT, this.filters.rootObjects.indexOf(fqid));
    });
  },

  beforeUpdate() {
    if (this.isGiantAppMap) {
      this.showStatsPanel = true;
      this.setView(null);
    }
  },
};
</script>

<style lang="scss">
// This is not be the best place to declare font-face.
// The best options would be something like:
//
// import Vue from 'vue';
// import App from './App.vue';
// import './assets/scss/fonts.scss';
// new Vue({
//   render: (h) => h(App),
// }).$mount('#app');
//
// But I don't think it is possible with the current setup.
// And we do not want to add font-face declaration in scss/vue.scss.
// It will cause the font-face to be redeclared in each component.
// Finally, we can redeclare font-face in components on need-basis.
// But that leads to a lot of repetition. I still prefer this.
// I aslo tried to declare font-face in a separate file.
// But scss does not update url(...) when the file is imported.
@font-face {
  font-family: 'IBM Plex Mono';
  src: local('IBM Plex Mono'),
    url(../assets/fonts/IBM_Plex_Mono/IBMPlexMono-Regular.ttf) format('truetype');
}

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

.appmap-stats {
  height: 95%;
  overflow-y: auto;
  overflow: scroll;
  padding: 0;
}

.share-appmap,
.appmap-stats {
  box-shadow: $box-shadow-min;
  font-family: $appland-text-font-family;
  position: absolute;
  top: 5rem;
  right: 2rem;
  background-color: $gray2;
  border-radius: 0.5rem;
  width: calc(100% - 4rem);
  word-break: break-word;
  z-index: 2;
  h1 {
    color: $white;
    font-weight: 800;
  }
  h3 {
    margin-bottom: 0.5rem;
  }
  .heading {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 2rem;
    border-bottom: 1px solid #808b9869;
    svg {
      margin-right: 0.5rem;
    }
  }
  .content {
    padding: 0 2rem;
    color: $white;
    line-height: 1.5rem;
  }
  .share-url {
    p {
      margin-top: 0.5rem;
      margin-bottom: 0;
    }
  }
  .share-link {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    background-color: $white;
    padding: 0.6rem 1.25rem;
    border-radius: 0.5rem;
    .url {
      color: $blue;
      font-weight: 800;
      transition: $transition;
      &:hover {
        color: $royal;
        cursor: pointer;
      }
    }
    .icon {
      &:hover {
        cursor: pointer;
      }
      color: $blue;
    }
  }
  .close-me {
    transition: $transition;
    font-weight: 800;
    width: 16px;
    height: 16px;
    fill: white;
    &:hover {
      fill: $blue;
      cursor: pointer;
    }
  }
}

.appmap-stats {
  background-color: transparent;
  .notification {
    padding: 1rem;
    border-radius: 0.5rem;
    display: grid;
    grid-template-columns: auto;
    gap: 0.5rem;
    align-items: baseline;
    margin: 0 1rem 1rem 1rem;
    box-shadow: $box-shadow-min;
    .content {
      margin: 0;
      padding: 0;
    }
    .notification-head {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }
    svg {
      width: 1rem;
      height: 1rem;
      fill: $white;
    }
    a {
      color: inherit;
    }
    p {
      margin: 0;
    }
    &.blocked {
      background-color: #d1245c;
    }
    &.trimmed {
      background: #c07d1b;
    }
  }
}

#app {
  position: relative;
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-rows: 100%;
  height: 100vh;
  color: $base11;
  background-color: $black;

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
        appearance: none;
        cursor: pointer;
        transition: color 0.3s ease-in;

        &:hover,
        &:active {
          color: $gray5;
          transition-timing-function: ease-out;
        }

        &__icon {
          width: 16px;
          height: 14px;
          fill: currentColor;
        }
      }

      .download-button {
        display: inline-block;
      }

      .diagram-instructions {
        position: absolute;
        right: 1.3rem;
        bottom: 1.3rem;
      }

      .hover-text-popper {
        display: inline-block;
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
  background: $gray2;
  border: 0;
  border-radius: 50px;
}
::-webkit-scrollbar-thumb:hover,
::-webkit-scrollbar-thumb:active {
  background: $gray5;
}
::-webkit-scrollbar-track {
  background: $black;
  border: 0;
  border-radius: 50px;
}
::-webkit-scrollbar-corner {
  background: transparent;
}

@media (max-width: 1250px) {
  #app .main-column--right .hover-text-popper {
    background-color: transparent;
    padding: 0;
    span {
      display: none;
    }
  }
}
</style>
