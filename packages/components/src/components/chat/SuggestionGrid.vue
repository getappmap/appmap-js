<template>
  <div class="suggestion-grid" v-if="suggestions.length">
    <p>Not sure? Here are some useful starting points:</p>
    <div class="grid">
      <v-suggestion-card
        v-for="(s, i) in suggestions"
        :key="i"
        :title="s.title"
        :sub-title="s.subTitle"
        :prompt="s.prompt"
        @suggest="onSuggestion"
      />
    </div>
  </div>
</template>

<script lang="ts">
//@ts-nocheck
import VSuggestionCard from '@/components/chat/SuggestionCard.vue';

export type Suggestion = {
  title: string;
  subTitle: string;
  prompt: string;
};

export default {
  name: 'v-suggestion-grid',

  components: {
    VSuggestionCard,
  },

  props: {
    suggestions: {
      type: Array,
      default: () => [],
    },
  },

  methods: {
    onSuggestion(prompt: string) {
      this.$emit('suggest', prompt);
    },
  },
};
</script>

<style lang="scss" scoped>
.suggestion-grid {
  width: fit-content;
  margin: 1rem auto;
  font-size: 0.8rem;
  color: #c2c2c2;

  .grid {
    display: grid;
    gap: 1rem;
    font-family: system-ui;
  }
}

@media (max-width: 54rem) {
  .suggestion-grid .grid {
    grid-template-columns: 1fr;
  }
}
</style>
