import Vue from 'vue';
import Vuex from 'vuex';
import { AppMap, buildAppMap } from '@appland/models';
import { fullyQualifiedFunctionName } from '@appland/diagrams/src/js/util'; // HACK

Vue.use(Vuex);

export const SELECT_OBJECT = 'selectObject';
export const SET_APPMAP_DATA = 'setAppMapData';
export const POP_OBJECT_STACK = 'popObjectStack';
export const SET_VIEW = 'setView';
export const VIEW_COMPONENT = 'viewComponent';
export const VIEW_FLOW = 'viewFlow';

export const store = new Vuex.Store({
  state: {
    appMap: new AppMap(),
    selectionStack: [],
    currentView: VIEW_COMPONENT,
  },

  getters: {
    selectedObject(state) {
      return state.selectionStack[state.selectionStack.length - 1];
    },
    canPopStack(state) {
      return state.selectionStack.length > 1;
    },
  },

  mutations: {
    [SET_APPMAP_DATA](state, data) {
      state.selectionStack = [];
      state.appMap = buildAppMap()
        .source(data)
        .normalize()
        .build();

      state.appMap.callTree.rootEvent.forEach((e) => {
        e.displayName = fullyQualifiedFunctionName(e.input);
      });
    },

    [SELECT_OBJECT](state, selection) {
      const selectedObject = { kind: null, object: null };
      const { kind, data } = selection;

      switch (kind) {
        case 'component': {
          const { id } = data;
          if (id === 'HTTP') {
            selectedObject.kind = 'http';
            selectedObject.object = null;
          } else if (id === 'SQL') {
            selectedObject.kind = 'database';
            selectedObject.object = null;
          } else if (id) {
            const matches = state.appMap.classMap.search(data.id);
            const object = matches[0] || null;
            if (object) {
              selectedObject.object = object;
              selectedObject.kind = object.type;
            } else {
              const httpEvents = state.appMap.events.filter((e) => {
                if (!e.isCall() || !e.http_server_request) {
                  return false;
                }

                /* eslint-disable camelcase */
                const {
                  path_info,
                  request_method,
                  normalized_path_info,
                } = e.http_server_request;

                const path = normalized_path_info || path_info;
                return id === `${request_method} ${path}`;
                /* eslint-enable camelcase */
              });

              if (httpEvents.length > 0) {
                selectedObject.kind = 'route';
                selectedObject.object = httpEvents;
              }
            }
          }
          break;
        }
        default: {
          selectedObject.kind = kind;
          selectedObject.object = data;
        }
      }

      if (selection.clearStack) {
        state.selectionStack = [];
      }

      if (selectedObject.kind) {
        state.selectionStack.push(selectedObject);
      }
    },

    [POP_OBJECT_STACK](state) {
      state.selectionStack.pop();
    },

    [SET_VIEW](state, view) {
      state.currentView = view;
    },
  },
});
