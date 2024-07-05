<template>
  <section>
    <h3>Getting started</h3>
    <p>
      When you run your Ruby code with the <code class="inline">appmap</code> gem in your bundle,
      AppMap will be enabled for recording. By default, the <code class="inline">appmap</code> gem
      is only enabled in the "test" and "development" environments.
    </p>
    <p>
      Before you run your app with AppMap, stop or disable Spring. You can stop Spring with the
      command <code class="inline">spring stop</code>, or you can run your Ruby program with the
      environment variable <code class="inline">DISABLE_SPRING=true</code>.
    </p>
    <h3>Recording methods</h3>
    <p>The following recording methods are available to Ruby applications.</p>
    <v-recording-method-grid>
      <v-recording-method
        title="HTTP request recording"
        documentation-url="https://appmap.io/docs/reference/appmap-ruby.html#requests-recording"
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
          <p>Start your Rails with the following command.</p>
          <v-code-snippet
            clipboard-text="DISABLE_SPRING=true rails server"
            :kind="codeSnippetType"
          />
        </template>
        <template #unsupported>
          <p>
            In Rails applications, AppMap will automatically record the execution flow of your
            application as it serves inbound HTTP requests.
          </p>
        </template>
      </v-recording-method>
      <v-recording-method
        title="Remote recording"
        title-lowercase="remote recording"
        documentation-url="https://appmap.io/docs/reference/appmap-ruby.html#remote-recording"
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
            In Rails applications, recording can optionally be toggled on and off via an HTTP API.
            This is useful in cases where control is needed over the lifetime of a recording.
          </p>
        </template>
      </v-recording-method>
      <v-recording-method
        title="Test recording"
        title-lowercase="test recording"
        documentation-url="https://appmap.io/docs/reference/appmap-ruby.html#tests-recording"
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
            <template v-if="testFramework.name.toLowerCase() == 'minitest'">
              <p>Run Minitest tests with the following command.</p>
              <v-code-snippet
                clipboard-text="DISABLE_SPRING=true rails test"
                :kind="codeSnippetType"
              />
            </template>
            <template v-if="testFramework.name.toLowerCase() == 'rspec'">
              <p>Run Rspec tests with the following command.</p>
              <v-code-snippet clipboard-text="DISABLE_SPRING=true rspec" :kind="codeSnippetType" />
            </template>
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
        title="Code block recording"
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
            Wrap sections of your code in <code class="inline">AppMap.record</code> blocks to record
            specific spans of execution.
          </p>
          <p>Visit the documentation for examples.</p>
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
