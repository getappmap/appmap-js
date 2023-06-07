<template>
  <QuickstartLayout>
    <section>
      <header>
        <h1 data-cy="title">Record AppMaps</h1>
      </header>
      <main>
        <article>
          <template v-if="isJava">
            <template v-if="isJetBrains">
              <VRecordInstructions_IntelliJ
                :theme="theme"
                :web-framework="webFrameworkSupported ? webFramework : undefined"
                :test-framework="testFrameworkSupported ? testFramework : undefined"
              />
            </template>
          </template>
          <template v-else-if="isRuby">
            <VRecordInstructions_Ruby
              :theme="theme"
              :web-framework="webFrameworkSupported ? webFramework : undefined"
              :test-framework="testFrameworkSupported ? testFramework : undefined"
            />
          </template>
          <template v-else-if="isPython">
            <VRecordInstructions_Python
              :theme="theme"
              :web-framework="webFrameworkSupported ? webFramework : undefined"
              :test-framework="testFrameworkSupported ? testFramework : undefined"
            />
          </template>
          <template v-else>
            <p class="mb20">
              For instructions on recording {{ language.name }} AppMaps, refer to our
              <a href="https://appmap.io/docs/recording-methods.html" data-cy="documentation-link">
                documentation.
              </a>
            </p>
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
import VRecordInstructions_IntelliJ from '@/components/install-guide/record-instructions/IntelliJ.vue';
import VRecordInstructions_Ruby from '@/components/install-guide/record-instructions/Ruby.vue';
import VRecordInstructions_Python from '@/components/install-guide/record-instructions/Python.vue';
import VCodeSnippet from '@/components/CodeSnippet.vue';
import Navigation from '@/components/mixins/navigation';
import VPending from '@/components/Pending.vue';

import { isFeatureSupported } from '@/lib/project';
import { DISABLE_PENDING_RECORD_STATE } from '@/lib/featureFlags';

export default {
  name: 'RecordAppMaps',

  components: {
    QuickstartLayout,
    VNavigationButtons,
    VRecordInstructions_IntelliJ,
    VRecordInstructions_Ruby,
    VRecordInstructions_Python,
    VCodeSnippet,
    VPending,
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
    isRuby() {
      if (!this.language) return false;
      return this.language.toLowerCase() === 'ruby';
    },
    isPython() {
      if (!this.language) return false;
      return this.language.toLowerCase() === 'python';
    },
    isJavaScript() {
      if (!this.language) return false;
      return this.language.toLowerCase() === 'javascript';
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
    pendingMessage() {
      if (this.complete) {
        return 'Success! AppMaps have been created. Continue to the next step.';
      }
      return 'Waiting for AppMaps to be created.';
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
