<template>
  <div>
    <v-accordion
      :class="{
        'project-configuration': 1,
        'project-configuration--open': openSection === 'project',
      }"
      :open="openSection === 'project'"
      @toggle="onClickSection('project')"
    >
      <template #header>
        <div
          :class="{
            'project-configuration__step': 1,
            'project-configuration__step--disabled': projects.length === 1,
          }"
        >
          <div class="project-configuration__step-title">Select a project</div>
          <div class="project-configuration__step-result" v-if="selectedProject">
            {{ selectedProject.name }}
            <v-check-icon />
          </div>
        </div>
      </template>
      <div class="project-configuration__content">
        <div
          v-for="project in projects"
          class="project-configuration__project"
          :key="project.path"
          @click="onSelectProject(project)"
        >
          <div class="project-configuration__project-name">{{ project.name }}</div>
          <div class="project-configuration__project-path">{{ project.path }}</div>
        </div>
      </div>
    </v-accordion>
    <v-accordion
      :class="{
        'project-configuration': 1,
        'project-configuration--open': openSection === 'language',
      }"
      :open="openSection === 'language'"
      v-if="selectedProject"
      @toggle="onClickSection('language')"
    >
      <template #header>
        <div class="project-configuration__step">
          <div class="project-configuration__step-title">Select a language</div>
          <div class="project-configuration__step-result" v-if="selectedLanguageName">
            {{ selectedLanguageName }}
            <v-check-icon />
          </div>
        </div>
      </template>
      <div class="project-configuration__content">
        <div class="project-configuration__languages">
          <v-language-button
            v-for="[language, icon] of Object.entries(languages)"
            :key="language"
            :language="language"
            @click.native="onSelectLanguage(language)"
          >
            <component :is="icon" />
          </v-language-button>
        </div>
        <p class="center">
          <a href="#" @click.prevent="onSelectLanguage('Other')"> Is your language not listed? </a>
        </p>
      </div>
    </v-accordion>
    <v-accordion
      :class="{
        'project-configuration': 1,
        'project-configuration--open ': openSection === 'content',
      }"
      :open="openSection === 'content'"
      v-if="selectedLanguage"
      @toggle="onClickSection('content')"
    >
      <template #header>
        <div class="project-configuration__step">
          <div class="project-configuration__step-title">{{ description }}</div>
        </div>
      </template>
      <div class="project-configuration__content">
        <template v-if="selectedLanguage === 'other'">
          <p>
            Because your language was not listed, there is no officially supported recording agent
            at this time. While this means that you cannot record AppMap data for this project,
            Navie can still statically analyze your code.
          </p>
          <v-button
            kind="primary"
            label="Next: Chat with Navie"
            data-cy="next-button"
            class="next-button"
            @click.native="$root.$emit('open-navie')"
          />
        </template>
        <template v-else>
          <template v-if="selectedLanguage === 'python'">
            <p>
              In order to record AppMap data from your Python project, you will first need to
              install the <code class="inline">appmap</code> package. Use the command below to
              install the dependency using your preferred package manager.
            </p>
            <v-command-picker :commands="commands" />
            <p>
              When you're ready to run your application to record AppMap data, run it with the
              <code class="inline">appmap-python</code> command instead of
              <code class="inline">python</code>. For example,
              <code class="inline">python my_app.py</code> becomes
              <code class="inline">appmap-python my_app.py</code>.
            </p>
          </template>
          <template v-else-if="selectedLanguage === 'node.js'">
            <p>
              In order to record AppMap data from your Node.js project, we recommended that you
              first install the <code class="inline">appmap-node</code> module. Use the command
              below to add AppMap as a development dependency using your preferred package manager.
            </p>
            <v-command-picker :commands="commands" @select-tab="onSelectNodePackageManager" />
            <section>
              <p>
                Use
                <code class="inline">appmap-node</code> to launch Node applications with AppMap
                recording enabled. For example:
              </p>
              <v-code-snippet
                class="full-width"
                language="shell"
                clipboard-text="yarn appmap-node yarn test"
                v-if="nodePackageManager === 'yarn'"
              />
              <v-code-snippet
                class="full-width"
                language="shell"
                clipboard-text="npm exec appmap-node npm test"
                v-else-if="nodePackageManager === 'npm'"
              />
              <v-code-snippet
                class="full-width"
                language="shell"
                clipboard-text="pnpm appmap-node pnpm test"
                v-else-if="nodePackageManager === 'pnpm'"
              />
              <v-code-snippet
                class="full-width"
                language="shell"
                clipboard-text="npx appmap-node index.js"
                v-else
              />
            </section>
          </template>
          <template v-else-if="selectedLanguage === 'ruby'">
            <p>
              In order to record AppMap data from your Ruby project, you will first need to add the
              <code class="inline">appmap</code> gem to your "test" and "development" bundles.
            </p>

            <section>
              <span>Add the following line of code to the <b>top of your Gemfile</b>.</span>
              <v-code-snippet
                class="full-width"
                language="ruby"
                clipboard-text="# This should be the first gem listed, so that appmap is loaded first\ngem 'appmap', group: %i[test development]"
              />
            </section>

            <section class="mb0">
              <span>Then, update your bundle by running the following command in a terminal.</span>
              <v-code-snippet class="full-width" clipboard-text="bundle install" />
            </section>

            <p>
              Before you run your app with AppMap, stop or disable Spring. You can stop Spring with
              the command <code class="inline">spring stop</code>, or you can run your Ruby program
              with the environment variable <code class="inline">DISABLE_SPRING=true</code>. If
              you're not using Spring, you can skip this step.
            </p>
          </template>
          <template v-else-if="selectedLanguage === 'java'">
            <p>
              In Java applications, AppMap runs as an instrumentation agent within the JVM. This is
              accomplished by providing the
              <code class="inline">-javaagent:<wbr />~/.appmap/lib/java/appmap.jar</code> option to
              the JVM running your application. The sections below describe different ways to run
              your application with the AppMap recording agent attached.
            </p>
            <section class="significant">
              <h3>Launch configurations</h3>
              <v-java-status
                :project-name="projectName"
                :project-path="projectPath"
                :enum-debug-configuration-status="debugConfigurationStatus"
              />
              <p>
                If you have the
                <a href="vscode:extension/vscjava.vscode-java-pack" target="_blank">
                  Extension Pack for Java
                </a>
                installed, launch configurations named
                <code class="inline">Run with AppMap</code> will be created for you. You can use
                these configurations to run your application with the AppMap recording agent
                attached. These configurations will be available via the Run and Debug view as well
                as the Testing view.
              </p>
            </section>
            <section class="significant">
              <h3>Maven or Gradle plugins</h3>
              <p>
                These optional plugins provide a simple way to record AppMap data while running your
                application's test cases. Please refer to the documentation for usage instructions.
              </p>
              <ul>
                <li>
                  <a href="https://appmap.io/docs/reference/appmap-maven-plugin" target="_blank">
                    AppMap Plugin for Maven
                  </a>
                </li>
                <li>
                  <a href="https://appmap.io/docs/reference/appmap-gradle-plugin" target="_blank">
                    AppMap Plugin for Gradle
                  </a>
                </li>
              </ul>
            </section>
            <section class="significant">
              <h3>Other</h3>
              <p>
                If you're using a different build tool, you can still record AppMap data by manually
                adding the AppMap agent to your application. To accomplish this, make sure the JVM
                is provided with the
                <code class="inline">-javaagent:~/.appmap/lib/java/appmap.jar</code> option. See the
                <a href="https://appmap.io/docs/reference/appmap-java" target="_blank">
                  documentation
                </a>
                for more information.
              </p>
            </section>
          </template>
          <v-button
            kind="ghost"
            label="Next: Record your application"
            data-cy="next-button"
            class="next-button"
            @click.native="onClickRecord"
          />
        </template>
      </div>
    </v-accordion>
    <v-accordion
      :class="{
        'project-configuration': 1,
        'project-configuration--open ': openSection === 'record',
      }"
      :open="openSection === 'record'"
      v-if="selectedLanguage && selectedLanguage !== 'other'"
      @toggle="onClickSection('record')"
    >
      <template #header>
        <div class="project-configuration__step">
          <div class="project-configuration__step-title">Record AppMap data</div>
        </div>
      </template>
      <div class="project-configuration__content">
        <v-ruby-record-instructions v-if="selectedLanguage === 'ruby'" />
        <v-python-record-instructions v-else-if="selectedLanguage === 'python'" />
        <v-java-record-instructions
          v-else-if="selectedLanguage === 'java' && editor === 'vscode'"
        />
        <v-intellij-java-record-instructions v-else-if="selectedLanguage === 'java'" />
        <v-node-record-instructions
          v-else-if="selectedLanguage === 'node.js'"
          :package-manager="nodePackageManager"
        />
      </div>
    </v-accordion>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import VAccordion from '@/components/Accordion.vue';
