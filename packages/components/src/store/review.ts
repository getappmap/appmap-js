import Vue from 'vue';
import Vuex from 'vuex';
import type { Feature, Suggestion, SuggestionStatus } from '@/components/review';

Vue.use(Vuex);

export interface ReviewState {
  loading: boolean;
  features: Feature[] | undefined;
  suggestions: Suggestion[] | undefined;
  dismissedFeatures: number[];
  suggestionStatuses: Record<string, SuggestionStatus>;
}

export default new Vuex.Store<ReviewState>({
  state: {
    loading: true,
    features: undefined,
    suggestions: undefined,
    dismissedFeatures: [],
    suggestionStatuses: {},
  },
  getters: {
    totalFeatures: (state): number | undefined => {
      return state.features?.length;
    },
    featuresNeedingTests: (state): number | undefined => {
      return state.features?.filter((f) => !f.hasCoverage).length;
    },
    suggestionsSummary: (state): { high: number; medium: number; low: number } | undefined => {
      if (!state.suggestions) return undefined;
      const summary = { high: 0, medium: 0, low: 0 };
      if (Array.isArray(state.suggestions)) {
        for (const suggestion of state.suggestions) {
          if (suggestion.priority === 'high') {
            summary.high++;
          } else if (suggestion.priority === 'medium') {
            summary.medium++;
          } else if (suggestion.priority === 'low') {
            summary.low++;
          }
        }
      }
      return summary;
    },
  },
  mutations: {
    setLoading(state, loading: boolean) {
      state.loading = loading;
    },
    setFeatures(state, features: Feature[] | undefined) {
      state.features = features;
    },
    setSuggestions(state, suggestions: Suggestion[] | undefined) {
      state.suggestions = suggestions;
    },
    dismissFeature(state, index: number) {
      if (!state.dismissedFeatures.includes(index)) {
        state.dismissedFeatures.push(index);
      }
    },
    setSuggestionStatus(state, { id, status }: { id: string; status: SuggestionStatus }) {
      Vue.set(state.suggestionStatuses, id, status);
    },
    removeSuggestionStatus(state, id: string) {
      Vue.delete(state.suggestionStatuses, id);
    },
  },
  actions: {
    updateFeatures({ commit }, features: Feature[] | undefined) {
      commit('setFeatures', features);
    },
    updateSuggestions({ commit }, suggestions: Suggestion[] | undefined) {
      commit('setSuggestions', suggestions);
    },
    updateLoading({ commit }, loading: boolean) {
      commit('setLoading', loading);
    },
    dismissFeature({ commit }, index: number) {
      commit('dismissFeature', index);
    },
    dismissSuggestion({ commit }, { id, reason }: { id: string; reason: string }) {
      commit('setSuggestionStatus', { id, status: { reason, status: 'dismissed' } });
    },
    reopenSuggestion({ commit }, id: string) {
      commit('removeSuggestionStatus', id);
    },
  },
});
