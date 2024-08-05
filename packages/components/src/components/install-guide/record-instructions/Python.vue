<template>
  <section>
    <p>
      To record your Python application with AppMap, run your application using the
      <code class="inline">appmap-python</code> command.
    </p>
    <v-code-snippet clipboard-text="appmap-python <start-command>" :show-copy="false" />
    <h3>Choose an option</h3>
    <p>The following recording methods are available to Python applications.</p>
    <v-recording-method-grid>
      <v-recording-method
        title="Record HTTP requests"
        documentation-url="https://appmap.io/docs/reference/appmap-python.html#request-recording"
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
            <code class="inline">appmap-python</code> command.
          </p>
          <p>Next, issue an HTTP request to your web service.</p>
          <p>
            An AppMap trace will be written to the <code class="inline">tmp/appmap</code> directory
            by default.
          </p>
        </template>
        <template #unsupported>
          <p>
            In Django or Flask applications, AppMap will automatically record the execution flow of
            your application as it serves inbound HTTP requests.
          </p>
        </template>
      </v-recording-method>
      <v-recording-method
        title="Record a web service"
        title-lowercase="remote recording"
        documentation-url="https://appmap.io/docs/reference/appmap-python.html#remote-recording"
        :supported="true"
        :default-behavior="false"
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
            <code class="inline">appmap-python</code> command.
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
            In Django or Flask applications, recording can optionally be toggled on and off via an
            HTTP API. This is useful in cases where control is needed over the lifetime of a
            recording.
          </p>
        </template>
      </v-recording-method>
      <v-recording-method
        title="Record test cases"
        title-lowercase="test recording"
        documentation-url="https://appmap.io/docs/reference/appmap-python.html#test-recording"
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
            <code class="inline">appmap-python</code> command.
          </p>
          <p>
            As each case test completes, an AppMap trace file will be saved with a name reflecting
            the description of the test case.
          </p>
        </template>
        <template #unsupported>
          <p>
            Testing frameworks such as <code class="inline">pytest</code> or
            <code class="inline">unittest</code> will automatically start and stop recordings for
            each test case. With adequate test coverage, this method can quickly record a broad
            range of the application's behavior.
          </p>
        </template>
      </v-recording-method>
      <v-recording-method
        title="Record a code block"
        title-lowercase="code block recording"
        documentation-url="https://appmap.io/docs/reference/appmap-python.html#code-block-recording"
        :supported="true"
        :default-behavior="false"
        :prompt-suggestions="promptSuggestions.codeBlock"
      >
        <template #icon>
          <CodeBlockIcon />
        </template>
        <template #supported>
          <p>
            Wrap sections of your code in <code class="inline">appmap.record</code> blocks to record
            specific spans of execution.
          </p>
          <p>
            Visit the
            <a
              href="https://appmap.io/docs/reference/appmap-python.html#code-block-recording"
              target="_blank"
            >
              documentation
            </a>
            for examples.
          </p>
        </template>
      </v-recording-method>
      <v-recording-method
        title="Record a process"
        title-lowercase="process recording"
        documentation-url="https://appmap.io/docs/reference/appmap-python.html#process-recording"
        :supported="true"
        :default-behavior="false"
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
            To start recording a full process trace, include the
            <code class="inline">--record process</code> option when running
            <code class="inline">appmap-python</code>.
          </p>
          <p class="mb0">See the example below.</p>
          <v-code-snippet
            clipboard-text="appmap-python --record process app.py"
            :show-copy="false"
          />
        </template>
      </v-recording-method>
    </v-recording-method-grid>
  </section>
</template>

<script>
import RequestsIcon from '@/assets/request-arrows-icon.svg';
import RemoteRecordingIcon from '@/assets/remote-recording-icon.svg';
import CodeBlockIcon from '@/assets/code-block-icon.svg';
import TestsIcon from '@/assets/record-test.svg';
import ProcessIcon from '@/assets/record-process.svg';
import VCodeSnippet from '@/components/CodeSnippet.vue';
import VRecordingMethod from './RecordingMethod.vue';
import VRecordingMethodGrid from './RecordingMethodGrid.vue';
import buildPrompts from '@/lib/buildPrompts';

export default {
  name: 'PythonRecordingInstructions',

  components: {
    VCodeSnippet,
    RequestsIcon,
    RemoteRecordingIcon,
    CodeBlockIcon,
    TestsIcon,
    ProcessIcon,
    VRecordingMethod,
    VRecordingMethodGrid,
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
        'Python',
        this.editor,
        this.webFramework?.name,
        this.testFramework?.name
      ),
    };
  },
};
</script>

<style lang="scss" scoped>
code {
  line-height: 1;
  padding: 1rem;
  padding-bottom: 0.75rem;
  background-color: rgba(black, 0.35);
  max-width: unset;
}
</style>
