<template>
  <section>
    <p>
      Ensure that your application runs with the JVM option
      <code class="inline">-javaagent:~/.appmap/lib/java/appmap.jar</code>. This option is required
      to record AppMap trace data.
    </p>

    <h3>Choose an option</h3>
    <p>
      Depending on your application, you may choose one of the following options for recording
      AppMap traces.
    </p>
    <v-recording-method-grid>
      <v-recording-method
        title="Record HTTP requests"
        documentation-url="https://appmap.io/docs/reference/appmap-java.html#requests-recording"
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
          <p>To begin, run your web service with the AppMap agent.</p>
          <p>Next, issue an HTTP request to your web service.</p>
          <p>
            An AppMap trace will be written to the <code class="inline">tmp/appmap</code> directory
            by default.
          </p>
        </template>
        <template #unsupported>
          <p>
            In Spring applications, AppMap will automatically record the execution flow of your
            application as it serves inbound HTTP requests.
          </p>
        </template>
      </v-recording-method>
      <v-recording-method
        title="Record a web service"
        title-lowercase="remote recording"
        documentation-url="https://appmap.io/docs/reference/appmap-java.html#remote-recording"
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
          <p>To begin, run your web service with the AppMap agent.</p>
          <p>
            Next, hover your mouse over the "AppMap data" section within the AppMap extension
            sidebar panel. Click the "Record" button to start recording.
          </p>
          <p>A prompt will appear requesting the URL of your web service.</p>
          <p>Once submitted, begin interacting with your application.</p>
          <p>When you are done, click the "Record" button again to name and save the recording.</p>
          <p>
            An AppMap trace of the entire session will be written to the
            <code class="inline">tmp/appmap</code> directory by default.
          </p>
        </template>
        <template #unsupported>
          <p>
            In Spring applications, recording can optionally be toggled on and off via an HTTP API.
            This is useful in cases where control is needed over the lifetime of a recording.
          </p>
        </template>
      </v-recording-method>
      <v-recording-method
        title="Record test cases"
        title-lowercase="test recording"
        documentation-url="https://appmap.io/docs/reference/appmap-java.html#tests-recording"
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
          <p>To begin, run your test cases with the AppMap agent loaded into the JVM.</p>
          <p>
            As each case test completes, an AppMap trace file will be saved with a name reflecting
            the description of the test case.
          </p>
        </template>
        <template #unsupported>
          <p>
            Testing frameworks such as JUnit or TestNG will automatically start and stop recordings
            for each test case. With adequate test coverage, this method can quickly record a broad
            range of the application's behavior.
          </p>
        </template>
      </v-recording-method>
      <v-recording-method
        title="Record a code block"
        title-lowercase="code block recording"
        documentation-url="https://appmap.io/docs/reference/appmap-java.html#code-block-recording"
        :supported="true"
        :default-behavior="false"
        :prompt-suggestions="promptSuggestions.codeBlock"
      >
        <template #icon>
          <CodeBlockIcon />
        </template>
        <template #supported>
          <p>
            Use the <code class="inline">com.appland.appmap.record.Recording</code> class to record
            specific spans of code.
          </p>
          <p>
            Note that this method still requires your application be run with the AppMap Java agent
            for recording to be enabled.
          </p>
          <p>
            Visit the
            <a
              href="https://appmap.io/docs/reference/appmap-java.html#code-block-recording"
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
        documentation-url="https://appmap.io/docs/reference/appmap-java.html#process-recording"
        :supported="true"
        :default-behavior="false"
        :prompt-suggestions="promptSuggestions.process"
      >
        <template #icon>
          <ProcessIcon :style="{ width: '1.25rem', height: '1.25rem' }" />
        </template>
        <template #supported>
          <p>
            AppMap can record the entire process lifetime from start to finish. To enable this
            behavior, set the Java system property
            <code class="inline">appmap.recording.auto=true</code>.
          </p>
          <p>
            For example, you can modify <code class="inline">.vscode/launch.json</code> to include
            <code class="inline">-Dappmap.recording.auto=true</code> in
            <code class="inline">vmArgs</code>. When running this configuration, an AppMap recording
            will be saved after your application exits.
          </p>
          <hr />
          <p>
            To begin, run your application with the AppMap agent and the
            <code class="inline">-Dappmap.recording.auto=true</code> system property.
          </p>
          <p>Trace data will be collected until your application exits.</p>
          <p>
            Once your application exits, an AppMap trace will be written to the
            <code class="inline">tmp/appmap</code> directory by default.
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
import ProcessIcon from '@/assets/record-process.svg';
import VRecordingMethod from './RecordingMethod.vue';
import VRecordingMethodGrid from './RecordingMethodGrid.vue';
import buildPrompts from '@/lib/buildPrompts';

export default {
  name: 'JavaRecordInstructions',

  props: {
    editor: String,
  },

  components: {
    ProcessIcon,
    RemoteRecordingIcon,
    RequestsIcon,
    CodeBlockIcon,
    TestsIcon,
    VRecordingMethod,
    VRecordingMethodGrid,
  },

  data() {
    return {
      webFramework: undefined,
      testFramework: undefined,
      promptSuggestions: buildPrompts(
        'Java',
        this.editor,
        this.webFramework?.name,
        this.testFramework?.name
      ),
    };
  },

  methods: {
    onSelectWebFramework(webFramework) {
      this.webFramework = webFramework === 'Other' ? undefined : webFramework;
    },
    onSelectTestFramework(testFramework) {
      this.testFramework = testFramework === 'Other' ? undefined : testFramework;
    },
  },
};
</script>

<style scoped>
.vscode-screenshot {
  text-align: center;
  max-width: 100%;
  padding: 1rem;
  border-radius: 10px;
  background-color: #343e5a;
  & > img {
    /* add drop shadow */
    box-shadow: 10px 10px 10px rgba(0, 0, 0, 0.5);
  }
}
</style>
