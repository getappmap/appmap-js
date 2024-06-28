<template>
  <section>
    <h3>Getting started</h3>
    <p>
      To record your application with AppMap, run your application using the
      <code class="inline">appmap-node</code> command.
    </p>
    <pre><code>$ npx appmap-node <span ref="startCommand">&lt;start-command&gt;</span></code></pre>

    <h3>Recording methods</h3>
    <p>The following recording methods are available to Node.js applications.</p>
    <v-recording-method-grid>
      <v-recording-method
        title="HTTP request recording"
        documentation-url="https://appmap.io/docs/reference/appmap-node.html#request-recording"
        :supported="!!webFramework"
        :default-behavior="true"
        :prompt-suggestions="promptSuggestions.httpRequest"
      >
        <template #icon>
          <RequestsIcon />
        </template>
        <template #supported>
          <p>
            Web services running {{ webFramework.name }} will automatically begin recording upon
            receiving an inbound HTTP request. The recording will span the entire lifetime of the
            request.
          </p>
          <p>
            Your web service must be started using the
            <code class="inline">appmap-node</code> command as described above.
          </p>
        </template>
        <template #unsupported>
          <p>
            Express-based web frameworks, such as NestJS or Next.js, you can make AppMaps of all the
            HTTP requests served by your app. These weren't detected in this project, though.
          </p>
          <p>
            Note that most projects serving HTTP using the <code class="inline">http</code> Node
            module directly will also work, even if it is stated that HTTP request recording is not
            supported.
          </p>
        </template>
      </v-recording-method>
      <v-recording-method
        title="Remote recording"
        title-lowercase="remote recording"
        documentation-url="https://appmap.io/docs/reference/appmap-node.html#remote-recording"
        :supported="!!webFramework"
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
            AppMap.
          </p>
        </template>
        <template #unsupported>
          <p>
            In Express-based web frameworks, such as NestJS or Next.js, recording can be toggled on
            and off via an HTTP API. This is useful in cases where you need control over the
            lifetime of the recording.
          </p>
          <p>
            Note that most projects serving HTTP using the <code class="inline">http</code> Node
            module directly will also work, even if it is stated that remote recording is not
            supported.
          </p>
        </template>
      </v-recording-method>
      <v-recording-method
        title="Test recording"
        title-lowercase="test recording"
        documentation-url="https://appmap.io/docs/reference/appmap-node.html#tests-recording"
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
          </p>
          <p>
            Your test run command must include the
            <code class="inline">appmap-node</code> command as described above.
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
        title="Process recording"
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
            After launching an application, AppMap will automatically begin recording the entire
            process lifetime. This behavior is disabled once another method of recording is
            triggered.
          </p>
          <p>
            Your application must be started using the
            <code class="inline">appmap-node</code> command as described above.
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

export default Vue.extend({
  components: {
    TestsIcon,
    RequestsIcon,
    RemoteRecordingIcon,
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
        'Node.js',
        this.editor,
        this.webFramework?.name,
        this.testFramework?.name
      ),
    };
  },

  computed: {
    codeSnippetType(): string {
      return this.complete ? 'ghost' : 'primary';
    },
  },

  mounted() {
    const startCommands = ['<start command>', 'npm start', 'yarn dev', 'node server.js'];

    async function typewriter(el: HTMLElement, text: string) {
      return new Promise<void>(async (resolve) => {
        let textQueue = text;
        while (textQueue.length) {
          const char = textQueue[0];
          el.innerText += char;
          textQueue = textQueue.slice(1);
          await new Promise((resolve) => setTimeout(resolve, 100 + (Math.random() * 100 - 50)));
        }
        resolve();
      });
    }

    let currentIndex = 0;
    const typeNextCommand = async () => {
      if (!this.$refs.startCommand) return;
      if (!(this.$refs.startCommand instanceof HTMLElement)) return;

      const startCommand = startCommands[currentIndex];
      this.$refs.startCommand.innerText = '';
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          if (!(this.$refs.startCommand instanceof HTMLElement)) return;
          typewriter(this.$refs.startCommand, startCommand).then(resolve);
        }, 1000);
      });
      currentIndex += 1;
      currentIndex = currentIndex % startCommands.length;
      await new Promise<void>((resolve) => setTimeout(resolve, Math.random() * 1000 + 1000));
      typeNextCommand();
    };

    typeNextCommand();
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
