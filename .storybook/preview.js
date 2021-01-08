import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
}
