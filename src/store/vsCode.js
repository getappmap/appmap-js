import Vue from 'vue';
import Vuex from 'vuex';
import { AppMap, buildAppMap } from '@appland/models';

Vue.use(Vuex);

export const SELECT_OBJECT = 'selectObject';
export const SET_APPMAP_DATA = 'setAppMapData';

const initialState = {
  appMap: new AppMap(),
  selectedObject: {
    kind: null,
    object: null,
  },
};

export const store = new Vuex.Store({
  state: { ...initialState },

  mutations: {
    [SET_APPMAP_DATA](state, data) {
      state.selectedObject = { ...initialState.selectedObject };
      state.appMap = buildAppMap()
        .source(data)
        .normalize()
        .build();
    },
    [SELECT_OBJECT](state, selection) {
      const selectedObject = { ...initialState.selectedObject };
      const { kind, data } = selection;

      switch (kind) {
        case 'component': {
          const { id } = data;
          if (id) {
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
                selectedObject.kind = 'http';
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

      state.selectedObject = selectedObject;
    },
  },
});
