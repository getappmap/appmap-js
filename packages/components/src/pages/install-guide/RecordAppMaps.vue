<template>
  <QuickstartLayout>
    <section>
      <header>
        <h1 data-cy="title">Record AppMaps</h1>
      </header>
      <main>
        <article>
          <v-status
            next-step="Explore AppMaps"
            :status-states="statusStates"
            :project-name="projectName"
            :num-app-maps="numAppMaps"
            :current-step="0"
            :viewing-step="1"
            class="mb20"
          >
            <template #header>
              <template v-if="complete">
                {{ numAppMaps }} AppMaps have been recorded for {{ projectName }}
              </template>
              <template v-else> No AppMaps have been recorded yet for {{ projectName }} </template>
            </template>
            <template #subheader>
              <template v-if="complete">Next step: Choose an AppMap to open and explore</template>
              <template v-else>Record AppMaps using one of the suggested methods</template>
            </template>
          </v-status>
          <template v-if="isJava">
            <VRecordInstructions_IntelliJ
              v-if="isJetBrains"
              :theme="theme"
              :web-framework="webFrameworkSupported ? webFramework : undefined"
              :test-framework="testFrameworkSupported ? testFramework : undefined"
            />
            <VRecordInstructions_Java
              v-else
              :web-framework="webFrameworkSupported ? webFramework : undefined"
              :test-framework="testFrameworkSupported ? testFramework : undefined"
            />
          </template>
          <template v-else-if="isRuby">
            <VRecordInstructions_Ruby
              :theme="theme"
              :web-framework="webFrameworkSupported ? webFramework : undefined"
              :test-framework="testFrameworkSupported ? testFramework : undefined"
              :complete="complete"
            />
          </template>
          <template v-else-if="isPython">
            <VRecordInstructions_Python
              :theme="theme"
              :web-framework="webFrameworkSupported ? webFramework : undefined"
              :test-framework="testFrameworkSupported ? testFramework : undefined"
              :complete="complete"
            />
          </template>
          <template v-else>
            <p class="mb20">
              For instructions on recording {{ language }} AppMaps, refer to our
              <a href="https://appmap.io/docs/recording-methods.html" data-cy="documentation-link">
                documentation.
              </a>
            </p>
          </template>
        </article>
      </main>
      <v-navigation-buttons :first="first" :last="last" :complete="complete" />
    </section>
  </QuickstartLayout>
</template>

<script>
import QuickstartLayout from '@/components/quickstart/QuickstartLayout.vue';
import VNavigationButtons from '@/components/install-guide/NavigationButtons.vue';
import VRecordInstructions_IntelliJ from '@/components/install-guide/record-instructions/IntelliJ.vue';
import VRecordInstructions_Ruby from '@/components/install-guide/record-instructions/Ruby.vue';
import VRecordInstructions_Python from '@/components/install-guide/record-instructions/Python.vue';
import VRecordInstructions_Java from '@/components/install-guide/record-instructions/Java.vue';
import Navigation from '@/components/mixins/navigation';
import VStatus from '@/components/install-guide/Status.vue';
import StatusState from '@/components/mixins/statusState.js';

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
    VRecordInstructions_Java,
    VStatus,
  },

  mixins: [Navigation, StatusState],

  props: {
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
    projectName() {
      return this.project?.name || '';
    },
    numAppMaps() {
      return this.project?.numAppMaps || 0;
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
          `Run your ${this.testFramework.name} tests. Each test case will emit an AppMap.`
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
