<template>
  <QuickstartLayout>
    <section>
      <header>
        <h1 data-cy="title">Add AppMap to your project</h1>
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
        <article v-if="projects.length === 1">
          <v-project-picker-table
            :projects="projects"
            @select-project="selectProject($event)"
            ref="projectTable"
          />
        </article>
        <article v-if="projects.length > 1">
          <h2 class="install subhead">Projects</h2>
          <p data-cy="multiple-projects-text">
            You have multiple projects in this workspace. We’ve outlined the projects that are ready
            to start making AppMaps. <br />Select a project to continue.
          </p>
          <div class="table-wrap">
            <v-project-picker-table
              :projects="projects"
              @select-project="selectProject($event)"
              ref="projectTable"
            />
          </div>
        </article>
      </main>
    </section>
  </QuickstartLayout>
</template>

<script>
import QuickstartLayout from '@/components/quickstart/QuickstartLayout.vue';
import VProjectPickerTable from '@/components/install-guide/ProjectPickerTable.vue';
import Navigation from '@/components/mixins/navigation';
import EmptyIcon from '@/assets/patch-question.svg';

export default {
  name: 'ProjectPicker',

  components: {
    QuickstartLayout,
    VProjectPickerTable,
    EmptyIcon,
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

h2 {
  margin-block-end: 0;
  counter-increment: step;
  border-bottom: 1px solid $gray-secondary;
  margin-bottom: 0.5rem;
}

.table-wrap {
  border: 1px solid $gray-secondary;
  border-radius: $border-radius;
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
