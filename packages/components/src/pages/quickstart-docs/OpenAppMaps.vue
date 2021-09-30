<template>
  <QuickstartLayout>
    <section class="qs-step">
      <div class="qs-step__head">
        <h1 class="qs-headline__1">{{ headerText }}</h1>
        <div class="qs-headline__subhead">
          OPEN APPMAPS <span class="step-number">(step 3 of 3)</span>
        </div>
      </div>
      <div class="qs-step__block" v-if="appmaps.length">
        <p>You have AppMaps in this project!</p>
        <p>
          Here are some that look interesting that you may want to check out...
        </p>
        <table class="qs-appmaps-table">
          <colgroup>
            <col width="70%" />
            <col width="10%" />
            <col width="10%" />
            <col width="10%" />
          </colgroup>
          <thead>
            <tr>
              <th>AppMap</th>
              <th>Requests</th>
              <th>SQL</th>
              <th>Functions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="appmap in appmaps"
              :key="appmap.path"
              @click="openAppmap(appmap.path)"
            >
              <td>{{ appmap.name }}</td>
              <td>{{ appmap.requests }}</td>
              <td>{{ appmap.sqlQueries }}</td>
              <td>{{ appmap.functions }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="qs-noappmaps">No AppMaps found in your project.</div>
      <p class="qs-step__next-step">
        <b>This is the last step of the Quickstart!</b>
        <br />
        <span class="minor-instructions">
          You can return here by clicking on the AppMap logo in the left column
          <br />
          when you want to install AppMap for another project.
        </span>
        <br />
        <a href="#" @click="goToInstallAgent">
          <div class="qs-next-progress-circle"></div>
        </a>
        <a href="#" @click="goToRecordAppmaps">
          <div class="qs-next-progress-circle"></div>
        </a>
        <a href="#" @click="goToOpenAppmaps">
          <div class="qs-next-progress-circle"></div>
        </a>
      </p>
    </section>
  </QuickstartLayout>
</template>

<script>
import QuickstartLayout from '@/components/quickstart/QuickstartLayout.vue';

export default {
  name: 'QuickstartDocsOpenAppMaps',

  components: {
    QuickstartLayout,
  },

  props: {
    appmaps: {
      type: Array,
      default: () => [],
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
    openAppmap(path) {
      this.$root.$emit('openAppmap', path);
    },
  },
};
</script>
