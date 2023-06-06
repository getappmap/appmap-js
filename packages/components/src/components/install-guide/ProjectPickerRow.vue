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
      <p class="mb20">
        <template v-if="isJava">
          Two things are required to make AppMaps of your Java project:

          <ol>
            <li>The <tt>appmap-agent.jar</tt> must be available on your machine.</li>
            <li>
              Application code and test cases use the JVM flag
              <tt>-Djavaagent=appmap-agent.jar</tt>.
            </li>
          </ol>

          AppMap also uses a configuration file called <i>appmap.yml</i>. A default configuration
          file will be created automatically the first time you run your application with AppMap
          enabled.
        </template>
        <template v-if="isRuby">
          <p>
            To make AppMaps of your Ruby project, you need to add the <tt>appmap</tt> gem 
            to your "test" and "development" bundles. We provide an open source installer to do this, 
            or you can install manually. Advantages of using the installer include:
            <ol>
              <li>Verifies that your Ruby version is supported by AppMap.</li>
              <li>Verifies that your Rails version (if present) is supported by AppMap.</li>
              <li>Creates the configuration file <i>appmap.yml</i>.</li>
              <li>Has built-in support if you encounter any problems.</li>
            </ol>
          </p>
        </template>
        <template v-if="isPython">
          <p>
            To make AppMaps of your Python project, you need to install the <tt>appmap</tt> package
            and configure your project to use it. We provide an open source installer, or you can
            install manually. Advantages of using the installer include:
            <ol>
              <li>Verifies that your Python version is supported by AppMap.</li>
              <li>Verifies that your Django and Flask versions (if present) are supported by AppMap.</li>
              <li>Detects and supports <tt>pip</tt>, <tt>pipenv</tt>, and <tt>poetry</tt>.</li>
              <li>Creates the configuration file <i>appmap.yml</i>.</li>
              <li>Has built-in support if you encounter any problems.</li>
            </ol>
          </p>
        </template>
        <template v-if="isJS">
          To make AppMaps of your JavaScript project, you need to install the <tt>appmap-agent-js</tt>
          package from NPM and configure your project to use it.
          We provide an open source installer, or you can install manually. Advantages of using the installer include:
          <ol>
            <li>Verifies that your Node.js version is supported by AppMap.</li>
            <li>Verify that your Express, Jest and Mocha versions (if present) are supported by AppMap.</li>
            <li>Detects and supports <i>package-lock.json</i> (npm) and <i>yarn.lock</i> (yarn).</li>
            <li>Creates the configuration file <i>appmap.yml</i>.</li>
            <li>Has built-in support if you encounter any problems.</li>
          </ol>
        </template>
      </p>
      <template v-if="supported">
        <template v-if="isJetBrains && isJava">
          <p class="mb20">
            ✓ <tt>appmap-agent.jar</tt> has been downloaded and saved to your machine by the AppMap
            plugin.
          </p>
          <p class="mb20">
            ✓ Run configurations called "Start with AppMap" have been added to your IntelliJ menus.
          </p>
          <p class="mb20">✓ <tt>appmap.yml</tt> has been created in your project directory.</p>
          <div class="page-control-wrap">
            <p></p>
            <v-navigation-buttons :first="true" :last="!supported" />
          </div>
        </template>
        <template v-else>
          <div class="center-block" data-cy="automated-install">
            <v-button kind="primary" @click.native="performInstall" :timeout="2000">
              Run the installer
            </v-button>
          </div>
          <template v-if="manualInstructions">
            <div class="page-control-wrap">
              <p></p>
              <v-navigation-buttons :first="true" :last="!supported" />
            </div>

            <div class="separator">OR</div>

            <div style="margin: 0px auto 1em auto; width: 18ex">
              <h3>Install manually</h3>
            </div>

            <p>
              <component :is="manualInstructions" data-cy="manual-install" /></p
          ></template>

          <div class="project-picker-row__nav">
            <p></p>
            <v-navigation-buttons :first="true" :last="!supported" />
          </div>
        </template>
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
import VJavaScript from '@/components/install-guide/install-instructions/JavaScript.vue';
import VIconChevron from '@/assets/fa-solid_chevron-down.svg';

import { isFeatureSupported, isProjectSupported } from '@/lib/project';
import { getAgentDocumentationUrl } from '@/lib/documentation';

const manualInstructionComponents = {
  ruby: VRuby,
  python: VPython,
  javascript: VJavaScript,
};

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
    isPython() {
      return this.language.name.toLowerCase() === 'python';
    },
    isRuby() {
      return this.language.name.toLowerCase() === 'ruby';
    },
    isJava() {
      return this.language.name.toLowerCase() === 'java';
    },
    isJS() {
      return this.language.name.toLowerCase() === 'javascript';
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

.page-control-wrap {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}
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

    .status-message {
      border-radius: 0.5rem;
      background-color: #69ad34;
      padding: 0.5rem;
    }
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
