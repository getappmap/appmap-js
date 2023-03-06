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
        @onChangeFilter="
          (value) => {
            this.eventFilterText = value;
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
          :isNew="true"
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
            v-if="appMapUploadable"
            class="hover-text-popper"
            text="Create a link to this AppMap"
            placement="bottom"
            text-align="right"
          >
            <button class="control-button appmap-upload" @click="uploadAppmap" title="">
              <UploadIcon class="control-button__icon" />
              <span>Share</span>
            </button>
          </v-popper>
          <v-popper
            v-if="showDownload"
            class="hover-text-popper"
            text="Export in SVG format"
            placement="bottom"
            text-align="right"
          >
            <v-download-sequence-diagram ref="export">
              <button
                class="control-button appmap-upload"
                @click="$refs.export.download()"
                title=""
              >
                <ExportIcon class="control-button__icon" />
                <span>Export</span>
              </button>
            </v-download-sequence-diagram>
          </v-popper>
          <v-popper-menu :isHighlight="filtersChanged">
            <template v-slot:icon>
              <FilterIcon class="control-button__icon" @click="openFilterModal" />
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
                    <div class="filters__root" v-for="(id, index) in filters.rootObjects" :key="id">
                      {{ id }}
                      <CloseThinIcon
                        class="filters__root-icon"
                        @click.stop="removeRootObject(index)"
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
                        <input type="checkbox" v-model="filters.declutter.limitRootEvents.on" />
                        <CheckIcon class="filters__checkbox-icon" />
                      </label>
                      <div class="filters__block-row-content">Limit root events to HTTP</div>
                    </div>
                    <div class="filters__block-row">
                      <label class="filters__checkbox">
                        <input type="checkbox" v-model="filters.declutter.hideMediaRequests.on" />
                        <CheckIcon class="filters__checkbox-icon" />
                      </label>
                      <div class="filters__block-row-content">Hide media HTTP requests</div>
                    </div>
                    <div class="filters__block-row">
                      <label class="filters__checkbox">
                        <input type="checkbox" v-model="filters.declutter.hideUnlabeled.on" />
                        <CheckIcon class="filters__checkbox-icon" />
                      </label>
                      <div class="filters__block-row-content">Hide unlabeled</div>
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
                            v-model="filters.declutter.hideElapsedTimeUnder.time"
                          />
                          <span class="filters__elapsed-ms">ms</span>
                        </div>
                      </div>
                    </div>
                    <div class="filters__block-row">
                      <label class="filters__checkbox">
                        <input type="checkbox" v-model="filters.declutter.hideName.on" />
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
                        <div class="filters__hide" v-if="filters.declutter.hideName.names.length">
                          <div
                            class="filters__hide-item"
                            v-for="(name, index) in filters.declutter.hideName.names"
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
          <button class="control-button diagram-reload" @click="resetDiagram" title="Clear">
            <ReloadIcon class="control-button__icon" />
          </button>
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

      <div class="diagram-instructions">
        <v-instructions ref="instructions" />
      </div>
    </div>

    <div class="no-data-notice" v-if="isEmptyAppMap && !isLoading">
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
import { Buffer } from 'buffer';
import { Event, AppMapFilter } from '@appland/models';
import CheckIcon from '@/assets/check.svg';
import CopyIcon from '@/assets/copy-icon.svg';
import CloseThinIcon from '@/assets/close-thin.svg';
import CloseIcon from '@/assets/close.svg';
import ReloadIcon from '@/assets/reload.svg';
import ResetIcon from '@/assets/reset.svg';
import UploadIcon from '@/assets/link-icon.svg';
import ExportIcon from '@/assets/export.svg';
import FilterIcon from '@/assets/filter.svg';
import DiagramGray from '@/assets/diagram-empty.svg';
import VDetailsPanel from '../components/DetailsPanel.vue';
import VDetailsButton from '../components/DetailsButton.vue';
import VDiagramComponent from '../components/DiagramComponent.vue';
import VDiagramSequence from '../components/DiagramSequence.vue';
import VDiagramTrace from '../components/DiagramTrace.vue';
import VDownloadSequenceDiagram from '../components/sequence/DownloadSequenceDiagram.vue';
import VFiltersForm from '../components/FiltersForm.vue';
import VInstructions from '../components/Instructions.vue';
import VNotification from '../components/Notification.vue';
import VPopperMenu from '../components/PopperMenu.vue';
import VPopper from '../components/Popper.vue';
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
  SELECT_CODE_OBJECT,
  SELECT_LABEL,
  POP_SELECTION_STACK,
  CLEAR_SELECTION_STACK,
} from '../store/vsCode';

function base64UrlEncode(text) {
  const buffer = Buffer.from(text, 'utf-8');
  return buffer.toString('base64').replace(/=/g, '').replace(/_/g, '/').replace(/-/g, '+');
}

function base64UrlDecode(encodedText) {
  const buffer = Buffer.from(encodedText, 'base64');
  return buffer.toString('utf-8');
}

