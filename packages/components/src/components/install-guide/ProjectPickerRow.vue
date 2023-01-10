<template>
  <v-accordion
    ref="accordion"
    data-cy="project-picker-row"
    :disabled="!supported"
    class="project-picker-row"
    :open="selected"
    :data-supported="supported"
  >
    <template #header>
      <div class="header">
        <div class="header__title">
          {{ name }}
        </div>
        <div class="header__support">
          <template v-for="feature in features">
            <v-popper
              :text="featureDescription(feature)"
              placement="left"
              text-align="left"
              v-if="feature.condition()"
              :key="feature.name"
            >
              <div class="header__feature-tag" @click.stop.prevent>
                <component :is="feature.icon" />
                <div class="header__icon-text">{{ feature.name }}</div>
              </div>
            </v-popper>
          </template>
        </div>
        <div class="header__accordion-icons">
          <v-icon-chevron v-if="!selected" />
        </div>
      </div>
    </template>

    <div class="project-picker-row__body">
      <template v-if="supported && isJetBrains && isJava">
        <p class="mb20">
          You're good to go! By using the AppMap plugin for IntelliJ, you don't need to install any
          additional dependencies to your project.
        </p>
        <p>Continue on to the next step.</p>
        <v-navigation-buttons :first="true" :last="!supported" />
      </template>
      <template v-else-if="supported">
        You're almost done! Install AppMap as a development dependency in your project. Click the
        button below to perform an automated installation.
        <div class="center-block" data-cy="automated-install">
          <v-button kind="ghost" @click.native="performInstall" :timeout="2000">
            Automated install via AppMap CLI
          </v-button>
        </div>
        <template v-if="manualInstructions">
          <div class="separator">OR</div>
          <component :is="manualInstructions" data-cy="manual-install" />
        </template>
        <div class="project-picker-row__nav">
          <p>Finished the installation? Proceed to the next step.</p>
          <v-navigation-buttons :first="true" :last="!supported" />
        </div>
      </template>
      <template v-else>
        <template v-if="!languageSupported">
          <p>
            This project does not meet all the requirements to create AppMaps. AppMap currently
            supports the following languages:
          </p>
          <ul class="support-list">
            <li><strong>Ruby</strong></li>
            <li><strong>Python</strong></li>
            <li><strong>JavaScript</strong></li>
            <li><strong>Java</strong></li>
          </ul>
        </template>
        <template v-else>
          <p class="mb20">
            We weren't able to find a supported web or test framework within this project. Please
            visit
            <a :href="documentationUrl">our {{ language.name }} documentation</a> for more
            information.
          </p>
        </template>
      </template>
    </div>
  </v-accordion>
</template>

<script>
import VButton from '@/components/Button.vue';
import VAccordion from '@/components/Accordion.vue';
import VAnalysisIcon from '@/assets/fa-solid_crosshairs.svg';
import VVisualizationIcon from '@/assets/fa-solid_map.svg';
import VOpenApiIcon from '@/assets/file-icons_openapi.svg';
import VUnsupportedIcon from '@/assets/info.svg';
import VPopper from '@/components/Popper.vue';
import VNavigationButtons from '@/components/install-guide/NavigationButtons.vue';
import VRuby from '@/components/install-guide/install-instructions/Ruby.vue';
import VPython from '@/components/install-guide/install-instructions/Python.vue';
import VIconChevron from '@/assets/fa-solid_chevron-down.svg';

import { isFeatureSupported, isProjectSupported } from '@/lib/project';
import { getAgentDocumentationUrl } from '@/lib/documentation';

const manualInstructionComponents = { ruby: VRuby, python: VPython };

