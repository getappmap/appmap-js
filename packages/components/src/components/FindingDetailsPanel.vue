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
.finding-details {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin-bottom: 2rem;
  font-size: 0.9rem;
  border: 1px solid $gray2;
  border-radius: 0.5rem;
  margin: 1rem 0;

  section {
    padding: 0 1rem;
    .code {
      color: $white;
      margin-top: 0;
      font-family: monospace;
    }
  }
  .heading,
  section {
    border-bottom: 3px solid $gray2;
    &:last-of-type {
      border-bottom: 0;
    }
    &.bt-1 {
      border-top: 3px solid $gray2;
    }
    p {
      color: $white;
    }
    ul {
      list-style-type: none;
      padding: 0;
      margin-top: 0;
      li {
        border-bottom: 1px solid #242c41a3;
        padding: 0.5rem 0;
        &:last-of-type {
          border: 0;
        }
        &:first-of-type {
          padding-top: 0;
        }
      }
      a {
        color: $blue;
        text-decoration: none;
        line-height: 1.5rem;
        width: 100%;
        word-break: break-all;
        transition: $transition;
        &:hover {
          text-decoration: underline;
          color: lighten($blue, 20);
        }
      }
    }

    .section-header {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
      h2 {
        text-transform: uppercase;
        color: $gray4;
        font-size: 0.9rem;
        font-weight: bold;
      }
      &.left {
        justify-content: flex-start;
        gap: 1rem;
      }
    }
    h3 {
      margin: 0.75rem 0;
      font-size: 0.9rem;
      color: $gray4;
      font-weight: 800;
      text-transform: uppercase;
    }
    .expando {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
      span {
        color: $gray2;
        &.appmap-title {
          color: $white;
        }
        &.control {
          color: $white;
          svg {
            fill: $white;
          }
          &.rotated-90 {
            rotate: 90deg;
          }
          &:hover {
            svg {
              fill: $blue;
            }
          }
        }
        &:hover {
          cursor: pointer;
          color: $blue;
        }
      }
      .control {
        &.closed {
          rotate: -90deg;
        }
      }
      &.open {
        .control {
          &.closed {
            rotate: -90deg;
          }
        }
      }
    }
    &.found-appmaps {
      ul {
        li {
          &.sublist {
            margin: 0 1rem;
          }
        }
      }
    }
  }

  .finding-name {
    line-height: 1.5rem;
    h2 {
      margin-bottom: 0rem;
      font-size: 1.2rem;
      color: $white;
      font-weight: 800;
    }
    h3 {
      margin-bottom: 0;
    }
    .subhead-margin {
      margin-top: 0.25rem;
    }
  }
}
</style>
