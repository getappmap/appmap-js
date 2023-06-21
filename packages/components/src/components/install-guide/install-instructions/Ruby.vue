<template>
  <div>
    <section>
      Manual installation is a good option if you want to install<code class="inline">appmap</code>
      from outside of the code editor.
    </section>
    <section>
      <p>Add the following line of code to the <strong>top of your Gemfile</strong>.</p>
      <v-code-snippet
        clipboard-text="# This should be the first gem listed, so that appmap is loaded first\ngem 'appmap', group: %i[test development]"
        :kind="ctaButtonType"
      />
      <p>Update your bundle.</p>
      <v-code-snippet clipboard-text="bundle install" :kind="ctaButtonType" />

      <p>
        Finally, run the following script to automatically create an
        <code class="inline">appmap.yml</code> configuration file. This configuration will also be
        created the first time your application is run.
      </p>
      <v-code-snippet
        clipboard-text="bundle exec ~/.appmap/bin/validate_install.rb"
        :kind="ctaButtonType"
      />
    </section>
  </div>
</template>

<script>
import VCodeSnippet from '@/components/CodeSnippet.vue';

export default {
  name: 'Ruby',
  components: { VCodeSnippet },
  props: { ctaButtonType: { type: String, default: 'primary' } },
};
</script>
