<template>
  <QuickstartLayout>
    <section>
      <header>
        <h1>Record AppMaps</h1>
      </header>
      <main>
        <article v-if="documentationUrl">
          <div class="mb20">
            Use our CLI to perform your first runtime analysis while exercising
            your test cases. If you do not have Node.js installed or would
            prefer to perform the recording manually, visit our
            <a :href="documentationUrl">
              documentation for recording AppMaps in {{ language }}.
            </a>
            <div class="center fit">
              <v-code-snippet
                clipboard-text="npx @appland/appmap record test"
                :message-success="clipboardSuccess"
              />
            </div>
          </div>
          <p class="mb20" v-if="complete">
            Success! Continue to the next step.
          </p>
        </article>
        <article v-else>
          <p class="mb20">
            For instructions on recording your first AppMaps, refer to the
            documentation below.
          </p>
          <p class="mb20">
            <template v-for="(url, lang, index) in editorSpecificUrls">
              <a :href="url" :key="lang">{{ lang }}</a>
              <template
                v-if="index !== Object.keys(editorSpecificUrls).length - 1"
              >
                &nbsp;&nbsp;|&nbsp;&nbsp;
              </template>
            </template>
          </p>
          <p class="mb20" v-if="completed">
            Success! Continue on to the next step to learn how to investigate
            one of the 19 findings identified.
          </p>
        </article>
      </main>
      <v-navigation-buttons />
    </section>
  </QuickstartLayout>
</template>

<script>
import QuickstartLayout from '@/components/quickstart/QuickstartLayout.vue';
import VNavigationButtons from '@/components/install-guide/NavigationButtons.vue';
import VCodeSnippet from '@/components/CodeSnippet.vue';

const documentationUrls = {
  vscode: {
    Java: 'https://appland.com/docs/appmap-diagrams/quickstart/vscode/java-step-3-tests',
    JavaScript:
      'https://appland.com/docs/appmap-diagrams/quickstart/vscode/javascript-step-3-tests',
    Python:
      'https://appland.com/docs/appmap-diagrams/quickstart/vscode/python-step-3-tests',
    Ruby: 'https://appland.com/docs/appmap-diagrams/quickstart/vscode/ruby-step-3-tests',
  },
  jetbrains: {
    Java: 'https://appland.com/docs/appmap-diagrams/quickstart/intellij/step-3-tests',
    JavaScript:
      'https://appland.com/docs/appmap-diagrams/quickstart/webstorm/step-3-tests',
    Python:
      'https://appland.com/docs/appmap-diagrams/quickstart/pycharm/step-3-tests',
    Ruby: 'https://appland.com/docs/appmap-diagrams/quickstart/rubymine/step-3-tests',
  },
};

export default {
  name: 'RecordAppMaps',

  components: {
    QuickstartLayout,
    VNavigationButtons,
    VCodeSnippet,
  },

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
  },

  computed: {
    completed() {
      return this.selectedProject && this.selectedProject.appMapsRecorded;
    },
    language() {
      if (!this.project || !this.project.language) return;
      return this.project.language.name;
    },
    editorSpecificUrls() {
      return documentationUrls[this.editor];
    },
    documentationUrl() {
      if (
        !this.project ||
        !this.project.language ||
        !this.project.language.name
      ) {
        return;
      }

      return this.editorSpecificUrls[this.project.language.name];
    },
  },
};
</script>
