<template>
  <section>
    <h3>Getting started</h3>
    <p>
      To record your Python application with AppMap, run your application using the
      <code class="inline">appmap-python</code> command.
    </p>
    <pre><code>$ appmap-python <span ref="startCommand">&lt;start-command&gt;</span></code></pre>
    <h3>Recording methods</h3>
    <p>The following recording methods are available to Python applications.</p>
    <v-recording-method-grid>
      <v-recording-method
        title="HTTP request recording"
        documentation-url="https://appmap.io/docs/reference/appmap-python.html#request-recording"
        :supported="!!webFramework"
        :default-behavior="true"
        :prompt-suggestions="promptSuggestions.httpRequest"
      >
        <template #icon>
          <RequestsIcon />
        </template>
        <template #supported>
          <p>
            {{ webFramework.name }} will automatically begin recording upon receiving an inbound
            HTTP request. The recording will span the entire lifetime of the request.
          </p>
          <template v-if="webFramework.name.toLowerCase() == 'flask'">
            <p>Start your Flask server with the following command.</p>
            <v-code-snippet clipboard-text="appmap-python flask run" :kind="codeSnippetType" />
          </template>
          <template v-if="webFramework.name.toLowerCase() == 'django'">
            <p>Start your Django server with the following command.</p>
            <v-code-snippet
              clipboard-text="appmap-python manage.py runserver"
              :kind="codeSnippetType"
            />
          </template>
        </template>
        <template #unsupported>
          <p>
            In Django or Flask applications, AppMap will automatically record the execution flow of
            your application as it serves inbound HTTP requests.
          </p>
        </template>
      </v-recording-method>
      <v-recording-method
        title="Remote recording"
        title-lowercase="remote recording"
        documentation-url="https://appmap.io/docs/reference/appmap-python.html#remote-recording"
        :supported="!!webFramework"
        :default-behavior="false"
        :prompt-suggestions="promptSuggestions.remote"
      >
        <template #icon>
          <RemoteRecordingIcon />
        </template>
        <template #supported>
          <p>
            Web services running {{ webFramework.name }} can toggle recordings on and off remotely
            via an HTTP API. This is useful in cases where you need control over the lifetime of the
            recording.
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
            In Django or Flask applications, recording can optionally be toggled on and off via an
            HTTP API. This is useful in cases where control is needed over the lifetime of a
            recording.
          </p>
        </template>
      </v-recording-method>
      <v-recording-method
        title="Test recording"
        title-lowercase="test recording"
        documentation-url="https://appmap.io/docs/reference/appmap-python.html#test-recording"
        :supported="!!testFramework"
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
            When running {{ testFramework.name }} tests, AppMap will automatically start and stop
            recording for each test case. With adequate test coverage, this method can quickly
            record a broad range of your application's behavior.
            <template v-if="testFramework.name.toLowerCase() == 'pytest'">
              <p>Run your pytest tests with the following command.</p>
              <v-code-snippet clipboard-text="appmap-python pytest" :kind="codeSnippetType" />
            </template>
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
        title="Code block recording"
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
          <p>Visit the documentation for examples.</p>
        </template>
      </v-recording-method>
      <v-recording-method
        title="Process recording"
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
            AppMap can record the entire process lifetime from start to finish. To enable this
            behavior, specify <code class="inline">--record process</code> when running
            <code class="inline">appmap-python</code>.
          </p>
          <p>See the example below.</p>
          <pre><code>$ appmap-python --record process app.py</code></pre>
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
import typewrite from '@/components/mixins/typewriter';

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

  mixins: [typewrite],

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

  computed: {
    codeSnippetType() {
      return this.complete ? 'ghost' : 'primary';
    },
  },

  mounted() {
    if (!this.$refs.startCommand) return;
    if (!(this.$refs.startCommand instanceof HTMLElement)) return;

    this.typewrite(this.$refs.startCommand, [
      '<start command>',
      'script.py',
      'flask --app main.app',
      'pytest',
      'manage.py runserver',
    ]);
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
