<template>
  <v-quickstart-layout>
    <section>
      <header>
        <h1>Generate OpenAPI</h1>
      </header>
      <main>
        <v-status
          next-step="Generate OpenAPI"
          :status-states="statusStates"
          :current-status="statusStates[3]"
          :project-name="projectName"
          :num-app-maps="numAppMaps"
          :current-step="0"
          :viewing-step="3"
          class="mb20"
        >
          <template #header>
            <template v-if="complete"> {{ projectName }} has OpenAPI definitions </template>
            <template v-else> {{ projectName }} has {{ numAppMaps }} AppMaps </template>
          </template>
          <template #subheader>
            <template v-if="complete">
              Next step: View runtime analysis report for {{ projectName }}
            </template>
            <template v-else>
              Automatically generate OpenAPI definitions for {{ projectName }}
            </template>
          </template>
        </v-status>
        <article v-if="numAppMaps === 0">
          No AppMaps have been found in your project. Try
          <a
            href="#"
            data-cy="record-appmaps"
            @click.prevent="$root.$emit('open-instruction', 'record-appmaps')"
          >
            recording AppMaps
          </a>
          first.
        </article>
        <article v-else-if="numHttpRequests > 0">
          <p>
            AppMap has identified {{ numHttpRequests }} unique HTTP requests to various routes in
            your web application. Using this data, we can automatically generate OpenAPI
            definitions.
          </p>
          <div class="center">
            <v-button
              label="Generate OpenAPI definitions"
              data-cy="generate-openapi"
              @click.native="generateOpenApi"
            />
          </div>
        </article>
        <article v-else>
          AppMap was unable to detect any HTTP request handlers in your application.
        </article>
      </main>
      <v-navigation-buttons :first="first" :last="last" />
    </section>
  </v-quickstart-layout>
</template>

<script>
import VNavigationButtons from '@/components/install-guide/NavigationButtons.vue';
import VQuickstartLayout from '@/components/quickstart/QuickstartLayout.vue';
import VStatus from '@/components/install-guide/Status.vue';
import VButton from '@/components/Button.vue';
import Navigation from '@/components/mixins/navigation';
import StatusState from '@/components/mixins/statusState.js';

export default {
  name: 'OpenApi',

  components: {
    VQuickstartLayout,
    VNavigationButtons,
    VButton,
    VStatus,
  },

  mixins: [Navigation, StatusState],

  props: {
    numHttpRequests: Number,
    numAppMaps: Number,
    projectName: {
      type: String,
      default: '',
    },
    complete: {
      type: Boolean,
      default: false,
    },
  },

  methods: {
    generateOpenApi() {
      this.$root.$emit('generate-openapi', this.projectPath);
    },
  },
};
</script>
