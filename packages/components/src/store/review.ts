import Vue from 'vue';
import Vuex from 'vuex';
import type { Feature, Suggestion, SuggestionStatus } from '@/components/review';

Vue.use(Vuex);

export interface ReviewState {
  loading: boolean;
  features: Feature[] | undefined;
  suggestions: Suggestion[] | undefined;
  summary: string | undefined;
  dismissedFeatures: number[];
  suggestionStatuses: Record<string, SuggestionStatus>;
}

export default new Vuex.Store<ReviewState>({
  state: {
    loading: true,
    features: undefined,
    suggestions: undefined,
    summary: undefined,
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
    setSummary(state, summary: string | undefined) {
      state.summary = summary;
    },
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
    setStatus(state, { id, status }: { id: string; status: string }) {
      // Update the status of a suggestion, keeping the existing threadId if it exists
      const currentStatus = state.suggestionStatuses[id];
      if (currentStatus) {
        Vue.set(state.suggestionStatuses, id, { ...currentStatus, status });
      } else {
        Vue.set(state.suggestionStatuses, id, { status });
      }
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
    updateSummary({ commit }, summary: string | undefined) {
      commit('setSummary', summary);
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
    setFixThread({ commit }, { id, threadId }: { id: string; threadId: string }) {
      commit('setSuggestionStatus', { id, status: { threadId, status: 'fix-in-progress' } });
    },
    fixInProgress: ({ commit }, id: string) =>
      commit('setStatus', { id, status: 'fix-in-progress' }),
    fixReady: ({ commit }, id: string) => commit('setStatus', { id, status: 'fix-ready' }),
    markAsDone({ commit }, id: string) {
      commit('setSuggestionStatus', { id, status: { status: 'fixed' } });
    },
  },
});
