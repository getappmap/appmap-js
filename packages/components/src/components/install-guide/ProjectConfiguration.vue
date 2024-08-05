<template>
  <div>
    <v-accordion
      :class="{
        'project-configuration': 1,
        'project-configuration--open': openSection === 'project',
      }"
      :open="openSection === 'project'"
      :data-active="openSection === 'project'"
      data-cy="project-selection"
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
          <div
            class="project-configuration__step-result"
            data-cy="selected-project"
            v-if="selectedProject"
          >
            {{ selectedProject.name }}
            <v-check-icon />
          </div>
        </div>
      </template>
      <div class="project-configuration__content">
        <div
          v-for="project in projects"
          class="project-configuration__project"
          data-cy="project-list-item"
          :key="project.path"
          @click="onSelectProject(project)"
        >
          <div class="project-configuration__project-name" data-cy="project-name">
            {{ project.name }}
          </div>
          <div class="project-configuration__project-path" data-cy="project-path">
            {{ project.path }}
          </div>
        </div>
      </div>
    </v-accordion>
    <v-accordion
      :class="{
        'project-configuration': 1,
        'project-configuration--open': openSection === 'language',
      }"
      :open="openSection === 'language'"
      :data-active="openSection === 'language'"
      data-cy="language-selection"
      v-if="selectedProject"
      @toggle="onClickSection('language')"
    >
      <template #header>
        <div class="project-configuration__step">
          <div class="project-configuration__step-title">Select a language</div>
          <div
            class="project-configuration__step-result"
            data-cy="selected-language"
            v-if="selectedLanguageName"
          >
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
          <a href="#" data-cy="language-other" @click.prevent="onSelectLanguage('Other')">
            Is your language not listed?
          </a>
        </p>
      </div>
    </v-accordion>
    <v-accordion
      :class="{
        'project-configuration': 1,
        'project-configuration--open ': openSection === 'content',
      }"
      :open="openSection === 'content'"
      :data-active="openSection === 'content'"
      data-cy="configure-project"
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
            While an officially supported recording agent isn't available for your language just
            yet, Navie can still provide valuable insights by statically analyzing your code.
            Although AppMap trace data recording isn't possible for this project, you can continue
            to benefit from Navie's powerful analysis capabilities.
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
            <p>
              After running your application with
              <code class="inline">appmap-python</code> for the first time, an
              <a
                href="https://appmap.io/docs/reference/appmap-python#configuration"
                target="_blank"
              >
                <code class="inline">appmap.yml</code> configuration file
              </a>
              will be created in the root of your project. AppMap trace data is saved to the
              <code class="inline">tmp/appmap</code> directory by default and each trace file uses
              the <code class="inline">.appmap.json</code> extension.
            </p>
          </template>
          <template v-else-if="selectedLanguage === 'node.js'">
            <p class="mb0">
              The <code class="inline">appmap-node</code> module launches your Node.js application
              with AppMap trace recording enabled. You can run it via
              <code class="inline">npx</code>.
            </p>
            <v-code-snippet clipboard-text="npx appmap-node <start-command>" :show-copy="false" />
            <p class="mb0">
              For example, if your Node.js application is normally run with the command
              <code class="inline">npm run dev</code>, the following command will create AppMap
              recordings of that application's behavior when it runs:
            </p>
            <v-code-snippet clipboard-text="npx appmap-node npm run dev" :show-copy="false" />
            <p>
              After running your application with
              <code class="inline">appmap-node</code> for the first time, an
              <a href="https://appmap.io/docs/reference/appmap-node#configuration" target="_blank">
                <code class="inline">appmap.yml</code> configuration file
              </a>
              will be created in the root of your project. AppMap trace data is saved to the
              <code class="inline">tmp/appmap</code> directory by default and each trace file uses
              the <code class="inline">.appmap.json</code> extension.
            </p>
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
            <p>
              After your application loads with the
              <code class="inline">appmap</code> gem for the first time, an
              <a href="https://appmap.io/docs/reference/appmap-ruby#configuration" target="_blank">
                <code class="inline">appmap.yml</code> configuration file
              </a>
              will be created in the root of your project. AppMap trace data is saved to the
              <code class="inline">tmp/appmap</code> directory by default and each trace file uses
              the <code class="inline">.appmap.json</code> extension.
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
              <template v-if="editor === 'vscode'">
                <h3>Launch configurations</h3>
                <p>
                  Launch configurations are an easy and quick way to run your application through
                  Visual Studio Code with the AppMap recording agent attached. Below are examples of
                  how to run your application with AppMap via the Run and Debug view as well as the
                  Testing view.
                </p>
                <div class="screenshot">
                  <img src="../../assets/vscode-java.gif" />
                </div>
                <div class="java-launch-configurations">
                  <div class="java-launch-configurations__card">
                    <h4>Run and Debug</h4>
                    <p>
                      You can start AppMap easily when launching a debugging session by adding the
                      following configuration to your
                      <code class="inline">launch.json</code> file. Once in place, select "Run with
                      AppMap" from the Run and Debug view.
                    </p>
                    <v-code-snippet
                      language="json"
                      class="code-snippet"
                      :clipboard-text="javaLaunchConfigurationSnippet"
                    />
                  </div>
                  <div class="java-launch-configurations__card">
                    <h4>Testing</h4>
                    <p>
                      If you have the
                      <a href="vscode:extension/vscjava.vscode-java-pack" target="_blank">
                        Extension Pack for Java
                      </a>
                      installed, you can configure the test runner to automatically attach the
                      AppMap agent by adding the following snippet to your
                      <code class="inline">settings.json</code> file.
                    </p>
                    <v-code-snippet
                      language="json"
                      class="code-snippet"
                      :clipboard-text="javaTestConfigurationSnippet"
                    />
                  </div>
                </div>
              </template>
              <template v-else>
                <h3>Start with AppMap</h3>
                <div class="screenshot">
                  <img src="../../assets/run-with-appmap-menu-item.png" />
                </div>
                <p>
                  This plugin adds an executor which will run JVM-based run configurations with the
                  AppMap recording agent attached. You can run your application with AppMap by
                  selecting "Start with AppMap" from the Run view.
                </p>
              </template>
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
            <p>
              After running your application with the AppMap agent for the first time, an
              <a href="https://appmap.io/docs/reference/appmap-java#configuration" target="_blank">
                <code class="inline">appmap.yml</code> configuration file
              </a>
              will be created in the root of your project. AppMap trace data is saved to the
              <code class="inline">tmp/appmap</code> directory by default and each trace file uses
              the <code class="inline">.appmap.json</code> extension.
            </p>
          </template>
          <v-button
            kind="primary"
            label="Next: Collect AppMap trace data"
            data-cy="next-button"
            class="next-button"
            @click.native="onClickSection('record')"
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
      :data-active="openSection === 'record'"
      data-cy="record-project"
      v-if="selectedLanguage && selectedLanguage !== 'other'"
      ref="recordAccordion"
      @toggle="onClickSection('record')"
    >
      <template #header>
        <div class="project-configuration__step">
          <div class="project-configuration__step-title">Collect AppMap trace data</div>
        </div>
      </template>
      <div class="project-configuration__content">
        <v-ruby-record-instructions v-if="selectedLanguage === 'ruby'" />
        <v-python-record-instructions v-else-if="selectedLanguage === 'python'" />
        <v-java-record-instructions
          v-else-if="selectedLanguage === 'java' && editor === 'vscode'"
        />
        <v-intellij-java-record-instructions v-else-if="selectedLanguage === 'java'" />
        <v-node-record-instructions v-else-if="selectedLanguage === 'node.js'" />
        <v-button
          kind="primary"
          label="Next: Chat with Navie"
          data-cy="end-button"
          class="next-button"
          @click.native="$root.$emit('open-navie')"
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

