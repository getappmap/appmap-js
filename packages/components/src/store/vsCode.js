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
export const SET_FOCUSED_EVENT = 'setFocusedEvent';
export const VIEW_COMPONENT = 'viewComponent';
export const VIEW_SEQUENCE = 'viewSequence';
export const VIEW_FLOW = 'viewFlow';
export const DEFAULT_VIEW = VIEW_COMPONENT;

export function buildStore() {
  return new Vuex.Store({
    state: {
      appMap: new AppMap(),
      selectionStack: [],
      currentView: DEFAULT_VIEW,
      selectedLabel: null,
      focusedEvent: null,
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
      focusedEvent(state) {
        return state.focusedEvent;
      },
    },

    mutations: {
      // Stores the initial, complete AppMap.
      [SET_APPMAP_DATA](state, data) {
        state.selectionStack = [];
        state.appMap = buildAppMap().source(data).normalize().build();

        state.appMap.callTree.rootEvent.forEach((e) => {
          e.displayName = fullyQualifiedFunctionName(e.input);
        });
      },

      // Show information about a code object in the sidebar.
      // The code object can be a package, class, function, SQL, etc, or it can
      // be a specific event. These code object selections are stored in a stack, so that
      // the user can navigate back to the previous selection.
      [SELECT_CODE_OBJECT](state, selection) {
        let selectionStack = Array.isArray(selection) ? selection : [selection];
        state.selectionStack.push(...selectionStack);
        state.selectedLabel = null;
        state.focusedEvent = null;
      },

      [POP_SELECTION_STACK](state) {
        state.selectionStack.pop();
      },

      [CLEAR_SELECTION_STACK](state) {
        state.selectionStack = [];
        state.selectedLabel = null;
        state.focusedEvent = null;
      },

      [SELECT_LABEL](state, label) {
        state.selectionStack = [];
        state.selectedLabel = label;
        state.focusedEvent = null;
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
    },
  });
}

export const store = buildStore();
