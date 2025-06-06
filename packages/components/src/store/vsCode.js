import { createStore } from 'vuex';
import {
  AppMap,
  buildAppMap,
  fullyQualifiedFunctionName,
  AppMapFilter,
  deserializeFilter,
  base64UrlDecode,
} from '@appland/models';

export const SELECT_CODE_OBJECT = 'selectCodeObject';
export const SELECT_LABEL = 'selectLabel';
export const SET_APPMAP_DATA = 'setAppMapData';
export const POP_SELECTION_STACK = 'popSelectionStack';
export const CLEAR_SELECTION_STACK = 'clearSelectionStack';
export const SET_VIEW = 'setView';
export const SET_FOCUSED_EVENT = 'setFocusedEvent';
export const VIEW_COMPONENT = 'viewComponent';
export const VIEW_SEQUENCE = 'viewSequence';
export const VIEW_FLOW = 'viewFlow';
export const VIEW_FLAMEGRAPH = 'viewFlamegraph';
export const ADD_EXPANDED_PACKAGE = 'addExpandedPackage';
export const REMOVE_EXPANDED_PACKAGE = 'removeExpandedPackage';
export const SET_EXPANDED_PACKAGES = 'setExpandedPackage';
export const CLEAR_EXPANDED_PACKAGES = 'clearExpandedPackage';
export const SET_FILTER = 'setFilter';
export const SET_DECLUTTER_ON = 'setFilterBoolean';
export const SET_ELAPSED_TIME = 'setElapsedTime';
export const RESET_FILTERS = 'resetFilters';
export const ADD_ROOT_OBJECT = 'addRootObject';
export const REMOVE_ROOT_OBJECT = 'removeRootObject';
export const ADD_HIDDEN_NAME = 'addHiddenName';
export const REMOVE_HIDDEN_NAME = 'removeHiddenName';
export const SET_SAVED_FILTERS = 'setSavedFilters';
export const SET_SELECTED_SAVED_FILTER = 'setselectedSavedFilter';
export const SET_HIGHLIGHTED_EVENTS = 'setHighlightedEvents';
export const DEFAULT_VIEW = VIEW_COMPONENT;
export const DEFAULT_FILTER_NAME = 'AppMap default';
export const SET_COLLAPSED_ACTION_STATE = 'setCollapsedActionState';

// Always have the AppMap default filter as the top option
function savedFiltersSorter(a, b) {
  // default filter goes on top
  if (a.default) return -1;
  if (b.default) return 1;

  // AppMap default filter goes next
  if (a.filterName === DEFAULT_FILTER_NAME) return -1;
  if (b.filterName === DEFAULT_FILTER_NAME) return 1;

  return a.filterName.localeCompare(b.filterName);
}