type Section = undefined | 'project' | 'language' | 'content' | 'record' | 'summary';

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
      languages: {
        Java: VJavaIcon,
        Python: VPythonIcon,
        Ruby: VRubyIcon,
        'Node.js': VNodeIcon,
      } as const,
      javaLaunchConfigurationSnippet: `{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "java",
      "name": "Run with AppMap",
      "request": "launch",
      "mainClass": "",
      "vmArgs": "-javaagent:\${userHome}/.appmap/lib/java/appmap.jar"
    }
  ]
}
`,
      javaTestConfigurationSnippet: `{
  "java.test.config": [
    {
      "name": "Test with AppMap",
      "vmArgs": [
        "-javaagent:\${userHome}/.appmap/lib/java/appmap.jar",
        "-Dappmap.output.directory=\${command:appmap.getAppmapDir}"
      ]
    }
  ]
}`,
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

      switch (section) {
        case 'record':
          return this.scrollToRef('recordAccordion');
        case 'summary':
          return this.scrollToRef('summaryAccordion');
        default:
        // do nothing
      }
    },
    onSelectProject(project: Project) {
      this.selectedProject = project;
      this.openSection = 'language';
      this.$emit('select-project', project);
    },
    onSelectLanguage(language: string) {
      this.selectedLanguageName = language;
      this.openSection = 'content';
      this.$emit('select-language', language.toLowerCase());
    },
    async scrollToRef(ref: string) {
      await this.$nextTick();

      const el =
        this.$refs[ref] instanceof Vue
          ? (this.$refs.recordAccordion as Vue).$el
          : (this.$refs.recordAccordion as Element | undefined);
      if (!el || !(el instanceof HTMLElement)) return;
      document.scrollingElement?.scrollTo({
        top: el.offsetTop,
        behavior: 'smooth',
      });
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

  .java-launch-configurations {
    display: flex;
    flex-direction: column;

    &__card {
      display: flex;
      flex-direction: column;
      border-radius: $border-radius;
      margin-bottom: 1rem;

      * {
        margin: 0;
        margin-bottom: 0.5rem;
      }
    }
  }

  .screenshot {
    text-align: center;
    max-width: 100%;
    padding: 1rem;
    border-radius: 10px;
    img {
      box-shadow: 10px 10px 10px rgba(0, 0, 0, 0.5);
      border-radius: $border-radius;
      border: 1px solid rgba(white, 0.1);
      max-width: 100%;
    }
  }
}
</style>
