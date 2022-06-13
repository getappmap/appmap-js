<template>
  <QuickstartLayout>
    <section>
      <header>
        <h1>Install AppMap agent</h1>
      </header>
      <main>
        <article v-if="projects.length > 0">
          <h2>Select a suitable project</h2>
          <!-- <p>
            To make sure that your projects are suitable for mapping, we make a
            couple of quick requirement checks on your workspace to help you
            find a project to start AppMapping. Select a suitable project from
            the table below.
          </p> -->
          <v-project-picker-table
            :projects="projects"
            @select-project="selectProject($event)"
            ref="projectTable"
          />
        </article>
        <template v-if="quality == 'good' || quality == 'ok'">
          <article>
            <h2>Run AppMap installer</h2>
            <!-- <p class="body-text">
              AppMap agent records executing code. It creates JSON files as you
              execute test cases, run sample programs, or perform interactive
              sessions with your app. This script will guide you through the
              installation process. Run it in the project's environment so it
              can correctly detect runtimes and libraries.
            </p> -->
            <!-- <p class="note body-text" v-if="quality == 'ok'">
              It appears this project might not be a good choice for your first
              AppMap. We recommend you pick another project; proceed at your own
              risk.
            </p> -->
            <!-- <p class="body-text">
              If you do not have Node.js installed, or would prefer manual
              installion of the AppMap agent visit our
              <a
                id="docref-step2"
                href="https://appland.com/docs/quickstart/vscode/step-2"
                >installation documentation.</a
              >
            </p> -->
            <v-code-snippet
              :clipboard-text="installCommand"
              :message-success="messageSuccess"
            />
          </article>
          <!-- <article v-if="selectedProject.agentInstalled">
            It looks like the AppMap agent is installed. Continue on to the next
            step.
          </article> -->
          <v-navigation-buttons :first="first" :last="last" />
        </template>
        <template v-if="quality == 'bad'">
          <article>
            <h2>Run AppMap installer</h2>
            <p>
              The AppMap agent watches your code as it executes and generates
              traces you can examine visually.
            </p>
            <p class="note">
              It appears this project might not be a good choice for your first
              AppMap. We recommend you pick another project; proceed at your own
              risk.
            </p>
          </article>
        </template>
      </main>
    </section>
  </QuickstartLayout>
</template>

<script>
import QuickstartLayout from '@/components/quickstart/QuickstartLayout.vue';
import VCodeSnippet from '@/components/CodeSnippet.vue';
import VProjectPickerTable from '@/components/install-guide/ProjectPickerTable.vue';
import VNavigationButtons from '@/components/install-guide/NavigationButtons.vue';
import Navigation from '@/components/mixins/navigation';

export default {
  name: 'ProjectPicker',

  components: {
    VCodeSnippet,
    QuickstartLayout,
    VProjectPickerTable,
    VNavigationButtons,
  },

  mixins: [Navigation],

  props: {
    messageSuccess: {
      type: String,
      default: '<b>Copied!</b><br/>Paste this command<br/>into your terminal.',
    },
    projects: {
      type: Array,
      default: () => [],
    },
  },

  computed: {
    quality() {
      const { selectedProject: project } = this;
      if (!project) return undefined;
      if (!project.score || project.score < 2) return 'bad';
      if (project.score < 3) return 'ok';
      return 'good';
    },
    installCommand() {
      return [
        'npx @appland/appmap install',
        this.selectedProject && `-d ${this.selectedProject.path}`,
      ]
        .filter(Boolean)
        .join(' ');
    },
  },

  data() {
    return {
      selectedProject: null,
    };
  },

  mounted() {
    if (this.projects.length === 1) {
      this.$refs.projectTable.selectProject(this.projects[0]);
    }
  },

  methods: {
    goToRecordAppmaps(event) {
      event.preventDefault();
      event.stopImmediatePropagation();
      this.$root.$emit('transition', 'RECORD_APPMAPS');
    },
    selectProject(project) {
      this.$nextTick(() => {
        this.selectedProject = project;
        this.$root.$emit('select-project', project);
      });
    },
  },
};
</script>

<style lang="scss" scoped>
main {
  counter-reset: step;
}

h1 {
  margin-block-start: 0;
  font-size: 2em;
}

h2 {
  margin-block-end: 0;
  counter-increment: step;
}

h2::before {
  content: counter(step) '. ';
}

tr :first-child {
  text-align: left;
  padding-left: 6ex;
  position: relative;
}

p.note {
  font-style: italic;

  &:before {
    content: 'Note: ';
    font-size: large;
    opacity: 0.8;
    font-variant-caps: all-small-caps;
    margin-right: 0.8ex;
    font-style: normal;
  }
}
</style>
