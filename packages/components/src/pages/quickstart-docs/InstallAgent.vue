<template>
  <QuickstartLayout>
    <section class="qs-step">
      <div class="qs-step__head">
        <h1 class="qs-title">Install the AppMap agent for this project</h1>
      </div>
      <div
        class="qs-step__block"
        v-if="selectedLanguage && selectedLanguageData"
      >
        <p>
          We have provided an installer to help you do that. All you have to do
          is open a terminal window in the root of your project and paste in
          this command:
        </p>
        <code>
          {{ selectedLanguageData.installCommand }}
        </code>
        <p class="mb10">OR</p>
        <p class="mb20">
          You can install the AppMap agent manually by following our
          <a :href="selectedLanguageData.link" target="_blank">quickstart</a>
          documentation.
        </p>
        <p>
          After you have installed the agent proceed to
          <a href="#" @click="goToRecordAppmaps"><b>Record AppMaps</b></a>
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
    goToRecordAppmaps(event) {
      event.preventDefault();
      event.stopImmediatePropagation();
      this.$root.$emit('transition', 'RECORD_APPMAPS');
    },
  },

  computed: {
    selectedLanguage() {
      const detected = this.languages.filter((lang) => lang.isDetected);
      return detected[0] ? detected[0].id : false;
    },
    selectedLanguageData() {
      if (!this.selectedLanguage) {
        return null;
      }
      return this.languages.filter(
        (lang) => lang.id === this.selectedLanguage
      )[0];
    },
  },
};
</script>
