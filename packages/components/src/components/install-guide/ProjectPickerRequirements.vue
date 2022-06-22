<template>
  <div v-if="project">
    <article class="requirements">
      <h2 class="install subhead">Requirements</h2>
      <p v-if="quality === 'good'">
        <span :class="quality">
          This project meets all requirements necessary to create AppMaps.</span
        >
        Run the AppMap installer command to continue.
      </p>
      <p v-else>
        <span :class="quality">
          It appears this project might not be a good choice for your first
          AppMap.
        </span>
        We recommend you pick another project.
        <span v-if="quality === 'ok'">Proceed at your own risk.</span>
      </p>
      <ul>
        <li><strong>Name: </strong>{{ project.name }}</li>
        <li></li>
        <li>
          <strong>Language: </strong>
          {{ language }}
          <v-quality-icon :quality="String(project.language.score)" />
        </li>
        <li>
          <strong>Test framework: </strong>
          {{ testFramework }}
          <v-quality-icon :quality="String(project.testFramework.score)" />
        </li>
        <li>
          <strong>Web framework: </strong>
          {{ webFramework }}
          <v-quality-icon :quality="String(project.webFramework.score)" />
        </li>
      </ul>
    </article>
    <article v-if="quality === 'good' || quality === 'ok'">
      <h2>Run AppMap installer</h2>
      <v-code-snippet
        :clipboard-text="installCommand"
        :message-success="messageSuccess"
      />
      <div v-if="project.agentInstalled">
        <span class="good">It looks like the AppMap agent is installed.</span>
        Continue on to the next step.
      </div>
    </article>
    <v-navigation-buttons :first="first" :last="last" />
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
      default: {},
    },
    messageSuccess: {
      type: String,
      default: '<b>Copied!</b><br/>Paste this command<br/>into your terminal.',
    },
  },

  computed: {
    quality() {
      if (!this.project) return undefined;
      if (!this.project.score || this.project.score < 1) return 'empty';
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
        (this.project.language && this.project.language.name) || 'None Detected'
      );
    },
    webFramework() {
      return (
        (this.project.webFramework && this.project.webFramework.name) ||
        'None Detected'
      );
    },
    testFramework() {
      return (
        (this.project.testFramework && this.project.testFramework.name) ||
        'None Detected'
      );
    },
  },

  data() {
    return {};
  },

  mounted() {},
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
