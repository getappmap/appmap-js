<template>
  <section>
    <p>
      Add the following line of code to the top of your Gemfile to ensure the gem is loaded first
      and has a chance to observe other gems as they're loaded.
    </p>
    <v-code-snippet
      clipboard-text="# This must be the first gem listed\ngem 'appmap', group: %i[test development]"
    />
  </section>
</template>

<script>
import VCodeSnippet from '@/components/CodeSnippet.vue';

export default {
  name: 'Ruby',
  components: { VCodeSnippet },
};
</script>
