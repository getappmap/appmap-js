import Vue from 'vue';
import Vuex from 'vuex';
import {
  AppMap,
  buildAppMap,
  AppMapFilter,
  deserializeFilter,
  base64UrlDecode,
  CodeObject,
  Event,
  Filter,
} from '@appland/models';
import toListItem, { FindingListItem, ResolvedFinding } from '@/lib/finding';

Vue.use(Vuex);

export const DEFAULT_VIEW = 'viewComponent';
export const DEFAULT_FILTER_NAME = 'AppMap default';

// Always have the AppMap default filter as the top option
function savedFiltersSorter(a: any, b: any) {
  // default filter goes on top
  if (a.default) return -1;
  if (b.default) return 1;

  // AppMap default filter goes next
  if (a.filterName === DEFAULT_FILTER_NAME) return -1;
  if (b.filterName === DEFAULT_FILTER_NAME) return 1;

  return a.filterName.localeCompare(b.filterName);
}

type Selectable = CodeObject | Event | FindingListItem;
type SavedFilter = {
  filterName: string;
  state: string;
  default?: boolean;
};

export function buildStore() {
  return new Vuex.Store({
    state: {
      appMap: new AppMap(),
      filteredAppMap: new AppMap(),
      precomputedSequenceDiagram: undefined,
      selectionStack: [] as Selectable[],
      currentSelection: undefined as Selectable | undefined,
      currentView: DEFAULT_VIEW,
      selectedLabel: undefined,
      focusedEvent: undefined,
      expandedPackages: [] as CodeObject[],
      filters: new AppMapFilter(),
      findings: [] as ResolvedFinding[],
      savedFilters: [] as SavedFilter[],
      selectedSavedFilter: undefined as SavedFilter | undefined,
      defaultFilter: undefined as SavedFilter | undefined,
      highlightedEvents: [],
      collapsedActionState: [],
    },

    getters: {
      selectedObject(state) {
        if (state.currentSelection) return state.currentSelection;
        return state.selectionStack[state.selectionStack.length - 1];
      },
      appMap: (state) => state.filteredAppMap,
    },

    actions: {
      loadAppMap({ commit }, data) {
        commit('SET_APPMAP_DATA', data);
      },
      selectObject({ commit, state }, fqid: string, modifyFilters?: boolean) {
        const [match, type, object] = fqid.match(/^([a-z\-]+):(.+)/) || [];
        if (!match) return;

        if (type === 'label') {
          commit('SELECT_LABEL', object);
          return;
        }

        const { classMap, events } = state.filteredAppMap;
        let selectedObject: Event | CodeObject | undefined;

        if (type === 'event') {
          const eventId = parseInt(object, 10);

          if (Number.isNaN(eventId)) return;

          selectedObject = events.find((e) => e.id === eventId);

          // It's possible that we're trying to select an object that does not exist in the filtered
          // set. If we're unable to find an object, we'll look for it in the unfiltered set.
          if (!selectedObject && modifyFilters) {
            selectedObject = state.appMap.events.find((e) => e.id === eventId);

            // We found it in the unfiltered set. So start turning everything on.
            // TODO: Why everything?
            if (selectedObject) commit('CLEAR_DECLUTTER_FILTERS');
          }
        } else if (type === 'analysis-finding') {
          const hash_v2 = object;
          const finding = state.findings.find(({ finding }) => finding.hash_v2 === hash_v2);
          if (finding) commit('SELECT_CODE_OBJECT', toListItem(finding));
        } else {
          selectedObject = classMap.codeObjects.find((obj) => obj.fqid === fqid);
        }

        if (selectedObject) commit('SELECT_CODE_OBJECT', selectedObject);
      },
    },

    mutations: {
      // Stores the initial, complete AppMap.
      SET_APPMAP_DATA(state, data) {
        state.selectionStack = [];
        state.appMap = buildAppMap().source(data).normalize().build();
        if (data.sequenceDiagram) state.precomputedSequenceDiagram = data.sequenceDiagram;

        // TODO: Is this needed? This looks like view model code
        // state.appMap.callTree.rootEvent.forEach((e) => {
        //   e.displayName = fullyQualifiedFunctionName(e.input);
        // });
      },

      // Show information about a code object in the sidebar.
      // The code object can be a package, class, function, SQL, etc, or it can
      // be a specific event. These code object selections are stored in a stack, so that
      // the user can navigate back to the previous selection.
      SELECT_CODE_OBJECT(state, selection?: Selectable) {
        if (selection) {
          let selectionProperty: keyof CodeObject | keyof Event | keyof FindingListItem = 'fqid';
          if ('type' in selection && selection.type === 'analysis-finding') {
            selectionProperty = 'name';
          }

          const existingSelection = state.selectionStack.find((selectedObject) => {
            if (!(selectionProperty in selectedObject)) return false;
            if (!(selectionProperty in selection)) return false;
            return (
              (selectedObject as any)[selectionProperty] === (selection as any)[selectionProperty]
            );
          });

          if (existingSelection) {
            state.currentSelection = existingSelection;
          } else {
            const selectionStack = Array.isArray(selection) ? selection : [selection];
            state.selectionStack.push(...selectionStack);
            state.currentSelection = undefined;
          }
        } else {
          state.selectionStack = [];
          state.currentSelection = undefined;
        }

        state.selectedLabel = undefined;
        state.focusedEvent = undefined;
        state.highlightedEvents = [];
      },

      POP_SELECTION_STACK(state) {
        state.selectionStack.pop();
        state.selectedLabel = undefined;
        state.focusedEvent = undefined;
        state.highlightedEvents = [];
      },

      CLEAR_SELECTION_STACK(state) {
        state.selectionStack = [];
        state.selectedLabel = undefined;
        state.focusedEvent = undefined;
        state.highlightedEvents = [];
        state.currentSelection = undefined;
      },

      SELECT_LABEL(state, label) {
        state.selectionStack = [];
        state.selectedLabel = label;
        state.focusedEvent = undefined;
        state.highlightedEvents = [];
      },

      SET_VIEW(state, view) {
        state.currentView = view;
      },

      // Focused event refers to an event that should be displayed and emphasized in
      // the current events view (sequence diagram or trace view). The viewport should be adjusted
      // so that this event is visible, and an effect can be rendered on the event.
      // This action does not imply that the sidebar display should be changed.
      SET_FOCUSED_EVENT(state, event) {
        state.focusedEvent = event;
      },

      ADD_EXPANDED_PACKAGE(state, packageToAdd: CodeObject) {
        state.expandedPackages.push(packageToAdd);
      },

      REMOVE_EXPANDED_PACKAGE(state, subClass) {
        state.expandedPackages = state.expandedPackages.filter(
          (expandedPackage) => expandedPackage.fqid !== subClass.packageObject.fqid
        );
      },

      SET_EXPANDED_PACKAGES(state, expandedPackages) {
        state.expandedPackages = expandedPackages;
      },

      CLEAR_EXPANDED_PACKAGES(state) {
        state.expandedPackages = [];
      },

      SET_FILTER(state, filter) {
        state.filters = filter;
        state.filteredAppMap = filter.filter(state.appMap, state.findings);
      },

      CLEAR_DECLUTTER_FILTERS(state) {
        Object.values(state.filters.declutter).forEach(
          (declutterProperty: Filter.DeclutterProperty) => {
            declutterProperty.on = false;
          }
        );
        state.filteredAppMap = state.filters.filter(state.appMap, state.findings);
      },

      SET_ELAPSED_TIME(state, elapsedTime: number) {
        state.filters.declutter.hideElapsedTimeUnder.time = elapsedTime;
      },

      RESET_FILTERS(state) {
        let newDefault;
        const defaultFilter = state.savedFilters.find((savedFilter) => savedFilter.default);

        if (defaultFilter) {
          const filterStateString = base64UrlDecode(defaultFilter.state);
          const parsedState = JSON.parse(filterStateString);

          newDefault = deserializeFilter(parsedState.filters);
          state.selectedSavedFilter = defaultFilter;
        } else {
          newDefault = new AppMapFilter();
        }

        state.filters = newDefault;
      },

      ADD_ROOT_OBJECT(state, fqid) {
        const objectFqid = fqid.trim();

        if (!objectFqid || state.filters.rootObjects.includes(objectFqid)) return;

        state.filters.rootObjects.push(objectFqid);
      },

      REMOVE_ROOT_OBJECT(state, index) {
        state.filters.rootObjects.splice(index, 1);
      },

      ADD_HIDDEN_NAME(state, nameToRemove) {
        const objectName = nameToRemove.trim();
        if (!objectName || state.filters.declutter.hideName.names.includes(objectName)) return;

        state.filters.declutter.hideName.names.push(objectName);
        state.filters.declutter.hideName.on = true;
      },

      REMOVE_HIDDEN_NAME(state, index) {
        state.filters.declutter.hideName.names.splice(index, 1);
      },

      SET_SAVED_FILTERS(state, savedFilters) {
        state.savedFilters = savedFilters;
        state.savedFilters.sort(savedFiltersSorter);

        const selectedSavedFilter = state.selectedSavedFilter;
        if (selectedSavedFilter) {
          const newselectedSavedFilter = state.savedFilters.find(
            (savedFilter) => savedFilter.filterName === selectedSavedFilter.filterName
          );
          if (newselectedSavedFilter) state.selectedSavedFilter = newselectedSavedFilter;
        }
      },

      SET_SELECTED_SAVED_FILTER(state, selectedSavedFilter) {
        state.selectedSavedFilter = selectedSavedFilter;
      },

      SET_HIGHLIGHTED_EVENTS(state, highlightedEvents) {
        state.highlightedEvents = highlightedEvents;
      },

      SET_COLLAPSED_ACTION_STATE(state, collapsedActionState) {
        state.collapsedActionState = collapsedActionState;
      },
    },
  });
}

export const store = buildStore();
