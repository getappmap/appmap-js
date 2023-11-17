<template>
  <section>
    <p>
      The more AppMaps you record, the more information you will have about your running application. No matter which method you start with, you can add more AppMaps or remove old AppMaps at any time.
    </p><br/>
    <p>
      When you run your Python code with the <code class="inline"> appmap </code> package, AppMap
      will be enabled for recording.
    </p>
    <br />
    <h2>Choose the best recording method for this project</h2>
    <br />
    <template v-if="testFramework">
      <section class="recording-method">
        <h3>
          <!--TODO make recommended tag dynamic-->
          <i class="header-icon"><TestsIcon /></i>Tests recording<span class="recommended-badge"
            >recommended</span
          >
        </h3><br/>
        <p>Recording your test run will provide a broad range of AppMaps that trace important behaviors.</p><br/>
        <p>
          When you run your {{ testFramework.name }} tests with AppMap enabled, an AppMap will be
          created for each test.
        </p>
        <template v-if="testFramework.name.toLowerCase() == 'pytest'">
          Run Pytest tests:
          <v-code-snippet clipboard-text="pytest" :kind="codeSnippetType" />
        </template><br/>
        <p>
          Docs:
          <a
            href="https://appmap.io/docs/reference/appmap-python.html#tests-recording"
            target="_blank"
            >Python tests recording</a
          >
        </p>
      </section>
    </template>
    <template v-else> <VTestsPrompt framework="pytest or unittest" /> </template><br />
    <template v-if="webFramework">
      <section class="recording-method">
        <h3>
          <i class="header-icon"><RequestsIcon /></i>Requests recording
        </h3><br/>
        <p>Create AppMaps as you interact with your applications UI or API. This is helpful for tracing the backend during specific usage scenarios.</p><br/>
        <p>
          When your application uses Django or Flask, and you run your application with AppMap
          enabled, HTTP server requests recording is enabled. To record requests, first run your
          application:
        </p>
        <br />
        <p>
          Start your Django server with AppMap enabled:
          <v-code-snippet clipboard-text="python manage.py runserver" :kind="codeSnippetType" />
        </p>
        <p>
          Start your Flask server with AppMap enabled:
          <v-code-snippet clipboard-text="flask run" :kind="codeSnippetType" />
        </p>
        <p>
          Then, interact with your application through its user interface and/or by making API
          requests using a tool such as Postman. An AppMap will be created for each HTTP server
          request that's served by your app.
        </p><br/>
        <p>
          Docs:
          <a
            href="https://appmap.io/docs/reference/appmap-python.html#requests-recording"
            target="_blank"
            >Python requests recording</a
          >
        </p>
      </section>
    </template>
    <template v-else> <VWebFrameworkPrompt frameworks="Django or Flask" /> </template><br />
    <section class="recording-method">
      <h3>
        <i class="header-icon"><CodeIcon /></i>Context manager recording
      </h3><br/>
      <p>
        You can use the AppMap Python package directly to record a specific span of code.</p><br/>
      <p>With this method, you can control exactly what code is recorded, and where the recording is saved. To
        use Context manager recording, add an AppMap code snippet to the section of code you want to
        record, then run your application with AppMap enabled. Instructions for adding the AppMap code snippet to a span of code can be
        <a href="https://appmap.io/docs/reference/appmap-python.html#context-manager-recording" target="_blank">found in our documentation</a>.
      </p>
    </section>
  </section>
</template>
<script>
import CodeIcon from '@/assets/code-icon.svg';
import TestsIcon from '@/assets/tests-icon.svg';
import RequestsIcon from '@/assets/request-arrows-icon.svg';
import VCodeSnippet from '@/components/CodeSnippet.vue';
import VTestsPrompt from './TestsPrompt.vue';
import VWebFrameworkPrompt from './WebFrameworkPrompt.vue';

export default {
  name: 'PythonRecordingInstructions',

  components: {
    VCodeSnippet,
    VTestsPrompt,
    VWebFrameworkPrompt,
    CodeIcon,
    TestsIcon,
    RequestsIcon,
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
