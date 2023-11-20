<template>
  <section>
    <p>
      The more AppMaps you record, the more information you will have about your running
      application.
    </p>
    <br />
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
    <p>
      No matter which method you start with, you can add more AppMaps or remove old AppMaps at any
      time.
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
        <br />
        <p>
          Recording your test run will provide a broad range of AppMaps that trace important
          behaviors. When you run your {{ testFramework.name }} tests with AppMap enabled, an AppMap
          will be created for each test.
        </p>
        <br />
        <p>
          <template v-if="testFramework.name.toLowerCase() == 'minitest'">
            Run Minitest tests with AppMap enabled:
            <v-code-snippet
              clipboard-text="DISABLE_SPRING=true rails test"
              :kind="codeSnippetType"
            />
          </template>
          <template v-if="testFramework.name.toLowerCase() == 'rspec'">
            Run Rspec tests with AppMap enabled:
            <v-code-snippet clipboard-text="DISABLE_SPRING=true rspec" :kind="codeSnippetType" />
          </template>
        </p>
        <p>
          Docs:
          <a
            href="https://appmap.io/docs/reference/appmap-ruby.html#tests-recording"
            target="_blank"
            >Ruby tests recording</a
          >
        </p>
      </section>
    </template>
    <template v-else>
      <VTestsPrompt framework="RSpec or Minitest" />
    </template>
    <br />
    <template v-if="webFramework">
      <section class="recording-method">
        <h3>
          <i class="header-icon"><RequestsIcon /></i>Requests recording
        </h3>
        <br />
        <p>
          Create AppMaps as you interact with your applications UI or API. This is helpful for
          tracing the backend during specific usage scenarios. When your application uses
          {{ this.webFramework.name }}, and you run your application with AppMap enabled, HTTP
          server request recording will be enabled.
        </p>
        <br />
        <p>
          <strong>First</strong>, start your Rails server with AppMap enabled:
          <v-code-snippet
            clipboard-text="DISABLE_SPRING=true rails server"
            :kind="codeSnippetType"
          />
        </p>
        <p>
          <strong>Second</strong>, interact with your application, through its user interface and/or
          by making API requests using a tool such as Postman. An AppMap will be created for each
          HTTP server request that's served by your app.
        </p>
        <br />
        <p>
          Docs:
          <a
            href="https://appmap.io/docs/reference/appmap-ruby.html#requests-recording"
            target="_blank"
            >Ruby requests recording</a
          >
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
      <br />
      <p>With this method, you can control exactly which code spans are recorded.</p>
      <br />
      <p>
        To use Block recording, add an AppMap code snippet to the section of code you want to
        record, then run your application with AppMap enabled. Instructions for adding the AppMap
        code snippet to a span of code can be
        <a
          href="https://appmap.io/docs/reference/appmap-ruby.html#code-block-recording"
          target="_blank"
          >found in our documentation</a
        >.
      </p>
      <br />
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
  name: 'RubyRecordingInstructions',

  components: {
    VCodeSnippet,
    VTestsPrompt,
    VWebFrameworkPrompt,
    TestsIcon,
    RequestsIcon,
    CodeBlockIcon,
  },

  props: {
    webFramework: Object,
    testFramework: Object,
    theme: String,
    complete: Boolean,
  },

  computed: {
    codeSnippetType() {
      return this.complete ? 'ghost' : 'primary';
    },
  },
};
</script>
