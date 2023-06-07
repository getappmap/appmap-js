<template>
  <section>
    <p class="mb20 bold">
      When you run your Ruby code with the <tt>appmap</tt> gem in your bundle, AppMap will be
      enabled for recording. By default, the <tt>appmap</tt> gem is only enabled in the "test" and
      "development" environments.
    </p>
    <p>
      Before you run your app with AppMap, be sure and stop or disable Spring. You can stop Spring
      with the command <tt>spring stop</tt>, or you can run your Ruby program with the environment
      variable <tt>DISABLE_SPRING=true</tt>.
    </p>
    <template v-if="testFramework">
      <h3>Tests recording</h3>
      <p>
        When you run your {{ testFramework.name }} tests with AppMap enabled, an AppMap will be
        created for each test.
      </p>
      <template v-if="testFramework.name.toLowerCase() == 'minitest'">
        Run Minitest tests:
        <v-code-snippet clipboard-text="DISABLE_SPRING=true rails test" />
      </template>
      <template v-if="testFramework.name.toLowerCase() == 'rspec'">
        Run Rspec tests:
        <v-code-snippet clipboard-text="DISABLE_SPRING=true rspec" />
      </template>
      <p>
        For more information, visit
        <a href="https://appmap.io/docs/reference/appmap-ruby.html#tests-recording" target="_blank"
          >AppMap docs - Ruby Tests recording</a
        >.
      </p>
    </template>
    <template v-else>
      <VTestsPrompt frameworks="RSpec or Minitest" />
    </template>
    <template v-if="webFramework">
      <h3>Requests recording</h3>
      <p>
        When your application uses {{ this.webFramework.name }}, and you run your application with
        AppMap enabled, HTTP server requests recording is enabled. To record requests, first run
        your application:
      </p>
      <p>
        Start your Rails server:
        <v-code-snippet clipboard-text="DISABLE_SPRING=true rails server" />
      </p>
      <p>
        Interact with your application, through its user interface and/or by making API requests
        using a tool such as Postman. An AppMap will be created for each HTTP server request that's
        served by your app.
      </p>
      <p>
        For more information, visit
        <a
          href="https://appmap.io/docs/reference/appmap-ruby.html#requests-recording"
          target="_blank"
          >AppMap docs - Ruby Requests recording</a
        >.
      </p>
    </template>
    <template v-else>
      <VWebFrameworkPrompt frameworks="Rails" />
    </template>
    <section>
      <h3>Block recording</h3>
      <p>
        You can use the AppMap Ruby gem directly to record a specific span of code. With this
        method, you can control exactly what code is recorded, and where the recording is saved. To
        use Block recording, add an AppMap code snippet to the section of code you want to record,
        then run your application with AppMap enabled. Visit
        <a href="https://appmap.io/docs/reference/appmap-ruby.html#block-recording" target="_blank"
          >AppMap Docs - Ruby Block recording</a
        >
        for more information.
      </p>
    </section>
  </section>
</template>
<script>
import VCodeSnippet from '@/components/CodeSnippet.vue';
import VTestsPrompt from './TestsPrompt.vue';
import VWebFrameworkPrompt from './WebFrameworkPrompt.vue';

export default {
  name: 'Ruby',

  props: {
    webFramework: Object,
    testFramework: Object,
    theme: String,
  },

  components: { VCodeSnippet, VTestsPrompt, VWebFrameworkPrompt },

  computed: {},
};
</script>
