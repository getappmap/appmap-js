<template>
  <section class="stack-trace">
    <v-details-panel-list-header>Stack trace</v-details-panel-list-header>
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
</template>

<script>
import VPopper from '@/components/Popper.vue';
import VDetailsPanelListHeader from '@/components/DetailsPanelListHeader.vue';

export default {
  name: 'v-details-panel-stack-trace',
  components: {
    VPopper,
    VDetailsPanelListHeader,
  },

  props: {
    stackLocations: {
      type: Array,
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
};
</script>

<style lang="scss">
.stack-trace {
  &__header {
    h3 {
      margin: 0.75rem 0;
      font-size: 0.9rem;
      color: $gray4;
      font-weight: 800;
      text-transform: uppercase;
    }
  }

  ul {
    list-style-type: none;
    padding: 0.25rem 0.5rem;
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
}
</style>
