<template>
  <QuickstartLayout>
    <section class="qs-step">
      <div class="qs-step__head">
        <h1 class="qs-headline__1">{{ headerText }}</h1>
        <div class="qs-headline__subhead">
          RECORD APPMAPS<span class="step-number"> (step 2 of 3)</span>
        </div>
      </div>
      <div class="qs-step__block">
        <div>
          <p class="qs-step__margin">
            With the agent installed and your application server running you
            will be able to:
          </p>
          <p class="qs-inline-steps">
            <b>
              Start a recording
              <span class="qs-next-icon"> >> </span>
              Interact with your application
              <span class="qs-next-icon"> >> </span>
              Stop the recording and view an AppMap of how the code behaved
            </b>
          </p>
          <p class="qs-step__margin qs-step__callout__primary">
            Follow the simple instructions for doing this with your framework:
            <span
              class="qs-step__margin primary-links"
              v-if="editor === 'vscode'"
            >
              <a
                class="blue-on-blue-link"
                href="https://appland.com/docs/quickstart/vscode/java-step-3.html"
              >
                Spring
              </a>
              &nbsp;&nbsp;|&nbsp;&nbsp;
              <a
                class="blue-on-blue-link"
                href="https://appland.com/docs/quickstart/vscode/python-step-3.html"
              >
                Flask
              </a>
              &nbsp;&nbsp;|&nbsp;&nbsp;
              <a
                class="blue-on-blue-link"
                href="https://appland.com/docs/quickstart/vscode/python-step-3.html"
              >
                Django
              </a>
              &nbsp;&nbsp;|&nbsp;&nbsp;
              <a
                class="blue-on-blue-link"
                href="https://appland.com/docs/quickstart/vscode/ruby-step-3.html"
              >
                Rails
              </a>
            </span>
          </p>
          <p class="mb20" v-if="editor === 'jetbrains'">
            <a href="https://appland.com/docs/quickstart/intellij/step-3">
              Spring
            </a>
            &nbsp;&nbsp;|&nbsp;&nbsp;
            <a href="https://appland.com/docs/quickstart/pycharm/step-3">
              Flask
            </a>
            &nbsp;&nbsp;|&nbsp;&nbsp;
            <a href="https://appland.com/docs/quickstart/pycharm/step-3">
              Django
            </a>
            &nbsp;&nbsp;|&nbsp;&nbsp;
            <a href="https://appland.com/docs/quickstart/rubymine/step-3">
              Rails
            </a>
          </p>
        </div>
        <p class="qs-step__next-step">
          Next up:
          <a href="#" @click="goToOpenAppmaps">
            <b>Open AppMaps</b>
          </a>
          <br />
          <a href="#" @click="goToInstallAgent">
            <div class="qs-next-progress-circle"></div>
          </a>
          <a href="#" @click="goToRecordAppmaps">
            <div class="qs-next-progress-circle"></div>
          </a>
          <a href="#" @click="goToOpenAppmaps">
            <div class="qs-next-progress-circle todo"></div>
          </a>
        </p>
      </div>
    </section>
  </QuickstartLayout>
</template>

<script>
import QuickstartLayout from '@/components/quickstart/QuickstartLayout.vue';

export default {
  name: 'QuickstartDocsRecordAppMaps',

  components: {
    QuickstartLayout,
  },

  props: {
    editor: {
      type: String,
      required: true,
      default: 'vscode',
      validator: (value) => ['vscode', 'jetbrains'].indexOf(value) !== -1,
    },
    projectName: String,
  },

  computed: {
    headerText() {
      return ['Quickstart', this.projectName].filter((x) => x).join(': ');
    },
  },

  methods: {
    goToInstallAgent(event) {
      event.preventDefault();
      event.stopImmediatePropagation();
      this.$root.$emit('transition', 'INSTALL_AGENT');
    },
    goToRecordAppmaps(event) {
      event.preventDefault();
      event.stopImmediatePropagation();
      this.$root.$emit('transition', 'RECORD_APPMAPS');
    },
    goToOpenAppmaps(event) {
      event.preventDefault();
      event.stopImmediatePropagation();
      this.$root.$emit('transition', 'OPEN_APPMAPS');
    },
  },
};
</script>
