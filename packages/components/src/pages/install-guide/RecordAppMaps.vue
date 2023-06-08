<template>
  <QuickstartLayout>
    <section>
      <header>
        <h1 data-cy="title">Record AppMaps</h1>
      </header>
      <main>
        <article>
          <template v-if="isJava && isJetBrains">
            <p class="mb20 bold">
              Use the <component :is="runConfigIcon" class="run-config-icon" /> "Start with AppMap"
              button to start your run configurations with AppMap enabled.
            </p>
            <template v-if="intelliJRecordingPrompts.length === 1">
              <p class="mb20" data-cy="automatic-recording-single">
                To perform your first runtime analysis {{ firstPrompt(intelliJRecordingPrompts) }}
              </p>
            </template>
            <template v-else>
              There are {{ intelliJRecordingPrompts.length }} methods of performing runtime analysis
              with AppMap in this project:
              <ol data-cy="automatic-recording-multi">
                <li v-for="(text, index) in intelliJRecordingPrompts" :key="index">
                  {{ text }}
                </li>
              </ol>
            </template>
            <p class="mb20">
              Looking for more information? Visit our
              <a href="https://appmap.io/docs/recording-methods.html" data-cy="documentation-link">
                documentation for recording AppMaps in {{ language }}.
              </a>
            </p>
          </template>
          <template v-else-if="automaticRecording">
            <template v-if="automaticRecordingPrompts.length === 1">
              <p class="mb20" data-cy="automatic-recording-single">
                To perform your first runtime analysis {{ firstPrompt(automaticRecordingPrompts) }}
              </p>
            </template>

            <template v-else>
              There are {{ automaticRecordingPrompts.length }} methods of performing runtime
              analysis with AppMap in this project:
              <ol data-cy="automatic-recording-multi">
                <li v-for="(text, index) in automaticRecordingPrompts" :key="index">
                  {{ text }}
                </li>
              </ol>
            </template>
            <p class="mb20">
              Looking for more information? Visit our
              <a href="https://appmap.io/docs/recording-methods.html" data-cy="documentation-link">
                documentation for recording AppMaps in {{ language }}.
              </a>
            </p>
          </template>
          <template v-else-if="!webFrameworkSupported && !testFrameworkSupported">
            <p class="mb20">
              For instructions on recording your first AppMaps, refer to our
              <a href="https://appmap.io/docs/recording-methods.html" data-cy="documentation-link">
                documentation.
              </a>
            </p>
          </template>
          <template v-else>
            <div class="mb20">
              Use our CLI to perform your first runtime analysis while exercising your test cases.
              If you do not have Node.js installed or would prefer to perform the recording
              manually, visit our
              <a href="https://appmap.io/docs/recording-methods.html" data-cy="documentation-link">
                documentation for recording AppMaps in {{ language }}.
              </a>
              <div class="center fit">
                <v-code-snippet :clipboard-text="command" :message-success="clipboardSuccess" />
              </div>
            </div>
          </template>

          <v-pending
            class="mb20 status-message"
            :is-pending="!complete"
            :message="pendingMessage"
            v-if="showPendingState"
            data-cy="status-message"
          />
        </article>
      </main>
      <v-navigation-buttons :first="first" :last="last" />
    </section>
  </QuickstartLayout>
</template>

<script>
import QuickstartLayout from '@/components/quickstart/QuickstartLayout.vue';
import VNavigationButtons from '@/components/install-guide/NavigationButtons.vue';
import VCodeSnippet from '@/components/CodeSnippet.vue';
import Navigation from '@/components/mixins/navigation';
import VPending from '@/components/Pending.vue';
import VRunConfigDark from '@/assets/jetbrains_run_config_execute_dark.svg';
import VRunConfigLight from '@/assets/jetbrains_run_config_execute.svg';

import { isFeatureSupported } from '@/lib/project';
import { DISABLE_PENDING_RECORD_STATE } from '@/lib/featureFlags';

