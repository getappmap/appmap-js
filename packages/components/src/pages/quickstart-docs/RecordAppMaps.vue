<template>
  <QuickstartLayout>
    <section class="qs-step">
      <div class="qs-step__head">
        <h1 class="qs-title">Record AppMaps</h1>
      </div>
      <div class="qs-step__block">
        <div v-if="language === 'ruby'">
          <p>Record AppMaps using your existing tests.</p>
          <ul>
            <li>
              <a
                href="https://appland.com/docs/quickstart/vscode/ruby-step-3#rspec"
                >Record AppMaps with RSpec</a
              >
            </li>
            <li>
              <a
                href="https://appland.com/docs/quickstart/vscode/ruby-step-3#minitest"
                >Record AppMaps with Minitest</a
              >
            </li>
            <li>
              <a
                href="https://appland.com/docs/quickstart/vscode/ruby-step-3#cucumber"
                >Record AppMaps with Cucumber</a
              >
            </li>
          </ul>
          <p>
            If you do not have tests, you can use our Remote recording
            capability to record your application as it runs. This requires a
            Rails-based application.
          </p>
          <ul>
            <li>
              <a
                href="https://appland.com/docs/quickstart/vscode/ruby-step-3#remote-recording"
                >Remote recording</a
              >
            </li>
          </ul>
        </div>
        <div v-if="language === 'python'">
          <p>Record AppMaps using your existing tests.</p>
          <ul>
            <li>
              <a
                href="https://appland.com/docs/quickstart/vscode/python-step-3.html#pytest"
                >Record AppMaps with pytest</a
              >
            </li>
            <li>
              <a
                href="https://appland.com/docs/quickstart/vscode/python-step-3.html#unittest"
                >Record AppMaps with Unittest</a
              >
            </li>
          </ul>
          <p>
            If you do not have tests, you can use our Remote recording
            capability to record your application as it runs. This requires a
            Django or Flask based application.
          </p>
          <ul>
            <li>
              <a
                href="https://appland.com/docs/quickstart/vscode/python-step-3.html#remote-recording"
                >Remote recording</a
              >
            </li>
          </ul>
        </div>
        <div v-if="language === 'java'">
          <p>
            The fastest way to record AppMaps is from running JUnit or TestNG
            tests.<br />Jump to the instructions for the build framework of your
            application:
          </p>
          <ul>
            <li>
              <a
                href="https://appland.com/docs/quickstart/vscode/java-step-3.html#maven"
                >Maven</a
              >
            </li>
            <li>
              <a
                href="https://appland.com/docs/quickstart/vscode/java-step-3.html#gradle"
                >Gradle</a
              >
            </li>
            <li>
              <a
                href="https://appland.com/docs/quickstart/vscode/java-step-3.html#for-other-than-maven-or-gradle-projects"
                >For other than Maven or Gradle projects</a
              >
            </li>
          </ul>
          <p>
            If you do not have JUnit or TestNG tests, you can use our Remote
            recording capability to record your application as it runs.
          </p>
          <ul>
            <li>
              <a
                href="https://appland.com/docs/quickstart/vscode/java-step-3.html#remote-recording"
                >Remote recording</a
              >
            </li>
          </ul>
        </div>
        <p>
          After you have installed the agent proceed to
          <a href="#" @click="goToOpenAppmaps"><b>Open AppMaps</b></a>
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
    language: {
      type: String,
      require: true,
      default: 'ruby',
    },
  },

  methods: {
    goToOpenAppmaps(event) {
      event.preventDefault();
      event.stopImmediatePropagation();
      this.$root.$emit('transition', 'OPEN_APPMAPS');
    },
  },
};
</script>
