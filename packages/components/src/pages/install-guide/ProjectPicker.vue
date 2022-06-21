<template>
  <QuickstartLayout>
    <section>
      <header>
        <h1>Install AppMap agent</h1>
      </header>
      <main>
        <article v-if="projects.length == 1">
          <h2 class="install subhead">Project</h2>
          <v-project-picker-table
            :projects="projects"
            @select-project="selectProject($event)"
            ref="projectTable"
          />
        </article>
        <article v-if="projects.length > 1">
          <h2 class="install subhead">Projects</h2>
          <p>
            You have multiple projects in this workspace. We’ve outlined the
            projects that are ready to start making AppMaps. <br />Select a
            project to continue.
          </p>
          <v-project-picker-table
            :projects="projects"
            @select-project="selectProject($event)"
            ref="projectTable"
          />
        </article>

        <!-- Good -->
        <template v-if="quality == 'good'">
          <article class="requirements">
            <h2 class="install subhead">Requirements</h2>
            <p>
              <span class="good"
                >This project meets all requirements necessary to create
                AppMaps.</span
              >
              Run the AppMap installer command to continue.
            </p>
            <ul>
              <li><strong>Name:</strong> MySingleProject</li>
              <li></li>
              <li>
                <strong>Language: </strong>
                {{ selectedProject.language.name || 'None Detected' }}
                <GoodIcon />
              </li>
              <li>
                <strong>Test framework: </strong>
                {{ selectedProject.testFramework.name || 'None Detected' }}
                <GoodIcon />
              </li>
              <li>
                <strong>Web framework: </strong>
                {{ selectedProject.webFramework.name || 'None Detected' }}
                <GoodIcon />
              </li>
            </ul>
          </article>
          <article>
            <h2>Run AppMap installer</h2>
            <v-code-snippet
              :clipboard-text="installCommand"
              :message-success="messageSuccess"
            />
            <div v-if="selectedProject.agentInstalled">
              <span class="good"
                >It looks like the AppMap agent is installed.</span
              >
              Continue on to the next step.
            </div>
          </article>
          <v-navigation-buttons :first="first" :last="last" />
        </template>

        <!-- OK -->
        <template v-if="quality == 'ok'">
          <article class="requirements">
            <h2 class="install subhead">Requirements</h2>
            <p>
              <span class="ok">
                It appears this project might not be a good choice for your
                first AppMap.
              </span>
              We recommend you pick another project; proceed at your own risk.
            </p>
            <ul>
              <li><strong>Name:</strong> MySingleProject</li>
              <li>
                <strong>Language: </strong>
                {{ selectedProject.language.name || 'None Detected' }}
                <OKIcon />
                <span class="ok">Support for Python is in Beta</span>
              </li>
              <li>
                <strong>Test framework: </strong>
                {{
                  (selectedProject.testFramework &&
                    selectedProject.testFramework.name) ||
                  'None Detected'
                }}
                <OKIcon />
                <span class="ok"
                  >Supported tests: pytest, unittest, and remote-recording</span
                >
              </li>
              <li>
                <strong>Web framework: </strong>
                {{
                  (selectedProject.webFramework &&
                    selectedProject.webFramework.name) ||
                  'None Detected'
                }}
                <GoodIcon />
              </li>
            </ul>
          </article>
          <article>
            <h2>Run AppMap installer</h2>
            <v-code-snippet
              :clipboard-text="installCommand"
              :message-success="messageSuccess"
            />
            <div v-if="selectedProject.agentInstalled">
              <span class="good"
                >It looks like the AppMap agent is installed.</span
              >
              Continue on to the next step.
            </div>
          </article>

          <v-navigation-buttons :first="first" :last="last" />
        </template>

        <!-- Bad -->
        <template v-if="quality == 'bad'">
          <article class="requirements">
            <h2 class="install subhead">Requirements</h2>
            <p>
              <span class="bad">
                It appears this project might not be a good choice for your
                first AppMap.
              </span>
              We recommend you pick another project.
            </p>
            <ul>
              <li><strong>Name:</strong> MySingleProject</li>
              <li>
                <strong>Language: </strong>
                {{
                  (selectedProject.language && selectedProject.language.name) ||
                  'None Detected'
                }}
                <BadIcon />
                <span class="bad"
                  >Supported languages: Ruby, Java, Javascript,
                  Python(Beta)</span
                >
              </li>
              <li>
                <strong>Test framework: </strong>
                {{
                  (selectedProject.testFramework &&
                    selectedProject.testFramework.name) ||
                  'None Detected'
                }}
                <BadIcon />
                <span class="bad"
                  >Supported tests: rspec, minitest, cucumber, and
                  remote-recording</span
                >
              </li>
              <li>
                <strong>Web framework:</strong>
                {{
                  (selectedProject.webFramework &&
                    selectedProject.webFramework.name) ||
                  'None Detected'
                }}
                <BadIcon />
                <span class="bad">Supported Rails versions: 5.x, 6.x, 7.x</span>
              </li>
            </ul>
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
import GoodIcon from '@/assets/check-circle-outline.svg';
import OKIcon from '@/assets/dash-circle.svg';
import BadIcon from '@/assets/x-circle.svg';

export default {
  name: 'ProjectPicker',

  components: {
    VCodeSnippet,
    QuickstartLayout,
    VProjectPickerTable,
    VNavigationButtons,
    GoodIcon,
    OKIcon,
    BadIcon,
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
      if (!project.score || project.score < 1) return 'empty';
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
  color: $gray-secondary;
  border-bottom: 1px solid $gray-secondary;
  margin-bottom: 0.5rem;
}

// h2::before {
//   content: counter(step) '. ';
// }

tr :first-child {
  text-align: left;
  padding-left: 6ex;
  position: relative;
}

p {
  margin: 0.5rem 0;
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

.requirements {
  ul {
    list-style-type: none;
    padding: 0;
    li {
      line-height: 1.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      &.requirement-good {
        svg {
          color: $alert-success;
        }
      }
    }
  }
}

.empty-state {
  border-radius: $border-radius;
  border: 1px dashed darken($gray4, 10);
  padding: 3rem;
  .card {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    .empty-icon {
      padding: 0 2rem;
    }
  }
}
.good {
  color: $alert-success;
}
.ok {
  color: $ok-status;
}
.bad {
  color: $bad-status;
}
</style>
