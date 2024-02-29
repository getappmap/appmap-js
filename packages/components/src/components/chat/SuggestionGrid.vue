<template>
  <div class="suggestion-grid" v-if="suggestions.length">
    <p>Here are some useful starting points:</p>
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
      default: () => [
        {
          title: 'Document the architecture of a feature.',
          subTitle: 'Get AppMaps and a detailed text description of the code design.',
          prompt:
            "Describe a particular feature or system within your application and I'll describe how it works.",
        },
        {
          title: 'Find the root cause of a performance issue.',
          subTitle: 'Describe the issue and let AppMap help you fix it.',
          prompt:
            "Let's get to the bottom of a performance issue. Can you describe what the issue is, or how it's manifesting itself in your application?",
        },
      ],
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
  margin-top: 0;
  font-size: 0.8rem;
  color: #c2c2c2;
  padding: 2rem;
  padding-bottom: 1rem;
  padding-top: 0;

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));
    gap: 1rem;
    font-family: system-ui;
  }
}
</style>
