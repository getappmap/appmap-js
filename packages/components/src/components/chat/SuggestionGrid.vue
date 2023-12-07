<template>
  <div class="suggestion-grid">
    <p>Not sure? Here are some useful starting points:</p>
    <div class="grid">
      <v-suggestion-card
        title="Document the architecture of a feature."
        sub-title="Get AppMaps and a detailed text description of the code design."
        prompt="Describe a particular feature or system within your application and I'll describe how it works."
        @suggest="onSuggestion"
      />
      <v-suggestion-card
        title="Identify the usage of personal data."
        sub-title="Enumerate the user's personal data that's being accessed."
        prompt="Describe a feature and ask which user data it accesses. I'll tell you what I find."
        @suggest="onSuggestion"
      />
      <v-suggestion-card
        title="Find the root cause of a performance issue."
        sub-title="Describe the issue and let AppMap help you fix it."
        prompt="Let's get to the bottom of a performance issue. Can you describe what the issue is, or how it's manifesting itself in your application?"
        @suggest="onSuggestion"
      />
      <v-suggestion-card
        title="Look for security issues."
        sub-title="Use AppMap data to surface runtime security flaws."
        prompt="I can help you identify any potential security issues. Do you have a particular concern in mind, or would you like me to make a suggestion?"
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
};

export default {
  name: 'v-suggestion-grid',

  components: {
    VSuggestionCard,
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