import VCheckIcon from '@/assets/check-circle-solid.svg';
import VLanguageButton from '@/components/install-guide/LanguageButton.vue';
import VJavaIcon from '@/assets/languages/java.svg';
import VPythonIcon from '@/assets/languages/python.svg';
import VRubyIcon from '@/assets/languages/ruby.svg';
import VNodeIcon from '@/assets/languages/nodejs.svg';
import VRubyRecordInstructions from '@/components/install-guide/record-instructions/Ruby.vue';
import VPythonRecordInstructions from '@/components/install-guide/record-instructions/Python.vue';
import VJavaRecordInstructions from '@/components/install-guide/record-instructions/Java.vue';
import VIntellijJavaRecordInstructions from '@/components/install-guide/record-instructions/IntelliJ.vue';
import VNodeRecordInstructions from '@/components/install-guide/record-instructions/JavaScript.vue';
import VCommandPicker from '@/components/install-guide/CommandPicker.vue';
import VButton from '@/components/Button.vue';
import VCodeSnippet from '@/components/CodeSnippet.vue';
import VJavaStatus from '@/components/install-guide/JavaStatus.vue';

interface Project {
  path: string;
  name: string;
  debugConfigurationStatus?: number;
  javaAgentStatus?: number;
}

type Section = undefined | 'project' | 'language' | 'content' | 'record';