export default {
  name: 'VSCodeExtension',

  components: {
    CheckIcon,
    CloseThinIcon,
    CloseIcon,
    CopyIcon,
    ReloadIcon,
    ResetIcon,
    UploadIcon,
    ExportIcon,
    FilterIcon,
    VDetailsPanel,
    VDetailsButton,
    VDiagramComponent,
    VDiagramSequence,
    VDiagramTrace,
    VDownloadSequenceDiagram,
    VFiltersForm,
    VInstructions,
    VNotification,
    VPopperMenu,
    VPopper,
    VTabs,
    VTab,
    VTraceFilter,
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
      VIEW_SEQUENCE,
      VIEW_FLOW,
      filters: new AppMapFilter(),
      eventFilterText: '',
      eventFilterMatchIndex: 0,
      showShareModal: false,
      shareURL: undefined,
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
    '$store.getters.selectedLabel': {
      handler() {
        this.$root.$emit('stateChanged', 'selectedObject');
      },
    },
    '$store.getters.focusedEvent': {
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
  },

  computed: {
    classes() {
      return this.isLoading ? 'app--loading' : '';
    },

    findings() {
      const { appMap } = this.$store.state;
      const {
        data: { findings },
      } = appMap;
      return this.uniqueFindings(findings);
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
                      this.filters.declutter.limitRootEvents.on = false;
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

    isViewingSequence() {
      return this.currentView === VIEW_SEQUENCE;
    },

    isViewingFlow() {
      return this.currentView === VIEW_FLOW;
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

    shareURLmessage() {
      if (this.shareURL) return this.shareURL;
      return 'Retrieving link...';
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
    },

    setView(view) {
      if (this.currentView !== view) {
        this.$store.commit(SET_VIEW, view);
      }
    },

    getState() {
      const state = {};

      state.currentView = this.currentView;

      if (this.selectedObject && this.selectedObject.fqid) {
        state.selectedObject = this.selectedObject.fqid;
      } else if (this.selectedLabel) {
        state.selectedObject = `label:${this.selectedLabel}`;
      }

      if (this.eventFilterText) {
        state.traceFilter = this.eventFilterText;
      }

      const { declutter } = this.filters;

      state.filters = Object.entries({
        rootObjects: declutter.rootObjects,
        limitRootEvents: declutter.limitRootEvents.on,
        hideMediaRequests: declutter.hideMediaRequests.on,
        hideUnlabeled: declutter.hideUnlabeled.on,
        hideElapsedTimeUnder: declutter.hideElapsedTimeUnder.on
          ? declutter.hideElapsedTimeUnder.time
          : false,
        hideName: declutter.hideName.on ? declutter.hideName.names : false,
      }).reduce((memo, [k, v]) => {
        // This could be cleaned up. The serialized data structure differs from
        // what we use internally, which causes this to be a bit of a mess.
        const filter = this.filters.declutter[k];
        if (Array.isArray(v) && v.length !== 0) {
          memo[k] = v;
        } else if (filter && filter.default !== v) {
          memo[k] = v;
        }
        return memo;
      }, {});

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

        let json;
        const isStringifiedJson = serializedState.trimLeft().startsWith('{');
        if (isStringifiedJson) {
          // The old style of deserialization expected a raw stringified JSON object.
          // To avoid introducing a breaking change, we'll support both for now.
          json = serializedState;
        } else {
          json = base64UrlDecode(serializedState);
        }

        const state = JSON.parse(json);
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
                  Object.keys(this.filters.declutter).forEach((k) => {
                    this.filters.declutter[k].on = false;
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

        const { filters } = state;
        if (filters) {
          if ('rootObjects' in filters) {
            this.filters.declutter.rootObjects = filters.rootObjects;
          }
          if ('limitRootEvents' in filters) {
            this.filters.declutter.limitRootEvents.on = filters.limitRootEvents;
          }
          if ('hideMediaRequests' in filters) {
            this.filters.declutter.hideMediaRequests.on = filters.hideMediaRequests;
          }
          if ('hideUnlabeled' in filters) {
            this.filters.declutter.hideUnlabeled.on = filters.hideUnlabeled;
          }
          if ('hideElapsedTimeUnder' in filters && filters.hideElapsedTimeUnder !== false) {
            this.filters.declutter.hideElapsedTimeUnder.on = true;
            this.filters.declutter.hideElapsedTimeUnder.time = filters.hideElapsedTimeUnder;
          }
          if ('hideName' in filters && filters.hideName !== false) {
            this.filters.declutter.hideName.on = true;
            this.filters.declutter.hideName.names = filters.hideName;
          }
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
      this.clearSelection();
      this.resetFilters();
      this.$root.$emit('resetDiagram');

      this.renderKey += 1;
    },

    uploadAppmap() {
      this.showShareModal = true;
      this.$root.$emit('uploadAppmap');
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

    resetFilters() {
      this.filters.rootObjects = [];
      Object.keys(this.filters.declutter).forEach((k) => {
        this.filters.declutter[k].on = this.filters.declutter[k].default;
      });
      this.filters.declutter.hideElapsedTimeUnder.time = 100;
      this.filters.declutter.hideName.names = [];
    },

    addHiddenName(name) {
      const objectName = name.trim();

      if (!objectName || this.filters.declutter.hideName.names.includes(objectName)) {
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

.share-appmap {
  box-shadow: $box-shadow-min;
  font-family: $appland-text-font-family;
  position: absolute;
  top: 5rem;
  right: 2rem;
  background-color: $gray2;
  border-radius: 0.5rem;
  padding: 0 0 2rem 0;
  width: calc(100% - 4rem);
  word-break: break-word;
  z-index: 200;
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

        .appmap-upload {
          background-color: $dark-purple;
          border-radius: 0.5rem;
          color: $white;
          padding: 0.25rem 0.65rem;
          text-transform: uppercase;
          flex-direction: row-reverse;
          gap: 0.5rem;
          span {
            font-size: 0.85rem;
            margin: auto;
          }
        }
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

  .filters {
    width: 390px;
    font-size: 0.75rem;

    &__head {
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid $gray2;
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
        padding: 0.5rem 0rem;
        line-height: 1.25rem;
        background: $black;
        border-bottom: 1px solid $gray2;
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
        background: $black;

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
      border: 1px solid $gray2;

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
  #app .main-column--right .hover-text-popper .appmap-upload {
    background-color: transparent;
    padding: 0;
    span {
      display: none;
    }
    svg {
      fill: $gray4;
    }
  }
}
</style>
