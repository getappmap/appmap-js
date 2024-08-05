<template>
  <section>
    <p>
      When you run your Ruby code with the <code class="inline">appmap</code> gem in your bundle,
      AppMap will be enabled for recording. In the previous step, the
      <code class="inline">appmap</code> gem was added only to the "test" and "development"
      environments.
    </p>
    <p>
      Before you run your app with AppMap, stop or disable Spring. You can stop Spring with the
      command <code class="inline">spring stop</code>, or you can run your Ruby program with the
      environment variable <code class="inline">DISABLE_SPRING=true</code>.
    </p>
    <h3>Choose an option</h3>
    <p>
      Depending on your application, you may choose one of the following options for recording
      AppMap traces.
    </p>
    <v-recording-method-grid>
      <v-recording-method
        title="Record HTTP requests"
        documentation-url="https://appmap.io/docs/reference/appmap-ruby.html#requests-recording"
        :supported="true"
        :default-behavior="true"
        :prompt-suggestions="promptSuggestions.httpRequest"
      >
        <template #icon>
          <RequestsIcon />
        </template>
        <template #supported>
          <p>
            Rails applications will automatically begin recording upon receiving an inbound HTTP
            request. The recording will span the entire lifetime of the request.
          </p>
          <hr />
          <p>To begin, start your Rails with the following command.</p>
          <v-code-snippet
            clipboard-text="DISABLE_SPRING=true rails server"
            :kind="codeSnippetType"
          />
          <p>Next, issue an HTTP request to your web service.</p>
          <p>
            An AppMap trace will be written to the <code class="inline">tmp/appmap</code> directory
            by default.
          </p>
        </template>
        <template #unsupported>
          <p>
            In Rails applications, AppMap will automatically record the execution flow of your
            application as it serves inbound HTTP requests.
          </p>
        </template>
      </v-recording-method>
      <v-recording-method
        title="Record a web service"
        title-lowercase="remote recording"
        documentation-url="https://appmap.io/docs/reference/appmap-ruby.html#remote-recording"
        :supported="true"
        :default-behavior="false"
        :prompt-suggestions="promptSuggestions.remote"
      >
        <template #icon>
          <RemoteRecordingIcon />
        </template>
        <template #supported>
          <p>
            Web services running Rails can toggle recordings on and off remotely via an HTTP API.
            This is useful in cases where you need control over the lifetime of the recording.
          </p>
          <hr />
          <p>To begin, start your Rails with the following command.</p>
          <v-code-snippet
            clipboard-text="DISABLE_SPRING=true rails server"
            :kind="codeSnippetType"
          />
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
            In Rails applications, recording can optionally be toggled on and off via an HTTP API.
            This is useful in cases where control is needed over the lifetime of a recording.
          </p>
        </template>
      </v-recording-method>
      <v-recording-method
        title="Record test cases"
        title-lowercase="test recording"
        documentation-url="https://appmap.io/docs/reference/appmap-ruby.html#tests-recording"
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
            To begin, run your test cases. The <code class="inline">appmap</code> gem will
            automatically be loaded if you followed the configuration in the previous step.
          </p>
          <p>
            As each case test completes, an AppMap trace file will be saved with a name reflecting
            the description of the test case.
          </p>
        </template>
        <template #unsupported>
          <p>
            Testing frameworks such as RSpec or Minitest will automatically start and stop
            recordings for each test case. With adequate test coverage, this method can quickly
            record a broad range of the application's behavior.
          </p>
        </template>
      </v-recording-method>
      <v-recording-method
        title="Record a code block"
        title-lowercase="code block recording"
        documentation-url="https://appmap.io/docs/reference/appmap-ruby.html#code-block-recording"
        :supported="true"
        :default-behavior="false"
        :prompt-suggestions="promptSuggestions.codeBlock"
      >
        <template #icon>
          <CodeBlockIcon />
        </template>
        <template #supported>
          <p>
            By wrapping sections of your code in <code class="inline">AppMap.record</code> blocks,
            you can record specific spans of execution.
          </p>
          <p>
            Visit the
            <a
              href="https://appmap.io/docs/reference/appmap-ruby.html#code-block-recording"
              target="_blank"
            >
              documentation
            </a>
            for examples.
          </p>
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
import VCodeSnippet from '@/components/CodeSnippet.vue';
import VRecordingMethod from './RecordingMethod.vue';
import VRecordingMethodGrid from './RecordingMethodGrid.vue';
import buildPrompts from '@/lib/buildPrompts';

export default {
  name: 'RubyRecordingInstructions',

  components: {
    VCodeSnippet,
    TestsIcon,
    RequestsIcon,
    CodeBlockIcon,
    VRecordingMethod,
    VRecordingMethodGrid,
    RemoteRecordingIcon,
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
        'Ruby',
        this.editor,
        this.webFramework?.name,
        this.testFramework?.name
      ),
    };
  },

  computed: {
    codeSnippetType() {
      return this.complete ? 'ghost' : 'primary';
    },
  },
};
</script>
