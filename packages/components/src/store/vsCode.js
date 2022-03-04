import Vue from 'vue';
import Vuex from 'vuex';
import {
  AppMap,
  buildAppMap,
  fullyQualifiedFunctionName,
} from '@appland/models';

Vue.use(Vuex);

export const SELECT_OBJECT = 'selectObject';
export const SELECT_LABEL = 'selectLabel';
export const SELECT_REFERENCE = 'selectReference';
export const SET_APPMAP_DATA = 'setAppMapData';
export const POP_OBJECT_STACK = 'popObjectStack';
export const CLEAR_OBJECT_STACK = 'clearObjectStack';
export const SET_VIEW = 'setView';
export const SET_FOCUSED_EVENT = 'setFocusedEvent';
export const VIEW_COMPONENT = 'viewComponent';
export const VIEW_FLOW = 'viewFlow';

export function buildStore() {
  return new Vuex.Store({
    state: {
      appMap: new AppMap(),
      selectionStack: [],
      currentView: VIEW_COMPONENT,
      focusedEvent: null,
    },

    getters: {
      selectedObject(state) {
        const obj = state.selectionStack[state.selectionStack.length - 1];
        return obj ? obj.data : null;
      },
      selectedObjectType(state) {
        const obj = state.selectionStack[state.selectionStack.length - 1];
        return obj ? obj.type : null;
      },
      canPopStack(state) {
        return state.selectionStack.length > 1;
      },
      prevSelectedObject(state) {
        return state.selectionStack.length > 1
          ? state.selectionStack[state.selectionStack.length - 2].data
          : null;
      },
      focusedEvent(state) {
        return state.focusedEvent;
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

      [SELECT_OBJECT](state, selection) {
        if (Array.isArray(selection)) {
          selection.forEach((obj) => {
            state.selectionStack.push({
              type: 'object',
              data: obj,
            });
          });
        } else {
          state.selectionStack.push({
            type: 'object',
            data: selection,
          });
        }
        state.focusedEvent = null;
      },

      [SELECT_LABEL](state, label) {
        state.selectionStack.push({
          type: 'label',
          data: label,
        });
        state.focusedEvent = null;
      },

      [SELECT_REFERENCE](state, reference) {
        state.selectionStack.push({
          type: 'reference',
          data: reference,
        });
        state.focusedEvent = null;
      },

      [POP_OBJECT_STACK](state) {
        state.selectionStack.pop();
      },

      [CLEAR_OBJECT_STACK](state) {
        state.selectionStack = [];
        state.focusedEvent = null;
      },

      [SET_VIEW](state, view) {
        state.currentView = view;
      },

      [SET_FOCUSED_EVENT](state, event) {
        state.focusedEvent = event;
      },
    },
  });
}

export const store = buildStore();
