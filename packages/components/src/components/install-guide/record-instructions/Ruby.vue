<template>
  <section>
    <p>
      When you run your Ruby code with the <code class="inline">appmap</code> gem in your bundle,
      AppMap will be enabled for recording. By default, the <code class="inline">appmap</code> gem
      is only enabled in the "test" and "development" environments.
    </p>
    <br />
    <p>
      Before you run your app with AppMap, stop or disable Spring. You can stop Spring with the
      command <code class="inline">spring stop</code>, or you can run your Ruby program with the
      environment variable <code class="inline">DISABLE_SPRING=true</code>.
    </p>
    <br />
    <h2>Choose the best recording method for this project</h2>
    <br />
    <template v-if="testFramework">
      <section class="recording-method">
        <h3>
          <i class="header-icon"><TestsIcon /></i>Tests recording<span class="recommended-badge"
            >recommended</span
          >
        </h3>
        <p>
          When you run your {{ testFramework.name }} tests with AppMap enabled, an AppMap will be
          created for each test.
        </p>
        <p>
          <template v-if="testFramework.name.toLowerCase() == 'minitest'">
            Run Minitest tests:
            <v-code-snippet clipboard-text="DISABLE_SPRING=true rails test" />
          </template>
          <template v-if="testFramework.name.toLowerCase() == 'rspec'">
            Run Rspec tests:
            <v-code-snippet clipboard-text="DISABLE_SPRING=true rspec" />
          </template>
        </p>
        <p>
          For more information, visit
          <a
            href="https://appmap.io/docs/reference/appmap-ruby.html#tests-recording"
            target="_blank"
            >AppMap docs - Ruby Tests recording</a
          >.
        </p>
      </section>
    </template>
    <template v-else>
      <VTestsPrompt frameworks="RSpec or Minitest" />
    </template>
    <br />
    <template v-if="webFramework">
      <section class="recording-method">
        <h3>
          <i class="header-icon"><RequestsIcon /></i>Requests recording
        </h3>
        <p>
          When your application uses {{ this.webFramework.name }}, and you run your application with
          AppMap enabled, HTTP server request recording will be enabled. To record requests, first
          run your application:
        </p>
        <p>
          Start your Rails server:
          <v-code-snippet clipboard-text="DISABLE_SPRING=true rails server" />
        </p>
        <p>
          Interact with your application, through its user interface and/or by making API requests
          using a tool such as Postman. An AppMap will be created for each HTTP server request
          that's served by your app.
        </p>
        <p>
          For more information, visit
          <a
            href="https://appmap.io/docs/reference/appmap-ruby.html#requests-recording"
            target="_blank"
            >AppMap docs - Ruby Requests recording</a
          >.
        </p>
      </section>
    </template>
    <template v-else>
      <VWebFrameworkPrompt frameworks="Rails" />
    </template>
    <br />
    <section class="recording-method">
      <h3>
        <i class="header-icon"><CodeBlockIcon /></i>Block recording
      </h3>
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
import RequestsIcon from '@/assets/request-arrows-icon.svg';
import CodeBlockIcon from '@/assets/code-block-icon.svg';
import TestsIcon from '@/assets/tests-icon.svg';
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

  components: {
    VCodeSnippet,
    VTestsPrompt,
    VWebFrameworkPrompt,
    TestsIcon,
    RequestsIcon,
    CodeBlockIcon,
  },

  computed: {},
};
</script>