export function buildStore() {
  return createStore({
    state: {
      appMap: new AppMap(),
      precomputedSequenceDiagram: null,
      selectionStack: [],
      currentSelection: null,
      currentView: DEFAULT_VIEW,
      selectedLabel: null,
      focusedEvent: null,
      expandedPackages: [],
      filters: new AppMapFilter(),
      savedFilters: [],
      selectedSavedFilter: null,
      defaultFilter: null,
      highlightedEvents: [],
      collapsedActionState: [],
    },

    getters: {
      selectedObject(state) {
        if (state.currentSelection) return state.currentSelection;
        return state.selectionStack[state.selectionStack.length - 1];
      },
    },

    mutations: {
      // Stores the initial, complete AppMap.
      [SET_APPMAP_DATA](state, data) {
        state.selectionStack = [];
        state.appMap = buildAppMap().source(data).normalize().build();
        if (data.sequenceDiagram) state.precomputedSequenceDiagram = data.sequenceDiagram;

        state.appMap.callTree.rootEvent.forEach((e) => {
          e.displayName = fullyQualifiedFunctionName(e.input);
        });
      },

      // Show information about a code object in the sidebar.
      // The code object can be a package, class, function, SQL, etc, or it can
      // be a specific event. These code object selections are stored in a stack, so that
      // the user can navigate back to the previous selection.
      [SELECT_CODE_OBJECT](state, selection) {
        if (!selection) {
          console.warn('SELECT_CODE_OBJECT called with falsey selection');
          return;
        }

        let selectionProperty = 'fqid';
        if (selection && selection.type === 'analysis-finding') selectionProperty = 'name';

        const existingSelection = state.selectionStack.find(
          (selectedObject) =>
            selection && selection[selectionProperty] === selectedObject[selectionProperty]
        );

        if (existingSelection) {
          state.currentSelection = existingSelection;
        } else {
          let selectionStack = Array.isArray(selection) ? selection : [selection];
          state.selectionStack.push(...selectionStack);
          state.currentSelection = null;
        }

        state.selectedLabel = null;
        state.focusedEvent = null;
      },

      [POP_SELECTION_STACK](state) {
        state.selectionStack.pop();
        state.selectedLabel = null;
        state.focusedEvent = null;
        state.highlightedEvents = [];
      },

      [CLEAR_SELECTION_STACK](state) {
        state.selectionStack = [];
        state.selectedLabel = null;
        state.focusedEvent = null;
        state.highlightedEvents = [];
        state.currentSelection = null;
      },

      [SELECT_LABEL](state, label) {
        state.selectionStack = [];
        state.selectedLabel = label;
        state.focusedEvent = null;
        state.highlightedEvents = [];
      },

      [SET_VIEW](state, view) {
        state.currentView = view;
      },

      // Focused event refers to an event that should be displayed and emphasized in
      // the current events view (sequence diagram or trace view). The viewport should be adjusted
      // so that this event is visible, and an effect can be rendered on the event.
      // This action does not imply that the sidebar display should be changed.
      [SET_FOCUSED_EVENT](state, event) {
        state.focusedEvent = event;
      },

      [ADD_EXPANDED_PACKAGE](state, packageToAdd) {
        state.expandedPackages.push(packageToAdd);
      },

      [REMOVE_EXPANDED_PACKAGE](state, subClass) {
        state.expandedPackages = state.expandedPackages.filter(
          (expandedPackage) => expandedPackage.fqid !== subClass.packageObject.fqid
        );
      },

      [SET_EXPANDED_PACKAGES](state, expandedPackages) {
        state.expandedPackages = expandedPackages;
      },

      [CLEAR_EXPANDED_PACKAGES](state) {
        state.expandedPackages = [];
      },

      [SET_FILTER](state, filter) {
        state.filters = filter;
      },

      [SET_DECLUTTER_ON](state, { declutterProperty, value }) {
        state.filters.declutter[declutterProperty].on = value;
      },

      [SET_ELAPSED_TIME](state, elapsedTime) {
        state.filters.declutter.hideElapsedTimeUnder.time = elapsedTime;
      },

      [RESET_FILTERS](state) {
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

      [ADD_ROOT_OBJECT](state, fqid) {
        const objectFqid = fqid.trim();

        if (!objectFqid || state.filters.rootObjects.includes(objectFqid)) return;

        state.filters.rootObjects.push(objectFqid);
      },

      [REMOVE_ROOT_OBJECT](state, index) {
        state.filters.rootObjects.splice(index, 1);
      },

      [ADD_HIDDEN_NAME](state, nameToRemove) {
        const objectName = nameToRemove.trim();
        if (!objectName || state.filters.declutter.hideName.names.includes(objectName)) return;

        state.filters.declutter.hideName.names.push(objectName);
        state.filters.declutter.hideName.on = true;
      },

      [REMOVE_HIDDEN_NAME](state, index) {
        state.filters.declutter.hideName.names.splice(index, 1);
      },

      [SET_SAVED_FILTERS](state, savedFilters) {
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

      [SET_SELECTED_SAVED_FILTER](state, selectedSavedFilter) {
        state.selectedSavedFilter = selectedSavedFilter;
      },

      [SET_HIGHLIGHTED_EVENTS](state, highlightedEvents) {
        state.highlightedEvents = highlightedEvents;
      },

      [SET_COLLAPSED_ACTION_STATE](state, collapsedActionState) {
        state.collapsedActionState = collapsedActionState;
      },
    },
  });
}

export const store = buildStore();