export default {
  name: 'RecordAppMaps',

  components: {
    QuickstartLayout,
    VNavigationButtons,
    VCodeSnippet,
    VPending,
    VRunConfigDark,
    VRunConfigLight,
  },

  mixins: [Navigation],

  props: {
    clipboardSuccess: {
      type: String,
      default: '<b>Copied!</b><br/>Paste this command<br/>into your terminal.',
    },
    complete: Boolean,
    project: Object,
    editor: {
      type: String,
      required: true,
      default: 'vscode',
      validator: (value) => ['vscode', 'jetbrains'].indexOf(value) !== -1,
    },
    featureFlags: {
      type: Set,
      default: () => new Set(),
    },
    theme: String,
  },

  computed: {
    showPendingState() {
      return !this.featureFlags.has(DISABLE_PENDING_RECORD_STATE);
    },
    command() {
      const baseCommand = 'npx @appland/appmap@latest record';

      if (this.project && this.project.path) {
        return `${baseCommand} -d ${this.escapePath(this.project.path)}`;
      }
      return baseCommand;
    },
    language() {
      if (!this.project || !this.project.language) return undefined;
      return this.project.language.name;
    },
    isJava() {
      if (!this.language) return false;
      return this.language.toLowerCase() === 'java';
    },
    isJetBrains() {
      return this.editor === 'jetbrains';
    },
    automaticRecordingLanguages() {
      return ['ruby', 'python'];
    },
    automaticRecording() {
      return (
        this.automaticRecordingLanguages.includes((this.language || '').toLowerCase()) &&
        (this.webFrameworkSupported || this.testFrameworkSupported)
      );
    },
    webFramework() {
      return (this.project || {}).webFramework || { score: 0 };
    },
    webFrameworkSupported() {
      return isFeatureSupported(this.webFramework);
    },
    applicationName() {
      return [this.webFramework.name, 'application'].filter(Boolean).join(' ');
    },
    testFramework() {
      return (this.project || {}).testFramework || { score: 0 };
    },
    testFrameworkSupported() {
      return isFeatureSupported(this.testFramework);
    },
    automaticRecordingPrompts() {
      const prompts = [];
      if (this.webFrameworkSupported)
        prompts.push(
          `Start your ${this.webFramework.name} server. Inbound requests will be automatically be recorded.`
        );
      if (this.testFrameworkSupported)
        prompts.push(
          `Run your ${this.project.testFramework.name} tests. Each test case will emit an AppMap.`
        );
      return prompts;
    },
    intelliJRecordingPrompts() {
      const prompts = [];
      if (this.webFrameworkSupported)
        prompts.push(
          `Start your ${this.webFramework.name} server. Inbound requests can be captured by starting a remote recording. Click the record button in the top right of the AppMap panel to begin.`
        );
      if (this.testFrameworkSupported)
        prompts.push(
          `Run your ${this.project.testFramework.name} tests. Each test case will emit an AppMap.`
        );
      return prompts;
    },
    pendingMessage() {
      if (this.complete) {
        return 'Success! AppMaps have been created. Continue to the next step.';
      }
      return 'Waiting for AppMaps to be created.';
    },
    runConfigIcon() {
      return this.theme === 'dark' ? VRunConfigDark : VRunConfigLight;
    },
  },

  methods: {
    firstPrompt(prompts) {
      // Make the first character lowercase, we're going to append some
      // words to the beginning of this sentence.
      return prompts[0].charAt(0).toLowerCase() + prompts[0].slice(1);
    },
    isWindowsPath(path) {
      // test if the path starts with a drive letter, then a colon, then a backslash
      return /^[A-Z]:\\$/i.test(path.slice(0, 3));
    },
    escapePath(path) {
      if (this.isWindowsPath(path)) {
        const [driveLetter, restOfPath] = path.split(':');
        return `${driveLetter}:"${restOfPath}"`;
      }
      return path.replace(/([^A-Za-z0-9_\-.,:/@\n])/g, '\\$1');
    },
  },
};
</script>

<style>
.status-message {
  border-radius: 0.5rem;
  background-color: #69ad34;
  padding: 0.5rem 0;
}

.bold {
  font-weight: bold;
}
.run-config-icon {
  width: 22px;
  transform: translateY(25%);
}
</style>
