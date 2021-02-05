import Vue from 'vue';
import Vuex from 'vuex';
import { AppMap, buildAppMap } from '@/lib/models';
import { fullyQualifiedFunctionName } from '@/lib/util'; // HACK

Vue.use(Vuex);

export const SELECT_OBJECT = 'selectObject';
export const SET_APPMAP_DATA = 'setAppMapData';
export const POP_OBJECT_STACK = 'popObjectStack';
export const CLEAR_OBJECT_STACK = 'clearObjectStack';
export const SET_VIEW = 'setView';
export const SET_FILTERED_OBJECTS = 'setFilteredObjects';
export const VIEW_COMPONENT = 'viewComponent';
export const VIEW_FLOW = 'viewFlow';

export const store = new Vuex.Store({
  state: {
    appMap: new AppMap(),
    selectionStack: [],
    currentView: VIEW_COMPONENT,
    filteredObjects: [],
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
        state.selectionStack.push(...selection);
      } else {
        state.selectionStack.push(selection);
      }
    },

    [POP_OBJECT_STACK](state) {
      state.selectionStack.pop();
    },

    [CLEAR_OBJECT_STACK](state) {
      state.selectionStack = [];
    },

    [SET_VIEW](state, view) {
      state.currentView = view;
    },

    [SET_FILTERED_OBJECTS](state, list) {
      state.filteredObjects = list;
    },
  },
});
