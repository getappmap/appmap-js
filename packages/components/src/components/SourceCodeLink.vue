<template>
  <div :class="classes" v-if="sourceLocation" @click="viewSource">
    <div class="source-code-link__path" data-cy="source-location">
      {{ sourceLocation }}
      <v-external-link-icon
        v-if="externalUrl"
        data-cy="external-link"
        class="source-code-link__extern-link"
      />
    </div>
    <div
      class="source-code-link__warning"
      v-if="sourceLocationError"
      data-cy="source-location-error"
    >
      <v-warning-icon />
      {{ sourceLocationError }}
    </div>
  </div>
</template>

<script>
import VExternalLinkIcon from '@/assets/external-link.svg';
import VWarningIcon from '@/assets/warning.svg';

export default {
  name: 'v-source-code-link',
  components: { VExternalLinkIcon, VWarningIcon },
  props: {
    object: {
      type: Object,
    },
  },

  watch: {
    object() {
      this.requestLocation();
    },
  },

  data() {
    return {
      sourceLocation: undefined,
      sourceLocationError: undefined,
      externalUrl: undefined,
    };
  },

  computed: {
    text() {
      return this.$data.sourceLocation || this.$data.sourceLocationError;
    },

    shouldRender() {
      return Boolean(this.text);
    },

    defaultLocation() {
      if (!this.object) {
        return undefined;
      }

      if (typeof this.object === 'string') {
        return this.object;
      }

      return (
        (this.object.path &&
          [this.object.path, this.object.lineno].filter(Boolean).join(':')) ||
        this.object.location ||
        (Array.isArray(this.object.locations) && this.object.locations[0])
      );
    },

    classes() {
      return {
        'source-code-link': true,
        'source-code-link--has-external-link':
          this.$data.sourceLocation && this.$data.externalUrl,
      };
    },
  },

  methods: {
    viewSource() {
      if (this.$data.sourceLocation) {
        this.$root.$emit('viewSource', {
          location: this.$data.sourceLocation,
          error: this.$data.sourceLocationError,
          externalUrl: this.$data.externalUrl,
        });
      }
    },

    onResolveLocation(response) {
      this.$data.sourceLocation = response.location;
      this.$data.sourceLocationError = response.error;
      this.$data.externalUrl = response.externalUrl;
    },

    requestLocation() {
      this.sourceLocation = undefined;
      if (this.defaultLocation) {
        this.$root.$emit('request-resolve-location', this.defaultLocation);
      }
    },
  },

  beforeMount() {
    this.$root.$on('response-resolve-location', this.onResolveLocation);
    this.requestLocation();
  },

  beforeDestroy() {
    this.$root.$off('response-resolve-location', this.onResolveLocation);
  },
};
</script>

<style scoped lang="scss">
.source-code-link {
  display: flex;
  flex-direction: column;
  margin-bottom: 1em;
  color: $gray4;
  transition: $transition;

  &__path {
    flex-direction: row;
    font-family: monospace;
    border-radius: 8px;
    background-color: #2c2b32;
    padding: 0.6em;
    display: flex;
    align-items: center;
  }

  &__extern-link {
    height: 16px;
    min-width: 16px;
    width: 16px;
    vertical-align: middle;
    margin-left: auto;

    path {
      fill: #716e85;
    }
  }

  &__warning {
    display: flex;
    align-items: center;
    font-size: 0.7em;
    margin: 0.25em 0;
    color: #6a6a6a;

    svg {
      display: inline-block;
      margin-right: 0.5em;
      path {
        fill: #6a6a6a;
      }
    }
  }

  &--has-external-link {
    &:hover {
      cursor: pointer;
      color: #fff;
      background-color: rgba(255, 255, 255, 0.05);
      border-radius: 8px;

      path {
        fill: #fff !important;
      }
    }
  }
}
</style>
