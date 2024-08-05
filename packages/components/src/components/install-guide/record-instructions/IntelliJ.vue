<template>
  <section>
    <p>
      Use the <component :is="runConfigIcon" class="run-config-icon" /> "Start with AppMap" option
      from the "Run" menu to start your run configurations with AppMap enabled.
    </p>
    <p>
      Using "Start with AppMap" ensures that your Java code runs with the JVM option
      <code class="inline">-javaagent:~/.appmap/lib/java/appmap.jar</code>. This option is required
      to enable AppMap recording.
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
            HTTP request. The recording will span the entire lifetime of the request.
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
          <p>
            Use the "Record" button in the IDE to start recording. Interact with your application,
            through its user interface and/or by making API requests using a tool such as Postman.
            When you are done, click the "Record" button again to save the recording and view the
            AppMap diagrams.
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
          <p>
            A subset of tests can be run by right-clicking on any test class or package, and choose
            <component :is="runConfigIcon" class="run-config-icon" /> "Start with AppMap".
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
          <p>You must set this system property as a JVM argument.</p>
          <p>
            If you are using a graphical run configuration, add the option
            <code class="inline">-Dappmap.recording.auto=true</code> to the "VM options" field.
          </p>
          <p>
            If you are running on the command line, add the option
            <code class="inline">-Dappmap.recording.auto=true</code> to the JVM CLI arguments. Next,
            run your application using
            <component :is="runConfigIcon" class="run-config-icon" /> "Start with AppMap". When your
            application exits, the AppMap diagrams will be saved and opened.
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
import VRunConfigDark from '@/assets/jetbrains_run_config_execute_dark.svg';
import VRunConfigLight from '@/assets/jetbrains_run_config_execute.svg';
import VRecordingMethod from './RecordingMethod.vue';
import VRecordingMethodGrid from './RecordingMethodGrid.vue';
import buildPrompts from '@/lib/buildPrompts';

export default {
  name: 'IntelliJ',

  props: {
    webFramework: Object,
    testFramework: Object,
    theme: String,
  },

  components: {
    VRunConfigDark,
    VRunConfigLight,
    RequestsIcon,
    RemoteRecordingIcon,
    CodeBlockIcon,
    TestsIcon,
    ProcessIcon,
    VRecordingMethod,
    VRecordingMethodGrid,
  },

  data() {
    return {
      promptSuggestions: buildPrompts(
        'Java',
        this.editor,
        this.webFramework?.name,
        this.testFramework?.name
      ),
    };
  },

  computed: {
    runConfigIcon() {
      return this.theme === 'dark' ? VRunConfigDark : VRunConfigLight;
    },
  },
};
</script>

<style scoped>
.run-config-icon {
  width: 22px;
  transform: translateY(25%);
}
</style>
