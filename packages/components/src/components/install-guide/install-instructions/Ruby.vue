<template>
  <div>
    <section>
      Manual installation is a good option if you want to install <tt>appmap</tt> from outside of
      the code editor.
    </section>
    <section>
      <p>Add the following line of code to the <strong>top of your Gemfile</strong>.</p>
      <v-code-snippet
        clipboard-text="# This should be the first gem listed, so that appmap is loaded first\ngem 'appmap', group: %i[test development]"
      />
      <p>Update your bundle.</p>
      <v-code-snippet clipboard-text="bundle install" />
      <i>appmap.yml</i> will be created the first time you run your application with AppMap enabled.
    </section>
  </div>
</template>

<script>
import VCodeSnippet from '@/components/CodeSnippet.vue';

export default {
  name: 'Ruby',
  components: { VCodeSnippet },
};
</script>
