<template>
  <section>
    <p>
      When you run your Node.js code with the
      <code class="inline">npx appmap-node</code> command, AppMap will be enabled for recording.
    </p>
    <p>For example, if you normally run your code with</p>
    <pre><code>$ yarn &lt;start-command&gt;</code></pre>
    <p>simply run with</p>
    <pre><code>$ npx appmap-node yarn &lt;start-command&gt;</code></pre>
    <p>to enable recording.</p>
    <p>
      If no specific recording method (below) is detected, this will record and create an AppMap of
      the whole process.
    </p>
    <h2>Choose the best recording method for this project</h2>
    <template v-if="webFramework">
      <section class="recording-method">
        <h3>
          <i class="header-icon"><RequestsIcon /></i>Requests recording
        </h3>
        <p>
          When your application uses {{ this.webFramework.name }}, and you run your application with
          AppMap enabled, HTTP server request recording will be enabled. To record requests, first
          run your application by passing your launch command as the arguments to
          <code class="inline">npx appmap-node</code>.
        </p>
        <p>
          For example, if you normally start your server with
          <code class="inline">npm run dev</code>, instead run
          <code class="inline"><em>npx appmap-node</em> npm run dev</code>.
        </p>

        <p>
          Interact with your application, through its user interface and/or by making API requests
          using a tool such as Postman. An AppMap will be created for each HTTP server request
          that's served by your app.
        </p>
        <p>
          For more information, visit
          <a
            href="https://appmap.io/docs/reference/appmap-node.html#request-recording"
            target="_blank"
            >AppMap docs — Node.js Requests recording</a
          >.
        </p>
      </section>
      <section class="recording-method">
        <h3>
          <i class="header-icon"><RemoteRecordingIcon /></i>Remote recording
        </h3>
        <p>
          When your application uses {{ this.webFramework.name }}, and you run your application with
          AppMap enabled, remote recording is enabled. To make a remote recording, run your
          application using <code class="inline">npx appmap-node</code> command. Then use the
          "Record" button in the IDE to start recording. Interact with your application, through its
          user interface and/or by making API requests using a tool such as Postman. When you are
          done, click the "Record" button again to save the recording and view the AppMap.
        </p>
        <p>
          For more information, visit
          <a
            href="https://appmap.io/docs/reference/appmap-node.html#remote-recording"
            target="_blank"
            >AppMap docs — Node.js Remote recording</a
          >.
        </p>
      </section>
    </template>
    <template v-else>
      <section class="recording-method recording-method--disabled">
        <h3>
          <i class="header-icon header-icon--disabled"><RequestsIcon /></i>HTTP recording
        </h3>
        <p>
          Did you know? When you run an Express, NestJS or Next.js app, you can make AppMaps of all
          the HTTP requests served by your app. These weren't detected in this project, though.
        </p>
        <p>
          Note most projects serving HTTP using node <i>http</i> module directly will also work,
          even though we're not currently detecting them. For more information on using HTTP
          recording, see
          <a
            href="https://appmap.io/docs/reference/appmap-node.html#request-recording"
            target="_blank"
            >AppMap docs — Node.js Requests recording</a
          >
          and
          <a
            href="https://appmap.io/docs/reference/appmap-node.html#remote-recording"
            target="_blank"
            >remote recording</a
          >.
        </p>
      </section>
    </template>
    <template v-if="testFramework">
      <section class="recording-method">
        <h3>
          <i class="header-icon"><TestsIcon /></i>Tests recording
        </h3>
        <p>
          When you run your {{ testFramework.name }} tests with AppMap enabled, an AppMap will be
          created for each test. Just run your test command as usual, prepending
          <code class="inline">npx appmap-node</code>.
        </p>
        <p>
          For example, if you normally run tests with <code class="inline">pnpm test</code>, instead
          run <code class="inline"><em>npx appmap-node</em> pnpm test</code>
        </p>
        <p>
          For more information, visit
          <a
            href="https://appmap.io/docs/reference/appmap-node.html#tests-recording"
            target="_blank"
            >AppMap docs — Node.js Tests recording</a
          >.
        </p>
      </section>
    </template>
    <template v-else>
      <VTestsPrompt framework="Mocha, Jest or Vitest" />
    </template>
  </section>
</template>
<script>
import RemoteRecordingIcon from '@/assets/remote-recording-icon.svg';
import RequestsIcon from '@/assets/request-arrows-icon.svg';
import TestsIcon from '@/assets/tests-icon.svg';
import VTestsPrompt from './TestsPrompt.vue';

export default {
  name: 'RubyRecordingInstructions',

  components: {
    VTestsPrompt,
    TestsIcon,
    RequestsIcon,
    RemoteRecordingIcon,
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