const Commands: Record<string, Array<{ name: string; command: string }>> = {
  python: [
    { name: 'pip', command: 'pip install --require-virtualenv appmap' },
    { name: 'pipenv', command: 'pipenv install --dev appmap' },
    { name: 'poetry', command: 'poetry add --dev appmap' },
  ],
  'node.js': [
    { name: 'npm', command: 'npm i --save-dev appmap-node' },
    { name: 'yarn', command: 'yarn add -D appmap-node' },
    { name: 'pnpm', command: 'pnpm add -D appmap-node' },
  ],
};

export default Vue.extend({
  components: {
    VAccordion,
    VCheckIcon,
    VLanguageButton,
    VJavaIcon,
    VPythonIcon,
    VRubyIcon,
    VNodeIcon,
    VRubyRecordInstructions,
    VPythonRecordInstructions,
    VJavaRecordInstructions,
    VNodeRecordInstructions,
    VIntellijJavaRecordInstructions,
    VCommandPicker,
    VButton,
    VCodeSnippet,
    VJavaStatus,
  },

  props: {
    description: String,
    projects: {
      type: Array as () => Project[],
      default: () => [],
    },
    editor: String,
  },

  watch: {
    projects(newProjects: Project[]) {
      if (!this.selectedProject) {
        return;
      }

      const newProject = newProjects.find((p) => p.path === this.selectedProject?.path);
      this.selectedProject = newProject;
    },
  },

  data() {
    return {
      openSection: 'project' as Section,
      selectedProject: undefined as undefined | Project,
      selectedLanguageName: undefined as undefined | string,
      nodePackageManager: undefined as undefined | string,
      languages: {
        Java: VJavaIcon,
        Python: VPythonIcon,
        Ruby: VRubyIcon,
        'Node.js': VNodeIcon,
      } as const,
    };
  },

  computed: {
    selectedLanguage(): string | undefined {
      return this.selectedLanguageName?.toLowerCase();
    },
    commands() {
      const language = this.selectedLanguageName?.toLowerCase();
      if (!language) return [];
      return Commands[language];
    },
    projectName(): string | undefined {
      return this.selectedProject?.name;
    },
    projectPath(): string | undefined {
      return this.selectedProject?.path;
    },
    debugConfigurationStatus(): number | undefined {
      return this.selectedProject?.debugConfigurationStatus;
    },
    javaAgentStatus(): number | undefined {
      return this.selectedProject?.javaAgentStatus;
    },
  },

  methods: {
    onClickSection(section: Section) {
      if (section === 'project' && this.projects.length === 1) {
        return;
      }
      this.openSection = section;
    },
    onSelectProject(project: Project) {
      this.selectedProject = project;
      this.openSection = 'language';
      this.$emit('select-project', project);
    },
    onSelectLanguage(language: string) {
      this.selectedLanguageName = language;
      this.openSection = 'content';
      this.nodePackageManager = undefined;
      this.$emit('select-language', language.toLowerCase());
    },
    onClickRecord() {
      this.openSection = 'record';
    },
    onSelectNodePackageManager(nodePackageManager: string) {
      console.log(nodePackageManager);
      this.nodePackageManager = nodePackageManager.toLowerCase();
    },
  },

  mounted() {
    if (this.projects.length === 1) {
      this.onSelectProject(this.projects[0]);
    }
  },
});
</script>

