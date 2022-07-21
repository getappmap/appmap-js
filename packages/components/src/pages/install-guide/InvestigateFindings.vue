<template>
  <v-quickstart-layout>
    <section>
      <header>
        <h1 data-cy="title">Investigate findings</h1>
      </header>
      <main>
        <article v-if="scanned">
          <template v-if="numFindings > 0">
            <p>
              AppMap has identified
              <badge
                v-for="domain in [
                  'security',
                  'performance',
                  'stability',
                  'maintainability',
                ]"
                :key="domain"
                :data-cy="domain"
                :class="domain"
              >
                {{ findingsDomainCounts[domain] }} {{ domain }}
              </badge>
              findings.
            </p>
            <br />
            <p>
              For details
              <v-button
                data-cy="investigate-findings-button"
                label="Open the PROBLEMS tab"
                @click.native="viewProblems"
              />
            </p>
          </template>
          <p v-else>
            You're good to go! AppMap scanned your application and found no
            flaws. We'll continue scanning for flaws automatically.
          </p>
        </article>
        <article v-else>
          <p>
            <strong>This project has not been scanned yet.</strong>
          </p>
          <p>
            AppMap will scan your project and report findings automatically if
            you have:
          </p>

          <ol>
            <li>
              <a
                href="#"
                @click.prevent="
                  $root.$emit('open-instruction', 'project-picker')
                "
                >The AppMap Agent installed</a
              >
            </li>
            <li>
              <a
                href="#"
                @click.prevent="
                  $root.$emit('open-instruction', 'record-appmaps')
                "
              >
                AppMaps in your project</a
              >
            </li>
          </ol>
          <p>
            If you need help getting set up, we are happy to help open a support
            ticket.
          </p>
        </article>
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
    findingsDomainCounts: {
      type: Object,
      default: () => ({}),
    },
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

.security {
  color: #ff4141;
  padding: 5px;
  font-weight: bold;
}
.performance {
  color: orange;
  padding: 5px;
  font-weight: bold;
}
.stability {
  color: yellow;
  padding: 5px;
  font-weight: bold;
}
.maintainability {
  color: white;
  padding: 5px;
  font-weight: bold;
}
</style>
