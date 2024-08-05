<template>
  <QuickstartLayout>
    <section class="project-picker">
      <header class="content content--header">
        <h1 data-cy="title">Recording AppMap data</h1>
      </header>
      <main>
        <article class="empty-state" data-cy="empty-state-article" v-if="projects.length === 0">
          <div class="card">
            <div class="empty-icon">
              <EmptyIcon />
            </div>
            <div class="content" data-cy="empty-state-content">
              <p>No projects were found in this workspace.</p>
              <p>Open a project to see if it's ready to create AppMaps.</p>
            </div>
          </div>
        </article>
        <article class="project-list" v-else>
          <v-project-configuration
            ref="projectConfiguration"
            :projects="projects"
            :editor="editor"
            @select-project="onSelectProject"
            @select-language="onSelectLanguage"
            description="Configure your project"
          >
            <div class="install-instructions"></div>
          </v-project-configuration>
        </article>
      </main>
      <p class="content content--footer">
        By downloading and using AppMap you agree to the
        <a href="https://appmap.io/community/terms-and-conditions">Terms and Conditions</a>.
      </p>
    </section>
  </QuickstartLayout>
</template>

<script>
import QuickstartLayout from '@/components/quickstart/QuickstartLayout.vue';
import EmptyIcon from '@/assets/patch-question.svg';
import VProjectConfiguration from '@/components/install-guide/ProjectConfiguration.vue';

export default {
  name: 'ProjectPicker',

  components: {
    QuickstartLayout,
    VProjectConfiguration,
    EmptyIcon,
  },

  props: {
    projects: {
      type: Array,
      default: () => [],
    },
    editor: {
      type: String,
      validator: (value) => ['vscode', 'jetbrains'].indexOf(value) !== -1,
    },
  },

  data() {
    return {
      selectedLanguage: undefined,
    };
  },

  computed: {
    projectConfiguration() {
      return this.$refs.projectConfiguration;
    },
  },

  methods: {
    onSelectProject(project) {
      this.selectedProject = this.projects.find((p) => p.path === project.path);
      this.$root.$emit('select-project', project);
    },
    onSelectLanguage(language) {
      this.selectedLanguage = language.toLowerCase();
    },
  },
};
</script>

<style lang="scss" scoped>
main {
  counter-reset: step;
}

h2 {
  margin-block-end: 0;
  counter-increment: step;
  border-bottom: 1px solid $gray-secondary;
  margin-bottom: 0.5rem;
}

.project-picker {
  h3 {
    text-transform: uppercase;
    color: $gray4;
  }
  .project-list {
    p {
      margin-bottom: 1.75rem;
    }
  }
  .subtitle {
    color: $gray4;
    font-size: 1.25rem;
  }
}

.table-wrap {
  &::-webkit-scrollbar-thumb {
    background: $gray-secondary;
  }
}

.qs h2 {
  margin-bottom: 0.5rem;
}

tr :first-child {
  text-align: left;
  padding-left: 6ex;
  position: relative;
}

p {
  margin: 0.5rem 0;
}

.empty-state {
  border-radius: $border-radius;
  border: 1px dashed darken($gray4, 10);
  margin: 2rem;
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
.content {
  padding: 2em;

  &--header {
    padding-bottom: 0;
  }

  &--footer {
    padding-top: 0;
    padding-bottom: 1rem;
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
.install-instructions {
  display: flex;
  flex-direction: column;
  align-items: flex-start;

  .next-button {
    margin-left: auto;
  }

  .full-width {
    width: 100%;
  }

  .code-snippet {
    margin-top: 0.25rem;
    margin-bottom: 0;
    width: 100%;
  }

  section {
    margin-bottom: 1.75rem;
    width: 100%;
  }
}
</style>
