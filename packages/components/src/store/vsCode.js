import Vue from 'vue';
import Vuex from 'vuex';
import { AppMap, buildAppMap, fullyQualifiedFunctionName } from '@appland/models';

Vue.use(Vuex);

export const SELECT_CODE_OBJECT = 'selectCodeObject';
export const SELECT_LABEL = 'selectLabel';
export const SET_APPMAP_DATA = 'setAppMapData';
export const POP_SELECTION_STACK = 'popSelectionStack';
export const CLEAR_SELECTION_STACK = 'clearSelectionStack';
export const SET_VIEW = 'setView';
export const SET_SELECTED_TRACE_EVENT = 'setSelectedTraceEvent';
export const VIEW_COMPONENT = 'viewComponent';
export const VIEW_SEQUENCE = 'viewSequence';
export const VIEW_FLOW = 'viewFlow';
export const DEFAULT_VIEW = VIEW_COMPONENT;
export const SET_FILTERED_MAP = 'setFilteredMap';

export function buildStore() {
  return new Vuex.Store({
    state: {
      appMap: new AppMap(),
      selectionStack: [],
      currentView: DEFAULT_VIEW,
      selectedLabel: null,
      selectedTraceEvent: null,
      filteredAppMap: new AppMap(),
    },

    getters: {
      selectedObject(state) {
        return state.selectionStack[state.selectionStack.length - 1];
      },
      canPopStack(state) {
        return state.selectionStack.length > 1;
      },
      prevSelectedObject(state) {
        return state.selectionStack.length > 1
          ? state.selectionStack[state.selectionStack.length - 2]
          : null;
      },
      selectedLabel(state) {
        return state.selectedLabel;
      },
      selectedTraceEvent(state) {
        return state.selectedTraceEvent;
      },
    },

    mutations: {
      [SET_APPMAP_DATA](state, data) {
        state.selectionStack = [];
        state.appMap = buildAppMap().source(data).normalize().build();

        state.appMap.callTree.rootEvent.forEach((e) => {
          e.displayName = fullyQualifiedFunctionName(e.input);
        });
      },

      // Show information about a code object in the sidebar.
      // The code object can be a package, class, function, SQL, etc, or it can
      // be a specific event.
      [SELECT_CODE_OBJECT](state, selection) {
        if (!Array.isArray(selection)) selection = [selection];

        state.selectionStack.push(...selection);
        state.selectedLabel = null;
        state.selectedTraceEvent = null;
      },

      [POP_SELECTION_STACK](state) {
        state.selectionStack.pop();
      },

      [CLEAR_SELECTION_STACK](state) {
        state.selectionStack = [];
        state.selectedLabel = null;
        state.selectedTraceEvent = null;
      },

      [SELECT_LABEL](state, label) {
        state.selectionStack = [];
        state.selectedLabel = label;
        state.selectedTraceEvent = null;
      },

      [SET_VIEW](state, view) {
        state.currentView = view;
      },

      // Show the selected event in the current diagram (not the sidebar).
      [SET_SELECTED_TRACE_EVENT](state, event) {
        state.selectedTraceEvent = event;
      },

      [SET_FILTERED_MAP](state, filteredAppMap) {
        state.filteredAppMap = filteredAppMap;
      },
    },
  });
}

export const store = buildStore();
