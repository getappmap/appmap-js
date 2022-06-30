<template>
  <v-quickstart-layout>
    <section>
      <header>
        <h1>Investigate findings</h1>
      </header>
      <main>
        <article v-if="scanned">
          <template v-if="numFindings > 0">
            <p>
              AppMap has identified {{ numFindings }} findings. You can locate
              more details by opening the problems panel.
            </p>
            <div class="center">
              <v-button label="View problems" @click.native="viewProblems" />
            </div>
          </template>
          <p v-else></p>
        </article>
        <article v-else>Waiting on your first analysis results.</article>
      </main>
      <v-navigation-buttons :first="first" :last="last" />
    </section>
  </v-quickstart-layout>
</template>

<script>
import VNavigationButtons from '@/components/install-guide/NavigationButtons.vue';
import VQuickstartLayout from '@/components/quickstart/QuickstartLayout.vue';
import VButton from '@/components/Button.vue';
import Navigation from '@/components/mixins/navigation';

export default {
  name: 'InvestigateFindings',

  components: {
    VQuickstartLayout,
    VNavigationButtons,
    VButton,
  },

  mixins: [Navigation],

  props: {
    scanned: Boolean,
    numFindings: Number,
    projectPath: String,
  },

  methods: {
    viewProblems() {
      this.$root.$emit('view-problems', this.projectPath);
    },
  },
};
</script>
<style lang="scss" scoped>
h1 {
  margin-block-start: 0;
  font-size: 2em;
}
</style>
