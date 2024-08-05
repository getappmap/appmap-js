<template>
  <section>
    <p>
      To record your application with AppMap, run your application using the
      <code class="inline">appmap-node</code> command.
    </p>
    <v-code-snippet clipboard-text="npx appmap-node <start-command>" :show-copy="false" />

    <h3>Choose an option</h3>
    <p>
      Depending on your application, you may choose one of the following options for recording
      AppMap traces.
    </p>
    <v-recording-method-grid>
      <v-recording-method
        title="Record HTTP requests"
        documentation-url="https://appmap.io/docs/reference/appmap-node.html#request-recording"
        :supported="true"
        :default-behavior="true"
        :prompt-suggestions="promptSuggestions.httpRequest"
      >
        <template #icon>
          <RequestsIcon />
        </template>
        <template #supported>
          <p>
            Web services will automatically begin recording upon receiving an inbound HTTP request.
            The recording will span the entire lifetime of the request.
          </p>
          <hr />
          <p>
            To begin, run your web service with the
            <code class="inline">appmap-node</code> command.
          </p>
          <p>Next, issue an HTTP request to your web service.</p>
          <p>
            An AppMap trace will be written to the <code class="inline">tmp/appmap</code> directory
            by default.
          </p>
        </template>
        <template #unsupported>
          <p>
            In Express-based web frameworks such as NestJS or Next.js, AppMap will automatically
            record the execution flow of your application as it serves inbound HTTP requests.
            Express wasn't located in this project.
          </p>
          <p>
            Note that most projects serving HTTP using the <code class="inline">http</code> Node
            module directly will also work, even if it is stated that HTTP request recording is not
            supported.
          </p>
        </template>
      </v-recording-method>
      <v-recording-method
        title="Record a web service"
        title-lowercase="remote recording"
        documentation-url="https://appmap.io/docs/reference/appmap-node.html#remote-recording"
        :supported="true"
        :prompt-suggestions="promptSuggestions.remote"
      >
        <template #icon>
          <RemoteRecordingIcon />
        </template>
        <template #supported>
          <p>
            Web services can toggle recordings on and off remotely via an HTTP API. This is useful
            in cases where you need control over the lifetime of the recording.
          </p>
          <hr />
          <p>
            To begin, run your web service with the
            <code class="inline">appmap-node</code> command.
          </p>
          <p>
            Next, hover your mouse over the "AppMap data" section within the AppMap extension
            sidebar panel. Click the "Record" button to start recording.
          </p>
          <p>A prompt will appear requesting the URL of your web service.</p>
          <p>Once submitted, begin interacting with your application.</p>
          <p>When you are done, click the "Record" button again to name andsave the recording.</p>
          <p>
            An AppMap trace of the entire session will be written to the
            <code class="inline">tmp/appmap</code> directory by default.
          </p>
        </template>
        <template #unsupported>
          <p>
            In Express-based web frameworks such as NestJS or Next.js, recording can optionally be
            toggled on and off via an HTTP API. This is useful in cases where control is needed over
            the lifetime of a recording.
          </p>
          <p>
            Note that most projects serving HTTP using the <code class="inline">http</code> Node
            module directly will also work, even if it is stated that remote recording is not
            supported.
          </p>
        </template>
      </v-recording-method>
      <v-recording-method
        title="Record test cases"
        title-lowercase="test recording"
        documentation-url="https://appmap.io/docs/reference/appmap-node.html#tests-recording"
        :supported="true"
        :default-behavior="true"
        :prompt-suggestions="promptSuggestions.test"
      >
        <template #icon>
          <TestsIcon
            :style="{ width: '1.5rem', height: '1.5rem', transform: 'translateY(0.1rem)' }"
          />
        </template>
        <template #supported>
          <p>
            When running tests, AppMap will automatically start and stop recording for each test
            case. With adequate test coverage, this method can quickly record a broad range of your
            application's behavior.
          </p>
          <hr />
          <p>
            To begin, run your test cases with the
            <code class="inline">appmap-node</code> command.
          </p>
          <p>
            As each case test completes, an AppMap trace file will be saved with a name reflecting
            the description of the test case.
          </p>
        </template>
        <template #unsupported>
          <p>
            Testing frameworks such as Jest, Mocha or Vitest will automatically start and stop
            recordings for each test case. With adequate test coverage, this method can quickly
            record a broad range of the application's behavior.
          </p>
        </template>
      </v-recording-method>
      <v-recording-method
        title="Record a process"
        title-lowercase="process recording"
        documentation-url="https://appmap.io/docs/reference/appmap-node.html#process-recording"
        :supported="true"
        :default-behavior="true"
        :prompt-suggestions="promptSuggestions.process"
      >
        <template #icon>
          <ProcessIcon :style="{ width: '1.25rem', height: '1.25rem' }" />
        </template>
        <template #supported>
          <p>
            AppMap can record a trace which spans the entire lifetime of a process. This option is
            particularly useful for short-lived processes such as a CLI or simple script.
          </p>
          <hr />
          <p>
            To begin, run your application with the <code class="inline">appmap-node</code> command.
          </p>
          <p>
            Upon exiting, a full trace of your application's execution will be written to the
            <code class="inline">tmp/appmap</code> directory by default.
          </p>
          <p>
            Note that his behavior will be automatically disabled once another method of recording
            is detected, such as the execution of a test case or the processing of an inbound HTTP
            request.
          </p>
        </template>
      </v-recording-method>
    </v-recording-method-grid>
  </section>
</template>

<script lang="ts">
import Vue from 'vue';
import RemoteRecordingIcon from '@/assets/remote-recording-icon.svg';
import RequestsIcon from '@/assets/request-arrows-icon.svg';
import TestsIcon from '@/assets/record-test.svg';
import ProcessIcon from '@/assets/record-process.svg';
import VRecordingMethod from './RecordingMethod.vue';
import VRecordingMethodGrid from './RecordingMethodGrid.vue';
import buildPrompts from '@/lib/buildPrompts';
import VCodeSnippet from '@/components/CodeSnippet.vue';

export default Vue.extend({
  components: {
    TestsIcon,
    RequestsIcon,
    RemoteRecordingIcon,
    ProcessIcon,
    VRecordingMethod,
    VRecordingMethodGrid,
    VCodeSnippet,
  },

  props: {
    webFramework: Object,
    testFramework: Object,
    theme: String,
    complete: Boolean,
    editor: String,
  },

  data() {
    return {
      promptSuggestions: buildPrompts(
        'Node.js',
        this.editor,
        this.webFramework?.name,
        this.testFramework?.name
      ),
    };
  },
});
</script>

<style lang="scss" scoped>
code {
  line-height: 1;
  padding: 1rem;
  padding-bottom: 0.75rem;
  background-color: rgba(black, 0.35);
}
</style>
