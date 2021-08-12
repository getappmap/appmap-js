<template>
  <QuickstartLayout>
    <section class="qs-step">
      <div class="qs-step__head">
        <h1 class="qs-title">
          🥳 Congratulations! You have installed the AppMap extension.
        </h1>
        <p>You can use this extension to view and navigate existing AppMaps.</p>
      </div>
      <div class="qs-step__block" v-if="hasDetectedLanguage">
        <h3>
          To record AppMaps of your code you must also install the AppMap agent
          for this project.
        </h3>
        <div
          class="qs-link-wrap"
          v-if="selectedLanguage && selectedLanguageData"
        >
          <p>
            We have provided an installer to help you do that. All you have to
            is open a terminal window in the root of your project and paste in
            this command:
          </p>
          <code>
            {{ selectedLanguageData.installCommand }}
          </code>
          <p>OR</p>
          <p>
            If node-based installers are not your thing you can install the
            AppMap agent manually by following our
            <a :href="selectedLanguageData.link" target="_blank">quickstart</a>
            guide in the AppMap documentation.
          </p>
          <p>
            After you have installed the agent proceed to
            <a href="#" @click.prevent="goToRecordAppmaps">Record AppMaps</a>
          </p>
        </div>
      </div>
      <div class="qs-step__block" v-else>
        <p>
          AppMap currently supports Java, Python, and Ruby projects.<br />Visit
          the Quickstart guides for more details:
        </p>
        <ul class="qs-list">
          <li v-for="lang in languages" :key="lang.id">
            <a :href="lang.link">AppMap Quickstart guide for {{ lang.name }}</a>
          </li>
        </ul>
        <p class="qs-step__separator">or</p>
        <p>
          For updates on new language support
          <a href="https://discord.com/invite/N9VUap6"
            >join our Discord community</a
          >
        </p>
      </div>
    </section>
  </QuickstartLayout>
</template>

<script>
import QuickstartLayout from '@/components/quickstart/QuickstartLayout.vue';

export default {
  name: 'QuickstartDocsInstallAgent',

  components: {
    QuickstartLayout,
  },

  props: {
    languages: {
      type: Array,
      default: () => [],
    },
  },

  methods: {
    goToRecordAppmaps() {
      this.$root.$emit('goToRecordAppmaps');
    },
  },

  computed: {
    selectedLanguage() {
      return this.languages.filter((lang) => lang.isDetected)[0].id;
    },
    selectedLanguageData() {
      if (!this.selectedLanguage) {
        return null;
      }
      return this.languages.filter(
        (lang) => lang.id === this.selectedLanguage
      )[0];
    },
    hasDetectedLanguage() {
      return this.languages.some((lang) => lang.isDetected);
    },
  },
};
</script>
