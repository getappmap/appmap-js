<template>
  <QuickstartLayout>
    <section>
      <header>
        <h1>Record AppMaps</h1>
      </header>
      <main>
        <article v-if="documentationUrl">
          <div class="mb20">
            Use our CLI to perform your first runtime analysis while exercising your test cases. If
            you do not have Node.js installed or would prefer to perform the recording manually,
            visit our
            <a :href="documentationUrl"> documentation for recording AppMaps in {{ language }}. </a>
            <div class="center fit">
              <v-code-snippet :clipboard-text="command" :message-success="clipboardSuccess" />
            </div>
          </div>
          <p class="mb20" v-if="complete">Success! Continue to the next step.</p>
        </article>
        <article v-else>
          <p class="mb20">
            For instructions on recording your first AppMaps, refer to our
            <a href="https://appmap.io/docs/recording-methods.html">documentation</a>.
          </p>
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
import { getRecordingDocumentationUrl } from '@/lib/documentation';

export default {
  name: 'RecordAppMaps',

  components: {
    QuickstartLayout,
    VNavigationButtons,
    VCodeSnippet,
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
    disabledLanguages: {
      type: Array,
      default: () => [],
    },
  },

  computed: {
    command() {
      return ['npx @appland/appmap record test', this.project && `-d ${this.project.path}`]
        .filter(Boolean)
        .join(' ');
    },
    completed() {
      return this.selectedProject && this.selectedProject.appMapsRecorded;
    },
    language() {
      if (!this.project || !this.project.language) return undefined;
      return this.project.language.name;
    },
    documentationUrl() {
      return getRecordingDocumentationUrl(this.language);
    },
  },
};
</script>
