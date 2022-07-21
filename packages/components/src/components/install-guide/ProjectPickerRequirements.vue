<template>
  <div v-if="projectSelected">
    <article class="requirements">
      <h2 class="install subhead" data-cy="requirements-title">Requirements</h2>
      <p v-if="quality === 'good'">
        <span :class="quality">
          This project meets all requirements necessary to create AppMaps.</span
        >
        Run the AppMap installer command to continue.
      </p>
      <p v-else>
        <span :class="quality">
          This project does not meet all the requirements to create AppMaps.
        </span>
        <a :href="link"> See the docs for more info. </a>
      </p>
      <ul>
        <li>
          <div class="req-data">
            <strong>Name: </strong>
            {{ project.name }}
          </div>
        </li>
        <li>
          <div class="req-data">
            <strong>Language: </strong>
            {{ language }}
            <v-quality-icon :quality="languageQuality" />
          </div>
          <div class="req-message">
            <span :class="languageQuality">{{ languageMessage }}</span>
          </div>
        </li>
        <li>
          <div class="req-data">
            <strong>Test framework: </strong>
            {{ testFramework }}
            <v-quality-icon :quality="testFrameworkQuality" />
          </div>
          <div class="req-message">
            <span :class="testFrameworkQuality">{{
              testFrameworkMessage
            }}</span>
          </div>
        </li>
        <li>
          <div class="req-data">
            <strong>Web framework: </strong>
            {{ webFramework }}
            <v-quality-icon :quality="webFrameworkQuality" />
          </div>
          <div class="req-message">
            <span :class="webFrameworkQuality">{{ webFrameworkMessage }}</span>
          </div>
        </li>
      </ul>
    </article>
    <article v-if="quality === 'good' || quality === 'ok'">
      <h2>Run AppMap installer</h2>
      <article class="node-install-warning" v-if="hasNode === false">
        <p class="ok">
          Installing the AppMap agent requires Node 14, 16, or 18, which was not
          detected.
        </p>
        <p>
          For instructions, see our
          <a
            target="blank"
            href="https://www.appland.com/docs/install-appmap-agent/node-requirements-for-install.html"
            >Node installation guide</a
          >
        </p>
      </article>
      <v-code-snippet
        :clipboard-text="installCommand"
        :message-success="messageSuccess"
      />
      <div v-if="project.agentInstalled" data-cy="agent-installed-message">
        <span class="good">It looks like the AppMap agent is installed.</span>
        Continue on to the next step.
      </div>
    </article>
    <v-navigation-buttons
      v-if="quality === 'good' || quality === 'ok'"
      :first="first"
      :last="last"
    />
  </div>
</template>

<script>
import VCodeSnippet from '@/components/CodeSnippet.vue';
import VNavigationButtons from '@/components/install-guide/NavigationButtons.vue';
import Navigation from '@/components/mixins/navigation';
import VQualityIcon from '@/components/QualityIcon.vue';

export default {
  name: 'project-picker-requirements',

  components: {
    VCodeSnippet,
    VNavigationButtons,
    VQualityIcon,
  },

  mixins: [Navigation],

  props: {
    project: {
      type: Object,
      default: () => ({}),
    },
    messageSuccess: {
      type: String,
      default: '<b>Copied!</b><br/>Paste this command<br/>into your terminal.',
    },
  },

  computed: {
    projectSelected() {
      return this.project && Object.keys(this.project).length > 0;
    },
    quality() {
      if (!this.project) return undefined;
      if (!this.project.score || this.project.score < 2) return 'bad';
      if (this.project.score < 3) return 'ok';
      return 'good';
    },
    installCommand() {
      return [
        'npx @appland/appmap install',
        this.project && `-d ${this.project.path}`,
      ]
        .filter(Boolean)
        .join(' ');
    },
    language() {
      return (
        (this.project && this.project.language && this.project.language.name) ||
        'None Detected'
      );
    },
    languageMessage() {
      return (
        (this.project && this.project.language && this.project.language.text) ||
        ''
      );
    },
    languageQuality() {
      if (
        !(this.project && this.project.language && this.project.language.score)
      )
        return 'bad';
      if (this.project.language.score < 2) return 'bad';
      if (this.project.language.score < 3) return 'ok';
      return 'good';
    },
    webFramework() {
      return (
        (this.project &&
          this.project.webFramework &&
          this.project.webFramework.name) ||
        'None Detected'
      );
    },
    webFrameworkMessage() {
      return (
        (this.project &&
          this.project.webFramework &&
          this.project.webFramework.text) ||
        ''
      );
    },
    webFrameworkQuality() {
      if (
        !(
          this.project &&
          this.project.webFramework &&
          this.project.webFramework.score
        )
      )
        return 'bad';
      if (this.project.webFramework.score < 2) return 'bad';
      if (this.project.webFramework.score < 3) return 'ok';
      return 'good';
    },
    testFramework() {
      return (
        (this.project &&
          this.project.testFramework &&
          this.project.testFramework.name) ||
        'None Detected'
      );
    },
    testFrameworkMessage() {
      return (
        (this.project &&
          this.project.testFramework &&
          this.project.testFramework.text) ||
        ''
      );
    },
    testFrameworkQuality() {
      if (
        !(
          this.project &&
          this.project.testFramework &&
          this.project.testFramework.score
        )
      )
        return 'bad';
      if (this.project.testFramework.score < 2) return 'bad';
      if (this.project.testFramework.score < 3) return 'ok';
      return 'good';
    },
    link() {
      let url = 'https://appland.com/docs/install-appmap-agent';
      if (this.language === 'Ruby') {
        url =
          'https://appland.com/docs/install-appmap-agent/install-appmap-agent-for-ruby.html';
      } else if (this.language === 'Java') {
        url =
          'https://appland.com/docs/install-appmap-agent/install-appmap-agent-for-java.html';
      } else if (this.language === 'Python') {
        url =
          'https://appland.com/docs/install-appmap-agent/install-appmap-agent-for-python.html';
      } else if (this.language === 'JavaScript') {
        url =
          'https://appland.com/docs/install-appmap-agent/install-appmap-agent-for-javascript.html';
      }
      return url;
    },
    hasNode() {
      return !!(this.project && this.project.hasNode);
    },
  },
};
</script>

<style lang="scss" scoped>
h2 {
  margin-block-end: 0;
  counter-increment: step;
  color: $gray-secondary;
  border-bottom: 1px solid $gray-secondary;
  margin-bottom: 0.5rem;
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
    list-style-type: unset;
    list-style-position: inside;
    flex-wrap: wrap;
    li {
      line-height: 1.5rem;
      display: flex;
      align-items: flex-start;
      margin: 0.5rem 0;
      gap: 0.5rem;
      &.requirement-good {
        svg {
          color: $alert-success;
        }
      }
    }
  }
}

.req-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  svg {
    min-width: 1rem !important;
  }
}

.req-data {
  white-space: nowrap;
  display: flex;
  align-content: flex-start;
  align-items: center;
  flex-direction: row;
  strong {
    margin-right: 0.5rem;
  }
  svg {
    margin: 0 0.5rem;
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

@media (max-width: 800px) {
  .requirements {
    ul {
      padding: 0;
      li {
        flex-direction: column;
        gap: 0;
        margin-bottom: 1.25rem;
      }
    }
  }

  .req-message {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
}
</style>