<style scoped lang="scss">
$border-color: rgba(white, 0.25);

.project-configuration {
  &:first-child {
    border-top: 1px solid $border-color;
  }

  &__project {
    display: flex;
    width: 100%;
    border-bottom: 1px solid darken($border-color, 50%);
    padding: 0.5rem 0.5rem;
    cursor: pointer;

    &:hover {
      color: black;
      background-color: rgba(white, 0.75);

      .project-configuration__project-path {
        color: black;
      }
    }

    &:last-child {
      border-bottom: 0;
    }

    &-name {
      flex-grow: 1;
      font-weight: bold;
    }

    &-path {
      color: $gray4;
      text-overflow: ellipsis;
      overflow: hidden;
      direction: rtl;
    }
  }

  &__step {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 2rem;
    border-bottom: 1px solid $border-color;

    &--disabled {
      cursor: initial;
      user-select: text;
      .project-configuration__step-title {
        color: $gray4;
      }
    }

    &-title {
      font-weight: bold;
      flex-grow: 1;
    }

    &-result {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
  }

  &__languages {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-self: center;
  }

  &__content {
    display: flex;
    flex-direction: column;
    padding: 0 2rem;
    padding-bottom: 1rem;
    .next-button {
      margin-left: auto;
    }
    .code-snippet {
      margin-top: 0.25rem;
    }
    section {
      max-width: 100%;
      margin-bottom: 1rem;

      &.significant {
        border-radius: $border-radius;
        border-bottom: 1px solid rgba(black, 0.1);
        background-color: rgba(black, 0.1);
        padding: 0 1rem;
      }

      ul {
        margin-left: 0.5rem;
      }

      h3:first-child {
        margin-top: 0.5rem;
      }
    }
    p {
      max-width: 100%;
    }
    code.inline {
      display: initial;
      overflow-wrap: break-word;
      hyphens: manual;
    }
  }

  &--open {
    background-color: rgba(black, 0.25);

    .project-configuration__step {
      background-color: transparent;
      border-bottom: none;
      padding-bottom: 0;
      cursor: initial;
      user-select: text;

      &-title {
        font-size: 1.25rem;
        font-weight: bold;
      }
    }

    .project-configuration__content {
      border-bottom: 1px solid $border-color;
    }
  }

  .center {
    place-self: center;
  }

  .mb0 {
    margin-bottom: 0;
  }
}
</style>
