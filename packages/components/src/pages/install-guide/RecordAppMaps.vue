<template>
  <QuickstartLayout>
    <section>
      <header>
        <h1>Record AppMaps</h1>
      </header>
      <main>
        <article v-if="documentationUrl">
          <h2>There are two ways to generate AppMaps:</h2>
          <ol>
            <li>
              <h3>Using your tests:</h3>
              <div class="youtube-link">
                <a
                  class="btn-youtube"
                  href="https://www.youtube.com/watch?v=-TWop5gpsFA"
                >
                  <YoutubeLogo />
                  <v-button
                    label="Watch our tutorial video"
                    class="cta-button b-0"
                  />
                </a>
              </div>
              <p>Run this command in your terminal and follow the prompts:</p>
              <div class="center fit">
                <v-code-snippet
                  :clipboard-text="command"
                  :message-success="clipboardSuccess"
                />
              </div>
            </li>
            <li>
              <h3>By manually interacting with your application:</h3>
              <div class="youtube-link">
                <a
                  class="btn-youtube"
                  href="https://www.youtube.com/watch?v=1QcGAuruj6Y"
                >
                  <YoutubeLogo />
                  <v-button
                    label="Watch our tutorial video"
                    class="cta-button b-0"
                  />
                </a>
              </div>
              <div>
                Or visit our
                <a :href="documentationUrl">
                  documentation for recording AppMaps in {{ language }}.
                </a>
              </div>
            </li>
          </ol>
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
            <template
              v-for="(url, lang, index) in editorSpecificUrls"
              :key="lang"
            >
              <a :href="url">{{ lang }}</a>
              <template
                v-if="index !== Object.keys(editorSpecificUrls).length - 1"
              >
                &nbsp;&nbsp;|&nbsp;&nbsp;
              </template>
            </template>
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
import VButton from '@/components/Button.vue';
import YoutubeLogo from '@/assets/youtube_icon.svg';

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
    VButton,
    YoutubeLogo,
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
      return [
        'npx @appland/appmap record test',
        this.project && `-d ${this.project.path}`,
      ]
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
    editorSpecificUrls() {
      const urls = { ...documentationUrls[this.editor] };
      const disabledLanguages = Object.values(this.disabledLanguages);
      disabledLanguages.forEach((l) => {
        delete urls[l];
      });

      return urls;
    },
    documentationUrl() {
      if (
        !this.project ||
        !this.project.language ||
        !this.project.language.name
      ) {
        return undefined;
      }

      return this.editorSpecificUrls[this.project.language.name];
    },
  },
};
</script>
<style lang="scss" scoped>
h1 {
  margin-block-start: 0;
  font-size: 2em;
}

h2 {
  font-size: 1.7em;
}

h3 {
  font-size: 1.4em;
}

.youtube-link {
  margin: 20px 0;
}

.pink {
  color: #ff07aa;
}

.btn-youtube {
  align-items: center;
  background-color: $almost-black;
  border: 3px solid $gray-tertiary;
  border-radius: 1rem;
  box-shadow: $box-shadow-min;
  display: flex;
  flex-direction: row;
  justify-content: center;
  padding: 0.5rem 0.8rem;
  transition: $transition;
  width: 50%;
  min-width: 300px;

  .cta-button {
    padding: 0.5rem 0.5rem 0.5rem 4rem;
  }

  .b-0 {
    border: none;
  }

  &:hover {
    background-color: $black;
    box-shadow: $box-shadow-min;
    border-color: #5f729a;
    .cta-button {
      background: none;
    }
  }
}
</style>
