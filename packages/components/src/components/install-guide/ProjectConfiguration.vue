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
        <div class="project-configuration__step">
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
        'project-configuration--open': openSection === 'runtime',
      }"
      :open="openSection === 'runtime'"
      @toggle="onClickSection('runtime')"
    >
      <template #header>
        <div class="project-configuration__step">
          <div class="project-configuration__step-title">Select a runtime</div>
          <div class="project-configuration__step-result" v-if="selectedRuntime">
            {{ selectedRuntime }}
            <v-check-icon />
          </div>
        </div>
      </template>
      <div class="project-configuration__content">
        <div class="project-configuration__runtimes">
          <v-language-button
            v-for="[language, icon] of Object.entries(languages)"
            :key="language"
            :language="language"
            @click.native="onSelectRuntime(language)"
          >
            <component :is="icon" />
          </v-language-button>
        </div>
      </div>
    </v-accordion>
    <v-accordion
      :class="{
        'project-configuration': 1,
        'project-configuration--open ': openSection === 'content',
      }"
      :open="openSection === 'content'"
      @toggle="onClickSection('content')"
    >
      <template #header>
        <div class="project-configuration__step">
          <div class="project-configuration__step-title">{{ description }}</div>
        </div>
      </template>
      <div class="project-configuration__content">
        <slot />
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

interface Project {
  path: string;
  name: string;
}

type Section = undefined | 'project' | 'runtime' | 'content';

export default Vue.extend({
  components: {
    VAccordion,
    VCheckIcon,
    VLanguageButton,
    VJavaIcon,
    VPythonIcon,
    VRubyIcon,
    VNodeIcon,
  },

  props: {
    description: String,
    projects: {
      type: Array as () => Project[],
      default: () => [],
    },
    editor: String,
    javaAgentStatus: Number,
  },

  data() {
    return {
      openSection: 'project' as undefined | 'project' | 'runtime' | 'content',
      selectedProject: undefined as undefined | Project,
      selectedRuntime: undefined as undefined | string,
      languages: {
        Java: VJavaIcon,
        Python: VPythonIcon,
        Ruby: VRubyIcon,
        'Node.js': VNodeIcon,
      } as const,
    };
  },

  methods: {
    onClickSection(section: Section) {
      this.openSection = section;
    },
    onSelectProject(project: Project) {
      this.selectedProject = project;
      this.openSection = 'runtime';
    },
    onSelectRuntime(runtime: string) {
      this.selectedRuntime = runtime;
      this.openSection = 'content';
      this.$emit('select-runtime', runtime);
    },
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
    margin: 0.5rem;
    border-bottom: 1px solid darken($border-color, 50%);
    padding: 0.25rem 0.5rem;

    &:hover {
      cursor: pointer;
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

  &__runtimes {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 1rem;
    place-content: center;
  }

  &__content {
    padding: 0.5rem 2rem;
    margin: 0.5rem 0;
  }

  &--open {
    background-color: rgba(black, 0.25);

    .project-configuration__step {
      background-color: transparent;
      border-bottom: none;
      padding-bottom: 0;

      &-title {
        font-size: 1.25rem;
        font-weight: bold;
      }
    }

    .project-configuration__content {
      border-bottom: 1px solid $border-color;
    }
  }
}
</style>