export default {
  name: 'project-picker-row',
  components: {
    VButton,
    VAccordion,
    VRuby,
    VPython,
    VAnalysisIcon,
    VVisualizationIcon,
    VOpenApiIcon,
    VUnsupportedIcon,
    VPopper,
    VNavigationButtons,
    VIconChevron,
  },
  props: {
    selected: Boolean,
    name: String,
    score: Number,
    path: String,
    language: Object,
    testFramework: Object,
    webFramework: Object,
    editor: String,
  },
  data() {
    return {
      features: [
        {
          name: 'Map',
          icon: VVisualizationIcon,
          condition: () => this.supported,
          description:
            'AppMap will generate interactive diagrams of your code.\nSee exactly how functions, web services, data stores, security, I/O and dependent services all work together when application code runs.',
        },
        {
          name: 'Analyze',
          icon: VAnalysisIcon,
          condition: () => this.webFrameworkSupported,
          description:
            "AppMap will automatically identify software design flaws that impact performance, stability, security and maintainability. This runtime code analysis can find the problems that static code analyzers miss - and that cause 90% of today's most serious production issues.",
        },
        {
          name: 'Generate OpenAPI',
          icon: VOpenApiIcon,
          condition: () => this.webFrameworkSupported,
          description: 'AppMap will use runtime data to generate OpenAPI specifications.',
        },
        {
          name: 'Unsupported',
          icon: VUnsupportedIcon,
          condition: () => !this.supported,
          description: 'This project does not meet all the requirements to create AppMaps.',
        },
      ],
    };
  },
  computed: {
    rows() {
      return [this.language, this.testFramework, this.webFramework];
    },
    supported() {
      return isProjectSupported({
        name: this.name,
        score: this.score,
        webFramework: this.webFramework,
        testFramework: this.testFramework,
      });
    },
    languageSupported() {
      return isFeatureSupported(this.language);
    },
    webFrameworkSupported() {
      return isFeatureSupported(this.webFramework);
    },
    classes() {
      return {
        selected: this.selected,
      };
    },
    manualInstructions() {
      const languageKey = ((this.language && this.language.name) || '').toLowerCase();
      return manualInstructionComponents[languageKey];
    },
    documentationUrl() {
      return getAgentDocumentationUrl(this.language && this.language.name);
    },
    isJetBrains() {
      return this.editor === 'jetbrains';
    },
    isJava() {
      return this.language.name.toLowerCase() === 'java';
    },
  },
  methods: {
    performInstall() {
      this.$root.$emit('perform-install', this.path, this.language && this.language.name);
    },
    featureDescription(feature) {
      if (typeof feature.description === 'function') {
        return feature.description(this);
      }
      return feature.description;
    },
  },
  mounted() {
    const { accordion } = this.$refs;
    this.$root.$on('select-project', (project) => {
      if (project.path === this.path) {
        window.scrollTo(250, accordion.$el.offsetTop);
      }
    });
  },
};
</script>

<style lang="scss" scoped>
$brightblue: rgba(255, 255, 255, 0.1);

.project-picker-row {
  border-bottom: 1px solid lighten($gray2, 15);
  padding: 0;

  &.accordion--open {
    background-color: #171d2d;
    border-radius: 0;
    border-bottom: 1px solid lighten($gray2, 15);
  }
  &__body {
    padding: 1rem 0;
    border-top: 1px solid lighten($gray2, 15);
  }
  &__nav {
    display: flex;
    p {
      justify-content: left;
      flex-grow: 1;
      margin: auto 0;
    }
    margin-top: 1rem;
  }

  &:hover {
    background-color: #171d2d;
  }
}

.header {
  display: flex;
  align-items: center;

  &__title {
    font-size: 0.9rem;
    justify-content: left;
    flex-grow: 1;
    font-weight: 800;
  }

  &__support {
    display: flex;
    gap: 1.25rem;
  }

  &__feature-tag {
    color: $gray4;
    display: flex;
    padding: 0.2rem 0;
    align-items: center;
    transition: $transition;

    svg {
      height: 16px;
      width: 16px;
      fill: $gray4;
      transition: $transition;
    }

    &:hover {
      color: lighten($gray4, 30);

      svg {
        fill: lighten($gray4, 30);
      }
    }
  }

  &__icon-text {
    display: inline-block;
    margin-left: 0.25em;
    font-size: 0.9rem;
  }

  &__accordion-icons {
    position: relative;
    width: 14px;
    height: 14px;
    margin-left: 1rem;
    align-self: center;

    svg {
      position: absolute;
      left: 0;
      top: 0;
      fill: $white;
    }
  }
}

.separator {
  $color: rgba(255, 255, 255, 0.5);

  display: flex;
  justify-content: center;
  margin: 2em auto;
  color: lighten($gray2, 25);

  &::before {
    content: ' ';
    margin: auto 1em auto 0;
    width: 100%;
    background-color: lighten($gray2, 15);
    height: 1px;
  }

  &::after {
    content: ' ';
    margin: auto 0 auto 1em;
    width: 100%;
    background-color: lighten($gray2, 15);
    height: 1px;
  }
}

.center-block {
  display: flex;
  justify-content: center;
  margin: 1em;
}

.support-list {
  margin: 1rem 0;
  list-style-position: inside;
  ul {
    margin-left: 1rem;
    margin-top: 0;
    li {
      strong {
        color: #939fb1;
      }
    }
  }
  strong {
    color: #939fb1;
  }
}
</style>
