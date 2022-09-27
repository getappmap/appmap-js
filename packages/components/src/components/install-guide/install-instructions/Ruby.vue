<template>
  <section>
    <p>Add the following line to the top of your Gemfile.</p>
    <v-code-snippet
      clipboard-text="# This must be the first gem listed\ngem 'appmap', group: %i[test development]"
    />
    <p class="note">
      This ensures the gem is loaded first and has a chance to observe other gems as they're loaded.
    </p>
  </section>
</template>

<script>
import VCodeSnippet from '@/components/CodeSnippet.vue';

export default {
  name: 'Ruby',
  components: { VCodeSnippet },
};
</script>
