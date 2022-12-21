<template>
  <div class="finding-details">
    <section class="finding-name">
      <h2>{{ title }}</h2>
      <p class="subhead-margin">
        {{ description }}
      </p>
    </section>
    <section class="overview">
      <div class="section-header expando">
        <h3>Overview</h3>
      </div>
      <div class="section-content">
        <ul class="overview">
          <li>Impact Category: {{ impactDomain }}</li>
          <li v-for="(link, reference) in references" :key="reference">
            Reference: <a :href="link">{{ reference }}</a>
          </li>
        </ul>
      </div>
    </section>
    <section class="message">
      <div class="section-header">
        <h3>Message:</h3>
      </div>
      <p class="code">{{ message }}</p>
    </section>
    <section class="stack-trace">
      <div class="section-header">
        <h3>Stack Trace</h3>
      </div>
      <ul>
        <li v-for="location in stackLocations" :key="location.uri.path" data-cy="stack-trace">
          <v-popper
            class="hover-text-popper"
            data-cy="popper"
            :text="location.uri.path"
            placement="top"
            text-align="left"
          >
            <a href="#" @click.prevent="openInSourceCode(location)">{{
              displayLocation(location)
            }}</a>
          </v-popper>
        </li>
      </ul>
    </section>
  </div>
</template>

<script>
import VPopper from '@/components/Popper.vue';

export default {
  name: 'v-finding-details-panel',
  components: {
    VPopper,
  },

  props: {
    finding: {
      type: Object,
      required: true,
    },
  },

  methods: {
    displayLocation(location) {
      const lineNumber = location.range[0] && location.range[0].line + 1;
      const { truncatedPath } = location;
      if (lineNumber && lineNumber > 1) {
        return `${truncatedPath}:${lineNumber}`;
      }
      return `${truncatedPath}`;
    },

    openInSourceCode(location) {
      let locationStr = location.uri.path;
      const lineNumber = location.range[0] && location.range[0].line + 1;

      if (lineNumber && lineNumber !== 0) {
        locationStr += `:${lineNumber}`;
      }

      this.$root.$emit('viewSource', {
        location: locationStr,
      });
    },
  },

  computed: {
    rule() {
      return this.finding.rule;
    },

    description() {
      return this.rule.description;
    },

    title() {
      return this.rule.title;
    },

    impactDomain() {
      return this.rule.impactDomain;
    },

    references() {
      return this.rule.references;
    },

    message() {
      return this.finding.finding.message;
    },

    stackLocations() {
      return this.finding.stackLocations;
    },
  },
};
</script>

<style scoped lang="scss">
</style>
